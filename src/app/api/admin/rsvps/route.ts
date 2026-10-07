import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);

  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const supabase = createSupabaseServerClient();

    const { data: rsvps, error } = await supabase
      .from("rsvps")
      .select(
        `
        id,
        attending,
        companion_count,
        companion_names,
        responded_at,
        guests (
          name,
          phone
        ),
        rsvp_days (
          event_days (
            event_date,
            title
          )
        )
      `,
      )
      .order("responded_at", { ascending: false });

    if (error) {
      console.error("Erro ao consultar RSVPs:", error);

      return NextResponse.json(
        { error: "Não foi possível carregar as respostas." },
        { status: 500 },
      );
    }

    const formattedRsvps = (rsvps ?? []).map((rsvp) => {
      const guest = Array.isArray(rsvp.guests) ? rsvp.guests[0] : rsvp.guests;

      return {
        id: rsvp.id,
        name: guest?.name ?? "Sem nome",
        phone: guest?.phone ?? null,
        attending: rsvp.attending,
        companionCount: rsvp.companion_count ?? 0,
        companionNames: Array.isArray(rsvp.companion_names)
          ? rsvp.companion_names
          : [],
        respondedAt: rsvp.responded_at,
        days: (rsvp.rsvp_days ?? [])
          .map((item) =>
            Array.isArray(item.event_days)
              ? item.event_days[0]
              : item.event_days,
          )
          .filter(Boolean)
          .map((day) => ({
            date: day.event_date,
            title: day.title,
          })),
      };
    });

    return NextResponse.json({
      rsvps: formattedRsvps,
    });
  } catch (error) {
    console.error("Erro inesperado ao consultar RSVPs:", error);

    return NextResponse.json(
      { error: "Ocorreu um erro inesperado." },
      { status: 500 },
    );
  }
}
