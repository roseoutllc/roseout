export async function trackAnalytics({
  itemId,
  itemType,
  eventType,
}: {
  itemId: string;
  itemType: "restaurant" | "activity";
  eventType: "view" | "click";
}) {
  try {
    await fetch("/api/analytics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        item_id: itemId,
        item_type: itemType,
        event_type: eventType,
        page_path: window.location.pathname,
      }),
    });
  } catch {
    // Do nothing. Analytics should never break the user experience.
  }
}