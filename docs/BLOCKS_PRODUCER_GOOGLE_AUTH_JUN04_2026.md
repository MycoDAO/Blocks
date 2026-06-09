# BLOCKS Producer — Google Sign-In (Jun 04, 2026)

**Status:** Complete (code)  
**Site:** `https://blocks.mycodao.com` (MycoDAO — not mycosoft.com)

## Behavior

- Producer tab (`/blocks/?producer=1` or `#producer`) uses **Google OAuth** via Supabase.
- Session is **persisted in the browser** (`localStorage`, auto-refresh) until sign-out.
- **No magic link / email OTP** for producer login.
- Server still enforces an **email allowlist** after Google sign-in (`lib/server/producer-auth.ts`).

## Supabase dashboard (one-time)

Project: same Supabase used by MycoDAO (`NEXT_PUBLIC_SUPABASE_URL` on VM 198).

### 1. Google provider

**Authentication → Providers → Google**

- Enable Google
- Use Google Cloud OAuth client ID + secret (Web application)
- Authorized redirect URI in **Google Cloud Console** must include:
  - `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`

### 2. URL configuration (fixes redirect to mycosoft.com)

This project **shares** Supabase with mycosoft.com. **Site URL** stays `https://mycosoft.com` for the main site.

Producer OAuth **must** whitelist MycoDAO callbacks or Supabase sends users to Site URL with `?code=...` on **mycosoft.com** (broken).

**Authentication → URL Configuration → Redirect URLs** — add **exactly**:

```
https://blocks.mycodao.com/blocks/?producer=1
https://blocks.mycodao.com/blocks/**
http://localhost:3004/blocks/?producer=1
```

Optional if you serve Blocks on apex domain:

```
https://www.mycodao.com/blocks/?producer=1
https://mycodao.com/blocks/?producer=1
```

**Do not** remove mycosoft.com from Site URL — add MycoDAO URLs to **Redirect URLs** only.

Server env (VM `.env.production`):

```env
PRODUCER_OAUTH_REDIRECT_URL=https://blocks.mycodao.com/blocks/?producer=1
```

### 3. Email provider

Magic link is **not** used for producer. Email provider can stay on for other apps sharing the project.

## Allowlisted Google accounts

Default (override with `NEWS_PRODUCER_ALLOWED_EMAILS` on server):

- `morgan@mycosoft.org`
- `morgan@mycodao.com`
- `abelardo@mycosoft.org`
- `abelardo@mycodao.com`

Google must return one of these emails or producer APIs return 401.

## Verify

1. Open `https://blocks.mycodao.com/blocks/?producer=1`
2. **Continue with Google** → pick allowlisted account
3. Land back on producer dashboard with controls unlocked
4. Close tab, reopen same URL — should still be signed in (remember me)
5. **Sign out** clears session

## Deploy

Rebuild pulse + Next image on VM 198 after pull (`npm run build`, restart `mycodao-app`).
