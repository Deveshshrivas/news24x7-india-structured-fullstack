"""Compatibility entry point for `uvicorn backend.main:app`."""
if __package__:
    from backend.app.main import app
else:
    from app.main import app

__all__ = ["app"]
