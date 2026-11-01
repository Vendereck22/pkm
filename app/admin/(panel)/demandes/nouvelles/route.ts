import { requireAdmin } from "@/lib/auth";
import { getRequestPulse } from "@/lib/contact-requests";

// Interrogée toutes les quelques secondes par le panneau ouvert : jamais mise en cache.
export const dynamic = "force-dynamic";

export async function GET() {
  await requireAdmin();
  const pulse = await getRequestPulse();
  if (!pulse.ok) return Response.json({ error: "unavailable" }, { status: 503 });
  return Response.json(pulse.data, { headers: { "Cache-Control": "no-store" } });
}
