"use client";

import { useMemo, useState } from "react";

type Recipient = {
  id: string;
  type: "user" | "location";
  locationType?: "restaurants" | "activities";
  title: string;
  subtitle: string;
  email: string | null;
  phone: string | null;
  smsOptIn?: boolean;
  meta?: string | null;
};

type Channel = "email" | "sms" | "both";

type Template = {
  key: string;
  label: string;
  description: string;
  channel: Channel;
  subject: string;
  emailBody: string;
  smsBody: string;
};

const TEMPLATES: Template[] = [
  {
    key: "welcome",
    label: "Welcome / onboarding",
    description: "Invite a customer or owner to start using RoseOut.",
    channel: "both",
    subject: "Welcome to RoseOut",
    emailBody:
      "Hi there,\n\nWelcome to RoseOut. We are excited to help you discover and manage better experiences. Reply to this email if you need help getting started.\n\n— RoseOut Team",
    smsBody:
      "RoseOut: Welcome! We are excited to help you discover and manage better experiences. Reply if you need help.",
  },
  {
    key: "location_claim",
    label: "Claim your location",
    description: "Ask a location owner to claim and polish their listing.",
    channel: "both",
    subject: "Claim your RoseOut location",
    emailBody:
      "Hi,\n\nYour location is listed on RoseOut. Claiming your profile lets you update photos, contact details, booking links, and business information.\n\nReply here and we can help you get set up.\n\n— RoseOut Team",
    smsBody:
      "RoseOut: Your location is listed on RoseOut. Reply here and we can help you claim and update your profile.",
  },
  {
    key: "reservation_followup",
    label: "Reservation follow-up",
    description: "Send a short support follow-up about a booking.",
    channel: "both",
    subject: "RoseOut reservation follow-up",
    emailBody:
      "Hi,\n\nWe are following up about your RoseOut reservation. Please reply with any questions or updates, and our team will help.\n\n— RoseOut Team",
    smsBody:
      "RoseOut: We are following up about your reservation. Reply with any questions or updates and our team will help.",
  },
  {
    key: "promo",
    label: "Promotion / announcement",
    description: "A reusable marketing-style update for email-first campaigns.",
    channel: "email",
    subject: "A new RoseOut update for you",
    emailBody:
      "Hi,\n\nWe have a new RoseOut update we think you will like. Log in to RoseOut to explore new places, plans, and experiences curated for your next outing.\n\n— RoseOut Team",
    smsBody: "RoseOut: New places and plans are waiting for your next outing.",
  },
];

function characterStatus(length: number) {
  if (length > 480) return "text-red-600";
  if (length > 320) return "text-amber-700";
  return "text-black/45";
}

export default function AdminMessagingCenter() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selected, setSelected] = useState<Recipient | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [channel, setChannel] = useState<Channel>("email");
  const [templateKey, setTemplateKey] = useState("custom");
  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [smsBody, setSmsBody] = useState("");
  const [allowUserSmsWithoutOptIn, setAllowUserSmsWithoutOptIn] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const selectedTemplate = useMemo(
    () => TEMPLATES.find((template) => template.key === templateKey),
    [templateKey]
  );

  async function searchRecipients() {
    const safeQuery = query.trim();

    if (safeQuery.length < 2) {
      setRecipients([]);
      setNotice({ type: "error", text: "Search with at least 2 characters." });
      return;
    }

    setSearching(true);
    setNotice(null);

    const response = await fetch(
      `/api/admin/messaging/recipients?q=${encodeURIComponent(safeQuery)}`
    );
    const payload = await response.json();

    setSearching(false);

    if (!response.ok) {
      setNotice({ type: "error", text: payload.error || "Search failed." });
      setRecipients([]);
      return;
    }

    setRecipients(payload.recipients || []);
  }

  function applyTemplate(key: string) {
    setTemplateKey(key);

    const template = TEMPLATES.find((item) => item.key === key);

    if (!template) return;

    setChannel(template.channel);
    setSubject(template.subject);
    setEmailBody(template.emailBody);
    setSmsBody(template.smsBody);
  }

  async function sendMessage() {
    setSending(true);
    setNotice(null);

    const recipient = manualMode
      ? {
          kind: "manual",
          name: manualName,
          email: manualEmail,
          phone: manualPhone,
        }
      : selected
      ? {
          kind: selected.type,
          id: selected.id,
          locationType: selected.locationType,
        }
      : null;

    if (!recipient) {
      setSending(false);
      setNotice({ type: "error", text: "Select a recipient or use manual mode." });
      return;
    }

    const response = await fetch("/api/admin/messaging/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient,
        channel,
        subject,
        emailBody,
        smsBody,
        template: selectedTemplate?.key || null,
        allowUserSmsWithoutOptIn,
      }),
    });

    const payload = await response.json();
    setSending(false);

    if (!response.ok || !payload.success) {
      const providerErrors = payload.result?.errors?.join(" ");
      setNotice({
        type: "error",
        text: payload.error || providerErrors || "Message could not be sent.",
      });
      return;
    }

    setNotice({
      type: "success",
      text: "Message succesfully sent.",
    });
  }

  return (
    <section id="admin-messaging" className="mt-5 overflow-hidden rounded-[2rem] border border-white/10 bg-[#f8f3ef] text-[#1b1210] shadow-2xl">
      <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="border-b border-black/10 bg-white/75 p-5 lg:border-b-0 lg:border-r">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-rose-700">
            Admin Messaging
          </p>
          <h2 className="mt-2 text-2xl font-black">Email or text anyone</h2>
          <p className="mt-2 text-sm leading-6 text-black/55">
            Search users and locations, choose a saved message, or manually enter an email or phone number for one-off outreach.
          </p>

          <div className="mt-5 flex rounded-full border border-black/10 bg-white p-1 text-xs font-black">
            <button
              type="button"
              onClick={() => setManualMode(false)}
              className={`flex-1 rounded-full px-4 py-2 transition ${
                !manualMode ? "bg-[#1b1210] text-white" : "text-black/45 hover:text-black"
              }`}
            >
              Search RoseOut
            </button>
            <button
              type="button"
              onClick={() => {
                setManualMode(true);
                setSelected(null);
              }}
              className={`flex-1 rounded-full px-4 py-2 transition ${
                manualMode ? "bg-[#1b1210] text-white" : "text-black/45 hover:text-black"
              }`}
            >
              Manual contact
            </button>
          </div>

          {manualMode ? (
            <div className="mt-5 space-y-3">
              <input
                value={manualName}
                onChange={(event) => setManualName(event.target.value)}
                placeholder="Recipient name"
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-rose-400"
              />
              <input
                value={manualEmail}
                onChange={(event) => setManualEmail(event.target.value)}
                placeholder="Email address"
                type="email"
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-rose-400"
              />
              <input
                value={manualPhone}
                onChange={(event) => setManualPhone(event.target.value)}
                placeholder="Phone number for text"
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-rose-400"
              />
            </div>
          ) : (
            <div className="mt-5">
              <div className="flex gap-2">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") searchRecipients();
                  }}
                  placeholder="Search user, email, phone, or location"
                  className="min-w-0 flex-1 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-rose-400"
                />
                <button
                  type="button"
                  onClick={searchRecipients}
                  disabled={searching}
                  className="rounded-2xl bg-[#1b1210] px-5 py-3 text-sm font-black text-white transition hover:bg-rose-600 disabled:opacity-50"
                >
                  {searching ? "Searching" : "Search"}
                </button>
              </div>

              <div className="mt-4 max-h-[360px] space-y-2 overflow-y-auto pr-1">
                {recipients.map((recipient) => (
                  <button
                    type="button"
                    key={`${recipient.type}-${recipient.locationType || "user"}-${recipient.id}`}
                    onClick={() => setSelected(recipient)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selected?.id === recipient.id && selected?.type === recipient.type
                        ? "border-rose-400 bg-rose-50"
                        : "border-black/10 bg-white hover:border-rose-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black">{recipient.title}</p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-black/35">
                          {recipient.type === "user"
                            ? "User"
                            : recipient.locationType === "restaurants"
                            ? "Restaurant"
                            : "Activity"} {recipient.meta ? `• ${recipient.meta}` : ""}
                        </p>
                        <p className="mt-1 text-sm text-black/50">{recipient.subtitle}</p>
                      </div>
                      <div className="text-right text-[11px] font-black text-black/45">
                        <p>{recipient.email ? "Email" : "No email"}</p>
                        <p className={recipient.phone ? "text-emerald-700" : "text-black/30"}>
                          {recipient.phone ? "Text" : "No phone"}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}

                {!recipients.length && (
                  <div className="rounded-2xl border border-dashed border-black/15 bg-white/55 p-4 text-sm font-bold text-black/40">
                    Search results will appear here.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_180px]">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-black/40">
                Preselected email / text
              </span>
              <select
                value={templateKey}
                onChange={(event) => applyTemplate(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-black outline-none focus:border-rose-400"
              >
                <option value="custom">Custom blank message</option>
                {TEMPLATES.map((template) => (
                  <option key={template.key} value={template.key}>
                    {template.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-black/40">
                Channel
              </span>
              <select
                value={channel}
                onChange={(event) => setChannel(event.target.value as Channel)}
                className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-black outline-none focus:border-rose-400"
              >
                <option value="email">Email</option>
                <option value="sms">Text</option>
                <option value="both">Email + Text</option>
              </select>
            </label>
          </div>

          {selectedTemplate && (
            <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold leading-5 text-rose-700">
              {selectedTemplate.description}
            </p>
          )}

          {(channel === "email" || channel === "both") && (
            <div className="mt-4 space-y-3">
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Email subject"
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-rose-400"
              />
              <textarea
                value={emailBody}
                onChange={(event) => setEmailBody(event.target.value)}
                placeholder="Write the email body..."
                rows={8}
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold leading-6 outline-none focus:border-rose-400"
              />
            </div>
          )}

          {(channel === "sms" || channel === "both") && (
            <div className="mt-4">
              <textarea
                value={smsBody}
                onChange={(event) => setSmsBody(event.target.value)}
                placeholder="Write the text message..."
                rows={4}
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold leading-6 outline-none focus:border-rose-400"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <p className={`text-xs font-black ${characterStatus(smsBody.length)}`}>
                  {smsBody.length}/480 characters
                </p>
                <label className="flex items-center gap-2 text-xs font-bold text-black/50">
                  <input
                    type="checkbox"
                    checked={allowUserSmsWithoutOptIn}
                    onChange={(event) => setAllowUserSmsWithoutOptIn(event.target.checked)}
                  />
                  Confirm non-marketing text if user has no SMS opt-in
                </label>
              </div>
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-black/10 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-black/35">
              Current recipient
            </p>
            <p className="mt-1 font-black">
              {manualMode
                ? manualName || manualEmail || manualPhone || "Manual recipient"
                : selected?.title || "No recipient selected"}
            </p>
            <p className="mt-1 text-sm text-black/50">
              {manualMode
                ? [manualEmail, manualPhone].filter(Boolean).join(" • ") || "Enter an email or phone number."
                : selected
                ? [selected.email, selected.phone].filter(Boolean).join(" • ") || "No contact method on file."
                : "Search and select a user or location."}
            </p>
          </div>

          {notice && (
            <div
              className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-bold ${
                notice.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {notice.text}
            </div>
          )}

          <button
            type="button"
            onClick={sendMessage}
            disabled={sending || smsBody.length > 480}
            className="mt-5 w-full rounded-full bg-gradient-to-r from-rose-500 to-rose-700 px-6 py-4 text-sm font-black text-white shadow-lg shadow-rose-950/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send message"}
          </button>
        </div>
      </div>
    </section>
  );
}
