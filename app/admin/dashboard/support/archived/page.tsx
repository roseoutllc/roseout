import Link from "next/link";
import { requireAdminRole } from "@/lib/admin-auth";
import { listSupportTickets, type SupportTicket } from "@/lib/support";

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function normalizeSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]?.trim() || "";
  return value?.trim() || "";
}

function isClosedTicket(ticket: SupportTicket) {
  return (ticket.status || "open").toLowerCase() === "closed";
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

export default async function ArchivedSupportTicketsPage({ searchParams }: PageProps) {
  await requireAdminRole(["superuser", "admin", "editor", "reviewer", "viewer"]);

  const { q } = await searchParams;
  const searchQuery = normalizeSearchParam(q);
  const allTickets = await listSupportTickets(500);
  const archivedTickets = allTickets
    .filter(isClosedTicket)
    .filter((ticket) => ticketMatchesSearch(ticket, searchQuery));

  return (
    <main className="px-4 pb-12 pt-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_34%),linear-gradient(135deg,#17110b,#090706_58%,#14100c)] p-6 shadow-2xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-amber-200">Archived Support</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight">Closed tickets</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
                All closed support tickets live here. Search the archive by requester name,
                email address, or ticket number when you need to review old conversations.
              </p>
            </div>
            <Link href="/admin/dashboard/support" className="rounded-full border border-white/10 bg-white/[0.07] px-6 py-3 text-center text-sm font-black text-white/70 hover:bg-white/10 hover:text-white">
              ← Active inbox
            </Link>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-[#111] shadow-2xl">
          <div className="border-b border-white/10 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-white/40">Archive</p>
                <h2 className="mt-2 text-2xl font-black">Closed ticket history</h2>
                <p className="mt-2 text-sm font-bold text-white/40">Showing {archivedTickets.length} closed ticket{archivedTickets.length === 1 ? "" : "s"}.</p>
              </div>
              <form action="/admin/dashboard/support/archived" className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-xl">
                <input
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Search name, email, or ticket number"
                  className="min-h-12 flex-1 rounded-full border border-white/10 bg-black/40 px-4 text-sm font-bold text-white outline-none placeholder:text-white/30 focus:border-amber-200/70"
                />
                <button className="rounded-full bg-white px-5 py-3 text-sm font-black text-black hover:bg-white/90" type="submit">
                  Search
                </button>
                {searchQuery && (
                  <Link href="/admin/dashboard/support/archived" className="rounded-full border border-white/10 px-5 py-3 text-center text-sm font-black text-white/70 hover:bg-white/10 hover:text-white">
                    Clear
                  </Link>
                )}
              </form>
            </div>
          </div>

          <div className="divide-y divide-white/10">
            {archivedTickets.map((ticket) => (
              <Link key={ticket.id} href={`/admin/dashboard/support/${ticket.id}`} className="grid gap-3 p-5 transition hover:bg-white/[0.04] md:grid-cols-[1fr_170px_150px] md:items-center">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">{ticket.ticket_number || ticket.id}</p>
                  <h3 className="mt-1 text-lg font-black">{ticket.subject}</h3>
                  <p className="mt-1 text-sm text-white/45">{ticket.requester_name} · {ticket.requester_email}</p>
                </div>
                <span className="rounded-full bg-amber-200 px-3 py-2 text-center text-xs font-black uppercase tracking-wide text-black">{ticket.status || "closed"}</span>
                <time className="text-sm font-bold text-white/45">{formatDate(ticket.updated_at || ticket.last_message_at || ticket.created_at)}</time>
              </Link>
            ))}

            {archivedTickets.length === 0 && (
              <div className="p-8 text-center text-sm font-bold text-white/45">
                {searchQuery ? "No closed support tickets match that search." : "No closed support tickets yet."}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
