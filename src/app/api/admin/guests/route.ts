import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const createGuestSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(30).optional(),
  maxCompanions: z.number().int().min(0).max(4),
});

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);

  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const supabase = createSupabaseServerClient();

    const { data: guests, error } = await supabase
      .from("guests")
      .select(
        `
        id,
        name,
        phone,
        invitation_code,
        max_companions,
        created_at,
        rsvps (
          attending,
          companion_count,
          companion_names,
          responded_at,
          rsvp_days (
            event_days (
              event_date,
              title
            )
          )
        )
      `,
      )
      .order("name", { ascending: true });

    if (error) {
      console.error("Erro ao consultar convidados:", error);

      return NextResponse.json(
        { error: "Não foi possível carregar os convidados." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      guests: guests ?? [],
    });
  } catch (error) {
    console.error("Erro inesperado ao consultar convidados:", error);

    return NextResponse.json(
      { error: "Ocorreu um erro inesperado." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);

  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await request.json();

    const parsed = createGuestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const { name, phone, maxCompanions } = parsed.data;

    const supabase = createSupabaseServerClient();

    const invitationCode = `K50-${crypto
      .randomUUID()
      .replace(/-/g, "")
      .slice(0, 6)
      .toUpperCase()}`;

    const { data: guest, error } = await supabase
      .from("guests")
      .insert({
        name,
        phone: phone || null,
        invitation_code: invitationCode,
        max_companions: maxCompanions,
      })
      .select(
        `
        id,
        name,
        phone,
        invitation_code,
        max_companions,
        created_at
      `,
      )
      .single();

    if (error) {
      console.error("Erro ao cadastrar convidado:", error);

      return NextResponse.json(
        { error: "Não foi possível cadastrar o convidado." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        guest,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro inesperado ao cadastrar convidado:", error);

    return NextResponse.json(
      { error: "Ocorreu um erro inesperado." },
      { status: 500 },
    );
  }
}
