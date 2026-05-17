import os


def get_port(default: int) -> int:
    """Render sets PORT; local dev uses the service default."""
    return int(os.getenv("PORT", str(default)))
