from __future__ import annotations

from functools import lru_cache
from typing import BinaryIO
from urllib.parse import quote

import boto3
from botocore.client import Config

from config import settings


@lru_cache(maxsize=1)
def get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.object_storage_endpoint,
        aws_access_key_id=settings.object_storage_access_key,
        aws_secret_access_key=settings.object_storage_secret_key,
        region_name=settings.object_storage_region,
        config=Config(signature_version="s3v4"),
    )


def profile_photo_url(object_key: str) -> str:
    base_url = settings.object_storage_public_url.rstrip("/")
    bucket = quote(settings.object_storage_bucket.strip("/"), safe="")
    key = quote(object_key.lstrip("/"), safe="/")
    return f"{base_url}/{bucket}/{key}"


def upload_profile_photo(file_obj: BinaryIO, object_key: str, content_type: str) -> str:
    get_s3_client().upload_fileobj(
        file_obj,
        settings.object_storage_bucket,
        object_key,
        ExtraArgs={"ContentType": content_type},
    )
    return profile_photo_url(object_key)


def delete_object(object_key: str | None) -> None:
    if not object_key:
        return
    get_s3_client().delete_object(Bucket=settings.object_storage_bucket, Key=object_key)
