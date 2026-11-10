import os
import shutil
import tempfile
import uuid
from pathlib import Path

from fastapi import UploadFile

from app.document_parser.parser import DocumentParser


class DocumentService:
    MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB max file size
    CHUNK_SIZE = 64 * 1024  # 64 KB

    ALLOWED_EXTENSIONS = {
        ".pdf",
        ".docx",
        ".txt",
        ".csv",
    }

    def process(
        self,
        file: UploadFile,
    ) -> str:
        if not file.filename:
            raise ValueError("No file uploaded or filename is missing")

        # Extract only the base name and sanitize against path traversal
        raw_name = Path(file.filename).name
        extension = Path(raw_name).suffix.lower()

        if extension not in self.ALLOWED_EXTENSIONS:
            raise ValueError(
                f"Unsupported file type: {extension}. Allowed types: {', '.join(sorted(self.ALLOWED_EXTENSIONS))}"
            )

        temp_dir = tempfile.mkdtemp(prefix="prospectiq_upload_")
        # Use an unpredictable safe filename inside the isolated temporary folder
        safe_filename = f"{uuid.uuid4().hex}{extension}"
        temp_path = os.path.join(temp_dir, safe_filename)

        total_bytes = 0
        try:
            with open(temp_path, "wb") as buffer:
                while True:
                    chunk = file.file.read(self.CHUNK_SIZE)
                    if not chunk:
                        break
                    total_bytes += len(chunk)
                    if total_bytes > self.MAX_FILE_SIZE:
                        raise ValueError(
                            f"Uploaded file exceeds the maximum allowed size of {self.MAX_FILE_SIZE // (1024 * 1024)}MB."
                        )
                    buffer.write(chunk)

            text = DocumentParser.parse(temp_path)
            return text

        finally:
            # Thorough cleanup of temporary files
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except OSError:
                    pass

            if os.path.exists(temp_dir):
                try:
                    shutil.rmtree(temp_dir, ignore_errors=True)
                except OSError:
                    pass