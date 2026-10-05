/**
 * Public connection details for the Servilist database.
 *
 * Both values are public by design: the address is visible in every request a
 * browser makes, and a "publishable" key grants nothing by itself, because
 * every table is protected by row-level security. They are defaults so a
 * deployment still works when an environment setting is missing; setting
 * SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY overrides them.
 *
 * Secrets (payment keys, the payments server secret) are never given defaults
 * and are never placed in this file.
 */
const DEFAULT_SUPABASE_URL = "https://abhnoslxsvbiwvtzncxi.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_yDLqjZXBaFiPckFVZZEURw_3ciKC09I";

export function supabaseUrl(): string {
  return process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
}

export function supabasePublishableKey(): string {
  return process.env.SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_PUBLISHABLE_KEY;
}
