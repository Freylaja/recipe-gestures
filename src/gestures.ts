import type { HandLandmarkerResult, NormalizedLandmark } from "@mediapipe/tasks-vision";

export type GestureEvent =
  | { type: "SWIPE_LEFT" }
  | { type: "SWIPE_RIGHT" }
  | { type: "SWIPE_UP" }
  | { type: "SWIPE_DOWN" }
  | { type: "PINCH_FLICK_LEFT" }
  | { type: "PINCH_FLICK_RIGHT" }
  | { type: "ROTATE"; angle: number; deltaAngle: number }
  | { type: "POINT_CLOCK"; angle: number }
  | { type: "OPEN_PALM" }
  | { type: "OPEN_PALM_PROGRESS"; progress: number }
  | { type: "THUMBS_UP" };

export class GestureEngine {
  private lastX: number | null = null;
  private lastY: number | null = null;
  private lastT: number | null = null;
  private swipeCooldown = 0;
  
  // Pinch-flick tracking
  private pinchFlickActive = false;
  private pinchFlickStartX: number | null = null;
  private pinchFlickCooldown = 0;
  
  // Pinch-clock tracking for egg timer
  private pinchClockActive = false;
  private clockCenterX = 0.5;
  private clockCenterY = 0.5;

  private poseCooldown = 0;
  
  // Open palm hold tracking
  private openPalmStartTime: number | null = null;
  private openPalmTriggered = false;

  update(
    result: HandLandmarkerResult | null,
    t: number,
    emit: (e: GestureEvent) => void
  ) {
    if (!result?.landmarks?.length) {
      this.lastX = this.lastY = this.lastT = null;
      this.pinchFlickActive = false;
      this.pinchFlickStartX = null;
      
      // Reset palm progress when no hands detected
      if (this.openPalmStartTime !== null) {
        emit({ type: "OPEN_PALM_PROGRESS", progress: 0 });
      }
      this.openPalmStartTime = null;
      this.openPalmTriggered = false;
      return;
    }

    const lm = result.landmarks[0];

    // Calculate center and pinch early for all detections
    const pinch = dist(lm[4], lm[8]);
    const center = handCenter(lm);

    if (t > this.poseCooldown) {
      if (isOpenPalm(lm)) {
        // Start tracking open palm hold time
        if (this.openPalmStartTime === null) {
          this.openPalmStartTime = t;
        }
        
        const holdDuration = t - this.openPalmStartTime;
        const requiredDuration = 3000; // 3 seconds
        
        if (holdDuration < requiredDuration && !this.openPalmTriggered) {
          // Send progress updates every ~100ms
          const progress = holdDuration / requiredDuration;
          emit({ type: "OPEN_PALM_PROGRESS", progress });
        }
        
        // Check if held for 3 seconds and not already triggered
        if (holdDuration >= requiredDuration && !this.openPalmTriggered) {
          emit({ type: "OPEN_PALM" });
          this.openPalmTriggered = true;
          this.poseCooldown = t + 900;
        }
      } else {
        // Reset open palm tracking if hand changes
        this.openPalmStartTime = null;
        this.openPalmTriggered = false;
        // Send reset progress
        emit({ type: "OPEN_PALM_PROGRESS", progress: 0 });
      }
      
      if (isThumbsUp(lm)) {
        emit({ type: "THUMBS_UP" });
        this.poseCooldown = t + 900;
        return;
      }
    }
    
    // Check for pinch and determine if it should control clock
    if (pinch < 0.055) {
      const distanceFromClockCenter = Math.hypot(center.x - this.clockCenterX, center.y - this.clockCenterY);
      // Activate clock control if pinch is near clock area (within 0.35 normalized distance)
      if (distanceFromClockCenter < 0.35) {
        this.pinchClockActive = true;
        const clockAngle = Math.atan2(center.y - this.clockCenterY, center.x - this.clockCenterX);
        emit({ type: "PINCH_CLOCK", angle: clockAngle });
      } else if (!this.pinchClockActive && t > this.pinchFlickCooldown) {
        // Start pinch-flick only if not in clock area
        this.pinchFlickActive = true;
        this.pinchFlickStartX = center.x;
      }
    } else if (this.pinchClockActive) {
      // Pinch released, deactivate clock control
      this.pinchClockActive = false;
    } else if (this.pinchFlickActive && pinch > 0.08) {
      // End pinch-flick - check movement and decide
      if (this.pinchFlickStartX !== null) {
        const deltaX = center.x - this.pinchFlickStartX;
        const threshold = 0.08; // Smaller threshold for quick flick
        
        if (deltaX > threshold) {
          emit({ type: "PINCH_FLICK_RIGHT" });
          this.pinchFlickCooldown = t + 600;
        } else if (deltaX < -threshold) {
          emit({ type: "PINCH_FLICK_LEFT" });
          this.pinchFlickCooldown = t + 600;
        }
      }
      
      this.pinchFlickActive = false;
      this.pinchFlickStartX = null;
    }

    // Check for pointing finger to set clock directly
    if (isPointing(lm)) {
      const fingerTip = lm[8]; // Index finger tip
      const clockAngle = Math.atan2(fingerTip.y - this.centerY, fingerTip.x - this.centerX);
      emit({ type: "POINT_CLOCK", angle: clockAngle });
    }

    // Keep regular position tracking and add swipe detection
    if (this.lastX === null || this.lastY === null || this.lastT === null) {
      this.lastX = center.x;
      this.lastY = center.y;
      this.lastT = t;
      return;
    }

    // Add swipe detection 
    if (t > this.swipeCooldown) {
      const dx = center.x - this.lastX;
      const dy = center.y - this.lastY;
      const dt = (t - this.lastT) / 1000;
      
      // Horizontal swipes
      if (Math.abs(dx) > 0.12 && Math.abs(dx / dt) > 0.9 && Math.abs(dx) > Math.abs(dy)) {
        emit({ type: dx > 0 ? "SWIPE_RIGHT" : "SWIPE_LEFT" });
        this.swipeCooldown = t + 650;
      }
      // Vertical swipes  
      else if (Math.abs(dy) > 0.12 && Math.abs(dy / dt) > 0.9 && Math.abs(dy) > Math.abs(dx)) {
        emit({ type: dy > 0 ? "SWIPE_DOWN" : "SWIPE_UP" });
        this.swipeCooldown = t + 650;
      }
    }

    this.lastX = center.x;
    this.lastY = center.y;
    this.lastT = t;
  }
}

function handCenter(lm: NormalizedLandmark[]) {
  return { x: (lm[0].x + lm[9].x) / 2, y: (lm[0].y + lm[9].y) / 2 };
}

function dist(a: NormalizedLandmark, b: NormalizedLandmark) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function isOpenPalm(lm: NormalizedLandmark[]) {
  const w = lm[0];
  const tips = [4, 8, 12, 16, 20];
  const bases = [2, 5, 9, 13, 17];
  let extended = 0;
  for (let i = 0; i < tips.length; i++) {
    if (dist(lm[tips[i]], w) > dist(lm[bases[i]], w) * 1.15) extended++;
  }
  return extended >= 4;
}

function isPointing(lm: NormalizedLandmark[]) {
  const wrist = lm[0];
  const indexTip = lm[8];
  const indexMcp = lm[5]; // index finger base
  const middleTip = lm[12];
  const ringTip = lm[16];
  const pinkyTip = lm[20];
  const thumbTip = lm[4];
  
  // Index finger should be extended (tip further from wrist than base)
  const indexExtended = dist(indexTip, wrist) > dist(indexMcp, wrist) * 1.15;
  
  // Other fingers should be folded (tips closer to wrist than index finger)
  const othersFolded = [
    dist(middleTip, wrist) < dist(indexTip, wrist) * 0.85,
    dist(ringTip, wrist) < dist(indexTip, wrist) * 0.85,
    dist(pinkyTip, wrist) < dist(indexTip, wrist) * 0.85,
    dist(thumbTip, wrist) < dist(indexTip, wrist) * 0.9
  ].filter(Boolean).length >= 3;
  
  return indexExtended && othersFolded;
}

function isThumbsUp(lm: NormalizedLandmark[]) {
  const w = lm[0];
  const thumbUp = dist(lm[4], w) > dist(lm[2], w) * 1.2;
  const othersFolded = [8, 12, 16, 20].every(
    i => dist(lm[i], w) < dist(lm[i - 3], w) * 1.05
  );
  return thumbUp && othersFolded;
}
