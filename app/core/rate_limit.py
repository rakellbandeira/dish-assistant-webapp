"""Simple in-memory rate limiting for the login and register endpoints.
"""
import math
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status


class RateLimiter:
    def __init__(self, max_attempts: int, window_seconds: int, message: str):
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self.message = message
        self._attempts: dict[str, deque[float]] = defaultdict(deque)

    def check(self, key: str | None) -> None:
        
        if key is None:
            return
        now = time.monotonic()
        attempts = self._attempts[key]
        while attempts and now - attempts[0] >= self.window_seconds:
            attempts.popleft()

        if len(attempts) >= self.max_attempts:
            retry_after = math.ceil(self.window_seconds - (now - attempts[0]))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=self.message,
                headers={"Retry-After": str(retry_after)},
            )
        attempts.append(now)

    def reset(self) -> None:
        
        self._attempts.clear()


LOOPBACK = {"127.0.0.1", "::1", "localhost"}


def client_ip(request: Request) -> str | None:
    
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    host = request.client.host if request.client else None
    if host is None or host in LOOPBACK:
        return None
    return host 


TOO_MANY_LOGINS = "Too many sign-in attempts. Please wait a minute and try again."

# Security guessing limit
login_per_account = RateLimiter(max_attempts=10, window_seconds=60, message=TOO_MANY_LOGINS)
login_per_ip = RateLimiter(max_attempts=20, window_seconds=60, message=TOO_MANY_LOGINS)
register_per_ip = RateLimiter(
    max_attempts=10, window_seconds=60 * 60, message="Too many accounts created. Please try again later."
)
