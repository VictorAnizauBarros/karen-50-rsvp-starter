import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);

  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const supabase = createSupabaseServerClient();

    const { data: rsvps, error: rsvpsError } = await supabase
      .from("rsvps")
      .select("attending, companion_count");

    if (rsvpsError) {
      console.error("Erro ao consultar RSVPs:", rsvpsError);
      throw rsvpsError;
    }

    const responses = rsvps?.length ?? 0;

    const confirmed = (rsvps ?? []).filter(
      (rsvp) => rsvp.attending === true,
    ).length;

    const declined = (rsvps ?? []).filter(
      (rsvp) => rsvp.attending === false,
    ).length;

    const companions = (rsvps ?? [])
      .filter((rsvp) => rsvp.attending === true)
      .reduce((total, rsvp) => total + (rsvp.companion_count ?? 0), 0);

    const totalPeople = confirmed + companions;

    const { data: rsvpDays, error: rsvpDaysError } = await supabase.from(
      "rsvp_days",
    ).select(`
        rsvps (
          attending,
          companion_count
        ),
        event_days (
          event_date
        )
      `);

    if (rsvpDaysError) {
      console.error("Erro ao consultar dias dos RSVPs:", rsvpDaysError);
      throw rsvpDaysError;
    }

    const days = {
      "2026-10-31": 0,
      "2026-11-01": 0,
      "2026-11-02": 0,
    };

    for (const item of rsvpDays ?? []) {
      const eventDay = item.event_days;
      const rsvp = item.rsvps;

      if (!eventDay || !rsvp?.attending) {
        continue;
      }

      const date = eventDay.event_date;

      if (date in days) {
        const people = 1 + (rsvp.companion_count ?? 0);

        days[date as keyof typeof days] += people;
      }
    }

    return NextResponse.json({
      responses,
      confirmed,
      declined,
      companions,
      totalPeople,
      days,
    });
  } catch (error) {
    console.error("Erro ao consultar estatísticas:", error);

    return NextResponse.json(
      { error: "Não foi possível carregar as estatísticas." },
      { status: 500 },
    );
  }
}
