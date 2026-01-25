export class TimerController {
  private seconds = 0;
  private running = false;
  private paused = false;
  private last = 0;
  private raf: number | null = null;
  public hasFinished = false;

  constructor(private onUpdate: (s: string) => void) {
    this.emit();
  }

  get isRunning() {
    return this.running;
  }

  get isPaused() {
    return this.paused;
  }

  addSeconds(d: number) {
    this.seconds = Math.max(0, this.seconds + d);
    this.emit();
  }

  setTime(totalSeconds: number) {
    this.seconds = totalSeconds;
    this.hasFinished = false;
    this.emit();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    this.hasFinished = false;
    this.last = performance.now();
    this.loop();
  }

  pause() {
    if (!this.running) return;
    this.running = false;
    this.paused = true;
    if (this.raf) cancelAnimationFrame(this.raf);
  }

  stop() {
    this.running = false;
    this.paused = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.seconds = 0;
    this.hasFinished = false;
    this.emit();
  }

  private loop = () => {
    if (!this.running) return;
    const now = performance.now();
    const dt = (now - this.last) / 1000;
    this.last = now;

    if (this.seconds > 0) {
      this.seconds = Math.max(0, this.seconds - dt);
      if (this.seconds === 0) {
        this.running = false;
        this.hasFinished = true;
      }
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
