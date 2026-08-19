"""Authentication and cryptographic security utilities for Smart Freight.
Provides secure password hashing (PBKDF2-HMAC-SHA256) and lightweight signed token management.
"""

import base64
import hashlib
import hmac
import json
import secrets
import time
from typing import Any, Dict, Optional

# Secret key for token signing (in production, loaded from environment variables)
JWT_SECRET = "smart-freight-industrial-jwt-secret-key-2026-secure"
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRATION_SECONDS = 60 * 60 * 24 * 7  # 7 days


def generate_salt() -> str:
    """Generate a cryptographically secure random salt."""
    return secrets.token_hex(16)


def hash_password(password: str, salt: str) -> str:
    """Hash a password using PBKDF2-HMAC-SHA256 with 100,000 iterations."""
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100_000,
    )
    return key.hex()


def verify_password(plain_password: str, hashed_password: str, salt: str) -> bool:
    """Verify a plain password against the stored hash and salt."""
    computed_hash = hash_password(plain_password, salt)
    return hmac.compare_digest(computed_hash, hashed_password)


def _b64url_encode(data: bytes) -> str:
    """Encode bytes to base64url string without padding."""
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _b64url_decode(data_str: str) -> bytes:
    """Decode base64url string with added padding if necessary."""
    padding = 4 - (len(data_str) % 4)
    if padding != 4:
        data_str += "=" * padding
    return base64.urlsafe_b64decode(data_str.encode("utf-8"))


def create_access_token(user_id: str, email: str, name: str, role: str = "consumer") -> str:
    """Create a cryptographically signed HS256 JWT access token."""
    header = {"alg": JWT_ALGORITHM, "typ": "JWT"}
    payload = {
        "sub": user_id,
        "email": email,
        "name": name,
        "role": role,
        "iat": int(time.time()),
        "exp": int(time.time()) + TOKEN_EXPIRATION_SECONDS,
    }

    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))

    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    signature = hmac.new(JWT_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()
    signature_b64 = _b64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{signature_b64}"


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify signature and expiration of a JWT access token."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None

        header_b64, payload_b64, signature_b64 = parts
        signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")

        expected_sig = hmac.new(JWT_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()
        provided_sig = _b64url_decode(signature_b64)

        if not hmac.compare_digest(expected_sig, provided_sig):
            return None

        payload_bytes = _b64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode("utf-8"))

        # Check expiration
        if payload.get("exp", 0) < int(time.time()):
            return None

        return payload
    except Exception:
        return None
