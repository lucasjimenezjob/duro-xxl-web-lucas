import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { Volume2, VolumeX, X } from "lucide-react";
import {
  createPyroAudio,
  PYRO_DURATION,
  registerPyroTap,
  runFireworks,
} from "../lib/pyro";
import type { PyroAudio } from "../lib/pyro";
import "./pyro.css";

const PyroContext = createContext<() => void>(() => {});

export function usePyroEasterEgg() {
  const activate = useContext(PyroContext);
  const taps = useRef({ count: 0, started: 0 });
  return () => {
    const result = registerPyroTap(taps.current, performance.now());
    taps.current = result.sequence;
    if (result.triggered) activate();
  };
}

export function PyroEasterEggProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const playing = useRef(false);
  const audio = useRef<PyroAudio>(null);
  const activate = useCallback(() => {
    if (playing.current) return;
    playing.current = true;
    audio.current = createPyroAudio();
    setActive(true);
  }, []);
  const close = useCallback(() => {
    audio.current?.stop();
    audio.current = null;
    playing.current = false;
    setActive(false);
  }, []);
  useEffect(() => () => audio.current?.stop(), []);
  return (
    <PyroContext.Provider value={activate}>
      {children}
      {active && <PyroShow audio={audio.current} close={close} />}
    </PyroContext.Provider>
  );
}

function PyroShow({ audio, close }: { audio: PyroAudio; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [muted, setMuted] = useState(false);
  const [reduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const element = dialog.current!;
    const previousFocus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    const stop = runFireworks(canvas.current!, audio, reduced);
    const timeout = window.setTimeout(close, PYRO_DURATION);
    const hidden = () => {
      if (document.hidden) close();
    };
    document.addEventListener("visibilitychange", hidden);
    return () => {
      stop();
      window.clearTimeout(timeout);
      document.removeEventListener("visibilitychange", hidden);
      element.close();
      document.body.style.overflow = overflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, [audio, close, reduced]);
  return (
    <dialog
      ref={dialog}
      className={`pyro-show ${reduced ? "pyro-reduced" : ""}`}
      aria-label="DURO XXL: fuegos artificiales"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <div className="pyro-atmosphere" aria-hidden="true" />
      <canvas ref={canvas} className="pyro-fireworks" aria-hidden="true" />
      <div className="pyro-logo-scene">
        <div className="pyro-orbit" aria-hidden="true" />
        <span className="pyro-kicker">EASTER EGG DESBLOQUEADO</span>
        <img
          src="/images/duro-xxl-pyro.png"
          width="1774"
          height="887"
          alt="DURO XXL"
          className="pyro-logo"
        />
        <span className="pyro-tagline">QUE ARDA LA PISTA.</span>
      </div>
      <div className="pyro-controls">
        {audio && (
          <button
            type="button"
            aria-label={
              muted ? "Activar sonido" : "Silenciar fuegos artificiales"
            }
            aria-pressed={muted}
            onClick={() => {
              audio.mute(!muted);
              setMuted(!muted);
            }}
          >
            {muted ? <VolumeX size={21} /> : <Volume2 size={21} />}
          </button>
        )}
        <button
          type="button"
          aria-label="Cerrar fuegos artificiales"
          onClick={close}
          autoFocus
        >
          <X size={23} />
        </button>
      </div>
      <div className="pyro-duration" aria-hidden="true">
        <span />
      </div>
    </dialog>
  );
}
