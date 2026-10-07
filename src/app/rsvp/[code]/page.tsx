"use client";

import { event } from "@/lib/event";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

type Guest = {
  id: string;
  name: string;
  maxCompanions: number;
  code: string;
};

export default function RSVPPage() {
  const params = useParams();

  const code = typeof params.code === "string" ? params.code : "";

  const [guest, setGuest] = useState<Guest | null>(null);

  const [loadingGuest, setLoadingGuest] = useState(true);

  const [attending, setAttending] = useState<boolean | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [companions, setCompanions] = useState(0);
  const [companionNames, setCompanionNames] = useState<string[]>([]);

  const [status, setStatus] = useState<Status>("idle");

  const [message, setMessage] = useState("");

  const toggleDay = (day: string) => {
    setSelectedDays((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day],
    );
  };

  /*
   * ============================================================
   * BUSCAR CONVIDADO
   * ============================================================
   */

  useEffect(() => {
    async function loadGuest() {
      if (!code) {
        setMessage("Código do convite não informado.");
        setLoadingGuest(false);
        setStatus("error");
        return;
      }

      try {
        setLoadingGuest(true);

        const res = await fetch(`/api/guests/${encodeURIComponent(code)}`);

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? "Convite não encontrado.");
        }

        setGuest(data.guest);

        const rsvpRes = await fetch(
          `/api/guests/${encodeURIComponent(code)}/rsvp`,
        );

        const rsvpData = await rsvpRes.json();

        if (!rsvpRes.ok) {
          throw new Error(
            rsvpData.error ??
              "Não foi possível carregar sua resposta anterior.",
          );
        }

        if (rsvpData.rsvp) {
          setAttending(rsvpData.rsvp.attending);
          setSelectedDays(rsvpData.rsvp.selectedDays);
          setCompanions(rsvpData.rsvp.companions);
          setCompanionNames(rsvpData.rsvp.companionNames);
        }
      } catch (error) {
        console.error("Erro ao carregar convite:", error);

        setMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o convite.",
        );

        setStatus("error");
      } finally {
        setLoadingGuest(false);
      }
    }

    loadGuest();
  }, [code]);

  /*
   * ============================================================
   * ATUALIZAR ACOMPANHANTES
   * ============================================================
   */

  function updateCompanions(value: number) {
    const max = guest?.maxCompanions ?? 0;

    const next = Math.max(0, Math.min(max, value));

    setCompanions(next);

    setCompanionNames((old) =>
      Array.from({ length: next }, (_, index) => old[index] ?? ""),
    );
  }

  /*
   * ============================================================
   * ENVIAR RSVP
   * ============================================================
   */

  async function submit() {
    if (!guest) {
      setMessage("Convite não carregado.");
      setStatus("error");
      return;
    }

    if (attending === null) {
      setMessage("Escolha se você estará presente.");

      setStatus("error");
      return;
    }

    if (attending && selectedDays.length === 0) {
      setMessage("Selecione pelo menos um dia de participação.");
      setStatus("error");
      return;
    }

    if (attending && companionNames.some((name) => !name.trim())) {
      setMessage("Informe o nome de todos os acompanhantes.");

      setStatus("error");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          code,
          attending,
          selectedDays: attending ? selectedDays : [],
          companions: attending ? companions : 0,
          companionNames: attending
            ? companionNames.map((name) => name.trim())
            : [],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ?? "Não foi possível registrar sua confirmação.",
        );
      }

      setStatus("success");
    } catch (error) {
      console.error("Erro ao registrar RSVP:", error);

      setMessage(error instanceof Error ? error.message : "Erro inesperado.");

      setStatus("error");
    }
  }

  /*
   * ============================================================
   * CARREGANDO CONVITE
   * ============================================================
   */

  if (loadingGuest) {
    return (
      <main className="halloween-bg min-h-screen flex items-center justify-center px-6">
        <div className="max-w-xl w-full">
          <div className="card rounded-3xl p-7 md:p-10 text-center">
            <div className="text-6xl floaty">🎃</div>

            <p className="muted mt-6">Abrindo seu convite...</p>
          </div>
        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * CONVITE INVÁLIDO
   * ============================================================
   */

  if (!guest) {
    return (
      <main className="halloween-bg min-h-screen flex items-center justify-center px-6">
        <div className="max-w-xl w-full">
          <div className="card rounded-3xl p-7 md:p-10 text-center">
            <div className="text-6xl">🕯️</div>

            <p className="gold uppercase tracking-[.2em] text-xs mt-6">
              Karen 50
            </p>

            <h1 className="text-4xl mt-3">Convite não encontrado</h1>

            <p className="muted mt-4">
              {message || "Verifique se o link recebido está correto."}
            </p>

            <a
              href="/"
              className="inline-block mt-8 rounded-xl bg-orange-600 px-6 py-3 font-bold transition hover:bg-orange-500"
            >
              VOLTAR AO CONVITE
            </a>
          </div>
        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * CONFIRMAÇÃO REALIZADA
   * ============================================================
   */

  if (status === "success") {
    const declined = attending === false;

    return (
      <main className="halloween-bg min-h-screen flex items-center justify-center px-6 text-center">
        <div className="max-w-xl w-full">
          <div className="text-6xl floaty">{declined ? "🖤" : "🎃"}</div>

          <p className="gold uppercase tracking-[.2em] text-xs mt-6">
            Karen 50
          </p>

          <h1 className="text-5xl mt-6">
            {declined ? "Resposta registrada!" : "Presença confirmada!"}
          </h1>

          <p className="text-xl mt-5">Obrigado, {guest.name}.</p>

          {declined ? (
            <>
              <p className="muted mt-3">
                Sentiremos sua falta, mas agradecemos por avisar.
              </p>

              <p className="muted mt-6">
                Esperamos poder celebrar juntos em outra oportunidade. 🖤
              </p>
            </>
          ) : (
            <>
              <p className="muted mt-2">
                Você estará conosco nos seguintes dias:
              </p>

              <div className="mt-5 space-y-3 text-left">
                {event.days
                  .filter((day) => selectedDays.includes(day.isoDate))
                  .map((day) => (
                    <div
                      key={day.isoDate}
                      className="rounded-xl border border-white/10 bg-white/5 p-4"
                    >
                      <p className="font-semibold">
                        {day.date} — {day.label}
                      </p>

                      <p className="muted mt-1 text-sm">{day.note}</p>
                    </div>
                  ))}
              </div>

              {companions > 0 && (
                <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-left">
                  <p className="font-semibold">
                    Acompanhante{companions > 1 ? "s" : ""}
                  </p>

                  <div className="mt-2 space-y-1">
                    {companionNames.map((name, index) => (
                      <p key={index} className="muted text-sm">
                        {name}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <p className="muted mt-6">Karen estará esperando por você! 🖤</p>
            </>
          )}
        </div>
      </main>
    );
  }
  /*
   * ============================================================
   * RSVP
   * ============================================================
   */

  return (
    <main className="halloween-bg min-h-screen px-6 py-12">
      <div className="max-w-xl mx-auto">
        <a href="/" className="muted text-sm">
          ← Voltar ao convite
        </a>

        <div className="card rounded-3xl p-7 md:p-10 mt-8">
          <div className="text-4xl floaty">🦇</div>

          <p className="gold uppercase tracking-[.2em] text-xs mt-5">
            RSVP • Karen 50
          </p>

          <h1 className="text-4xl md:text-5xl mt-2">Olá, {guest.name}! 🎃</h1>

          <p className="muted mt-3">
            Será um prazer ter você conosco para celebrar os 50 anos da Karen.
          </p>

          {/* PRESENÇA */}

          {/* PRESENÇA */}
          <div className="mt-8">
            <p className="text-sm">Você estará conosco?</p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setAttending(true);
                  setMessage("");
                }}
                className={`rounded-xl border p-4 transition ${
                  attending === true
                    ? "border-orange-400 bg-orange-500/20"
                    : "border-white/10"
                }`}
              >
                🧡 Sim, estarei lá
              </button>

              <button
                type="button"
                onClick={() => {
                  setAttending(false);
                  setCompanions(0);
                  setCompanionNames([]);
                  setSelectedDays([]);
                  setMessage("");
                }}
                className={`rounded-xl border p-4 transition ${
                  attending === false
                    ? "border-stone-400 bg-white/5"
                    : "border-white/10"
                }`}
              >
                🖤 Não poderei ir
              </button>
            </div>

            {attending === true && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold">
                  Quais dias você pretende participar?
                </h2>

                <p className="muted mt-2 text-sm">
                  Você pode escolher um ou mais dias.
                </p>

                <div className="mt-5 grid gap-3">
                  {event.days.map((day) => {
                    const selected = selectedDays.includes(day.isoDate);

                    return (
                      <button
                        key={day.isoDate}
                        type="button"
                        onClick={() => toggleDay(day.isoDate)}
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          selected
                            ? "border-orange-400 bg-orange-500/10"
                            : "border-white/10 bg-white/5 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-semibold">{day.date}</p>

                            <p className="text-sm opacity-70">{day.label}</p>

                            <p className="mt-1 text-xs opacity-50">
                              {day.note}
                            </p>
                          </div>

                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                              selected
                                ? "border-orange-400 bg-orange-400 text-black"
                                : "border-white/30"
                            }`}
                          >
                            {selected && "✓"}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ACOMPANHANTES */}

          {attending && guest.maxCompanions > 0 && (
            <div className="mt-8">
              <p className="text-sm">Acompanhantes</p>

              <p className="muted text-xs mt-1">
                Este convite permite até {guest.maxCompanions} acompanhante
                {guest.maxCompanions > 1 ? "s" : ""}.
              </p>

              <div className="flex items-center gap-4 mt-4">
                <button
                  type="button"
                  onClick={() => updateCompanions(companions - 1)}
                  disabled={companions === 0}
                  className="w-11 h-11 rounded-full border border-white/10 disabled:opacity-30"
                >
                  −
                </button>

                <span className="text-2xl w-8 text-center">{companions}</span>

                <button
                  type="button"
                  onClick={() => updateCompanions(companions + 1)}
                  disabled={companions >= guest.maxCompanions}
                  className="w-11 h-11 rounded-full border border-white/10 disabled:opacity-30"
                >
                  +
                </button>
              </div>

              {companionNames.map((value, index) => (
                <input
                  key={index}
                  value={value}
                  onChange={(e) =>
                    setCompanionNames((old) =>
                      old.map((name, i) =>
                        i === index ? e.target.value : name,
                      ),
                    )
                  }
                  placeholder={`Nome do acompanhante ${index + 1}`}
                  className="w-full mt-3 rounded-xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-orange-400"
                />
              ))}
            </div>
          )}

          {attending && guest.maxCompanions === 0 && (
            <div className="mt-8 rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm">Este convite é individual.</p>

              <p className="muted text-xs mt-1">
                Não há acompanhantes cadastrados para este convite.
              </p>
            </div>
          )}

          {/* MENSAGEM */}

          {message && <p className="text-orange-300 mt-6">{message}</p>}

          {/* CONFIRMAR */}

          <button
            type="button"
            onClick={submit}
            disabled={status === "loading"}
            className="w-full mt-8 rounded-xl bg-orange-600 py-4 font-bold disabled:opacity-50 transition hover:bg-orange-500"
          >
            {status === "loading" ? "ENVIANDO..." : "ENVIAR RESPOSTA"}
          </button>
        </div>
      </div>
    </main>
  );
}
