import test from "node:test";
import assert from "node:assert/strict";
import {
  at,
  favoriteArtists,
  festivalEnd,
  festivalStart,
  performances,
  specialEvents,
  stages,
} from "../src/data/festival.ts";
import {
  conflictsFor,
  countdownTo,
  currentAt,
  durationLabel,
  festivalState,
  nextFavorites,
  overlapDuration,
  progressOf,
  specialEventsToAnnounce,
  timeLabel,
} from "../src/lib/time.ts";

test("el dataset contiene las 55 actuaciones y exactamente los 17 favoritos", () => {
  assert.equal(performances.length, 55);
  assert.equal(performances.filter((set) => set.favorite).length, 17);
  assert.deepEqual(
    new Set(
      performances.filter((set) => set.favorite).map((set) => set.artist),
    ),
    new Set(favoriteArtists),
  );
  assert.equal(new Set(performances.map((set) => set.id)).size, 55);
  assert.equal(
    performances.find((set) => set.artist === "TITI")?.favorite,
    false,
  );
  assert.equal(specialEvents[0].start, at("sunday", "21:15"));
  assert.equal(specialEvents[0].end, null);
});

test("cada escenario tiene un horario sin solapes ni huecos inesperados", () => {
  for (const day of ["saturday", "sunday"] as const) {
    for (const stage of stages) {
      const sets = performances.filter(
        (set) => set.day === day && set.stage === stage.id,
      );
      assert.equal(
        sets[0].start,
        at(
          day,
          day === "saturday" && stage.id === "hangar" ? "12:00" : "11:30",
        ),
      );
      assert.equal(sets.at(-1)?.end, at(day, "23:00"));
      sets.forEach((set, index) => {
        assert.ok(set.start < set.end);
        if (index > 0) assert.equal(sets[index - 1].end, set.start);
      });
    }
  }
});

test("el festival cambia de estado en los límites exactos", () => {
  assert.equal(festivalState(festivalStart - 1), "before");
  assert.equal(festivalState(festivalStart), "live");
  assert.equal(festivalState(at("saturday", "23:00")), "between");
  assert.equal(festivalState(at("sunday", "11:30") - 1), "between");
  assert.equal(festivalState(at("sunday", "11:30")), "live");
  assert.equal(festivalState(festivalEnd), "ended");
});

test("a las 19:00 TITI sustituye a Karah sin refrescar ni solapar actuaciones", () => {
  assert.equal(
    currentAt("cargo", at("saturday", "19:00") - 1)?.artist,
    "KARAH b2b MR. POLSKA",
  );
  assert.equal(currentAt("cargo", at("saturday", "19:00"))?.artist, "TITI");
  assert.equal(currentAt("hangar", at("saturday", "11:45")), undefined);
  assert.equal(currentAt("duro", festivalEnd), undefined);
});

test("el siguiente favorito excluye los actuales y conserva los empates", () => {
  assert.deepEqual(
    nextFavorites(at("saturday", "18:47")).map((set) => set.artist),
    ["SANTØS"],
  );
  assert.deepEqual(
    nextFavorites(at("sunday", "17:00")).map((set) => set.artist),
    ["VIEZE ASBAK", "ROOLER"],
  );
  assert.deepEqual(nextFavorites(festivalEnd), []);
});

test("los cuatro nuevos favoritos se incluyen en la agenda y próximos sin nuevos solapes", () => {
  const additions = [
    "JAZZY",
    "KRUELTY",
    "TOXIC MACHINERY",
    "DJ SISU b2b XAVISTYLE",
  ];
  for (const artist of additions) {
    const set = performances.find((set) => set.artist === artist)!;
    assert.equal(set.favorite, true);
    assert.deepEqual(conflictsFor(set), []);
  }
  for (const [day, time, expected] of [
    ["saturday", "14:00", "KRUELTY"],
    ["saturday", "15:30", "TOXIC MACHINERY"],
    ["saturday", "21:30", "DJ SISU b2b XAVISTYLE"],
    ["sunday", "18:00", "JAZZY"],
  ] as const) {
    assert.deepEqual(
      nextFavorites(at(day, time)).map((set) => set.artist),
      [expected],
    );
  }
});

test("la etiqueta de Andrés Campo no lo incluye en favoritos, próximos ni solapes", () => {
  const set = performances.find(
    (set) => set.artist === "ANDRÉS CAMPO b2b FUTURE.666",
  )!;
  assert.equal(set.annotation, "A escucharlo al Bershka🎀");
  assert.equal(set.favorite, false);
  assert.deepEqual(conflictsFor(set), []);
  assert.deepEqual(
    nextFavorites(at("saturday", "17:15")).map((set) => set.artist),
    ["NOVAH"],
  );
  for (const favorite of performances.filter((set) => set.favorite)) {
    assert.equal(
      conflictsFor(favorite).some((other) => other.id === set.id),
      false,
    );
  }
});

test("detecta solapes parciales entre favoritos, pero no horarios contiguos", () => {
  const vendex = performances.find((set) => set.artist === "VENDEX")!;
  assert.deepEqual(
    conflictsFor(vendex).map((set) => set.artist),
    ["ANDEREX"],
  );
  const vieze = performances.find((set) => set.artist === "VIEZE ASBAK")!;
  assert.deepEqual(
    conflictsFor(vieze).map((set) => set.artist),
    ["ROOLER"],
  );
  const karah = performances.find(
    (set) => set.artist === "KARAH b2b MR. POLSKA",
  )!;
  assert.deepEqual(
    conflictsFor(karah).map((set) => set.artist),
    ["NOVAH", "KLANGKUENSTLER"],
  );
  assert.deepEqual(
    conflictsFor(karah).map((set) => overlapDuration(karah, set) / 60_000),
    [30, 30],
  );
  assert.equal(overlapDuration(vendex, conflictsFor(vendex)[0]), 60 * 60_000);
  assert.equal(overlapDuration(vieze, conflictsFor(vieze)[0]), 60 * 60_000);
  const winson = performances.find((set) => set.artist === "WINSON")!;
  assert.equal(overlapDuration(vendex, winson), 0);
  assert.equal(overlapDuration(karah, vendex), 0);
});

test("el Pyro Show se anuncia antes y en el minuto de inicio, sin inventar duración", () => {
  assert.deepEqual(specialEventsToAnnounce(at("saturday", "21:15")), []);
  assert.deepEqual(specialEventsToAnnounce(at("sunday", "20:45") - 1), []);
  assert.equal(
    specialEventsToAnnounce(at("sunday", "20:45"))[0]?.name,
    "PYRO SHOW",
  );
  assert.equal(
    specialEventsToAnnounce(at("sunday", "21:15"))[0]?.name,
    "PYRO SHOW",
  );
  assert.deepEqual(specialEventsToAnnounce(at("sunday", "21:16")), []);
});

test("el reloj usa Madrid, y el progreso mide tiempo transcurrido", () => {
  assert.equal(timeLabel(Date.parse("2026-10-10T16:47:00Z")), "18:47");
  const klang = performances.find((set) => set.artist === "KLANGKUENSTLER")!;
  assert.equal(progressOf(klang, klang.start - 1), 0);
  assert.equal(progressOf(klang, (klang.start + klang.end) / 2), 50);
  assert.equal(progressOf(klang, klang.end + 1), 100);
  assert.equal(
    durationLabel(at("saturday", "21:00") - at("saturday", "18:47")),
    "2 h 13 min",
  );
  assert.deepEqual(countdownTo(festivalStart, festivalStart - 90061000), {
    days: 1,
    hours: 1,
    minutes: 1,
    seconds: 1,
  });
});
