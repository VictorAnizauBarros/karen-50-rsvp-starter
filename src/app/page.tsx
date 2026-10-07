"use client";

import { event } from "@/lib/event";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [introStage, setIntroStage] = useState<
    "dark" | "candle" | "surprise" | "revealed"
  >("dark");

  useEffect(() => {
    const candleTimer = window.setTimeout(() => setIntroStage("candle"), 500);
    const surpriseTimer = window.setTimeout(
      () => setIntroStage("surprise"),
      1700,
    );
    const revealTimer = window.setTimeout(
      () => setIntroStage("revealed"),
      3300,
    );

    return () => {
      window.clearTimeout(candleTimer);
      window.clearTimeout(surpriseTimer);
      window.clearTimeout(revealTimer);
    };
  }, []);

  return (
    <main className="halloween-bg relative min-h-screen overflow-hidden">
      <div
        className={`intro-overlay ${
          introStage === "revealed"
            ? "opacity-0 pointer-events-none"
            : "opacity-100"
        }`}
      >
        <div
          className={`intro-candle ${introStage === "dark" ? "scale-50 opacity-0" : "scale-100 opacity-100"}`}
        >
          <span className="intro-candle-emoji">🕯️</span>
          <span
            className={`intro-flame ${
              introStage === "revealed"
                ? "scale-[1.8]"
                : introStage === "surprise"
                  ? "scale-125"
                  : "scale-100"
            }`}
          />
        </div>

        <p
          className={`intro-text ${
            introStage === "surprise" || introStage === "revealed"
              ? "opacity-100"
              : "opacity-0"
          }`}
        >
          Shhh... Temos uma surpresa pra você!
        </p>
      </div>

      <div
        className={`welcome-content transition-all duration-[1600ms] ease-out ${
          introStage === "revealed"
            ? "opacity-100 scale-100 blur-0"
            : "opacity-0 scale-[0.97] blur-sm"
        }`}
      >
        <section className="min-h-screen flex items-center justify-center px-6 py-16 text-center relative">
          <div className="max-w-3xl">
            <div className="text-5xl mb-8 floaty">🕯️</div>
            <p className="uppercase tracking-[.35em] text-sm gold mb-5">
              Uma noite assustadoramente especial
            </p>
            <h1 className="text-6xl md:text-8xl font-black tracking-tight glow">
              KAREN
            </h1>
            <div className="text-8xl md:text-[11rem] font-black orange leading-none glow">
              {event.age}
            </div>
            <p className="text-xl md:text-2xl mt-6 text-stone-200">
              50 anos de histórias, memórias e pessoas especiais.
            </p>
            <p className="mt-4 muted">{event.dateLabel}</p>
            <Link
              href="/rsvp"
              className="inline-flex mt-10 rounded-full bg-orange-600 px-8 py-4 font-bold text-white hover:bg-orange-500 transition"
            >
              CONFIRMAR PRESENÇA
            </Link>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 pb-24">
          <div className="card rounded-3xl p-8 md:p-12">
            <p className="gold uppercase tracking-[.25em] text-sm">
              A celebração
            </p>
            <h2 className="text-3xl md:text-4xl mt-3">
              Três dias para celebrar
            </h2>
            <p className="muted mt-4 leading-7">
              Prepare sua fantasia e venha fazer parte desta celebração de
              Halloween. Os horários e o endereço serão atualizados aqui quando
              definidos.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mt-8">
              {event.days.map((day) => (
                <div
                  key={day.date}
                  className="rounded-2xl border border-white/10 p-5"
                >
                  <div className="orange text-2xl font-bold">{day.date}</div>
                  <div className="mt-1">{day.label}</div>
                  <div className="muted text-sm mt-2">{day.note}</div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={event.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-orange-400/30 px-5 py-3"
              >
                🗺️ Mapa
              </a>
            </div>
          </div>
        </section>

        <section
          id="local"
          className="max-w-4xl mx-auto px-6 pb-24 text-center"
        >
          <div className="text-4xl">🎃</div>
          <h2 className="text-3xl mt-3">Esperamos você</h2>
          <p className="muted mt-3">{event.locationName}</p>
          <p className="muted">{event.locationAddress}</p>
        </section>
      </div>
    </main>
  );
}
