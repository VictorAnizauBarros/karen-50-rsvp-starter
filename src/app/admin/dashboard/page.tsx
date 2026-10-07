"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Stats = {
  responses: number;
  confirmed: number;
  declined: number;
  companions: number;
  totalPeople: number;
  days: {
    "2026-10-31": number;
    "2026-11-01": number;
    "2026-11-02": number;
  };
};

type RSVP = {
  id: string;
  name: string;
  phone: string | null;
  attending: boolean;
  companionCount: number;
  companionNames: string[];
  respondedAt: string;
  days: {
    date: string;
    title: string;
  }[];
};

type Guest = {
  id: string;
  name: string;
  phone: string | null;
  invitation_code: string;
  max_companions: number;
  created_at: string;
  rsvps: {
    attending: boolean;
    companion_count: number;
    companion_names: string[];
    responded_at: string;
    rsvp_days: {
      event_days: {
        event_date: string;
        title: string;
      };
    }[];
  } | null;
};
const days = [
  {
    date: "31/10",
    isoDate: "2026-10-31",
    label: "Sábado",
    title: "Abertura",
  },
  {
    date: "01/11",
    isoDate: "2026-11-01",
    label: "Domingo",
    title: "Celebração principal",
  },
  {
    date: "02/11",
    isoDate: "2026-11-02",
    label: "Segunda-feira",
    title: "Encerramento",
  },
];

export default function AdminDashboardPage() {
  const router = useRouter();

  const [stats, setStats] = useState<Stats>({
    responses: 0,
    confirmed: 0,
    declined: 0,
    companions: 0,
    totalPeople: 0,
    days: {
      "2026-10-31": 0,
      "2026-11-01": 0,
      "2026-11-02": 0,
    },
  });

  const [loadingStats, setLoadingStats] = useState(true);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loadingGuests, setLoadingGuests] = useState(true);
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [loadingRsvps, setLoadingRsvps] = useState(true);
  const [rsvpSearch, setRsvpSearch] = useState("");
  const [rsvpStatusFilter, setRsvpStatusFilter] = useState<
    "all" | "confirmed" | "declined"
  >("all");
  const [rsvpDayFilter, setRsvpDayFilter] = useState<
    "all" | "2026-10-31" | "2026-11-01" | "2026-11-02"
  >("all");
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestMaxCompanions, setGuestMaxCompanions] = useState(0);
  const [savingGuest, setSavingGuest] = useState(false);
  const [guestMessage, setGuestMessage] = useState("");

  const filteredRsvps = rsvps.filter((rsvp) => {
    const search = rsvpSearch.trim().toLowerCase();

    const matchesSearch = !search || rsvp.name.toLowerCase().includes(search);

    const matchesStatus =
      rsvpStatusFilter === "all" ||
      (rsvpStatusFilter === "confirmed" && rsvp.attending) ||
      (rsvpStatusFilter === "declined" && !rsvp.attending);

    const matchesDay =
      rsvpDayFilter === "all" ||
      rsvp.days.some((day) => day.date === rsvpDayFilter);

    return matchesSearch && matchesStatus && matchesDay;
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await fetch("/api/admin/stats");

        if (!response.ok) {
          throw new Error("Não foi possível carregar as estatísticas.");
        }

        const data = await response.json();

        setStats(data);
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      } finally {
        setLoadingStats(false);
      }
    }

    loadStats();
  }, []);

  useEffect(() => {
    async function loadGuests() {
      try {
        const response = await fetch("/api/admin/guests");

        if (!response.ok) {
          throw new Error("Não foi possível carregar os convidados.");
        }

        const data = await response.json();

        setGuests(data.guests ?? []);
      } catch (error) {
        console.error("Erro ao carregar convidados:", error);
      } finally {
        setLoadingGuests(false);
      }
    }

    loadGuests();
  }, []);

  useEffect(() => {
    async function loadRsvps() {
      try {
        const response = await fetch("/api/admin/rsvps");

        if (!response.ok) {
          throw new Error("Não foi possível carregar as respostas.");
        }

        const data = await response.json();

        setRsvps(data.rsvps ?? []);
      } catch (error) {
        console.error("Erro ao carregar respostas:", error);
      } finally {
        setLoadingRsvps(false);
      }
    }

    loadRsvps();
  }, []);

  async function handleCreateGuest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSavingGuest(true);
    setGuestMessage("");

    try {
      const response = await fetch("/api/admin/guests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: guestName,
          phone: guestPhone,
          maxCompanions: guestMaxCompanions,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Não foi possível cadastrar o convidado.",
        );
      }

      setGuestMessage(
        `Convidado cadastrado! Código: ${data.guest.invitation_code}`,
      );

      setGuests((currentGuests) => [
        ...currentGuests,
        {
          ...data.guest,
          rsvps: null,
        },
      ]);

      setGuestName("");
      setGuestPhone("");
      setGuestMaxCompanions(0);
    } catch (error) {
      console.error("Erro ao cadastrar convidado:", error);

      setGuestMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar o convidado.",
      );
    } finally {
      setSavingGuest(false);
    }
  }

  function handleWhatsApp(guest: Guest) {
    if (!guest.phone) {
      alert("Este convidado não possui telefone cadastrado.");
      return;
    }

    const phone = guest.phone.replace(/\D/g, "");

    const invitationUrl = `${window.location.origin}/rsvp/${guest.invitation_code}`;

    const message = `Olá, ${guest.name}! 🎃

Você está convidado para comemorar os 50 anos da Karen Ferraz! 🖤🧡

Será uma celebração especial com o tema Halloween. 👻

Confirme sua presença pelo link:

${invitationUrl}

Esperamos você! 🕷️✨`;

    const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    console.log(whatsappUrl);

    window.open(whatsappUrl, "_blank");
  }
  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();

    await supabase.auth.signOut();

    router.push("/admin/login");
    router.refresh();
  }

  async function handleCopyInvite(guest: Guest) {
    const invitationUrl = `${window.location.origin}/rsvp/${guest.invitation_code}`;

    try {
      await navigator.clipboard.writeText(invitationUrl);

      alert("Link do convite copiado!");
    } catch (error) {
      console.error("Erro ao copiar convite:", error);

      alert("Não foi possível copiar o link.");
    }
  }

  function handleOpenInvite(guest: Guest) {
    const invitationUrl = `${window.location.origin}/rsvp/${guest.invitation_code}`;

    window.open(invitationUrl, "_blank");
  }

  return (
    <main className="min-h-screen px-6 py-8 md:px-10">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <header className="mb-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="gold mb-2 text-sm uppercase tracking-[0.3em]">
              Área administrativa
            </p>

            <h1 className="text-4xl md:text-5xl">Karen Ferraz — 50 anos</h1>

            <p className="muted mt-2">Painel de gerenciamento da celebração.</p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-white/10 px-5 py-3 text-sm transition hover:border-orange-400 hover:text-orange-300"
          >
            Sair
          </button>
        </header>

        {/* RESUMO */}
        <section className="mb-10">
          <div className="mb-4">
            <h2 className="text-2xl">Visão geral</h2>

            <p className="muted text-sm">Resumo das confirmações da festa.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="card p-6">
              <p className="muted text-sm">Respostas</p>

              <p className="mt-3 text-4xl">
                {loadingStats ? "..." : stats.responses}
              </p>

              <p className="muted mt-2 text-sm">Total de respostas recebidas</p>
            </div>

            <div className="card p-6">
              <p className="muted text-sm">Confirmados</p>

              <p className="mt-3 text-4xl">
                {loadingStats ? "..." : stats.confirmed}
              </p>

              <p className="muted mt-2 text-sm">Pessoas que irão à festa</p>
            </div>

            <div className="card p-6">
              <p className="muted text-sm">Não irão</p>

              <p className="mt-3 text-4xl">
                {loadingStats ? "..." : stats.declined}
              </p>

              <p className="muted mt-2 text-sm">Respostas negativas</p>
            </div>

            <div className="card p-6">
              <p className="muted text-sm">Acompanhantes</p>

              <p className="mt-3 text-4xl">
                {loadingStats ? "..." : stats.companions}
              </p>

              <p className="muted mt-2 text-sm">Total informado</p>
            </div>

            <div className="card p-6">
              <p className="muted text-sm">Total de pessoas</p>

              <p className="mt-3 text-4xl">
                {loadingStats ? "..." : stats.totalPeople}
              </p>

              <p className="muted mt-2 text-sm">Confirmados + acompanhantes</p>
            </div>
          </div>
        </section>

        {/* DIAS */}
        <section className="mb-10">
          <div className="mb-4">
            <h2 className="text-2xl">Dias da celebração</h2>

            <p className="muted text-sm">
              Acompanhamento das confirmações por data.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {days.map((day) => (
              <div key={day.date} className="card p-6">
                <p className="gold text-sm uppercase tracking-widest">
                  {day.label}
                </p>

                <div className="mt-3 flex items-end gap-3">
                  <span className="text-4xl">{day.date}</span>

                  <span className="muted mb-1 text-sm">{day.title}</span>
                </div>

                <div className="mt-6 flex justify-between border-t border-white/10 pt-4 text-sm">
                  <span className="muted">Confirmados</span>

                  <span>
                    {loadingStats
                      ? "..."
                      : stats.days[day.isoDate as keyof Stats["days"]]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CONVIDADOS */}
        <section>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl">Convidados</h2>

              <p className="muted text-sm">
                Gerencie os convites e acompanhe as respostas.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowGuestForm((current) => !current);
                setGuestMessage("");
              }}
              className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-orange-400"
            >
              {showGuestForm ? "Fechar" : "+ Adicionar convidado"}
            </button>
          </div>
          {showGuestForm && (
            <form onSubmit={handleCreateGuest} className="card mb-6 p-6">
              <div className="mb-6">
                <h3 className="text-xl">Novo convidado</h3>

                <p className="muted mt-1 text-sm">
                  Cadastre o convidado e defina quantos acompanhantes ele poderá
                  levar.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <label htmlFor="guest-name" className="mb-2 block text-sm">
                    Nome
                  </label>

                  <input
                    id="guest-name"
                    type="text"
                    value={guestName}
                    onChange={(event) => setGuestName(event.target.value)}
                    placeholder="Nome completo"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-orange-400"
                  />
                </div>

                <div>
                  <label htmlFor="guest-phone" className="mb-2 block text-sm">
                    Telefone
                  </label>

                  <input
                    id="guest-phone"
                    type="tel"
                    value={guestPhone}
                    onChange={(event) => setGuestPhone(event.target.value)}
                    placeholder="(19) 99999-9999"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-orange-400"
                  />
                </div>

                <div>
                  <label
                    htmlFor="guest-companions"
                    className="mb-2 block text-sm"
                  >
                    Máximo de acompanhantes
                  </label>

                  <select
                    id="guest-companions"
                    value={guestMaxCompanions}
                    onChange={(event) =>
                      setGuestMaxCompanions(Number(event.target.value))
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-orange-400"
                  >
                    <option value={0}>Nenhum</option>
                    <option value={1}>1 acompanhante</option>
                    <option value={2}>2 acompanhantes</option>
                    <option value={3}>3 acompanhantes</option>
                    <option value={4}>4 acompanhantes</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {guestMessage && (
                    <p className="text-sm text-green-300">{guestMessage}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={savingGuest}
                  className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingGuest ? "Cadastrando..." : "Cadastrar convidado"}
                </button>
              </div>
            </form>
          )}
          <div className="card mb-4 p-4">
            <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
              {/* BUSCA */}
              <div>
                <label
                  htmlFor="rsvp-search"
                  className="mb-2 block text-xs uppercase tracking-wide opacity-60"
                >
                  Buscar convidado
                </label>

                <input
                  id="rsvp-search"
                  type="text"
                  value={rsvpSearch}
                  onChange={(event) => setRsvpSearch(event.target.value)}
                  placeholder="Digite o nome..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-orange-400"
                />
              </div>

              {/* STATUS */}
              <div>
                <label
                  htmlFor="rsvp-status"
                  className="mb-2 block text-xs uppercase tracking-wide opacity-60"
                >
                  Status
                </label>

                <select
                  id="rsvp-status"
                  value={rsvpStatusFilter}
                  onChange={(event) =>
                    setRsvpStatusFilter(
                      event.target.value as "all" | "confirmed" | "declined",
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-orange-400"
                >
                  <option value="all">Todos</option>
                  <option value="confirmed">Confirmados</option>
                  <option value="declined">Não irão</option>
                </select>
              </div>

              {/* DIA */}
              <div>
                <label
                  htmlFor="rsvp-day"
                  className="mb-2 block text-xs uppercase tracking-wide opacity-60"
                >
                  Dia
                </label>

                <select
                  id="rsvp-day"
                  value={rsvpDayFilter}
                  onChange={(event) =>
                    setRsvpDayFilter(
                      event.target.value as
                        | "all"
                        | "2026-10-31"
                        | "2026-11-01"
                        | "2026-11-02",
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-orange-400"
                >
                  <option value="all">Todos os dias</option>
                  <option value="2026-10-31">31/10</option>
                  <option value="2026-11-01">01/11</option>
                  <option value="2026-11-02">02/11</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4">
              <p className="muted text-sm">
                {filteredRsvps.length}{" "}
                {filteredRsvps.length === 1
                  ? "resposta encontrada"
                  : "respostas encontradas"}
              </p>

              {(rsvpSearch ||
                rsvpStatusFilter !== "all" ||
                rsvpDayFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setRsvpSearch("");
                    setRsvpStatusFilter("all");
                    setRsvpDayFilter("all");
                  }}
                  className="text-xs text-orange-300 transition hover:text-orange-200"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-4 font-medium">Convidado</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Dias</th>
                    <th className="px-6 py-4 font-medium">Acompanhantes</th>
                    <th className="px-6 py-4 font-medium">Respondido em</th>
                  </tr>
                </thead>

                <tbody>
                  {loadingRsvps ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <p className="muted">Carregando respostas...</p>
                      </td>
                    </tr>
                  ) : rsvps.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <p className="muted">
                          Nenhuma resposta registrada ainda.
                        </p>
                      </td>
                    </tr>
                  ) : filteredRsvps.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <p className="muted">
                          Nenhuma resposta corresponde aos filtros selecionados.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredRsvps.map((rsvp) => {
                      const status = rsvp.attending ? "Confirmado" : "Não irá";

                      const statusClass = rsvp.attending
                        ? "text-green-300"
                        : "text-red-300";

                      return (
                        <tr
                          key={rsvp.id}
                          className="border-b border-white/5 last:border-b-0"
                        >
                          {/* CONVIDADO */}
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium">{rsvp.name}</p>

                              {rsvp.phone && (
                                <p className="muted mt-1 text-xs">
                                  {rsvp.phone}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* STATUS */}
                          <td className="px-6 py-4">
                            <span className={statusClass}>{status}</span>
                          </td>

                          {/* DIAS */}
                          <td className="px-6 py-4">
                            {rsvp.attending && rsvp.days.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {rsvp.days.map((day) => (
                                  <span
                                    key={day.date}
                                    className="rounded-lg bg-white/5 px-2.5 py-1 text-xs"
                                  >
                                    {new Date(
                                      `${day.date}T12:00:00`,
                                    ).toLocaleDateString("pt-BR", {
                                      day: "2-digit",
                                      month: "2-digit",
                                    })}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="muted">—</span>
                            )}
                          </td>

                          {/* ACOMPANHANTES */}
                          <td className="px-6 py-4">
                            {rsvp.attending && rsvp.companionCount > 0 ? (
                              <div>
                                <p>
                                  {rsvp.companionCount}{" "}
                                  {rsvp.companionCount === 1
                                    ? "acompanhante"
                                    : "acompanhantes"}
                                </p>

                                {rsvp.companionNames.length > 0 && (
                                  <p className="muted mt-1 text-xs">
                                    {rsvp.companionNames.join(", ")}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="muted">Nenhum</span>
                            )}
                          </td>

                          {/* RESPONDIDO EM */}
                          <td className="px-6 py-4">
                            <span className="muted text-xs">
                              {new Date(rsvp.respondedAt).toLocaleString(
                                "pt-BR",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>{" "}
        </section>
      </div>
    </main>
  );
}
