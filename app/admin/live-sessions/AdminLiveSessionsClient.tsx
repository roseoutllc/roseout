"use client";

import { useEffect, useMemo, useState } from "react";
import AdminTopBar from "@/components/admin/AdminTopBar";

type EventItem = {
  id: string;
  user_id: string | null;
  session_id: string | null;
  event_type: string;
  event_name: string | null;
  page_path: string | null;
  metadata: any;
  created_at: string;
};

type LiveSession = {
  session_id: string | null;
  user_id: string | null;
  user: {
    id: string;
    email: string | null;
    full_name: string | null;
    role: string | null;
    subscription_status: string | null;
  } | null;
  current_page: string | null;
  last_event_type: string | null;
  last_event_name: string | null;
  last_seen: string;
  events_count: number;
  events: EventItem[];
};

export default function AdminLiveSessionsClient() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [liveNow, setLiveNow] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<LiveSession | null>(
    null
  );

  async function loadSessions() {
    try {
      const res = await fetch("/api/admin/live-sessions", {
        cache: "no-store",
      });

      const data = await res.json();

      setSessions(data.sessions || []);
      setEvents(data.events || []);
      setLiveNow(data.live_now || 0);

      if (selectedSession) {
        const updated = (data.sessions || []).find(
          (s: LiveSession) => s.session_id === selectedSession.session_id
        );

        if (updated) setSelectedSession(updated);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSessions();

    const timer = setInterval(loadSessions, 5000);

    return () => clearInterval(timer);
  }, []);

  const totalEvents = events.length;

  const activePages = useMemo(() => {
    const counts = new Map<string, number>();

    sessions.forEach((session) => {
      const page = session.current_page || "Unknown";
      counts.set(page, (counts.get(page) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [sessions]);

  return (
    <main className="min-h-screen bg-[#080407] text-white">
      <AdminTopBar />

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.25),transparent_35%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.18),transparent_30%)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-10">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-rose-300">
            RoseOut Admin
          </p>

          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight md:text-6xl">
                Live User Sessions
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55">
                See what users are doing right now — page views, searches,
                clicks, saved-plan activity, and conversion events.
              </p>
            </div>

            <button
              onClick={loadSessions}
              className="rounded-full bg-white px-6 py-3 text-sm font-black text-black transition hover:bg-rose-100"
            >
              Refresh Now
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Live Now" value={liveNow} tone="rose" />
          <StatCard label="Recent Sessions" value={sessions.length} />
          <StatCard label="Events 30 Min" value={totalEvents} />
          <StatCard label="Refresh Rate" value="5s" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/25 lg:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-rose-300">
                  Sessions
                </p>
                <h2 className="mt-2 text-2xl font-black">
                  Active User Feed
                </h2>
              </div>

              <div className="rounded-full bg-emerald-500/15 px-4 py-2 text-xs font-black text-emerald-300">
                Auto-refreshing
              </div>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-black/25 p-8 text-center text-white/50">
                Loading live sessions...
              </div>
            ) : sessions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-black/25 p-10 text-center">
                <h3 className="text-2xl font-black">No live activity yet</h3>
                <p className="mt-2 text-sm text-white/45">
                  Once users visit tracked pages, their sessions will appear
                  here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => {
                  const isLive =
                    Date.now() - new Date(session.last_seen).getTime() <=
                    1000 * 60 * 5;

                  return (
                    <button
                      key={session.session_id || session.user_id}
                      onClick={() => setSelectedSession(session)}
                      className="w-full rounded-[1.5rem] border border-white/10 bg-black/25 p-5 text-left transition hover:border-rose-400/40 hover:bg-rose-500/10"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                isLive ? "bg-emerald-400" : "bg-white/25"
                              }`}
                            />

                            <p className="truncate text-lg font-black">
                              {session.user?.full_name ||
                                session.user?.email ||
                                "Guest Session"}
                            </p>
                          </div>

                          <p className="mt-1 truncate text-sm text-white/45">
                            {session.user?.email ||
                              session.session_id ||
                              "No email"}
                          </p>

                          <p className="mt-3 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/60">
                            {session.current_page || "Unknown page"}
                          </p>
                        </div>

                        <div className="text-left md:text-right">
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/35">
                            Last Action
                          </p>
                          <p className="mt-1 text-sm font-bold text-white">
                            {session.last_event_name ||
                              session.last_event_type ||
                              "Activity"}
                          </p>
                          <p className="mt-2 text-xs text-white/35">
                            {timeAgo(session.last_seen)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Badge>{session.events_count} events</Badge>
                        <Badge>{session.user?.subscription_status || "guest"}</Badge>
                        <Badge>{session.user?.role || "user"}</Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/25">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-rose-300">
                Top Pages
              </p>
              <h2 className="mt-2 text-2xl font-black">Right Now</h2>

              <div className="mt-5 space-y-3">
                {activePages.length === 0 ? (
                  <p className="text-sm text-white/45">No page data yet.</p>
                ) : (
                  activePages.map((item) => (
                    <div
                      key={item.page}
                      className="rounded-2xl bg-black/25 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-bold text-white">
                          {item.page}
                        </p>
                        <span className="rounded-full bg-rose-500 px-3 py-1 text-xs font-black">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/25">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-rose-300">
                Recent Events
              </p>
              <h2 className="mt-2 text-2xl font-black">Activity Stream</h2>

              <div className="mt-5 max-h-[480px] space-y-3 overflow-y-auto">
                {events.slice(0, 15).map((event) => (
                  <div
                    key={event.id}
                    className="rounded-2xl border border-white/10 bg-black/25 p-4"
                  >
                    <p className="text-sm font-black">
                      {event.event_name || event.event_type}
                    </p>
                    <p className="mt-1 truncate text-xs text-white/45">
                      {event.page_path || "Unknown page"}
                    </p>
                    <p className="mt-2 text-xs text-white/30">
                      {timeAgo(event.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>

        {selectedSession && (
          <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/25">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-rose-300">
                  Session Detail
                </p>
                <h2 className="mt-2 text-2xl font-black">
                  {selectedSession.user?.full_name ||
                    selectedSession.user?.email ||
                    "Guest Session"}
                </h2>
              </div>

              <button
                onClick={() => setSelectedSession(null)}
                className="rounded-full border border-white/10 px-4 py-2 text-xs font-black text-white/70 hover:bg-white hover:text-black"
              >
                Close
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <InfoBox
                label="Current Page"
                value={selectedSession.current_page || "Unknown"}
              />
              <InfoBox
                label="Last Seen"
                value={timeAgo(selectedSession.last_seen)}
              />
              <InfoBox
                label="Session ID"
                value={selectedSession.session_id || "None"}
              />
            </div>

            <div className="mt-6 space-y-3">
              {selectedSession.events.map((event) => (
                <div
                  key={event.id}
                  className="rounded-2xl border border-white/10 bg-black/25 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-black">
                        {event.event_name || event.event_type}
                      </p>
                      <p className="mt-1 text-sm text-white/45">
                        {event.page_path || "Unknown page"}
                      </p>
                    </div>

                    <p className="text-xs text-white/35">
                      {new Date(event.created_at).toLocaleString()}
                    </p>
                  </div>

                  {event.metadata &&
                    Object.keys(event.metadata).length > 0 && (
                      <pre className="mt-3 overflow-x-auto rounded-xl bg-black/40 p-3 text-xs text-white/50">
                        {JSON.stringify(event.metadata, null, 2)}
                      </pre>
                    )}
                </div>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "rose";
}) {
  return (
    <div
      className={`rounded-[1.5rem] border p-5 shadow-xl shadow-black/20 ${
        tone === "rose"
          ? "border-rose-400/25 bg-rose-500/15"
          : "border-white/10 bg-white/[0.05]"
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/35">
        {label}
      </p>
      <h2 className="mt-3 text-4xl font-black">{value}</h2>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold capitalize text-white/55">
      {children}
    </span>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-white/35">
        {label}
      </p>
      <p className="mt-2 break-all text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function timeAgo(dateString: string) {
  const seconds = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 1000
  );

  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}