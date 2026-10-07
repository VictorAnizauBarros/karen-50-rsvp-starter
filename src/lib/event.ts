export const event = {
  honoree: "Karen Ferraz",
  age: 50,
  theme: "Halloween",
  startDate: "2026-10-31",
  endDate: "2026-11-02",
  dateLabel: "31 de outubro, 1 e 2 de novembro de 2026",
  locationName: "Endereço da festa",
  locationAddress: "Endereço fictício — substituir antes da publicação",
  mapsUrl: "https://maps.google.com/",
  days: [
    {
      date: "31/10",
      isoDate: "2026-10-31",
      label: "Sábado",
      note: "Abertura da celebração",
    },
    {
      date: "01/11",
      isoDate: "2026-11-01",
      label: "Domingo",
      note: "Celebração principal",
    },
    {
      date: "02/11",
      isoDate: "2026-11-02",
      label: "Segunda-feira",
      note: "Encerramento",
    },
  ],
} as const;
