import os
import time
from azure.storage.blob import BlobServiceClient, ContentSettings
from talentstream_core_service.configs.config import settings


class AzureStorageService:
    def __init__(self):
        self._client: BlobServiceClient | None = None
        if settings.AZURE_STORAGE_CONNECTION_STRING:
            self._client = BlobServiceClient.from_connection_string(
                settings.AZURE_STORAGE_CONNECTION_STRING
            )
            self._ensure_container()

    def _ensure_container(self):
        container = self._client.get_container_client(settings.AZURE_CONTAINER_NAME)
        if not container.exists():
            container.create_container()

    def upload_resume(self, file_bytes: bytes, original_filename: str) -> str:
        """
        Uploads a resume to Azure Blob Storage (or local fallback).
        Returns the public URL of the uploaded file.
        """
        safe_name = f"{int(time.time())}_{original_filename}"

        if not self._client:
            # ── Local fallback (no Azure credentials) ──────────────────────────
            local_dir = "uploads"
            os.makedirs(local_dir, exist_ok=True)
            local_path = os.path.join(local_dir, safe_name)
            with open(local_path, "wb") as f:
                f.write(file_bytes)
            return f"local://{local_path}"

        blob_client = self._client.get_blob_client(
            container=settings.AZURE_CONTAINER_NAME,
            blob=safe_name,
        )
        blob_client.upload_blob(
            file_bytes,
            overwrite=True,
            content_settings=ContentSettings(content_type="application/pdf"),
        )
        return blob_client.url


azure_storage_service = AzureStorageService()
