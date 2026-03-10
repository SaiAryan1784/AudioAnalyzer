"""
Async SQLAlchemy engine and session factory for Neon PostgreSQL.
"""

import ssl
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.config import settings


def _build_async_url(url: str) -> tuple[str, dict]:
    """
    Convert a standard PostgreSQL URL to one compatible with asyncpg.
    Returns (clean_url, connect_args).

    asyncpg doesn't understand `sslmode` or `channel_binding` as URL params;
    SSL must be passed via connect_args instead.
    """
    # Swap driver to asyncpg
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)

    # Parse and strip problematic query params
    parsed = urlparse(url)
    params = parse_qs(parsed.query)

    use_ssl = params.pop("sslmode", [None])[0] in ("require", "verify-full", "verify-ca")
    params.pop("channel_binding", None)

    clean_query = urlencode({k: v[0] for k, v in params.items()}, doseq=False)
    clean_url = urlunparse(parsed._replace(query=clean_query))

    connect_args = {}
    if use_ssl:
        ssl_ctx = ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE
        connect_args["ssl"] = ssl_ctx

    return clean_url, connect_args


if not settings.DATABASE_URL:
    # During Vercel build, environment variables might be absent.
    # Provide a dummy URL so it doesn't crash the import, but will crash if executed.
    _url, _connect_args = "postgresql+asyncpg://dummy:dummy@localhost/dummy", {}
else:
    _url, _connect_args = _build_async_url(settings.DATABASE_URL)

engine = create_async_engine(
    _url,
    echo=False,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    connect_args=_connect_args,
)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    """FastAPI dependency — yields an async database session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
