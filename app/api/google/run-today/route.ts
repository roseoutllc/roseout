export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const res = await fetch(`${baseUrl}/api/google/import-batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-import-secret": process.env.IMPORT_SECRET || "",
      },
      body: JSON.stringify({
        start: 0,
        limit: 2,
      }),
    });

    const data = await res.json();

    return Response.json({
      success: res.ok,
      message: "Today’s 2 imports ran.",
      result: data,
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Import failed" },
      { status: 500 }
    );
  }
}