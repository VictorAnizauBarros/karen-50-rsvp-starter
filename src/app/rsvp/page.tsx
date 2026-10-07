"use client";

import { useState } from "react";
import { event } from "@/lib/event";

type Status = "idle" | "loading" | "success" | "error";

export default function RSVPPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [attending, setAttending] = useState<boolean | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const [companionNames, setCompanionNames] = useState<string[]>([]);

  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  function toggleDay(day: string) {
    setSelectedDays((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day],
    );
  }

  function addCompanion() {
    setCompanionNames((current) => [...current, ""]);
  }

  function removeCompanion(index: number) {
    setCompanionNames((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  function updateCompanion(index: number, value: string) {
    setCompanionNames((current) =>
      current.map((name, itemIndex) => (itemIndex === index ? value : name)),
    );
  }

  function handleAttending(value: boolean) {
    setAttending(value);
    setMessage("");

    if (!value) {
      setSelectedDays([]);
      setCompanionNames([]);
    }
  }

  async function submit() {
    setMessage("");

    if (!name.trim()) {
      setMessage("Informe seu nome.");
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

    if (
      attending &&
      companionNames.some((companionName) => !companionName.trim())
    ) {
      setMessage("Informe o nome de todos os acompanhantes.");
      setStatus("error");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/rsvp/public", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || undefined,
          attending,
          selectedDays: attending ? selectedDays : [],
          companions: attending ? companionNames.length : 0,
          companionNames: attending
            ? companionNames.map((companionName) => companionName.trim())
            : [],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ?? "Não foi possível registrar sua resposta.",
        );
      }

      setStatus("success");
    } catch (error) {
      console.error("Erro ao registrar RSVP:", error);

      setMessage(
        error instanceof Error ? error.message : "Ocorreu um erro inesperado.",
      );

      setStatus("error");
    }
  }

  if (status === "success") {
    const declined = attending === false;

    return (
      <main className="halloween-bg min-h-screen flex items-center justify-center px-6 py-12 text-center">
        <div className="max-w-xl w-full">
          <div className="text-6xl floaty">{declined ? "🖤" : "🎃"}</div>

          <p className="gold uppercase tracking-[.2em] text-xs mt-6">
            Karen 50
          </p>

          <h1 className="text-5xl mt-6">
            {declined ? "Resposta registrada!" : "Presença confirmada!"}
          </h1>

          <p className="text-xl mt-5">Obrigado, {name.trim()}.</p>

          {declined ? (
            <>
              <p className="muted mt-4">
                Sentiremos sua falta, mas agradecemos por avisar.
              </p>

              <p className="muted mt-6">
                Esperamos poder celebrar juntos em outra oportunidade. 🖤
              </p>
            </>
          ) : (
            <>
              <p className="muted mt-4">
                Estamos muito felizes em saber que você estará conosco!
              </p>

              <p className="muted mt-6">
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

              {companionNames.length > 0 && (
                <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-left">
                  <p className="font-semibold">
                    Acompanhante
                    {companionNames.length > 1 ? "s" : ""}
                  </p>

                  <div className="mt-2 space-y-1">
                    {companionNames.map((companionName, index) => (
                      <p key={index} className="muted text-sm">
                        {companionName}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <p className="muted mt-6">Karen estará esperando por você! 🖤</p>
            </>
          )}

          <a
            href="/"
            className="inline-block mt-8 rounded-xl border border-white/10 px-6 py-3 font-semibold transition hover:bg-white/5"
          >
            VOLTAR AO CONVITE
          </a>
        </div>
      </main>
    );
  }

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

          <h1 className="text-4xl md:text-5xl mt-2">
            Confirme sua presença 🎃
          </h1>

          <p className="muted mt-3">
            Será um prazer ter você conosco para celebrar os 50 anos da Karen.
          </p>

          {/* DADOS PESSOAIS */}

          <div className="mt-8">
            <label htmlFor="name" className="text-sm">
              Seu nome
            </label>

            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite seu nome completo"
              className="w-full mt-2 rounded-xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-orange-400"
            />
          </div>

          <div className="mt-5">
            <label htmlFor="phone" className="text-sm">
              WhatsApp
              <span className="muted ml-1">(opcional)</span>
            </label>

            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(19) 99999-9999"
              className="w-full mt-2 rounded-xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-orange-400"
            />
          </div>

          {/* PRESENÇA */}

          <div className="mt-8">
            <p className="text-sm">Você estará conosco?</p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleAttending(true)}
                className={`rounded-xl border p-4 transition ${
                  attending === true
                    ? "border-orange-400 bg-orange-500/20"
                    : "border-white/10 hover:bg-white/5"
                }`}
              >
                🧡 Sim, estarei lá
              </button>

              <button
                type="button"
                onClick={() => handleAttending(false)}
                className={`rounded-xl border p-4 transition ${
                  attending === false
                    ? "border-stone-400 bg-white/5"
                    : "border-white/10 hover:bg-white/5"
                }`}
              >
                🖤 Não poderei ir
              </button>
            </div>
          </div>

          {/* DIAS */}

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

                          <p className="mt-1 text-xs opacity-50">{day.note}</p>
                        </div>

                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
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

          {/* ACOMPANHANTES */}

          {attending === true && (
            <div className="mt-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm">Acompanhantes</p>

                  <p className="muted text-xs mt-1">
                    Adicione quantas pessoas forem necessárias.
                  </p>
                </div>

                {companionNames.length > 0 && (
                  <span className="text-xs gold whitespace-nowrap">
                    {companionNames.length}{" "}
                    {companionNames.length === 1
                      ? "acompanhante"
                      : "acompanhantes"}
                  </span>
                )}
              </div>

              {companionNames.length > 0 && (
                <div className="mt-4 space-y-3">
                  {companionNames.map((value, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => updateCompanion(index, e.target.value)}
                        placeholder={`Nome do acompanhante ${index + 1}`}
                        className="flex-1 rounded-xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-orange-400"
                      />

                      <button
                        type="button"
                        onClick={() => removeCompanion(index)}
                        aria-label={`Remover acompanhante ${index + 1}`}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 text-lg transition hover:border-red-400 hover:text-red-300"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={addCompanion}
                className="w-full mt-4 rounded-xl border border-dashed border-orange-400/50 py-3 font-semibold text-orange-300 transition hover:bg-orange-500/10"
              >
                + ADICIONAR ACOMPANHANTE
              </button>
            </div>
          )}

          {/* MENSAGEM */}

          {message && (
            <div className="mt-6 rounded-xl border border-orange-400/20 bg-orange-500/10 p-4">
              <p className="text-orange-300 text-sm">{message}</p>
            </div>
          )}

          {/* ENVIAR */}

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
