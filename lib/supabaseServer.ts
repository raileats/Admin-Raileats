// lib/supabaseServer.ts

import "server-only";

import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { cookies } from "next/headers";

/* =========================================================
   ENVIRONMENT
========================================================= */

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "";

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "";

function requireEnvironment(
  name: string,
  value: string,
) {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}`,
    );
  }

  return value;
}

const SERVER_SUPABASE_URL =
  requireEnvironment(
    "SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL",
    SUPABASE_URL,
  );

const SERVER_SERVICE_ROLE_KEY =
  requireEnvironment(
    "SUPABASE_SERVICE_ROLE_KEY",
    SUPABASE_SERVICE_ROLE_KEY,
  );

/* =========================================================
   SHARED CLIENT OPTIONS
========================================================= */

const SERVER_AUTH_OPTIONS = {
  persistSession: false,
  autoRefreshToken: false,
  detectSessionInUrl: false,
} as const;

/* =========================================================
   SERVICE-ROLE CLIENT
   - Server only
   - Bypasses RLS
   - Used by admin APIs, cron jobs and OrderJourney helper
========================================================= */

export const serviceClient: SupabaseClient =
  createClient(
    SERVER_SUPABASE_URL,
    SERVER_SERVICE_ROLE_KEY,
    {
      auth: SERVER_AUTH_OPTIONS,
      global: {
        headers: {
          "X-Client-Info":
            "raileats-server-service-role",
        },
      },
    },
  );

/*
 * Existing imports compatibility:
 *
 * import { supabaseServer } from "@/lib/supabaseServer";
 */
export const supabaseServer =
  serviceClient;

/* =========================================================
   CREATE FRESH SERVICE CLIENT
   Useful when a route needs an isolated client instance.
========================================================= */

export function createServiceClient(): SupabaseClient {
  return createClient(
    SERVER_SUPABASE_URL,
    SERVER_SERVICE_ROLE_KEY,
    {
      auth: SERVER_AUTH_OPTIONS,
      global: {
        headers: {
          "X-Client-Info":
            "raileats-server-service-role",
        },
      },
    },
  );
}

/* =========================================================
   COOKIE-AWARE USER CLIENT
   Uses anon key + current user access token.
========================================================= */

export function getServerClient(): SupabaseClient {
  const anonKey =
    requireEnvironment(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY",
      SUPABASE_ANON_KEY,
    );

  const cookieStore =
    cookies();

  const accessToken =
    cookieStore
      .get("sb-access-token")
      ?.value ||
    "";

  return createClient(
    SERVER_SUPABASE_URL,
    anonKey,
    {
      auth: SERVER_AUTH_OPTIONS,
      global: {
        headers: accessToken
          ? {
              Authorization:
                `Bearer ${accessToken}`,
              "X-Client-Info":
                "raileats-server-user",
            }
          : {
              "X-Client-Info":
                "raileats-server-anon",
            },
      },
    },
  );
}

/* =========================================================
   SIMPLE ANON CLIENT
========================================================= */

export function createAnonClient(): SupabaseClient {
  const anonKey =
    requireEnvironment(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY",
      SUPABASE_ANON_KEY,
    );

  return createClient(
    SERVER_SUPABASE_URL,
    anonKey,
    {
      auth: SERVER_AUTH_OPTIONS,
      global: {
        headers: {
          "X-Client-Info":
            "raileats-server-anon",
        },
      },
    },
  );
}

export default serviceClient;
