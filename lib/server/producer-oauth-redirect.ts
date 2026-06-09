const DEFAULT_PRODUCER_OAUTH_REDIRECT =
  "https://blocks.mycodao.com/blocks/?producer=1";

/**
 * Where Google OAuth must return after Supabase auth.
 * Must be listed in Supabase → Authentication → URL Configuration → Redirect URLs.
 * Do not use mycosoft.com — shared Supabase project Site URL is mycosoft.com.
 */
export function getProducerOAuthRedirectUrl(): string {
  const explicit = (
    process.env.PRODUCER_OAUTH_REDIRECT_URL ||
    process.env.NEXT_PUBLIC_PRODUCER_OAUTH_REDIRECT ||
    ""
  ).trim();
  if (explicit) return explicit;

  const site = (
    process.env.MYCODAO_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_MYCODAO_SITE_URL ||
    ""
  )
    .trim()
    .replace(/\/$/, "");
  if (site) {
    return `${site}/blocks/?producer=1`;
  }

  return DEFAULT_PRODUCER_OAUTH_REDIRECT;
}
