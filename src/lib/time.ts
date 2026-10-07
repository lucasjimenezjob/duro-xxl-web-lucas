import {
  at,
  days,
  festivalEnd,
  festivalStart,
  performances,
  specialEvents,
  TIME_ZONE,
} from "../data/festival.ts";
import type { Day, Performance, StageId } from "../data/festival.ts";

export type FestivalState = "before" | "live" | "between" | "ended";
export const timeLabel = (timestamp: number): string =>
  new Intl.DateTimeFormat("es-ES", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(timestamp);
export const dateLabel = (timestamp: number): string =>
  new Intl.DateTimeFormat("es-ES", {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(timestamp);

export function festivalState(now: number): FestivalState {
  if (now < festivalStart) return "before";
  if (now >= festivalEnd) return "ended";
  if (now >= at("saturday", "23:00") && now < at("sunday", "11:30"))
    return "between";
  return "live";
}

export function activeDay(now: number): Day {
  return now >= at("saturday", "23:00") ? "sunday" : "saturday";
}

export function currentAt(
  stage: StageId,
  now: number,
): Performance | undefined {
  return performances.find(
    (set) => set.stage === stage && set.start <= now && now < set.end,
  );
}

export function nextAt(stage: StageId, now: number): Performance | undefined {
  return performances.find((set) => set.stage === stage && set.start > now);
}

export function nextFavorites(now: number): Performance[] {
  const upcoming = performances.filter(
    (set) => set.favorite && set.start > now,
  );
  return upcoming.filter((set) => set.start === upcoming[0]?.start);
}

export function upcomingSets(now: number): Performance[] {
  const today = activeDay(now);
  return performances
    .filter((set) => set.day === today && set.start > now)
    .slice(0, 3);
}

// Aviso desde 30 minutos antes hasta el minuto de inicio. No representa
// la duración del espectáculo, que todavía no conocemos.
export function specialEventsToAnnounce(now: number) {
  return specialEvents.filter(
    (event) =>
      event.start !== null &&
      event.start - now <= 30 * 60_000 &&
      now < event.start + 60_000,
  );
}

export function statusOf(
  set: Performance,
  now: number,
): "live" | "upcoming" | "past" {
  return now < set.start ? "upcoming" : now >= set.end ? "past" : "live";
}

export function progressOf(set: Performance, now: number): number {
  return Math.min(
    100,
    Math.max(0, ((now - set.start) / (set.end - set.start)) * 100),
  );
}

export function durationLabel(milliseconds: number): string {
  const minutes = Math.max(0, Math.ceil(milliseconds / 60_000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours >= 24) return `${Math.floor(hours / 24)} d ${hours % 24} h`;
  return `${hours} h${rest ? ` ${rest} min` : ""}`;
}

export function overlapDuration(set: Performance, other: Performance): number {
  return Math.max(
    0,
    Math.min(set.end, other.end) - Math.max(set.start, other.start),
  );
}

export function conflictsFor(set: Performance): Performance[] {
  return performances.filter(
    (other) =>
      other.favorite &&
      set.favorite &&
      other.id !== set.id &&
      other.stage !== set.stage &&
      overlapDuration(set, other) > 0,
  );
}

export function countdownTo(timestamp: number, now: number) {
  const seconds = Math.max(0, Math.floor((timestamp - now) / 1000));
  return {
    days: Math.floor(seconds / 86_400),
    hours: Math.floor((seconds % 86_400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
  };
}

export function nextDayStart(now: number): number {
  return festivalState(now) === "between"
    ? at("sunday", days.sunday.start)
    : festivalStart;
}
