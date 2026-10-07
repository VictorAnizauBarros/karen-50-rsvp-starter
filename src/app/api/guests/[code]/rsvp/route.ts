import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;

    if (!code) {
      return NextResponse.json(
        { error: "Código do convite não informado." },
        { status: 400 },
      );
    }

    const supabase = createSupabaseServerClient();

    const { data: guest, error: guestError } = await supabase
      .from("guests")
      .select("id")
      .eq("invitation_code", code)
      .single();

    if (guestError || !guest) {
      return NextResponse.json(
        { error: "Convite não encontrado." },
        { status: 404 },
      );
    }

    const { data: rsvp, error: rsvpError } = await supabase
      .from("rsvps")
      .select(
        `
        id,
        attending,
        companion_count,
        companion_names,
        responded_at,
        rsvp_days (
          event_days (
            event_date
          )
        )
      `,
      )
      .eq("guest_id", guest.id)
      .maybeSingle();

    if (rsvpError) {
      console.error("Erro ao consultar RSVP:", rsvpError);

      return NextResponse.json(
        { error: "Não foi possível consultar a resposta." },
        { status: 500 },
      );
    }

    if (!rsvp) {
      return NextResponse.json({
        success: true,
        rsvp: null,
      });
    }

    const selectedDays =
      rsvp.rsvp_days
        ?.map((item) => {
          const eventDay = Array.isArray(item.event_days)
            ? item.event_days[0]
            : item.event_days;

          return eventDay?.event_date;
        })
        .filter(Boolean) ?? [];

    return NextResponse.json({
      success: true,
      rsvp: {
        id: rsvp.id,
        attending: rsvp.attending,
        companions: rsvp.companion_count,
        companionNames: Array.isArray(rsvp.companion_names)
          ? rsvp.companion_names
          : [],
        selectedDays,
        respondedAt: rsvp.responded_at,
      },
    });
  } catch (error) {
    console.error("Erro inesperado ao consultar RSVP:", error);

    return NextResponse.json(
      { error: "Ocorreu um erro inesperado." },
      { status: 500 },
    );
  }
}
