import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    code: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;

    if (!code) {
      return NextResponse.json(
        {
          error: "Código do convite não informado.",
        },
        {
          status: 400,
        },
      );
    }

    const supabase = createSupabaseServerClient();

    const { data: guest, error } = await supabase
      .from("guests")
      .select(
        `
        id,
        name,
        max_companions,
        invitation_code
      `,
      )
      .eq("invitation_code", code)
      .single();

    if (error || !guest) {
      return NextResponse.json(
        {
          error: "Convite não encontrado.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,
      guest: {
        id: guest.id,
        name: guest.name,
        maxCompanions: guest.max_companions,
        code: guest.invitation_code,
      },
    });
  } catch (error) {
    console.error("Erro ao consultar convidado:", error);

    return NextResponse.json(
      {
        error: "Não foi possível consultar o convite.",
      },
      {
        status: 500,
      },
    );
  }
}
