import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: "Email required." }, { status: 400 });
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://roseout.vercel.app";

    const { error } = await supabaseAdmin.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err: any) {
    return Response.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}