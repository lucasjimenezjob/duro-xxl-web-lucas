export const PYRO_DURATION = 7800;
export const TAP_WINDOW = 1200;

export interface TapSequence {
  count: number;
  started: number;
}

export function registerPyroTap(previous: TapSequence, now: number) {
  const count = now - previous.started > TAP_WINDOW ? 1 : previous.count + 1;
  const triggered = count === 3;
  return {
    sequence: {
      count: triggered ? 0 : count,
      started: count === 1 ? now : previous.started,
    },
    triggered,
  };
}

// Synthetic whistles, low booms and crackles: no downloads or audio loops.
export function createPyroAudio() {
  let context: AudioContext | undefined;
  try {
    const Audio =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Audio) return null;
    context = new Audio();
    // Called synchronously on the third tap, inside the browser's user gesture.
    void context.resume().catch(() => {});
    const ctx = context;
    const master = ctx.createGain();
    master.gain.value = 0.32;
    const compressor = ctx.createDynamicsCompressor();
    master.connect(compressor);
    compressor.connect(ctx.destination);
    const noise = ctx.createBuffer(1, ctx.sampleRate * 1.4, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    function whistle() {
      if (ctx.state !== "running") return;
      const time = ctx.currentTime;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(480, time);
      oscillator.frequency.exponentialRampToValueAtTime(1700, time + 0.5);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.06, time + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(time);
      oscillator.stop(time + 0.62);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    }

    function boom(power = 1) {
      if (ctx.state !== "running") return;
      const time = ctx.currentTime;
      const bass = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bass.frequency.setValueAtTime(105, time);
      bass.frequency.exponentialRampToValueAtTime(30, time + 0.7);
      bassGain.gain.setValueAtTime(0.001, time);
      bassGain.gain.linearRampToValueAtTime(0.55 * power, time + 0.015);
      bassGain.gain.exponentialRampToValueAtTime(0.001, time + 1.1);
      bass.connect(bassGain);
      bassGain.connect(master);
      bass.start(time);
      bass.stop(time + 1.15);
      bass.onended = () => {
        bass.disconnect();
        bassGain.disconnect();
      };

      const burst = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      burst.buffer = noise;
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(5200, time);
      filter.frequency.exponentialRampToValueAtTime(650, time + 1.2);
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.48 * power, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 1.3);
      burst.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      burst.start(time);
      burst.stop(time + 1.35);
      burst.onended = () => {
        burst.disconnect();
        filter.disconnect();
        gain.disconnect();
      };
    }
    return {
      whistle,
      boom,
      mute(value: boolean) {
        if (ctx.state === "closed") return;
        master.gain.setTargetAtTime(value ? 0 : 0.32, ctx.currentTime, 0.03);
      },
      stop() {
        if (ctx.state !== "closed") void ctx.close().catch(() => {});
      },
    };
  } catch {
    if (context && context.state !== "closed")
      void context.close().catch(() => {});
    return null;
  }
}

export type PyroAudio = ReturnType<typeof createPyroAudio>;

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  color: string;
  size: number;
}
interface Rocket {
  x: number;
  y: number;
  target: number;
  born: number;
  color: string;
}

export function runFireworks(
  canvas: HTMLCanvasElement,
  audio: PyroAudio,
  reduced: boolean,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  let width = 0,
    height = 0,
    frame = 0;
  const colors = ["#d4f448", "#fbd89a", "#00d7ed", "#c078ff", "#fff4da"];
  const sparks: Spark[] = [];
  const rockets: Rocket[] = [];
  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.75);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };
  resize();
  window.addEventListener("resize", resize);
  const start = performance.now();
  let previous = start,
    nextLaunch = 150,
    launches = 0;
  const burst = (rocket: Rocket) => {
    audio?.boom(launches > 7 ? 1 : 0.8);
    const count = width < 600 ? 72 : 110;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = (45 + Math.random() * 115) * (width < 600 ? 0.85 : 1.3);
      sparks.push({
        x: rocket.x,
        y: rocket.target,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        age: 0,
        life: 1.3 + Math.random() * 1.1,
        color: rocket.color,
        size: Math.random() > 0.85 ? 2.4 : 1.4,
      });
    }
  };
  if (reduced) {
    // A still starfield and logo for people who request less motion.
    for (let i = 0; i < 65; i++) {
      ctx.fillStyle = colors[i % colors.length];
      ctx.globalAlpha = 0.25 + Math.random() * 0.5;
      ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
    }
    ctx.globalAlpha = 1;
    audio?.boom(0.6);
  } else {
    const draw = (now: number) => {
      const elapsed = now - start;
      const dt = Math.min((now - previous) / 1000, 0.035);
      previous = now;
      ctx.clearRect(0, 0, width, height);
      if (elapsed >= nextLaunch && elapsed < 5700) {
        const color = colors[launches % colors.length];
        rockets.push({
          x: width * (0.12 + Math.random() * 0.76),
          y: height + 15,
          target: height * (0.12 + Math.random() * 0.46),
          born: elapsed,
          color,
        });
        audio?.whistle();
        launches++;
        nextLaunch = elapsed + (elapsed > 4100 ? 180 : 530);
      }
      ctx.lineCap = "round";
      for (let i = rockets.length - 1; i >= 0; i--) {
        const rocket = rockets[i];
        const progress = Math.min((elapsed - rocket.born) / 650, 1);
        rocket.y =
          height +
          15 +
          (rocket.target - height - 15) * (1 - (1 - progress) ** 2);
        ctx.strokeStyle = rocket.color;
        ctx.globalAlpha = 0.75;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(rocket.x, rocket.y + 32);
        ctx.lineTo(rocket.x, rocket.y);
        ctx.stroke();
        if (progress >= 1) {
          burst(rocket);
          rockets.splice(i, 1);
        }
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const spark = sparks[i];
        spark.age += dt;
        if (spark.age >= spark.life) {
          sparks.splice(i, 1);
          continue;
        }
        const x = spark.x,
          y = spark.y;
        spark.vx *= Math.exp(-0.55 * dt);
        spark.vy += 46 * dt;
        spark.x += spark.vx * dt;
        spark.y += spark.vy * dt;
        ctx.globalAlpha = (1 - spark.age / spark.life) ** 1.3;
        ctx.strokeStyle = spark.color;
        ctx.lineWidth = spark.size;
        ctx.beginPath();
        ctx.moveTo(x - spark.vx * 0.025, y - spark.vy * 0.025);
        ctx.lineTo(spark.x, spark.y);
        ctx.stroke();
        ctx.fillStyle = "#fff9de";
        ctx.fillRect(spark.x - 0.5, spark.y - 0.5, 1, 1);
      }
      ctx.globalAlpha = 1;
      if (elapsed < PYRO_DURATION) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
  }
  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("resize", resize);
  };
}
