import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  code: z.string().min(1).max(100),
  attending: z.boolean(),
  selectedDays: z.array(z.string()).max(3),
  companions: z.number().int().min(0).max(4),
  companionNames: z.array(z.string().max(120)).max(4),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos.",
        },
        {
          status: 400,
        },
      );
    }

    const { code, attending, selectedDays, companions, companionNames } =
      parsed.data;

    const supabase = createSupabaseServerClient();

    // 1. Localiza o convidado pelo código individual
    const { data: guest, error: guestError } = await supabase
      .from("guests")
      .select("id, name, max_companions")
      .eq("invitation_code", code)
      .single();

    if (guestError || !guest) {
      return NextResponse.json(
        {
          error: "Convite não encontrado.",
        },
        {
          status: 404,
        },
      );
    }

    // 2. Se não vai comparecer, não pode ter dias nem acompanhantes
    if (!attending && selectedDays.length > 0) {
      return NextResponse.json(
        {
          error: "Um convidado que não irá à festa não pode selecionar dias.",
        },
        {
          status: 400,
        },
      );
    }

    if (!attending && companions > 0) {
      return NextResponse.json(
        {
          error:
            "Um convidado que não irá à festa não pode possuir acompanhantes.",
        },
        {
          status: 400,
        },
      );
    }

    // 3. Se vai comparecer, precisa selecionar pelo menos um dia
    if (attending && selectedDays.length === 0) {
      return NextResponse.json(
        {
          error: "Selecione pelo menos um dia de participação.",
        },
        {
          status: 400,
        },
      );
    }

    // 4. Valida os dias informados
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
          {
            status: 500,
          },
        );
      }

      if (!eventDays || eventDays.length !== selectedDays.length) {
        return NextResponse.json(
          {
            error: "Um ou mais dias selecionados são inválidos.",
          },
          {
            status: 400,
          },
        );
      }
    }

    // 5. Valida o limite de acompanhantes
    if (companions > guest.max_companions) {
      return NextResponse.json(
        {
          error: `Este convite permite no máximo ${guest.max_companions} acompanhante(s).`,
        },
        {
          status: 400,
        },
      );
    }

    // 6. Valida quantidade de nomes
    if (companionNames.length !== companions) {
      return NextResponse.json(
        {
          error:
            "A quantidade de nomes dos acompanhantes não corresponde à quantidade informada.",
        },
        {
          status: 400,
        },
      );
    }

    // 7. Cria ou atualiza o RSVP
    const { data: rsvp, error: rsvpError } = await supabase
      .from("rsvps")
      .upsert(
        {
          guest_id: guest.id,
          attending,
          companion_count: attending ? companions : 0,
          companion_names: attending ? companionNames : [],
          responded_at: new Date().toISOString(),
        },
        {
          onConflict: "guest_id",
        },
      )
      .select()
      .single();

    if (rsvpError) {
      console.error("Erro ao salvar RSVP:", rsvpError);

      return NextResponse.json(
        {
          error: "Não foi possível registrar sua confirmação.",
        },
        {
          status: 500,
        },
      );
    }

    // 8. Remove os dias anteriores desse RSVP
    const { error: deleteDaysError } = await supabase
      .from("rsvp_days")
      .delete()
      .eq("rsvp_id", rsvp.id);

    if (deleteDaysError) {
      console.error("Erro ao limpar dias anteriores do RSVP:", deleteDaysError);

      return NextResponse.json(
        {
          error: "Não foi possível atualizar os dias selecionados.",
        },
        {
          status: 500,
        },
      );
    }

    // 9. Busca os IDs dos dias selecionados e cria os vínculos
    if (attending && selectedDays.length > 0) {
      const { data: eventDays, error: eventDaysError } = await supabase
        .from("event_days")
        .select("id, event_date")
        .in("event_date", selectedDays);

      if (eventDaysError || !eventDays) {
        console.error("Erro ao buscar IDs dos dias:", eventDaysError);

        return NextResponse.json(
          {
            error: "Não foi possível registrar os dias selecionados.",
          },
          {
            status: 500,
          },
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
            error: "Não foi possível registrar os dias selecionados.",
          },
          {
            status: 500,
          },
        );
      }
    }

    return NextResponse.json({
      success: true,
      guest: {
        id: guest.id,
        name: guest.name,
      },
      rsvpId: rsvp.id,
    });
  } catch (error) {
    console.error("Erro inesperado no RSVP:", error);

    return NextResponse.json(
      {
        error: "Ocorreu um erro inesperado.",
      },
      {
        status: 500,
      },
    );
  }
}
