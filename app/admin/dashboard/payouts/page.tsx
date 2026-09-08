import { requireAdminRole } from "@/lib/admin-auth";
import { ADMIN_PAGE_ACCESS } from "@/lib/admin-permissions";
import { readAdminPayoutsSnapshot } from "@/lib/admin/admin-payouts";
import type { IntegrationBalanceAmount, IntegrationStripePayout } from "@/lib/aws/integration-api";
import {
  AdminActionButton,
  AdminDataTableShell,
  AdminKpiCard,
  AdminKpiGrid,
  AdminPageHeader,
  AdminPageShell,
  AdminSectionCard,
} from "@/components/admin/AdminDesignSystem";

export const dynamic = "force-dynamic";

function money(amount: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format((Number(amount) || 0) / 100);
}

function total(items: IntegrationBalanceAmount[] | undefined, currency = "usd") {
  return (items || [])
    .filter((item) => String(item.currency).toLowerCase() === currency)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

function statusClass(value: string) {
  const normalized = value.toLowerCase();
  if (["paid", "complete", "active"].includes(normalized)) {
    return "border-emerald-400/25 bg-emerald-400/10 text-emerald-200";
  }
  if (
    normalized.includes("fail") ||
    normalized.includes("cancel") ||
    normalized.includes("restricted")
  ) {
    return "border-red-400/25 bg-red-400/10 text-red-200";
  }
  return "border-amber-300/20 bg-amber-300/10 text-amber-100";
}

function badge(value: string) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-bold ${statusClass(value)}`}
    >
      {value || "unknown"}
    </span>
  );
}

type RecentPayout = IntegrationStripePayout & {
  ownerName: string;
  ownerType: "Location" | "Organizer";
  accountId: string;
};

export default async function PayoutsPage() {
  await requireAdminRole(ADMIN_PAGE_ACCESS.payouts);
  const { owners, snapshots, auditRows } = await readAdminPayoutsSnapshot();

  const usdAvailable = snapshots.reduce(
    (sum, snapshot) => sum + total(snapshot.available),
    0,
  );
  const usdPending = snapshots.reduce(
    (sum, snapshot) => sum + total(snapshot.pending),
    0,
  );
  const recentPayouts: RecentPayout[] = snapshots
    .flatMap((snapshot) =>
      snapshot.payouts.map((payout) => ({
        ...payout,
        ownerName: snapshot.name,
        ownerType: snapshot.ownerType,
        accountId: snapshot.accountId,
      })),
    )
    .sort((a, b) => Number(b.created || 0) - Number(a.created || 0));
  const paid30d = recentPayouts
    .filter(
      (payout) =>
        payout.status === "paid" &&
        Number(payout.created || 0) >=
          Math.floor((Date.now() - 30 * 86_400_000) / 1000),
    )
    .reduce((sum, payout) => sum + Number(payout.amount || 0), 0);
  const failed = recentPayouts.filter((payout) => payout.status === "failed").length;

  return (
    <AdminPageShell>
      <AdminPageHeader
        eyebrow="Commerce"
        title="Payouts"
        subtitle="Stripe Connect payout oversight for locations and organizers. Connected businesses control payout settings in Stripe; this workspace monitors readiness, balances, payout status, and failures."
        actions={
          <AdminActionButton href="/admin/dashboard/ticket-orders">
            Ticket Orders
          </AdminActionButton>
        }
      />

      <AdminKpiGrid>
        <AdminKpiCard label="Connected accounts" value={owners.length} />
        <AdminKpiCard label="Available balance" value={money(usdAvailable)} />
        <AdminKpiCard label="Pending balance" value={money(usdPending)} />
        <AdminKpiCard label="Paid · recent" value={money(paid30d)} />
        <AdminKpiCard label="Failed payouts" value={failed} />
      </AdminKpiGrid>

      <AdminSectionCard className="p-5">
        <div className="mb-4">
          <h2 className="text-lg font-black">Connected account health</h2>
          <p className="mt-1 text-sm text-white/45">
            Live balance data is read from each connected Stripe account.
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {snapshots.map((row) => (
            <article
              key={`${row.ownerType}-${row.ownerId}`}
              className="admin-secondary rounded-2xl border border-white/10 bg-white/[0.025] p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="truncate font-black">{row.name}</div>
                  <div className="mt-1 break-all text-xs text-white/40">
                    {row.ownerType} · {row.apiVersion.toUpperCase()} · {row.accountId}
                  </div>
                </div>
                {badge(row.onboarding)}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-black/25 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-white/35">
                    Available
                  </p>
                  <p className="mt-1 text-lg font-black">
                    {money(total(row.available))}
                  </p>
                </div>
                <div className="rounded-xl bg-black/25 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-white/35">
                    Pending
                  </p>
                  <p className="mt-1 text-lg font-black">
                    {money(total(row.pending))}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {badge(row.chargesEnabled ? "charges active" : "charges inactive")}
                {badge(row.payoutsEnabled ? "payouts active" : "payouts inactive")}
                {row.requiresAction ? badge("action required") : null}
              </div>
              {row.error ? (
                <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-xs text-red-200">
                  Stripe read error: {row.error}
                </p>
              ) : null}
            </article>
          ))}
          {snapshots.length === 0 ? (
            <div className="col-span-full py-10 text-center text-white/45">
              No locations or organizers have connected Stripe accounts yet.
            </div>
          ) : null}
        </div>
      </AdminSectionCard>

      <AdminDataTableShell>
        <div className="border-b border-white/10 p-5">
          <h2 className="text-lg font-black">Recent Stripe payouts</h2>
          <p className="mt-1 text-sm text-white/45">
            Latest payouts reported directly by connected accounts.
          </p>
        </div>
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-white/[0.035] text-[11px] uppercase tracking-wider text-white/40">
            <tr>
              {["Owner", "Payout", "Amount", "Status", "Arrival", "Method", "Failure"].map(
                (heading) => (
                  <th key={heading} className="px-4 py-3">
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {recentPayouts.slice(0, 50).map((payout) => (
              <tr key={`${payout.accountId}-${payout.id}`}>
                <td className="px-4 py-4">
                  <div className="font-bold">{payout.ownerName}</div>
                  <div className="text-xs text-white/40">{payout.ownerType}</div>
                </td>
                <td className="px-4 py-4 font-mono text-xs text-white/55">
                  {payout.id}
                </td>
                <td className="px-4 py-4 font-black">
                  {money(payout.amount, payout.currency)}
                </td>
                <td className="px-4 py-4">{badge(payout.status)}</td>
                <td className="px-4 py-4 text-white/55">
                  {payout.arrival_date
                    ? new Date(payout.arrival_date * 1000).toLocaleDateString()
                    : "—"}
                </td>
                <td className="px-4 py-4 text-white/55">
                  {payout.method || payout.type || "—"}
                </td>
                <td className="px-4 py-4 text-xs text-red-200">
                  {payout.failure_message || payout.failure_code || "—"}
                </td>
              </tr>
            ))}
            {recentPayouts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-white/45">
                  No Stripe payouts have been reported yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </AdminDataTableShell>

      <AdminSectionCard>
        <div className="border-b border-white/10 p-5">
          <h2 className="text-lg font-black">Payout webhook audit</h2>
          <p className="mt-1 text-sm text-white/45">
            Platform-received payout events used for investigation and failure monitoring.
          </p>
        </div>
        <div className="divide-y divide-white/[0.06]">
          {auditRows.map((log) => (
            <div
              key={log.id}
              className="grid min-w-0 gap-2 px-5 py-4 md:grid-cols-[180px_minmax(0,1fr)_160px_minmax(0,1fr)]"
            >
              <div>{badge(log.eventType || "payout")}</div>
              <div className="min-w-0 break-all font-mono text-xs text-white/55">
                {log.payoutId || log.id}
              </div>
              <div className="text-sm font-bold">
                {log.amount != null ? money(log.amount, log.currency || "usd") : "—"}
              </div>
              <div className="min-w-0 break-words text-xs text-white/45">
                {log.processingError ||
                  log.failureMessage ||
                  (log.createdAt ? new Date(log.createdAt).toLocaleString() : "—")}
              </div>
            </div>
          ))}
          {auditRows.length === 0 ? (
            <div className="px-6 py-10 text-center text-white/45">
              No payout webhook events yet.
            </div>
          ) : null}
        </div>
      </AdminSectionCard>
    </AdminPageShell>
  );
}
