import { getSupportTicket, getSupportTicketMessages, isSupportRequestAdmin } from "@/lib/support";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const url = new URL(req.url);
    const key = url.searchParams.get("key") || "";
    const ticket = await getSupportTicket(id);

    if (!ticket) {
      return Response.json({ error: "Ticket not found." }, { status: 404 });
    }

    const isAdmin = await isSupportRequestAdmin();
    if (!isAdmin && key !== ticket.public_access_token) {
      return Response.json({ error: "Invalid ticket access key." }, { status: 403 });
    }

    const messages = await getSupportTicketMessages(ticket.id);

    return Response.json({ ticket, messages });
  } catch (error: unknown) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not load ticket." },
      { status: 500 }
    );
  }
}
