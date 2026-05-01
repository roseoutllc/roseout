import { requireAdminApiRole } from "@/lib/admin-api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error, supabase } = await requireAdminApiRole([
    "superuser",
    "admin",
    "viewer",
  ]);

  if (error) return error;

  try {
    const since = new Date(Date.now() - 1000 * 60 * 30).toISOString();

    const { data: events, error: fetchError } = await supabase
      .from("user_activity_events")
      .select(
        `
        id,
        user_id,
        session_id,
        event_type,
        event_name,
        page_path,
        metadata,
        created_at
      `
      )
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(300);

    if (fetchError) {
      return Response.json(
        { error: fetchError.message },
        { status: 500 }
      );
    }

    const userIds = Array.from(
      new Set((events || []).map((e) => e.user_id).filter(Boolean))
    );

    const { data: users } = userIds.length
      ? await supabase
          .from("users")
          .select("id,email,full_name,subscription_status,role")
          .in("id", userIds)
      : { data: [] };

    const userMap = new Map((users || []).map((u: any) => [u.id, u]));

    const sessionMap = new Map<string, any>();

    for (const event of events || []) {
      const key = event.session_id || event.user_id || event.id;

      if (!sessionMap.has(key)) {
        const profile = event.user_id ? userMap.get(event.user_id) : null;

        sessionMap.set(key, {
          session_id: event.session_id,
          user_id: event.user_id,
          user: profile || null,
          current_page: event.page_path,
          last_event_type: event.event_type,
          last_event_name: event.event_name,
          last_seen: event.created_at,
          events_count: 0,
          events: [],
        });
      }

      const session = sessionMap.get(key);
      session.events_count += 1;

      if (session.events.length < 8) {
        session.events.push(event);
      }
    }

    const sessions = Array.from(sessionMap.values()).sort(
      (a, b) =>
        new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime()
    );

    const liveNow = sessions.filter((session) => {
      const lastSeen = new Date(session.last_seen).getTime();
      return Date.now() - lastSeen <= 1000 * 60 * 5;
    });

    return Response.json({
      sessions,
      live_now: liveNow.length,
      total_sessions: sessions.length,
      events: events || [],
    });
  } catch (err: any) {
    return Response.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}