import requests
from bs4 import BeautifulSoup


class WebsiteScraper:

    @staticmethod
    def scrape(url: str) -> str:

        headers = {
            "User-Agent": (
                "Mozilla/5.0 "
                "(Windows NT 10.0; Win64; x64)"
            )
        }

        response = requests.get(
            url,
            headers=headers,
            timeout=20,
        )

        response.raise_for_status()

        soup = BeautifulSoup(
            response.text,
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

        return text