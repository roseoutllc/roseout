import Link from "next/link";
import { requireAdminRole } from "@/lib/admin-auth";
import SupportTicketClient from "@/components/support/SupportTicketClient";
import { autoCloseInactiveSupportTickets, listSupportTickets, type SupportTicket } from "@/lib/support";

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function normalizeSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]?.trim() || "";
  return value?.trim() || "";
}

function getTicketStatus(ticket: SupportTicket) {
  return (ticket.status || "open").toLowerCase();
}

function isClosedTicket(ticket: SupportTicket) {
  return getTicketStatus(ticket) === "closed";
}

function ticketMatchesSearch(ticket: SupportTicket, query: string) {
  if (!query) return true;

  const normalizedQuery = query.toLowerCase();
  return [
    ticket.requester_name,
    ticket.requester_email,
    ticket.ticket_number,
  ].some((value) => value?.toLowerCase().includes(normalizedQuery));
}

type PageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

export default async function AdminSupportPage({ searchParams }: PageProps) {
  await requireAdminRole(["superuser", "admin", "editor", "reviewer", "viewer"]);

  const { q } = await searchParams;
  const searchQuery = normalizeSearchParam(q);
  const autoCloseResult = await autoCloseInactiveSupportTickets();
  const allTickets = await listSupportTickets(500);
  const activeTickets = allTickets.filter((ticket) => !isClosedTicket(ticket));
  const supportTickets = activeTickets.filter((ticket) => ticketMatchesSearch(ticket, searchQuery));
  const stats = [
    { label: "Active tickets", value: activeTickets.length, helper: "Open and waiting tickets" },
    { label: "Open", value: activeTickets.filter((ticket) => getTicketStatus(ticket) === "open").length, helper: "Needs admin review" },
    { label: "Waiting", value: activeTickets.filter((ticket) => getTicketStatus(ticket) === "waiting_on_customer").length, helper: "Waiting on requester" },
    { label: "Archived", value: allTickets.filter(isClosedTicket).length, helper: "Closed tickets" },
  ];

  return (
    <main className="px-4 pb-12 pt-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(225,29,72,0.22),transparent_34%),linear-gradient(135deg,#170b0b,#090706_58%,#14100c)] p-6 shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-rose-300">Admin Support</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">Support tickets</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
            View active tickets created from support pages and contact forms, submit an
            admin ticket, and reply from the dashboard or by email.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="#new-ticket" className="rounded-full bg-gradient-to-r from-rose-500 to-rose-700 px-6 py-3 text-sm font-black text-white shadow-lg">
              Submit ticket
            </Link>
            <Link href="/admin/dashboard/support/archived" className="rounded-full border border-amber-300/30 bg-amber-300/10 px-6 py-3 text-sm font-black text-amber-100 hover:bg-amber-300/20">
              Archived tickets
            </Link>
            <Link href="/support" className="rounded-full border border-white/10 bg-white/[0.07] px-6 py-3 text-sm font-black text-white/70 hover:bg-white/10 hover:text-white">
              Public support page
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-[1.5rem] border border-white/10 bg-[#111] p-5 shadow-xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">{stat.label}</p>
              <p className="mt-3 text-4xl font-black tracking-tight text-white">{stat.value}</p>
              <p className="mt-2 text-sm font-bold text-white/45">{stat.helper}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-[#111] shadow-2xl">
          <div className="border-b border-white/10 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-white/40">Inbox</p>
                <h2 className="mt-2 text-2xl font-black">Latest active tickets</h2>
                <p className="mt-2 text-sm font-bold text-white/40">Closed tickets are stored in the archived section.</p>
              </div>
              <form action="/admin/dashboard/support" className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-xl">
                <input
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Search name, email, or ticket number"
                  className="min-h-12 flex-1 rounded-full border border-white/10 bg-black/40 px-4 text-sm font-bold text-white outline-none placeholder:text-white/30 focus:border-rose-300/70"
                />
                <button className="rounded-full bg-white px-5 py-3 text-sm font-black text-black hover:bg-white/90" type="submit">
                  Search
                </button>
                {searchQuery && (
                  <Link href="/admin/dashboard/support" className="rounded-full border border-white/10 px-5 py-3 text-center text-sm font-black text-white/70 hover:bg-white/10 hover:text-white">
                    Clear
                  </Link>
                )}
              </form>
            </div>
          </div>

          {autoCloseResult.closed > 0 && (
            <div className="border-b border-emerald-400/20 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-100">
              Auto-closed {autoCloseResult.closed} inactive support ticket{autoCloseResult.closed === 1 ? "" : "s"}. View them in the archived section.
            </div>
          )}

          <div className="divide-y divide-white/10">
            {supportTickets.map((ticket) => (
              <Link key={ticket.id} href={`/admin/dashboard/support/${ticket.id}`} className="grid gap-3 p-5 transition hover:bg-white/[0.04] md:grid-cols-[1fr_170px_150px] md:items-center">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-300">{ticket.ticket_number || ticket.id}</p>
                  <h3 className="mt-1 text-lg font-black">{ticket.subject}</h3>
                  <p className="mt-1 text-sm text-white/45">{ticket.requester_name} · {ticket.requester_email}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-2 text-center text-xs font-black uppercase tracking-wide text-black">{ticket.status || "open"}</span>
                <time className="text-sm font-bold text-white/45">{formatDate(ticket.last_message_at || ticket.created_at)}</time>
              </Link>
            ))}

            {supportTickets.length === 0 && (
              <div className="p-8 text-center text-sm font-bold text-white/45">
                {searchQuery ? "No active support tickets match that search." : "No active support tickets yet."}
              </div>
            )}
          </div>
        </section>

        <section id="new-ticket" className="mt-6">
          <SupportTicketClient defaultSource="admin_support" compact />
        </section>
      </div>
    </main>
  );
}
