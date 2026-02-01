import type { HandLandmarkerResult, NormalizedLandmark } from "@mediapipe/tasks-vision";

export type GestureEvent =
  | { type: "SWIPE_LEFT" }
  | { type: "SWIPE_RIGHT" }
  | { type: "SWIPE_UP" }
  | { type: "SWIPE_DOWN" }
  | { type: "PINCH_FLICK_LEFT" }
  | { type: "PINCH_FLICK_RIGHT" }
  | { type: "OPEN_PALM" }
  | { type: "OPEN_PALM_PROGRESS"; progress: number }
  | { type: "THUMBS_UP_PROGRESS"; progress: number }
  | { type: "THUMBS_UP_HOLD" }
  | { type: "PINCH_SWIPE_PROGRESS"; deltaX: number; deltaY: number; x: number }
  | { type: "THUMBS_UP" }
  | { type: "FIST" }
  | { type: "FIST_PROGRESS"; progress: number };

export class GestureEngine {
  // Pinch-swipe tracking
  private pinchActive = false;
  private pinchStartX: number | null = null;
  private pinchStartY: number | null = null;
  private pinchStartT: number | null = null;
  private pinchLastX: number | null = null;
  private pinchLastY: number | null = null;
  private pinchSwipeCooldown = 0;

  private poseCooldown = 0;
  
  // Open palm hold tracking
  private openPalmStartTime: number | null = null;
  private openPalmTriggered = false;
  private openPalmDelayPassed = false;

  // Thumbs-up hold tracking
  private thumbsUpStartTime: number | null = null;
  private thumbsUpTriggered = false;

  // Fist hold tracking
  private fistStartTime: number | null = null;
  private fistTriggered = false;

  update(
    result: HandLandmarkerResult | null,
    t: number,
    emit: (e: GestureEvent) => void
  ) {
    if (!result?.landmarks?.length) {
      // Reset palm progress when no hands detected
      if (this.openPalmStartTime !== null) {
        emit({ type: "OPEN_PALM_PROGRESS", progress: 0 });
      }
      this.openPalmStartTime = null;
      this.openPalmTriggered = false;
      this.openPalmDelayPassed = false;
      
      // Reset fist tracking
      if (this.fistStartTime !== null) {
        emit({ type: "FIST_PROGRESS", progress: 0 });
      }
      this.fistStartTime = null;
      this.fistTriggered = false;
      return;
    }

    const lm = result.landmarks[0];
    if (!lm || lm.length < 21) return;

    // Calculate center and pinch early for all detections
    const pinch = dist(lm[4]!, lm[8]!);
    const center = handCenter(lm);
    // More strict pinch detection: thumb and index finger must actually touch (< 0.03)
    // This prevents accidental pinch recognition
    const isPinching = pinch < 0.03;

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
      
      // Thumbs-up with hold progress
      if (isThumbsUp(lm)) {
        if (this.thumbsUpStartTime === null) {
          this.thumbsUpStartTime = t;
          // Also emit immediate thumbs-up once for quick actions
          emit({ type: "THUMBS_UP" });
        }
        const holdDuration = t - this.thumbsUpStartTime;
        const requiredDuration = 3000; // 3 seconds
        if (holdDuration < requiredDuration && !this.thumbsUpTriggered) {
          const progress = holdDuration / requiredDuration;
          emit({ type: "THUMBS_UP_PROGRESS", progress });
        }
        if (holdDuration >= requiredDuration && !this.thumbsUpTriggered) {
          emit({ type: "THUMBS_UP_HOLD" });
          this.thumbsUpTriggered = true;
          this.poseCooldown = t + 900;
        }
      } else {
        // Reset thumbs-up tracking when pose changes
        if (this.thumbsUpStartTime !== null) {
          emit({ type: "THUMBS_UP_PROGRESS", progress: 0 });
        }
        this.thumbsUpStartTime = null;
        this.thumbsUpTriggered = false;
      }
      
      // Fist with hold progress (for canceling/exiting)
      if (isFist(lm)) {
        if (this.fistStartTime === null) {
          this.fistStartTime = t;
        }
        const holdDuration = t - this.fistStartTime;
        const requiredDuration = 5000; // 5 seconds
        if (holdDuration < requiredDuration && !this.fistTriggered) {
          const progress = holdDuration / requiredDuration;
          emit({ type: "FIST_PROGRESS", progress });
        }
        if (holdDuration >= requiredDuration && !this.fistTriggered) {
          emit({ type: "FIST" });
          this.fistTriggered = true;
          this.poseCooldown = t + 900;
        }
      } else {
        // Reset fist tracking when pose changes
        if (this.fistStartTime !== null) {
          emit({ type: "FIST_PROGRESS", progress: 0 });
        }
        this.fistStartTime = null;
        this.fistTriggered = false;
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
          
          // Send progress feedback with absolute position
          emit({ type: "PINCH_SWIPE_PROGRESS", deltaX: dx, deltaY: dy, x: center.x });
        }
      }
      
    } else {
      // Pinch released - check if swipe should be triggered
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
        const resetX = this.pinchLastX ?? this.pinchStartX ?? 0;
        emit({ type: "PINCH_SWIPE_PROGRESS", deltaX: 0, deltaY: 0, x: resetX });
      }
      
      // Reset pinch tracking
      this.pinchActive = false;
      this.pinchStartX = null;
      this.pinchStartY = null;
      this.pinchStartT = null;
      this.pinchLastX = null;
      this.pinchLastY = null;
    }

  }
}

function handCenter(lm: NormalizedLandmark[]) {
  return { x: (lm[0]!.x + lm[9]!.x) / 2, y: (lm[0]!.y + lm[9]!.y) / 2 };
}

function dist(a: NormalizedLandmark, b: NormalizedLandmark) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function isOpenPalm(lm: NormalizedLandmark[]) {
  const w = lm[0]!;
  let extended = 0;
  const pairs = [
    [4, 2],
    [8, 5],
    [12, 9],
    [16, 13],
    [20, 17]
  ] as const;
  for (const [tipIndex, baseIndex] of pairs) {
    const tip = lm[tipIndex]!;
    const base = lm[baseIndex]!;
    if (dist(tip, w) > dist(base, w) * 1.15) extended++;
  }
  return extended >= 4;
}

function isThumbsUp(lm: NormalizedLandmark[]) {
  const wrist = lm[0]!;
  const thumbTip = lm[4]!;
  
  // Thumb must be extended (far from wrist)
  const thumbDistance = dist(thumbTip, wrist);
  
  // Get other finger tips
  const indexTip = lm[8]!;
  const middleTip = lm[12]!;
  const ringTip = lm[16]!;
  const pinkyTip = lm[20]!;
  
  const indexDistance = dist(indexTip, wrist);
  const middleDistance = dist(middleTip, wrist);
  const ringDistance = dist(ringTip, wrist);
  const pinkyDistance = dist(pinkyTip, wrist);
  
  // In thumbs-up, the thumb should be the most extended
  // Other fingers should NOT be extended as far as the thumb
  // They should be shorter (closer to wrist) than the thumb
  const indexFolded = indexDistance < thumbDistance * 0.7;
  const middleFolded = middleDistance < thumbDistance * 0.7;
  const ringFolded = ringDistance < thumbDistance * 0.7;
  const pinkyFolded = pinkyDistance < thumbDistance * 0.7;
  
  // Count folded fingers - at least 2 of 4 must be folded
  const foldedCount = [indexFolded, middleFolded, ringFolded, pinkyFolded].filter(Boolean).length;
  
  // Thumb must be extended at least 0.3 (absolute minimum distance)
  const thumbSufficientlyExtended = thumbDistance > 0.3;
  
  return thumbSufficientlyExtended && foldedCount >= 2;
}

function isFist(lm: NormalizedLandmark[]) {
  const wrist = lm[0]!;
  
  // All fingers should be folded (tips closer to wrist than bases)
  let foldedCount = 0;
  const pairs = [
    [4, 2],
    [8, 5],
    [12, 9],
    [16, 13],
    [20, 17]
  ] as const;
  for (const [tipIndex, baseIndex] of pairs) {
    const tip = lm[tipIndex]!;
    const base = lm[baseIndex]!;
    if (dist(tip, wrist) < dist(base, wrist) * 0.85) {
      foldedCount++;
    }
  }
  
  // All 5 fingers should be folded for a proper fist
  return foldedCount >= 4;
}
