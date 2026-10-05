import { NextResponse } from "next/server";

/** Liveness check for monitoring. Reveals nothing about configuration. */
export function GET() {
  return NextResponse.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
}
