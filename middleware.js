/** @type {import('next/server').NextRequest} */
import { NextResponse } from "next/server";

const BLOCKS_HOST = "blocks.mycodao.com";
const LEGACY_PULSE_HOST = "pulse.mycodao.com";
const APP_HOSTS = new Set([BLOCKS_HOST, LEGACY_PULSE_HOST]);

export function middleware(request) {
  const host = request.headers.get("host")?.split(":")[0] ?? "";

  // Canonical host: pulse.mycodao.com → blocks.mycodao.com (preserve path + query).
  if (host === LEGACY_PULSE_HOST) {
    const dest = new URL(request.url);
    dest.hostname = BLOCKS_HOST;
    dest.protocol = "https:";
    return NextResponse.redirect(dest, 301);
  }

  // Live Blocks hostname: send / to the dashboard (Cloudflare Tunnel or direct).
  if (APP_HOSTS.has(host) && request.nextUrl.pathname === "/") {
    const dest = new URL("/blocks/", request.url);
    dest.search = request.nextUrl.search;
    dest.hash = request.nextUrl.hash;
    return NextResponse.redirect(dest);
  }

  // In dev, app is served at / (no basePath). Redirect /mycodao.financial -> / so old links work.
  if (process.env.NODE_ENV !== "production" && request.nextUrl.pathname.startsWith("/mycodao.financial")) {
    const path = request.nextUrl.pathname.slice("/mycodao.financial".length) || "/";
    const url = new URL(path, request.url);
    url.search = request.nextUrl.search;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/mycodao.financial", "/mycodao.financial/:path*"],
};
