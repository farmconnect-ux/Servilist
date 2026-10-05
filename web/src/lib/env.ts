import "server-only";
import { supabasePublishableKey, supabaseUrl } from "@/lib/public-config";

/**
 * Server configuration. Values are read when a request needs them, so a build
 * without secrets still succeeds and a misconfigured deployment fails loudly.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}. See web/.env.example.`);
  }
  return value;
}

export const env = {
  get supabaseUrl() {
    return supabaseUrl();
  },
  get supabasePublishableKey() {
    return supabasePublishableKey();
  },
  /** A setting that has no safe default, such as a payment secret. */
  required,
  /** Public origin of this deployment, used in links sent by email. */
  get appUrl() {
    return (
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
    ).replace(/\/$/, "");
  },
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
};
