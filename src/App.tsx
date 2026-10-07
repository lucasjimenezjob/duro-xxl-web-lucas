import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Flame,
  Home,
  MapPin,
  Radio,
  Star,
  TriangleAlert,
} from "lucide-react";
import { days, performances, specialEvents, stages } from "./data/festival";
import type { Day, Performance, SpecialEvent, StageId } from "./data/festival";
import {
  activeDay,
  conflictsFor,
  countdownTo,
  currentAt,
  dateLabel,
  durationLabel,
  overlapDuration,
  festivalState,
  nextAt,
  nextDayStart,
  nextFavorites,
  progressOf,
  specialEventsToAnnounce,
  statusOf,
  timeLabel,
  upcomingSets,
} from "./lib/time";

type View = "inicio" | "favoritos" | "lineup";
const views: View[] = ["inicio", "favoritos", "lineup"];
const stageStyle = (id: StageId) =>
  ({
    "--stage": stages.find((stage) => stage.id === id)!.color,
  }) as CSSProperties;
const readView = (): View => {
  const hash = window.location.hash.slice(1);
  return views.includes(hash as View) ? (hash as View) : "inicio";
};
const demoTimestamp = () => {
  const value = new URLSearchParams(window.location.search).get("at");
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
};

function useFestivalClock() {
  const [base] = useState(demoTimestamp);
  const realStart = useRef(Date.now());
  const [now, setNow] = useState(base ?? Date.now());
  useEffect(() => {
    const update = () =>
      setNow(
        base === null ? Date.now() : base + Date.now() - realStart.current,
      );
    const interval = window.setInterval(update, 1000);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [base]);
  return { now, demo: base !== null };
}

function StageMark({ stage }: { stage: StageId }) {
  if (stage === "duro")
    return (
      <svg viewBox="0 0 28 24" fill="none" aria-hidden="true">
        <path d="M6 5h16l-3 14H3L6 5Z" stroke="currentColor" strokeWidth="3" />
        <path d="M8 5 4 9m17 6 4-4" stroke="currentColor" strokeWidth="3" />
      </svg>
    );
  if (stage === "cargo")
    return (
      <svg viewBox="0 0 28 24" fill="none" aria-hidden="true">
        <path
          d="m15 6 3-3a5 5 0 0 1 7 7l-5 5a5 5 0 0 1-7 0m0 3-3 3a5 5 0 0 1-7-7l5-5a5 5 0 0 1 7 0"
          stroke="currentColor"
          strokeWidth="3"
        />
      </svg>
    );
  return (
    <svg viewBox="0 0 28 24" fill="none" aria-hidden="true">
      <path
        d="M2 21a12 16 0 0 1 24 0H2ZM3 13h22M7 6h14M14 3v18M14 3c-6 3-7 11-7 18M14 3c6 3 7 11 7 18"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function SectionTitle({
  icon,
  children,
  extra,
  accent = false,
}: {
  icon: ReactNode;
  children: ReactNode;
  extra?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={`section-heading ${accent ? "accent" : ""}`}>
      <div>
        {icon}
        <h2>{children}</h2>
      </div>
      {extra}
    </div>
  );
}

function Progress({ set, now }: { set: Performance; now: number }) {
  const value = progressOf(set, now);
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={`Progreso de ${set.artist}`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
    >
      <span style={{ width: `${value}%` }} />
    </div>
  );
}

function LiveCard({
  stage,
  now,
  onOpen,
}: {
  stage: StageId;
  now: number;
  onOpen: (set: Performance) => void;
}) {
  const current = currentAt(stage, now);
  const next = nextAt(stage, now);
  const label = stages.find((item) => item.id === stage)!.label;
  return (
    <article
      className={`live-card ${current?.favorite ? "is-favorite" : ""}`}
      style={stageStyle(stage)}
    >
      <div className="stage-label">
        <StageMark stage={stage} />
        <span>{label}</span>
        {current?.favorite && (
          <Star size={15} fill="currentColor" aria-label="Favorito" />
        )}
      </div>
      {current ? (
        <>
          <h3>{current.artist}</h3>
          <p className="set-time">
            {timeLabel(current.start)} <span>—</span> {timeLabel(current.end)}
          </p>
          <Progress set={current} now={now} />
          <div className="live-card-bottom">
            <span>{durationLabel(current.end - now)} restantes</span>
            <span className="on-air">
              <span /> EN DIRECTO
            </span>
          </div>
        </>
      ) : (
        <>
          <h3 className="quiet">SIN ACTUACIÓN</h3>
          <p className="set-time">El escenario está en pausa</p>
          <div className="stage-idle">
            {next ? (
              <button onClick={() => onOpen(next)}>
                <span>Próximo · {timeLabel(next.start)}</span>
                <strong>{next.artist}</strong>
              </button>
            ) : (
              <span>Programación finalizada</span>
            )}
          </div>
        </>
      )}
    </article>
  );
}

function NextFavorite({
  now,
  onOpen,
}: {
  now: number;
  onOpen: (set: Performance) => void;
}) {
  const next = nextFavorites(now);
  return (
    <section className="favorite-next-section">
      <SectionTitle
        accent
        icon={<Star />}
        extra={<span className="section-meta">NUESTRA AGENDA</span>}
      >
        Tu próximo favorito
      </SectionTitle>
      {next.length ? (
        <div className="next-favorites">
          {next.map((set) => (
            <button
              key={set.id}
              className="next-favorite"
              onClick={() => onOpen(set)}
            >
              <div className="next-favorite-main">
                <span className="eyebrow">
                  {days[set.day].label} · {timeLabel(set.start)}
                </span>
                <h3>{set.artist}</h3>
                <span className="next-stage" style={stageStyle(set.stage)}>
                  <span />
                  {stages.find((stage) => stage.id === set.stage)!.label}
                </span>
              </div>
              <div className="starts-in">
                <span>Empieza en</span>
                <strong>{durationLabel(set.start - now)}</strong>
              </div>
              <ChevronRight className="next-chevron" size={20} />
            </button>
          ))}
        </div>
      ) : (
        <div className="empty-panel">
          <Check />
          <div>
            <h3>Todos nuestros favoritos han empezado</h3>
            <p>Consulta su horario en Favoritos.</p>
          </div>
        </div>
      )}
    </section>
  );
}

function SpecialEventCard({
  event,
  now,
}: {
  event: SpecialEvent;
  now?: number;
}) {
  return (
    <div className="special-event">
      <Flame size={24} />
      <div>
        <span className="eyebrow">
          EVENTO ESPECIAL · {days[event.day].label}
        </span>
        <h3>{event.name}</h3>
        <p>
          {event.start === null ? (
            "Horario por confirmar"
          ) : (
            <>
              <time dateTime={new Date(event.start).toISOString()}>
                {timeLabel(event.start)}
              </time>
              {now !== undefined &&
                (now < event.start
                  ? ` · Empieza en ${durationLabel(event.start - now)}`
                  : " · Empieza ahora")}
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function HomeView({
  now,
  onOpen,
  navigate,
}: {
  now: number;
  onOpen: (set: Performance) => void;
  navigate: (view: View) => void;
}) {
  const state = festivalState(now);
  const countdown = countdownTo(nextDayStart(now), now);
  const upcoming = upcomingSets(now);
  return (
    <>
      {state === "before" || state === "between" ? (
        <section className="countdown-panel">
          <div className="countdown-top">
            <span className="eyebrow">
              <span className="tiny-line" />
              {state === "before"
                ? "LA CUENTA ATRÁS HA EMPEZADO"
                : "VOLVEMOS EL DOMINGO"}
            </span>
            <span className="edition-label">EDICIÓN 2026</span>
          </div>
          <h1>
            {state === "before" ? (
              <>
                NOS VEMOS
                <br />
                <span>EN LA PISTA.</span>
              </>
            ) : (
              <>
                UNA NOCHE MÁS.
                <br />
                <span>OTRA DOSIS.</span>
              </>
            )}
          </h1>
          <p className="countdown-caption">
            {state === "before"
              ? "Todo empieza el sábado a las 11:30."
              : "La siguiente jornada empieza a las 11:30."}
          </p>
          <div
            className="countdown"
            role="timer"
            aria-label="Cuenta atrás hasta la próxima jornada"
          >
            {Object.entries(countdown).map(([key, value]) => (
              <div key={key}>
                <strong>{String(value).padStart(2, "0")}</strong>
                <span>
                  {
                    {
                      days: "DÍAS",
                      hours: "HORAS",
                      minutes: "MIN",
                      seconds: "SEG",
                    }[key]
                  }
                </span>
              </div>
            ))}
          </div>
          <div className="countdown-footer">
            <span>
              <Radio size={15} /> Tres escenarios. Dos días.
            </span>
            <button onClick={() => navigate("lineup")}>
              VER HORARIOS <ArrowUpRight size={16} />
            </button>
          </div>
        </section>
      ) : state === "ended" ? (
        <section className="end-panel">
          <span className="eyebrow">11 OCT · 23:00</span>
          <h1>
            EL ECO
            <br />
            <span>SE QUEDA.</span>
          </h1>
          <p>
            DURO XXL 2026 ha terminado.
            <br />
            Dos días que se quedan con nosotros.
          </p>
          <button
            className="outline-button"
            onClick={() => navigate("favoritos")}
          >
            NUESTROS 13 FAVORITOS <Star size={16} />
          </button>
        </section>
      ) : (
        <>
          <h1 className="sr-only">DURO XXL en directo</h1>
          <section className="now-section">
            <SectionTitle
              accent
              icon={<Activity />}
              extra={
                <span className="live-badge">
                  <span /> LIVE
                </span>
              }
            >
              Ahora <span className="heading-time">/ {timeLabel(now)}</span>
            </SectionTitle>
            <div className="live-grid">
              {stages.map((stage) => (
                <LiveCard
                  key={stage.id}
                  stage={stage.id}
                  now={now}
                  onOpen={onOpen}
                />
              ))}
            </div>
          </section>
          <section className="upcoming-section">
            <SectionTitle
              icon={<Clock3 />}
              extra={
                <span className="section-meta">
                  {days[activeDay(now)].label.toUpperCase()}
                </span>
              }
            >
              A continuación
            </SectionTitle>
            {upcoming.length ? (
              <div className="upcoming-list">
                {upcoming.map((set) => (
                  <button
                    key={set.id}
                    className="upcoming-row"
                    style={stageStyle(set.stage)}
                    onClick={() => onOpen(set)}
                  >
                    <time>{timeLabel(set.start)}</time>
                    <strong>
                      {set.artist}
                      {set.favorite && <Star size={14} fill="currentColor" />}
                    </strong>
                    <span className="upcoming-stage">
                      {stages.find((stage) => stage.id === set.stage)!.label}
                    </span>
                    <ChevronRight size={18} />
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty-panel">
                <Clock3 />
                <p>Últimas actuaciones de la jornada. Disfruta del cierre.</p>
              </div>
            )}
          </section>
        </>
      )}
      {specialEventsToAnnounce(now).map((event) => (
        <SpecialEventCard key={event.id} event={event} now={now} />
      ))}
      <NextFavorite now={now} onOpen={onOpen} />
      {state !== "live" && state !== "ended" && (
        <div className="home-hint">
          <span className="live-dot" /> El directo se activa automáticamente al
          empezar.
        </div>
      )}
    </>
  );
}

function DayTabs({ day, setDay }: { day: Day; setDay: (day: Day) => void }) {
  return (
    <div className="day-tabs" role="group" aria-label="Día del festival">
      {(Object.keys(days) as Day[]).map((value) => (
        <button
          key={value}
          aria-pressed={day === value}
          className={day === value ? "active" : ""}
          onClick={() => setDay(value)}
        >
          <span>{days[value].label}</span>
          <small>{days[value].short}</small>
        </button>
      ))}
    </div>
  );
}

function ScheduleCard({
  set,
  now,
  conflicts = false,
  focused = false,
}: {
  set: Performance;
  now: number;
  conflicts?: boolean;
  focused?: boolean;
}) {
  const status = statusOf(set, now);
  const overlaps = conflicts ? conflictsFor(set) : [];
  return (
    <article
      id={set.id}
      style={stageStyle(set.stage)}
      className={`schedule-card ${status} ${focused ? "focused" : ""}`}
    >
      <div className="schedule-time">
        <time>{timeLabel(set.start)}</time>
        <span>{timeLabel(set.end)}</span>
      </div>
      <div className="schedule-body">
        <div className="schedule-artist">
          <h3>{set.artist}</h3>
          {set.favorite && (
            <Star
              size={15}
              className="favorite-star"
              fill="currentColor"
              aria-label="Favorito"
            />
          )}
        </div>
        <div className="schedule-meta">
          <span className="stage-dot" />
          <span>{stages.find((stage) => stage.id === set.stage)!.label}</span>
          {status === "live" ? (
            <span className="set-status live-status">AHORA</span>
          ) : status === "past" ? (
            <span className="set-status">FINALIZADO</span>
          ) : (
            <span className="set-duration">
              {durationLabel(set.end - set.start)}
            </span>
          )}
        </div>
        {status === "live" && (
          <div className="schedule-progress">
            <Progress set={set} now={now} />
            <span>{durationLabel(set.end - now)} restantes</span>
          </div>
        )}
        {overlaps.length > 0 && (
          <div className="conflict-inline">
            <TriangleAlert size={13} />
            <div className="conflict-details">
              {overlaps.map((other) => (
                <span key={other.id}>
                  Coincide con {other.artist} ·{" "}
                  {durationLabel(overlapDuration(set, other))}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function FavoritesView({
  now,
  day,
  setDay,
}: {
  now: number;
  day: Day;
  setDay: (day: Day) => void;
}) {
  const favorites = performances.filter(
    (set) => set.favorite && set.day === day,
  );
  const conflicts = favorites.filter((set) => conflictsFor(set).length > 0);
  return (
    <>
      <div className="page-title">
        <span className="eyebrow">LOS QUE NO NOS PERDEMOS</span>
        <h1>
          NUESTROS <span>FAVORITOS.</span>
        </h1>
        <p>13 artistas. Nuestra ruta por DURO XXL.</p>
      </div>
      <DayTabs day={day} setDay={setDay} />
      <div className="list-heading">
        <h2>
          {days[day].label} <span>/ {days[day].short}</span>
        </h2>
        <span>{favorites.length} FAVORITOS</span>
      </div>
      {conflicts.length > 0 && (
        <div className="conflict-notice">
          <TriangleAlert size={19} />
          <div>
            <strong>Hay favoritos que coinciden</strong>
            <p>
              Los solapes están marcados en cada actuación. Tú eliges la pista.
            </p>
          </div>
        </div>
      )}
      <div className="favorites-list">
        {favorites.map((set) => (
          <ScheduleCard key={set.id} set={set} now={now} conflicts />
        ))}
      </div>
      <div className="favorite-note">
        <Star size={14} />
        <span>eL fAboRito De tU nOVia sigo siendo yo.</span>
      </div>
    </>
  );
}

function LineupView({
  now,
  day,
  setDay,
  stage,
  setStage,
  focused,
}: {
  now: number;
  day: Day;
  setDay: (day: Day) => void;
  stage: StageId | "all";
  setStage: (stage: StageId | "all") => void;
  focused: string | null;
}) {
  const visibleStages = stages.filter(
    (item) => stage === "all" || item.id === stage,
  );
  const count = performances.filter(
    (set) => set.day === day && (stage === "all" || set.stage === stage),
  ).length;
  return (
    <>
      <div className="page-title">
        <span className="eyebrow">CADA PISTA. CADA ACTUACIÓN.</span>
        <h1>
          EL <span>LINEUP.</span>
        </h1>
        <p>Dos días para perder la noción del tiempo.</p>
      </div>
      <DayTabs day={day} setDay={setDay} />
      <div className="stage-tabs" role="group" aria-label="Escenario">
        <button
          aria-pressed={stage === "all"}
          className={stage === "all" ? "active" : ""}
          onClick={() => setStage("all")}
        >
          TODOS
        </button>
        {stages.map((item) => (
          <button
            key={item.id}
            style={stageStyle(item.id)}
            aria-pressed={stage === item.id}
            className={stage === item.id ? "active" : ""}
            onClick={() => setStage(item.id)}
          >
            <span className="stage-dot" />
            {item.short}
          </button>
        ))}
      </div>
      <div className="lineup-meta">
        <span>{count} ACTUACIONES · 11:30 — 23:00</span>
        <span>
          <Star size={13} fill="currentColor" /> FAVORITO
        </span>
      </div>
      <div className={`lineup-grid ${stage !== "all" ? "single-stage" : ""}`}>
        {visibleStages.map((item) => (
          <section
            className="stage-schedule"
            key={item.id}
            style={stageStyle(item.id)}
          >
            <div className="stage-schedule-heading">
              <StageMark stage={item.id} />
              <h2>
                {item.id === "hangar" && day === "sunday"
                  ? "BLACK HANGAR / LASTER"
                  : item.label}
              </h2>
            </div>
            <div>
              {performances
                .filter((set) => set.day === day && set.stage === item.id)
                .map((set) => (
                  <ScheduleCard
                    key={set.id}
                    set={set}
                    now={now}
                    focused={focused === set.id}
                  />
                ))}
            </div>
          </section>
        ))}
      </div>
      {specialEvents
        .filter((event) => event.day === day)
        .map((event) => (
          <SpecialEventCard key={event.id} event={event} />
        ))}
      <p className="schedule-source">
        Horario del grupo · Actualiza los datos si la organización anuncia
        cambios.
      </p>
    </>
  );
}

export default function App() {
  const { now, demo } = useFestivalClock();
  const [view, setView] = useState<View>(readView);
  const [day, setDay] = useState<Day>(() => activeDay(now));
  const [stage, setStage] = useState<StageId | "all">("all");
  const [focused, setFocused] = useState<string | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const state = festivalState(now);

  useEffect(() => {
    const sync = () => {
      setView(readView());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  useEffect(() => {
    document.title = `DURO XXL · ${view === "inicio" ? "Inicio" : view === "favoritos" ? "Favoritos" : "Lineup"}`;
  }, [view]);
  useEffect(() => {
    if (!focused || view !== "lineup") return;
    const timer = window.setTimeout(
      () =>
        document.getElementById(focused)?.scrollIntoView({
          block: "center",
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "instant"
            : "smooth",
        }),
      100,
    );
    return () => window.clearTimeout(timer);
  }, [focused, view, day, stage]);

  function navigate(next: View) {
    setFocused(null);
    setView(next);
    window.location.hash = next;
    window.scrollTo({ top: 0, behavior: "instant" });
    mainRef.current?.focus({ preventScroll: true });
  }
  function openSet(set: Performance) {
    setDay(set.day);
    setStage(set.stage);
    setView("lineup");
    setFocused(set.id);
    window.location.hash = "lineup";
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>
      {demo && (
        <div className="demo-banner">
          <span>VISTA PREVIA · RELOJ SIMULADO</span>
          <a href={`${window.location.pathname}${window.location.hash}`}>
            Volver a hora real
          </a>
        </div>
      )}
      <header
        className={`festival-header ${view !== "inicio" ? "compact" : ""}`}
      >
        <a
          className="hero-link"
          href="#inicio"
          aria-label="Volver a Inicio"
          onClick={() => navigate("inicio")}
        >
          <img
            className="hero-image"
            src="/images/group-cover.webp"
            alt="Nuestro grupo frente al escenario, con el logotipo DURO XXL y la dedicatoria a Raky."
            width={1672}
            height={941}
            fetchPriority="high"
          />
        </a>
        <div className="header-inner">
          <div className="header-clock">
            <span>{dateLabel(now)}</span>
            <time dateTime={new Date(now).toISOString()}>{timeLabel(now)}</time>
            <span className="timezone">HORA DE MADRID</span>
          </div>
          <div className="festival-location">
            <strong>10 — 11 OCT 2026</strong>
            <span>
              <MapPin size={13} /> MONTMELÓ, BARCELONA
            </span>
          </div>
          <span className="header-state">
            {state === "live" ? (
              <>
                <span className="live-dot" /> EN DIRECTO
              </>
            ) : state === "ended" ? (
              "HASTA LA PRÓXIMA"
            ) : (
              "PROHIBIDO NO DIVERTIRSE"
            )}
          </span>
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        ref={mainRef}
        className={`main-content view-${view}`}
      >
        {view === "inicio" ? (
          <HomeView now={now} onOpen={openSet} navigate={navigate} />
        ) : view === "favoritos" ? (
          <FavoritesView now={now} day={day} setDay={setDay} />
        ) : (
          <LineupView
            now={now}
            day={day}
            setDay={setDay}
            stage={stage}
            setStage={setStage}
            focused={focused}
          />
        )}
        <footer className="page-footer">
          <span>10 — 11 OCT / 2026</span>
          <span>HECHO PARA NO PERDERNOS PORQUE SOMOS MUY TONTOS.</span>
        </footer>
      </main>
      <nav className="bottom-nav" aria-label="Navegación principal">
        <div>
          {(
            [
              { view: "inicio", label: "INICIO", icon: Home },
              { view: "favoritos", label: "FAVORITOS", icon: Star },
              { view: "lineup", label: "LINEUP", icon: CalendarDays },
            ] as const
          ).map((item) => (
            <a
              key={item.view}
              href={`#${item.view}`}
              aria-current={view === item.view ? "page" : undefined}
              className={view === item.view ? "active" : ""}
              onClick={(event) => {
                event.preventDefault();
                navigate(item.view);
              }}
            >
              <item.icon
                size={23}
                fill={
                  view === item.view && item.view === "inicio"
                    ? "currentColor"
                    : "none"
                }
              />
              <span>{item.label}</span>
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
}
