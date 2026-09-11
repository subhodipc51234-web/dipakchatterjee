// app/api/cron/purge-complaints/route.ts
//
// Wire this to any external scheduler (Vercel Cron, an uptime-ping
// service, Supabase pg_cron + pg_net, etc.) to purge expired complaints
// independent of an admin ever opening the dashboard — the dashboard
// itself also purges on every load, so this is a belt-and-suspenders
// mechanism for true background deletion. If CRON_SECRET is set, callers
// must send it as `Authorization: Bearer <secret>`; if unset, the route
// is open (the operation is idempotent and only ever deletes rows already
// past their expiration, so this is low-risk either way).

import { NextResponse } from "next/server";
import { purgeExpiredComplaints } from "@/lib/complaints-cleanup";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await purgeExpiredComplaints();
  return NextResponse.json(result);
}
