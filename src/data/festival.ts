export type Day = "saturday" | "sunday";
export type StageId = "duro" | "cargo" | "hangar";
export interface Performance {
  id: string;
  artist: string;
  day: Day;
  stage: StageId;
  start: number;
  end: number;
  favorite: boolean;
  annotation?: string;
}

export const TIME_ZONE = "Europe/Madrid";
export const days = {
  saturday: {
    label: "Sábado",
    date: "2026-10-10",
    short: "10 OCT",
    start: "11:30",
    end: "23:00",
  },
  sunday: {
    label: "Domingo",
    date: "2026-10-11",
    short: "11 OCT",
    start: "11:30",
    end: "23:00",
  },
} as const;

export const stages = [
  {
    id: "duro",
    label: "DURO STAGE",
    short: "DURO",
    description: "Main stage",
    color: "#d4f448",
  },
  {
    id: "cargo",
    label: "CARGO STAGE",
    short: "CARGO",
    description: "Cargo stage",
    color: "#00c9ed",
  },
  {
    id: "hangar",
    label: "BLACK HANGAR",
    short: "BLACK HANGAR",
    description: "Laster stage el domingo",
    color: "#bd68fa",
  },
] as const;

export const favoriteArtists = [
  "KLANGKUENSTLER",
  "SLVL",
  "KARAH b2b MR. POLSKA",
  "SANTØS",
  "NOVAH",
  "KOBOSIL",
  "FATIMA HAJJI b2b BUENRI",
  "VIEZE ASBAK",
  "VENDEX",
  "WINSON",
  "ROOLER",
  "ANDEREX",
  "SO JUICE",
  "JAZZY",
  "KRUELTY",
  "TOXIC MACHINERY",
  "DJ SISU b2b XAVISTYLE",
  "YANAMASTE",
  "LEE ANN ROBERTS",
  "CERA KHIN",
  "ALARICO",
] as const;

// Una etiqueta de la actuación, independiente de la lista de favoritos.
const artistAnnotations: Record<string, string> = {
  "ANDRÉS CAMPO b2b FUTURE.666": "A escucharlo al Bershka🎀",
};

// Las fechas del festival están en CEST (UTC+02:00). El offset explícito evita
// interpretar los horarios con la zona del teléfono o del servidor de Vercel.
export function at(day: Day, time: string): number {
  return Date.parse(`${days[day].date}T${time}:00+02:00`);
}

type Slot = [start: string, end: string, artist: string];
const schedule: Record<Day, Record<StageId, Slot[]>> = {
  saturday: {
    duro: [
      ["11:30", "12:30", "KEYKLAU"],
      ["12:30", "13:30", "ROLL DANN"],
      ["13:30", "15:30", "ADRIANA LOPEZ"],
      ["15:30", "17:30", "YANAMASTE"],
      ["17:30", "18:30", "ANDRÉS CAMPO b2b FUTURE.666"],
      ["18:30", "21:00", "KLANGKUENSTLER"],
      ["21:00", "23:00", "FERNANDA MARTINS & LUKAS"],
    ],
    cargo: [
      ["11:30", "12:30", "RAGE AMORETTY"],
      ["12:30", "14:00", "REVENJA"],
      ["14:00", "15:00", "BØERY"],
      ["15:00", "16:00", "KRUELTY"],
      ["16:00", "17:00", "TOXIC MACHINERY"],
      ["17:00", "18:00", "SLVL"],
      ["18:00", "19:00", "KARAH b2b MR. POLSKA"],
      ["19:00", "20:00", "TITI"],
      ["20:00", "21:00", "AZDAT b2b NEEK"],
      ["21:00", "22:00", "SANTØS"],
      ["22:00", "23:00", "DJ SISU b2b XAVISTYLE"],
    ],
    hangar: [
      ["12:00", "13:30", "LAURA SN b2b NINA CASTH"],
      ["13:30", "15:00", "ALBA FRANCH b2b BIXBITA"],
      ["15:00", "16:00", "ROW1"],
      ["16:00", "17:30", "RELAJADITA b2b CARNADA"],
      ["17:30", "18:30", "NOVAH"],
      ["18:30", "19:30", "OMAKS"],
      ["19:30", "21:00", "LEE ANN ROBERTS"],
      ["21:00", "22:00", "CERA KHIN"],
      ["22:00", "23:00", "NATTE VISSTICK"],
    ],
  },
  sunday: {
    duro: [
      ["11:30", "12:30", "N.O.V.A"],
      ["12:30", "13:30", "KSN b2b MVGRI"],
      ["13:30", "15:00", "UEBERREST"],
      ["15:00", "16:30", "KOBOSIL"],
      ["16:30", "17:30", "FATIMA HAJJI b2b BUENRI"],
      ["17:30", "18:30", "VIEZE ASBAK"],
      ["18:30", "20:00", "JAZZY"],
      ["20:00", "21:30", "VENDEX"],
      ["21:30", "23:00", "WINSON"],
    ],
    cargo: [
      ["11:30", "12:30", "EDIM WILLIOX"],
      ["12:30", "13:30", "BERN-AT & WARLEX"],
      ["13:30", "14:30", "KLOON"],
      ["14:30", "15:30", "ORIZONNT"],
      ["15:30", "16:30", "DANY BPM"],
      ["16:30", "17:30", "THE STRAIKERZ"],
      ["17:30", "18:30", "ROOLER"],
      ["18:30", "19:30", "KROWDEXX"],
      ["19:30", "20:30", "BMBERJCK"],
      ["20:30", "21:30", "ANDEREX"],
      ["21:30", "22:30", "SO JUICE"],
      ["22:30", "23:00", "KENAI"],
    ],
    hangar: [
      ["11:30", "13:00", "ROLL DANN b2b KAMELIA"],
      ["13:00", "15:00", "IGNEZ"],
      ["15:00", "16:30", "ALARICO"],
      ["16:30", "18:30", "BEN KLOCK"],
      ["18:30", "20:00", "PHILIPPA PACHO b2b SETAOC MASS"],
      ["20:00", "21:30", "CHLÄR"],
      ["21:30", "23:00", "FREDDY K b2b THE LADY MACHINE"],
    ],
  },
};

export const performances: Performance[] = (Object.keys(schedule) as Day[])
  .flatMap((day) =>
    stages.flatMap((stage) =>
      schedule[day][stage.id].map(([start, end, artist], index) => ({
        id: `${day}-${stage.id}-${index}`,
        day,
        stage: stage.id,
        artist,
        start: at(day, start),
        end: at(day, end),
        favorite: favoriteArtists.some((name) => name === artist),
        annotation: artistAnnotations[artist],
      })),
    ),
  )
  .sort((a, b) => a.start - b.start);

export interface SpecialEvent {
  id: string;
  name: string;
  day: Day;
  start: number | null;
  end: number | null;
}

export const specialEvents: SpecialEvent[] = [
  {
    id: "pyro-show",
    name: "PYRO SHOW",
    day: "sunday" as Day,
    start: at("sunday", "21:15"),
    end: null,
  },
];

export const festivalStart = at("saturday", "11:30");
export const festivalEnd = at("sunday", "23:00");
