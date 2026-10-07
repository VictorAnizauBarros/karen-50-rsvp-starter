import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(30).optional(),
  attending: z.boolean(),
  selectedDays: z.array(z.string()).max(3),
  companions: z.number().int().min(0),
  companionNames: z.array(z.string().trim().max(120)),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const { name, phone, attending, selectedDays, companions, companionNames } =
      parsed.data;

    if (!attending && selectedDays.length > 0) {
      return NextResponse.json(
        {
          error: "Uma pessoa que não irá à festa não pode selecionar dias.",
        },
        { status: 400 },
      );
    }

    if (!attending && companions > 0) {
      return NextResponse.json(
        {
          error:
            "Uma pessoa que não irá à festa não pode possuir acompanhantes.",
        },
        { status: 400 },
      );
    }

    if (attending && selectedDays.length === 0) {
      return NextResponse.json(
        {
          error: "Selecione pelo menos um dia de participação.",
        },
        { status: 400 },
      );
    }

    if (companionNames.length !== companions) {
      return NextResponse.json(
        {
          error:
            "A quantidade de nomes dos acompanhantes não corresponde à quantidade informada.",
        },
        { status: 400 },
      );
    }

    const supabase = createSupabaseServerClient();

    /*
     * Valida os dias escolhidos.
     */
    if (selectedDays.length > 0) {
      const { data: eventDays, error: eventDaysError } = await supabase
        .from("event_days")
        .select("id, event_date")
        .in("event_date", selectedDays);

      if (eventDaysError) {
        console.error("Erro ao consultar dias do evento:", eventDaysError);

        return NextResponse.json(
          {
            error: "Não foi possível validar os dias do evento.",
          },
          { status: 500 },
        );
      }

      if (!eventDays || eventDays.length !== selectedDays.length) {
        return NextResponse.json(
          {
            error: "Um ou mais dias selecionados são inválidos.",
          },
          { status: 400 },
        );
      }
    }

    /*
     * Gera um código interno.
     *
     * O convidado não precisa conhecer esse código.
     * Ele continua sendo útil para identificar o registro
     * internamente e manter a estrutura atual do banco.
     */
    const invitationCode = `K50-${crypto
      .randomUUID()
      .replace(/-/g, "")
      .slice(0, 8)
      .toUpperCase()}`;

    /*
     * Cria a pessoa.
     */
    const { data: guest, error: guestError } = await supabase
      .from("guests")
      .insert({
        name,
        phone: phone || null,
        invitation_code: invitationCode,
        max_companions: companions,
      })
      .select("id, name, phone, invitation_code")
      .single();

    if (guestError || !guest) {
      console.error("Erro ao cadastrar participante:", guestError);

      return NextResponse.json(
        {
          error: "Não foi possível registrar seus dados.",
        },
        { status: 500 },
      );
    }

    /*
     * Cria o RSVP.
     */
    const { data: rsvp, error: rsvpError } = await supabase
      .from("rsvps")
      .insert({
        guest_id: guest.id,
        attending,
        companion_count: attending ? companions : 0,
        companion_names: attending ? companionNames : [],
        responded_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (rsvpError || !rsvp) {
      console.error("Erro ao salvar RSVP:", rsvpError);

      return NextResponse.json(
        {
          error: "Não foi possível registrar sua confirmação.",
        },
        { status: 500 },
      );
    }

    /*
     * Busca os IDs dos dias selecionados.
     */
    if (attending && selectedDays.length > 0) {
      const { data: eventDays, error: eventDaysError } = await supabase
        .from("event_days")
        .select("id, event_date")
        .in("event_date", selectedDays);

      if (eventDaysError || !eventDays) {
        console.error("Erro ao buscar IDs dos dias:", eventDaysError);

        return NextResponse.json(
          {
            error:
              "A resposta foi registrada, mas não foi possível registrar os dias.",
          },
          { status: 500 },
        );
      }

      const rsvpDays = eventDays.map((day) => ({
        rsvp_id: rsvp.id,
        event_day_id: day.id,
      }));

      const { error: rsvpDaysError } = await supabase
        .from("rsvp_days")
        .insert(rsvpDays);

      if (rsvpDaysError) {
        console.error("Erro ao salvar dias do RSVP:", rsvpDaysError);

        return NextResponse.json(
          {
            error:
              "A resposta foi registrada, mas não foi possível registrar os dias.",
          },
          { status: 500 },
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        guest: {
          id: guest.id,
          name: guest.name,
          phone: guest.phone,
          code: guest.invitation_code,
        },
        rsvpId: rsvp.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro inesperado ao registrar RSVP público:", error);

    return NextResponse.json(
      {
        error: "Ocorreu um erro inesperado.",
      },
      { status: 500 },
    );
  }
}
