import { supabase } from "@/lib/supabase";
import QRCode from "qrcode";
import crypto from "crypto";

async function generateQrCodeDataUrl(url: string) {
  try {
    return await QRCode.toDataURL(url);
  } catch {
    return null;
  }
}

// 🔥 MAIN LOGIC
async function runBackfill(req: Request) {
  const secret = req.headers.get("x-internal-import-secret");

  // Allow browser use in development, require secret in production
  if (
    process.env.NODE_ENV !== "development" &&
    secret !== process.env.IMPORT_SECRET
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const { data: restaurants, error } = await supabase
      .from("restaurants")
      .select("id, claim_token, qr_code_data_url")
      .is("qr_code_data_url", null);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    let updated = 0;

    for (const restaurant of restaurants || []) {
      const claimToken = restaurant.claim_token || crypto.randomUUID();

      const claimUrl = `${baseUrl}/claim/${claimToken}`;

      const qrCodeDataUrl = await generateQrCodeDataUrl(claimUrl);

      const { error: updateError } = await supabase
        .from("restaurants")
        .update({
          claim_token: claimToken,
          claim_url: claimUrl,
          claim_status: "unclaimed",
          qr_code_data_url: qrCodeDataUrl,
        })
        .eq("id", restaurant.id);

      if (!updateError) updated++;
    }

    return Response.json({
      success: true,
      updated,
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}

// ✅ Allow browser access
export async function GET(req: Request) {
  return runBackfill(req);
}

// ✅ Allow secure POST access
export async function POST(req: Request) {
  return runBackfill(req);
}