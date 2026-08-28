import { NextResponse } from "next/server";
import { getServiceCalendar, rescheduleService, listServiceBookings } from "@/lib/os/service";

export async function GET() {
  return NextResponse.json({
    calendar: getServiceCalendar(14),
    bookings: listServiceBookings().slice(0, 50),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    bookingId?: string;
    scheduledAt?: string;
  };
  if (!body.bookingId || !body.scheduledAt) {
    return NextResponse.json(
      { error: "bookingId and scheduledAt required" },
      { status: 400 },
    );
  }
  const result = rescheduleService(body.bookingId, body.scheduledAt);
  if ("error" in result) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json({ ok: true, booking: result, calendar: getServiceCalendar(14) });
}
