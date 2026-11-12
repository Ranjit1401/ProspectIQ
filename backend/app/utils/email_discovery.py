import re
from urllib.parse import urlparse

from app.core.config import settings
from app.core.logger import logger
from app.utils.company_website import BLACKLIST

_EMAIL_REGEX = re.compile(r"\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b")

_IGNORED_EMAIL_DOMAINS = {
    "example.com",
    "example.org",
    "test.com",
    "domain.com",
    "email.com",
    "sentry.io",
    "w3.org",
    "schema.org",
    "localhost",
}

_ASSET_EXTENSIONS = (".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".css", ".js", ".woff", ".woff2")


def extract_domain(website: str | None) -> str:
    """Extract bare domain (without www.) from a URL or domain string."""
    if not website or not isinstance(website, str):
        return ""
    raw = website.strip()
    if not raw:
        return ""
    if "://" not in raw:
        raw = f"https://{raw}"
    parsed = urlparse(raw)
    host = (parsed.hostname or "").lower()
    if host.startswith("www."):
        host = host[4:]
    return host


def is_company_domain(domain: str) -> bool:
    if not domain or "." not in domain:
        return False
    return not any(bad in domain for bad in BLACKLIST)


def clean_person_name(name: str) -> tuple[str, str]:
    """Strip job titles/parentheticals and split into (first_name, last_name)."""
    if not name:
        return "", ""
    cleaned = re.split(r"[,(\-–—|]", name.strip(), maxsplit=1)[0].strip()
    parts = cleaned.split()
    if not parts:
        return "", ""
    first = parts[0]
    last = parts[1] if len(parts) > 1 else ""
    return first, last


def extract_emails_from_text(text: str) -> list[str]:
    """Extract plausible, non-placeholder email addresses from arbitrary text."""
    if not text:
        return []
    found: list[str] = []
    seen: set[str] = set()
    for match in _EMAIL_REGEX.findall(text):
        email = match.strip(".,;:!?\"'()[]<>").lower()
        if email in seen:
            continue
        if any(email.endswith(ext) for ext in _ASSET_EXTENSIONS):
            continue
        domain = email.split("@", 1)[-1]
        if domain in _IGNORED_EMAIL_DOMAINS or domain.endswith(".example"):
            continue
        seen.add(email)
        found.append(email)
    return found


def pick_best_email(
    emails: list[str],
    stakeholder_name: str = "",
    company_domain: str = "",
) -> str | None:
    """Rank extracted emails by match to stakeholder name and company domain."""
    if not emails:
        return None

    first, last = clean_person_name(stakeholder_name)
    first_l = first.lower()
    last_l = last.lower()
    domain_l = (company_domain or "").lower()

    def score(email: str) -> int:
        local, dom = email.split("@", 1)
        pts = 0
        if domain_l and (dom == domain_l or dom.endswith(f".{domain_l}")):
            pts += 50
        if first_l and len(first_l) >= 2 and first_l in local:
            pts += 30
        if last_l and len(last_l) >= 2 and last_l in local:
            pts += 30
        if any(prefix in local for prefix in ("contact", "info", "hello", "sales", "support", "team", "hello")):
            pts += 10
        if "noreply" in local or "no-reply" in local or "donotreply" in local:
            pts -= 100
        return pts

    ranked = sorted(emails, key=score, reverse=True)
    top = ranked[0]
    return top if score(top) >= 0 else None


def resolve_domain_from_sources(website: str | None, sources: list | None = None) -> str:
    """Resolve official company domain from stored website or research source URLs."""
    domain = extract_domain(website)
    if is_company_domain(domain):
        return domain

    for src in sources or []:
        url = src.get("url") if isinstance(src, dict) else (src if isinstance(src, str) else "")
        cand = extract_domain(url)
        if is_company_domain(cand):
            return cand

    return ""


def discover_company_email(
    company_name: str,
    website: str | None,
    stakeholder_name: str,
    knowledge_text: str = "",
    sources: list | None = None,
) -> tuple[str | None, str | None, bool]:
    """
    Find the best available email for a stakeholder or firm without inventing addresses.

    Order of discovery:
    1. Emails already present in the user's brief / extracted knowledge text.
    2. GrowthToolkit AppConnector API (when APPCONNECTOR_API_KEY is configured).
    3. Published contact emails on the company's official website /contact page or Tavily search.

    Returns (email, mx_domain, is_verified).
    """
    domain = resolve_domain_from_sources(website, sources)

    # 1. Check emails already present in notes / knowledge text
    local_emails = extract_emails_from_text(knowledge_text)
    if local_emails:
        best_local = pick_best_email(local_emails, stakeholder_name, domain)
        if best_local:
            email_dom = best_local.split("@", 1)[-1]
            return best_local, domain or email_dom, False

    # 2. Try Tavily search to find company domain if still missing
    if not domain and company_name and settings.TAVILY_API_KEY:
        try:
            from tavily import TavilyClient
            client = TavilyClient(api_key=settings.TAVILY_API_KEY)
            res = client.search(query=f"{company_name} official website", max_results=4)
            for item in res.get("results", []):
                cand = extract_domain(item.get("url"))
                if is_company_domain(cand):
                    domain = cand
                    break
        except Exception as exc:
            logger.debug(f"Domain search fallback skipped for {company_name}: {exc}")

    # 3. Use AppConnector API if configured
    first, last = clean_person_name(stakeholder_name)
    if settings.APPCONNECTOR_API_KEY and domain and first and first.lower() != "unknown":
        try:
            from app.services.enrichment_service import EnrichmentService
            result = EnrichmentService().find_and_verify_email(
                first_name=first,
                last_name=last,
                domain=domain,
            )
            if result and result.get("email"):
                return result["email"], result.get("mx_domain") or domain, bool(result.get("is_valid"))
        except Exception as exc:
            logger.warning(f"AppConnector email lookup skipped: {exc}")

    # 4. Scrape official website /contact page for published emails (SSRF-protected)
    discovered_emails: list[str] = []
    if domain:
        from app.website.scraper import WebsiteScraper
        for path in ("", "/contact", "/contact-us", "/about"):
            try:
                page_text = WebsiteScraper.scrape(f"https://{domain}{path}")
                discovered_emails.extend(extract_emails_from_text(page_text))
                if discovered_emails:
                    best = pick_best_email(discovered_emails, stakeholder_name, domain)
                    if best:
                        return best, domain, False
            except Exception:
                continue

    # 5. Fallback Tavily search for published firm contact email
    if company_name and settings.TAVILY_API_KEY:
        try:
            from tavily import TavilyClient
            client = TavilyClient(api_key=settings.TAVILY_API_KEY)
            query = f'"{company_name}" contact email' if not domain else f'"@{domain}" email contact'
            res = client.search(query=query, max_results=5)
            combined = "\n".join(
                f"{item.get('title', '')} {item.get('content', '')}"
                for item in res.get("results", [])
            )
            discovered_emails.extend(extract_emails_from_text(combined))
            best = pick_best_email(discovered_emails, stakeholder_name, domain)
            if best:
                email_dom = best.split("@", 1)[-1]
                return best, domain or email_dom, False
        except Exception as exc:
            logger.debug(f"Tavily email search skipped for {company_name}: {exc}")

    return None, domain or None, False
