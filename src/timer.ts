export class TimerController {
  private seconds = 0;
  private running = false;
  private paused = false;
  private last = 0;
  private raf: number | null = null;
  public hasFinished = false;
  private onUpdate: (s: string) => void;

  constructor(onUpdate: (s: string) => void) {
    this.onUpdate = onUpdate;
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

// Multiple timer management
export interface RunningTimer {
  id: number
  label: string
  remaining: string
  hasFinished: boolean
  controller: TimerController
}

export class MultiTimerManager {
  private timers: Map<number, RunningTimer> = new Map()
  private nextId = 1
  private onUpdate: () => void;
  
  constructor(onUpdate: () => void) {
    this.onUpdate = onUpdate;
  }

  createTimer(totalSeconds: number, label?: string): number {
    const id = this.nextId++
    const timer: RunningTimer = {
      id,
      label: label || `Timer ${id}`,
      remaining: '00:00',
      hasFinished: false,
      controller: new TimerController((timeString) => {
        const existing = this.timers.get(id)
        if (existing) {
          existing.remaining = timeString
          existing.hasFinished = existing.controller.hasFinished
          this.onUpdate()
        }
      })
    }
    
    timer.controller.setTime(totalSeconds)
    timer.controller.start()
    this.timers.set(id, timer)
    this.onUpdate()
    return id
  }

  removeTimer(id: number) {
    const timer = this.timers.get(id)
    if (timer) {
      timer.controller.stop()
      this.timers.delete(id)
      this.onUpdate()
    }
  }

  getActiveTimers(): RunningTimer[] {
    return Array.from(this.timers.values())
  }

  clearAllTimers() {
    this.timers.forEach(timer => timer.controller.stop())
    this.timers.clear()
    this.onUpdate()
  }
}
