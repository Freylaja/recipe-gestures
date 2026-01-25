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
  | { type: "PINCH_SWIPE_PROGRESS"; deltaX: number; deltaY: number }
  | { type: "THUMBS_UP" };

export class GestureEngine {
  private lastX: number | null = null;
  private lastY: number | null = null;
  private lastT: number | null = null;
  private swipeCooldown = 0;
  
  // Swipe tracking
  private swipeStartX: number | null = null;
  private swipeStartY: number | null = null;
  private swipeStartT: number | null = null;
  
  // Pinch-swipe tracking
  private pinchActive = false;
  private pinchStartX: number | null = null;
  private pinchStartY: number | null = null;
  private pinchStartT: number | null = null;
  private pinchLastX: number | null = null;
  private pinchLastY: number | null = null;
  private pinchSwipeCooldown = 0;
  
  // Pinch-clock tracking for egg timer
  private pinchClockActive = false;
  private clockCenterX = 0.5;
  private clockCenterY = 0.5;

  private poseCooldown = 0;
  
  // Open palm hold tracking
  private openPalmStartTime: number | null = null;
  private openPalmTriggered = false;
  private openPalmDelayPassed = false;

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
      this.openPalmDelayPassed = false;
      return;
    }

    const lm = result.landmarks[0];

    // Calculate center and pinch early for all detections
    const pinch = dist(lm[4], lm[8]);
    const center = handCenter(lm);
    const isPinching = pinch < 0.055;

    // Open palm detection - only if NOT pinching
    if (t > this.poseCooldown && !isPinching) {
      if (isOpenPalm(lm)) {
        // Start tracking open palm hold time
        if (this.openPalmStartTime === null) {
          this.openPalmStartTime = t;
          this.openPalmDelayPassed = false;
        }
        
        const holdDuration = t - this.openPalmStartTime;
        const delayDuration = 500; // 500ms delay before countdown starts
        const requiredDuration = 3000; // 3 seconds
        
        // Check if initial delay has passed
        if (holdDuration >= delayDuration && !this.openPalmDelayPassed) {
          this.openPalmDelayPassed = true;
        }
        
        // Only show countdown after delay has passed
        if (this.openPalmDelayPassed && holdDuration < requiredDuration && !this.openPalmTriggered) {
          // Progress based on time after delay
          const progressTime = holdDuration - delayDuration;
          const progress = progressTime / (requiredDuration - delayDuration);
          emit({ type: "OPEN_PALM_PROGRESS", progress });
        }
        
        // Check if held for 3 seconds total and not already triggered
        if (holdDuration >= requiredDuration && !this.openPalmTriggered) {
          emit({ type: "OPEN_PALM" });
          this.openPalmTriggered = true;
          this.poseCooldown = t + 900;
        }
      } else {
        // Reset open palm tracking if hand changes
        this.openPalmStartTime = null;
        this.openPalmTriggered = false;
        this.openPalmDelayPassed = false;
        // Send reset progress
        emit({ type: "OPEN_PALM_PROGRESS", progress: 0 });
      }
      
      if (isThumbsUp(lm)) {
        emit({ type: "THUMBS_UP" });
        this.poseCooldown = t + 900;
        return;
      }
    }
    
    // Reset open palm tracking when pinching
    if (isPinching && this.openPalmStartTime !== null) {
      this.openPalmStartTime = null;
      this.openPalmTriggered = false;
      this.openPalmDelayPassed = false;
      emit({ type: "OPEN_PALM_PROGRESS", progress: 0 });
    }
    
    // Check for pinch - allow swipe tracking everywhere
    if (isPinching) {
      const distanceFromClockCenter = Math.hypot(center.x - this.clockCenterX, center.y - this.clockCenterY);
      
      // Track pinch-swipe movement everywhere
      if (t > this.pinchSwipeCooldown) {
        if (!this.pinchActive) {
          this.pinchActive = true;
          this.pinchStartX = center.x;
          this.pinchStartY = center.y;
          this.pinchStartT = t;
        } else {
          // Track pinch movement for feedback and swipe detection
          const dx = center.x - this.pinchStartX!;
          const dy = center.y - this.pinchStartY!;
          
          // Save current position for release detection
          this.pinchLastX = center.x;
          this.pinchLastY = center.y;
          
          // Send progress feedback
          emit({ type: "PINCH_SWIPE_PROGRESS", deltaX: dx, deltaY: dy });
        }
      }
      
      // Also emit clock control if in clock area (for timer when open)
      if (distanceFromClockCenter < 0.35) {
        this.pinchClockActive = true;
        const clockAngle = Math.atan2(center.y - this.clockCenterY, center.x - this.clockCenterX);
        emit({ type: "PINCH_CLOCK", angle: clockAngle });
      }
    } else {
      // Pinch released - check if swipe should be triggered
      if (this.pinchClockActive) {
        this.pinchClockActive = false;
      }
      
      // Check for swipe on release
      if (this.pinchActive && this.pinchStartX !== null && this.pinchStartY !== null && this.pinchStartT !== null && this.pinchLastX !== null && this.pinchLastY !== null) {
        const dx = this.pinchLastX - this.pinchStartX;
        const dy = this.pinchLastY - this.pinchStartY;
        const dt = (t - this.pinchStartT) / 1000;
        
        // Detect swipe if movement was significant
        if (dt > 0.08 && dt < 1.5) {
          // Horizontal swipes - trigger on release (entspannte Bedingungen)
          if (Math.abs(dx) > 0.06) {
            emit({ type: dx > 0 ? "PINCH_FLICK_RIGHT" : "PINCH_FLICK_LEFT" });
            this.pinchSwipeCooldown = t + 600;
          }
          // Vertical swipes  
          else if (Math.abs(dy) > 0.06) {
            emit({ type: dy > 0 ? "SWIPE_DOWN" : "SWIPE_UP" });
            this.pinchSwipeCooldown = t + 600;
          }
        }
        
        // Reset progress
        emit({ type: "PINCH_SWIPE_PROGRESS", deltaX: 0, deltaY: 0 });
      }
      
      // Reset pinch tracking
      this.pinchActive = false;
      this.pinchStartX = null;
      this.pinchStartY = null;
      this.pinchStartT = null;
      this.pinchLastX = null;
      this.pinchLastY = null;
    }

    // Check for pointing finger to set clock directly
    if (isPointing(lm)) {
      const fingerTip = lm[8]; // Index finger tip
      const clockAngle = Math.atan2(fingerTip.y - this.centerY, fingerTip.x - this.centerX);
      emit({ type: "POINT_CLOCK", angle: clockAngle });
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
