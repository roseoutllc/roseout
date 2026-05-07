import { NextRequest } from "next/server";
import { autoCloseInactiveSupportTickets } from "@/lib/support";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const supportSecret = process.env.SUPPORT_INBOUND_SECRET;
  const authorization = request.headers.get("authorization");
  const supportHeader = request.headers.get("x-support-secret");

  if (supportSecret && supportHeader === supportSecret) return true;

  if (
    cronSecret &&
    authorization?.toLowerCase().startsWith("bearer ") &&
    authorization.replace(/^Bearer\s+/i, "") === cronSecret
  ) {
    return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await autoCloseInactiveSupportTickets();

  return Response.json({ success: true, ...result });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
