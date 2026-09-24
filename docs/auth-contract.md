# Auth agreement 
This doc is an agreement between frontend and backend for everything related to
signing up, signing in, staying signed in and signing out. Build against this document,
not against assumptions. If you need to change something, change here first (preferrably in a PR so everyone can see), then change the code.

---

## 1. General rules (apply to every endpoint, not just auth)

| Base path | Every backend route starts with `/api` |
| How the frontend calls it | Relative URLs, e.g. `fetch("/api/auth/login")`. Never hardcode `http://localhost:8000`. |
| How the request reaches FastAPI | Next.js forwards `/api/*` to the backend (`rewrites()` in `dish-assistant-frontend/next.config.ts`). The backend address comes from the `BACKEND_URL` env var (default `http://localhost:8000`). |
| Request body | JSON, with header `Content-Type: application/json` |
| Response body | JSON |
| Authentication | httpOnly cookies set by the backend (see §3). The frontend never reads, stores or sends tokens itself. |
| Error body | Always `{ "message": "..." }` (see §2) |

Because the browser sees frontend and backend as the same site, `fetch` sends the auth
cookies automatically; no `credentials` option or `Authorization` header is needed.

## 2. Error format

Every non-2xx response has this shape:

```json
{ "message": "text that can be shown to the user" }
```

Validation errors (422) also include one entry per invalid field, so forms can show
the message under the right input:

```json
{
  "message": "Password must contain at least one number.",
  "errors": [
    { "field": "password", "message": "Password must contain at least one number." }
  ]
}
```

When several fields are invalid, `message` is `"Invalid input."` and `errors` lists them all.

Frontend usage:

```ts
if (!res.ok) {
  const body = await res.json();
  throw new Error(body.message);          // form-level error
  // body.errors?.forEach(e => ...)       // optional: per-field errors
}
```

| Status | Meaning |
|---|---|
| 400 | Request understood but not allowed |
| 401 | Not signed in, or session expired |
| 409 | Conflict: email or username already taken |
| 422 | Invalid input (see `errors`) |
| 500 | Server error; message is generic, details are only in the backend logs |

## 3. Tokens and cookies

Two JWTs, both stored by the browser as httpOnly cookies (for safety)

| Cookie | Contains | Lifetime | Sent to | Purpose |

| `access_token` | JWT, `type: "access"` | 30 minutes | every `/api/*` request | Proves who the user is |
| `refresh_token` | JWT, `type: "refresh"` | 30 days with "Remember me" | only `/api/auth/*` | Gets a new access token without re-entering the password |

Cookie attributes: `HttpOnly`, `SameSite=Lax`, `Secure` in production (HTTPS).

About "Remember me"

| | Checked | Unchecked |
|---|---|---|
| Cookies | Persistent: survive closing the browser | Session cookies: deleted when the browser closes |
| Refresh token lifetime | 30 days |
| Email pre-filled next time | Yes (frontend saves it in `localStorage`) | No (frontend removes it) |

About JWT payload (signed with HS256 and the backend's `SECRET_KEY`):

```json
{
  "sub": "66f1a2b3c4d5e6f7a8b9c0d1",   // user id (Mongo _id as a string)
  "type": "access",                     // "access" or "refresh"
  "iat": 1790000000,                    // issued at (Unix time)
  "exp": 1790001800,                    // expires at (Unix time)
  "jti": "9f8e7d6c...",                 // unique token id (lets us add revocation later)
  "remember": true                      // refresh tokens only: keeps the same mode on refresh
}
```

No personal data (email, username) goes in the token.

## 4. The user object

Every endpoint that returns a user returns exactly this shape. `password_hash` is never sent.

```json
{
  "id": "66f1a2b3c4d5e6f7a8b9c0d1",
  "email": "ana.silva@example.com",
  "username": "ana_silva"
}
```

## 5. Validation rules

The backend is the source of truth and always enforces these. The frontend should check the
same rules so users get instant feedback.

| Field | Rule | Notes |
|---|---|---|
| `email` | Valid email, max 254 characters | Backend trims and lowercases it before storing or comparing. |
| `username` | 3–30 characters; letters, numbers, `_` and `-` only | Leading/trailing spaces trimmed. Unique, case-insensitive |
| `password` (register) | At least 8 characters, at least one letter and one number, at most 72 bytes | 72 bytes is bcrypt's limit. Accented letters use more than 1 byte
| `password` (login) | Not empty | No strength rules on login |
| `accepted_terms` | Must be `true` | Backend records the time in `terms_accepted_at` |

## 6. Endpoints

### 6.1 `POST /api/auth/register`

Creates an account and signs the user in (session cookies, as if "Remember me" were unchecked).

Request:
```json
{
  "email": "Ana.Silva@Example.com",
  "username": "ana_silva",
  "password": "tacos4ever",
  "accepted_terms": true
}
```

**201 Created**: sets both cookies.
```json
{ "user": { "id": "66f1...", "email": "ana.silva@example.com", "username": "ana_silva" } }
```

Errors:

| Status | `message` |
|---|---|
| 409 | `"An account with this email already exists."` |
| 409 | `"This username is already taken."` |
| 422 | Field-specific message, e.g. `"Password must contain at least one number."` |

Backend stores: `email` (normalized), `username`, `password_hash`, `terms_accepted_at`, `created_at`.

### 6.2 `POST /api/auth/login`

Request:
```json
{ "email": "ana.silva@example.com", "password": "tacos4ever", "remember_me": true }
```
`remember_me` is optional and defaults to `false`.

**200 OK**: sets both cookies (persistent if `remember_me`, session otherwise).
```json
{ "user": { "id": "66f1...", "email": "ana.silva@example.com", "username": "ana_silva" } }
```

Errors:

| Status | `message` |
|---|---|
| 401 | `"Incorrect email or password."` (same message whether the email exists or not, so nobody can find out which emails are registered) |
| 422 | Field-specific message |

### 6.3 `POST /api/auth/refresh`

No body. Uses the `refresh_token` cookie.

**200 OK**: sets a **new pair** of cookies, keeping the original "Remember me" mode.
```json
{ "user": { "id": "66f1...", "email": "ana.silva@example.com", "username": "ana_silva" } }
```

| Status | `message` | Frontend should |
|---|---|---|
| 401 | `"Not authenticated."` / `"Session expired. Please sign in again."` | Treat the user as signed out |

### 6.4 `POST /api/auth/logout`

No body. Always succeeds, even if the user was not signed in.

**200 OK**: tells the browser to delete both cookies.
```json
{ "message": "Signed out." }
```

Note: logout removes the cookies from the browser. A token copied before logout keeps working
until it expires (max 30 minutes for access tokens). Server-side revocation (using `jti`) can be
added in Sprint 4 if needed.

### 6.5 `GET /api/auth/me`

Uses the `access_token` cookie.

**200 OK**
```json
{ "user": { "id": "66f1...", "email": "ana.silva@example.com", "username": "ana_silva" } }
```

| Status | `message` |
|---|---|
| 401 | `"Not authenticated."`, `"Session expired. Please sign in again."`, `"Invalid authentication token."` or `"User no longer exists."` |


## 7. Frontend flows

**App loads / page refresh** (how the user "stays signed in"):
1. `GET /api/auth/me` → 200: signed in, store `user` in AuthContext.
2. If 401 → `POST /api/auth/refresh` → 200: signed in (store `user`).
3. If refresh is also 401 → signed out.

**Any protected request returns 401** (access token expired after 30 min):
call `POST /api/auth/refresh` **once**, then retry the original request. If refresh fails,
clear AuthContext and redirect to `/login`.

**Login:** `POST /api/auth/login` → store `user` in AuthContext → save or remove the email in
`localStorage` depending on "Remember me" → redirect to the dashboard.

**Register:** `POST /api/auth/register` → store `user` in AuthContext → redirect to
preferences onboarding (or dashboard).

**Logout:** `POST /api/auth/logout` → clear AuthContext → redirect to `/`.
Keep the remembered email in `localStorage` (it isn't sensitive and helps next sign-in).

**Never** put tokens, passwords or the user object in `localStorage`. The only thing saved
there is the remembered email.

## 8. Protecting other backend routes

Any route that needs a signed-in user adds one dependency:

```python
from fastapi import Depends
from app.api.deps import get_current_user

@router.get("/preferences")
async def get_preferences(user: dict = Depends(get_current_user)):
    ...  # user is the Mongo document; user["_id"] is an ObjectId
```

It returns 401 in the standard error format when the cookie is missing, invalid or expired.

## 9. Who builds what

| Piece | Owner | Location |
|---|---|---|
| Password hashing/verification, password rules, JWT create/decode, cookie helpers | Rakell | `app/core/security.py` |
| `get_current_user` dependency (protects routes) | Rakell | `app/api/deps.py` |
| Request/response models (`RegisterRequest`, `LoginRequest`, `UserPublic`, …) | Rakell | `app/models/auth.py` |
| `{message}` error handlers | Rakell | `app/core/errors.py` |
| `/api` router and Next.js rewrite | Rakell | `app/api/router.py`, `dish-assistant-frontend/next.config.ts` |
| Auth endpoints (§6) and AuthService | Armando | `app/api/routes/auth.py`, `app/services/auth_service.py` |
| User database model and indexes (from `app/schemas/users.schema.json`) | Armando | `app/models/`, `app/db/` |
| Backend auth tests | Armando | `tests/` |
| Login and register pages (add **username** field; call the endpoints) | Bailey | `dish-assistant-frontend/app/(auth)/` |
| AuthContext, `useAuth`, refresh-and-retry, protected routes | Andrea | `dish-assistant-frontend/` |

### Backend implementation notes 
- Parse bodies with the models in `app/models/auth.py`; they already enforce §5 and normalize email.
- Register: check email and username are free (return 409), then `hash_password()`, insert with
  `terms_accepted_at` and `created_at` set to `datetime.now(timezone.utc)`, then `set_auth_cookies(response, str(user_id), remember_me=False)`.
- Login: look up by normalized email. If not found, call `verify_password_dummy(password)` and return 401;
  otherwise `verify_password()`; on success `set_auth_cookies(response, str(user["_id"]), body.remember_me)`.
- Refresh: read `request.cookies["refresh_token"]`, `decode_token(token, "refresh")`, load the user,
  then `set_auth_cookies(response, payload["sub"], payload["remember"])`.
- Logout: `clear_auth_cookies(response)`.
- Always return users through `UserPublic.from_mongo(document)`.
- Use `to_object_id()` from `app/db/database.py` to turn string ids into ObjectIds.
- Do **not** use FastAPI's `OAuth2PasswordRequestForm`; login is JSON (§6.2).

## 10. Configuration

| Env var | Default | Notes |
|---|---|---|
| `SECRET_KEY` | `change-me-in-production` | **Required in production**: random, 32+ characters. The app refuses to start otherwise. Generate with `python -c "import secrets; print(secrets.token_urlsafe(48))"` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Without "Remember me" |
| `REFRESH_TOKEN_REMEMBER_DAYS` | `30` | With "Remember me" |
| `COOKIE_SECURE` | `false` | **Must be `true` in production** (HTTPS) |
| `COOKIE_SAMESITE` | `lax` | |
| `BACKEND_URL` (frontend) | `http://localhost:8000` | Where Next.js forwards `/api/*`. Must be set **before** `next build` in production. |

## 11. Security notes

- Passwords are hashed with bcrypt (cost 12) and never logged or returned. See `docs/password-security.md`.
- Tokens live only in httpOnly cookies, out of reach of JavaScript.
- `SameSite=Lax` plus JSON-only endpoints protect against cross-site request forgery.
- Login errors don't reveal whether an email is registered.
- Possible later hardening (Sprint 4): login rate limiting, refresh-token revocation on logout/password change.
