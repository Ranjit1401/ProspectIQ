import io
import os
import unittest
from fastapi import UploadFile
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import app
from app.schemas.user import UserCreate
from app.services.document_service import DocumentService
from app.website.scraper import WebsiteScraper


class TestBackendSecurity(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_security_headers_present(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get("X-Content-Type-Options"), "nosniff")
        self.assertEqual(response.headers.get("X-Frame-Options"), "DENY")
        self.assertEqual(response.headers.get("X-XSS-Protection"), "1; mode=block")
        self.assertEqual(
            response.headers.get("Referrer-Policy"),
            "strict-origin-when-cross-origin",
        )
        self.assertIn("camera=()", response.headers.get("Permissions-Policy", ""))

    def test_ssrf_blocks_localhost_and_metadata(self):
        malicious_urls = [
            "file:///etc/passwd",
            "ftp://example.com/resource",
            "http://localhost:8000/api",
            "http://127.0.0.1:5432/",
            "http://169.254.169.254/latest/meta-data/",
            "http://10.0.0.5/internal",
            "http://192.168.1.1/router",
            "http://[::1]/",
        ]
        for url in malicious_urls:
            with self.subTest(url=url):
                with self.assertRaises(ValueError):
                    WebsiteScraper._validate_safe_url(url)

    def test_document_upload_rejects_unsupported_extension(self):
        service = DocumentService()
        fake_file = UploadFile(filename="payload.exe", file=io.BytesIO(b"MZ"))
        with self.assertRaises(ValueError):
            service.process(fake_file)

    def test_document_upload_sanitizes_path_traversal(self):
        service = DocumentService()
        content = b"Safe enterprise research notes."
        # Even with traversal characters in filename, basename/UUID isolation protects FS
        traversal_file = UploadFile(
            filename="../../escaped_path.txt",
            file=io.BytesIO(content),
        )
        parsed = service.process(traversal_file)
        self.assertEqual(parsed, "Safe enterprise research notes.")
        self.assertFalse(os.path.exists("escaped_path.txt"))

    def test_document_upload_enforces_max_size(self):
        service = DocumentService()
        # Temporarily simulate smaller max size for fast unit testing
        original_max = service.MAX_FILE_SIZE
        service.MAX_FILE_SIZE = 1024  # 1 KB
        try:
            oversized = UploadFile(
                filename="large.txt",
                file=io.BytesIO(b"A" * 2048),
            )
            with self.assertRaises(ValueError) as ctx:
                service.process(oversized)
            self.assertIn("maximum allowed size", str(ctx.exception))
        finally:
            service.MAX_FILE_SIZE = original_max

    def test_user_create_validation(self):
        # Weak short password should fail
        with self.assertRaises(ValidationError):
            UserCreate(username="valid_user", email="test@example.com", password="123")

        # XSS/special chars in username should fail
        with self.assertRaises(ValidationError):
            UserCreate(
                username="<script>alert(1)</script>",
                email="test@example.com",
                password="StrongPassword123",
            )

        # Valid registration payload should pass
        valid = UserCreate(
            username="enterprise_user",
            email="test@example.com",
            password="StrongPassword123",
        )
        self.assertEqual(valid.username, "enterprise_user")


if __name__ == "__main__":
    unittest.main()
