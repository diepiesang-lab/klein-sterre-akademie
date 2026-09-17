import { db, databaseConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!databaseConfigured()) return Response.json({ configured: false, slots: [] });
  try {
    const slots = await db.get("slots", "select=id,session_date,session_time,capacity&order=session_date.asc,session_time.asc");
    const bookings = await db.get("bookings", "select=slot_id,status&status=in.(pending,confirmed)");
    const counts = new Map<string, number>();
    for (const booking of bookings as Array<{slot_id:string}>) counts.set(booking.slot_id, (counts.get(booking.slot_id) || 0) + 1);
    const result = (slots as Array<{id:string;session_date:string;session_time:string;capacity:number}>).map((slot) => ({
      id: slot.id,
      date: slot.session_date,
      time: String(slot.session_time).slice(0,5),
      capacity: slot.capacity,
      booked: counts.get(slot.id) || 0,
      available: Math.max(0, slot.capacity - (counts.get(slot.id) || 0)),
    }));
    return Response.json({ configured: true, slots: result });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Kon sessies nie laai nie." }, { status: 500 });
  }
}
