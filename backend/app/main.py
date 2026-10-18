from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Request
from fastapi.responses import JSONResponse
from redis.asyncio import Redis
from redis.exceptions import RedisError

from app.api.v1.router import api_router
from app.core.config import settings
from app.api.v1.endpoints.realtime import router as realtime_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Local-first RAG and agentic AI portfolio backend",
    lifespan=lifespan,
)

@app.middleware("http")
async def security_and_auth_rate_limit(request: Request, call_next):
    response = None
    auth_paths = {"/api/v1/auth/login", "/api/v1/auth/signup", "/api/v1/auth/password-reset/request", "/api/v1/auth/verify-email/request"}
    if request.url.path in auth_paths:
        client_ip = request.headers.get("x-real-ip") or (request.client.host if request.client else "unknown")
        redis = Redis.from_url(settings.redis_url, decode_responses=True, socket_connect_timeout=1, socket_timeout=1)
        try:
            key = f"rate:auth:{client_ip}:{request.url.path}"
            count = await redis.incr(key)
            if count == 1:
                await redis.expire(key, settings.auth_rate_window_seconds)
            if count > settings.auth_rate_limit:
                return JSONResponse(status_code=429, content={"detail": "Too many authentication attempts. Try again later."}, headers={"Retry-After": str(settings.auth_rate_window_seconds)})
        except RedisError:
            return JSONResponse(status_code=503, content={"detail": "Authentication service temporarily unavailable."})
        finally:
            await redis.aclose()
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_v1_prefix)
app.include_router(realtime_router, prefix=settings.api_v1_prefix, tags=["realtime"])


@app.get("/", tags=["meta"])
def root():
    return {"name": settings.app_name, "docs": "/docs", "health": f"{settings.api_v1_prefix}/health"}
