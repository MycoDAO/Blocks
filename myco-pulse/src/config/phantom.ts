import { AddressType } from "@phantom/react-sdk";
import type { PhantomSDKConfig } from "@phantom/react-sdk";
import { mycodaoColorLogo } from "../lib/brandLogos";

export const PHANTOM_APP_ID =
  import.meta.env.VITE_PHANTOM_APP_ID?.trim() || "0b78c207-6c6c-4ab7-8350-8f02552f3298";

const PHANTOM_PORTAL_ICON =
  "https://phantom-portal20240925173430423400000001.s3.ca-central-1.amazonaws.com/icons/2882e7c6-2fed-49b3-995b-1ad4e75f6fa4.png";

/**
 * OAuth redirect_uri — must match Phantom Portal redirect URLs exactly (origin only).
 * Portal: https://blocks.mycodao.com, http://blocks.mycodao.com (origin only, no /blocks path).
 * After OAuth, root forwards query params to /blocks/ so PhantomProvider can resume.
 */
export function resolvePhantomRedirectUrl(): string {
  const fromEnv = import.meta.env.VITE_PHANTOM_REDIRECT_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "https://blocks.mycodao.com";
}

export function buildPhantomConfig(): PhantomSDKConfig {
  return {
    providers: ["google", "apple", "injected"],
    appId: PHANTOM_APP_ID,
    addressTypes: [AddressType.solana],
    authOptions: {
      redirectUrl: resolvePhantomRedirectUrl(),
    },
  };
}

export const PHANTOM_APP_ICON =
  typeof mycodaoColorLogo === "string" ? mycodaoColorLogo : PHANTOM_PORTAL_ICON;

export const PHANTOM_APP_NAME = "Blocks";
