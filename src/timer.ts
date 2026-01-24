export class TimerController {
  private seconds = 0;
  private running = false;
  private last = 0;
  private raf: number | null = null;

  constructor(private onUpdate: (s: string) => void) {
    this.emit();
  }

  addSeconds(d: number) {
    this.seconds = Math.max(0, this.seconds + d);
    this.emit();
  }

  setTime(totalSeconds: number) {
    this.seconds = totalSeconds;
    this.emit();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.loop();
  }

  pause() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
  }

  stop() {
    this.pause();
    this.seconds = 0;
    this.emit();
  }

  private loop = () => {
    if (!this.running) return;
    const now = performance.now();
    const dt = (now - this.last) / 1000;
    this.last = now;

    if (this.seconds > 0) {
      this.seconds = Math.max(0, this.seconds - dt);
      if (this.seconds === 0) alert("Timer fertig!");
    }
    this.emit();
    this.raf = requestAnimationFrame(this.loop);
  };

  private emit() {
    const s = Math.floor(this.seconds);
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    this.onUpdate(`${mm}:${ss}`);
  }
}
