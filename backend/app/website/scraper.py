import ipaddress
import socket
from urllib.parse import urlparse
import requests
from bs4 import BeautifulSoup


class WebsiteScraper:
    MAX_CHARS = 8000
    MAX_BYTES = 2 * 1024 * 1024  # 2 MB limit to prevent memory exhaustion
    REQUEST_TIMEOUT = (5, 15)  # (connect timeout, read timeout)

    BLOCKED_HOSTNAMES = {
        "localhost",
        "127.0.0.1",
        "0.0.0.0",
        "::1",
        "metadata.google.internal",
        "instance-data",
    }

    @classmethod
    def _validate_safe_url(cls, url: str) -> str:
        """
        Validates URL against SSRF (Server-Side Request Forgery) attacks.
        Disallows private, loopback, link-local, and cloud metadata addresses.
        """
        if not url or not isinstance(url, str):
            raise ValueError("URL must be a non-empty string")

        parsed = urlparse(url.strip())
        if parsed.scheme.lower() not in ("http", "https"):
            raise ValueError(f"Unsupported URL scheme '{parsed.scheme}'. Only http and https are permitted.")

        hostname = parsed.hostname
        if not hostname:
            raise ValueError("Invalid URL: missing hostname")

        hostname_lower = hostname.lower()
        if hostname_lower in cls.BLOCKED_HOSTNAMES:
            raise ValueError("Access to localhost or internal hostname is prohibited.")

        # Resolve hostname to check destination IP addresses
        try:
            addr_info = socket.getaddrinfo(hostname, None)
        except socket.gaierror:
            raise ValueError(f"Unable to resolve hostname '{hostname}'")

        for item in addr_info:
            ip_str = item[4][0]
            try:
                ip = ipaddress.ip_address(ip_str)
            except ValueError:
                continue

            if (
                ip.is_private
                or ip.is_loopback
                or ip.is_link_local
                or ip.is_reserved
                or ip.is_multicast
                or ip.is_unspecified
                or ip_str == "169.254.169.254"  # AWS / Cloud Metadata IP
            ):
                raise ValueError(
                    f"Access to private/internal network IP ({ip_str}) is blocked for security (SSRF prevention)."
                )

        return url.strip()

    @staticmethod
    def scrape(url: str) -> str:
        safe_url = WebsiteScraper._validate_safe_url(url)

        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36 ProspectIQ-Bot/1.0"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        }

        try:
            # Stream response to guard against giant payloads / decompression bombs
            with requests.get(
                safe_url,
                headers=headers,
                timeout=WebsiteScraper.REQUEST_TIMEOUT,
                stream=True,
                allow_redirects=False,  # Disallow blind redirects that could lead to internal IPs
            ) as response:
                if response.status_code in (301, 302, 303, 307, 308):
                    redirect_target = response.headers.get("Location")
                    if redirect_target:
                        # Re-validate the redirect target recursively with protection
                        safe_redirect = WebsiteScraper._validate_safe_url(redirect_target)
                        return WebsiteScraper.scrape(safe_redirect)

                response.raise_for_status()

                content_type = response.headers.get("Content-Type", "")
                if "text/html" not in content_type and "text/plain" not in content_type and "application/xhtml" not in content_type:
                    raise ValueError(f"Unexpected Content-Type '{content_type}'. Expected HTML or text.")

                content_chunks = []
                total_bytes = 0
                for chunk in response.iter_content(chunk_size=8192, decode_unicode=True):
                    if chunk:
                        content_chunks.append(chunk)
                        total_bytes += len(chunk.encode("utf-8", errors="ignore"))
                        if total_bytes > WebsiteScraper.MAX_BYTES:
                            break

                raw_html = "".join(content_chunks)

        except requests.exceptions.Timeout:
            raise ValueError("Target website timed out during connection")
        except requests.exceptions.RequestException as exc:
            raise ValueError(f"Network error while fetching website: {exc}")

        soup = BeautifulSoup(
            raw_html,
            "html.parser",
        )

        # Remove unwanted tags
        for tag in soup(
            [
                "script",
                "style",
                "noscript",
                "svg",
                "footer",
                "header",
                "nav",
            ]
        ):
            tag.decompose()

        text = soup.get_text(
            separator="\n",
            strip=True,
        )
        if len(text) > WebsiteScraper.MAX_CHARS:
            text = text[: WebsiteScraper.MAX_CHARS]

        return text