<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";
import { initVision } from "./vision";
import { GestureEngine, type GestureEvent } from "./gestures";
import { TimerController } from "./timer";

const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const steps = [
  "Schritt 1: Zutaten vorbereiten.",
  "Schritt 2: Pfanne erhitzen.",
  "Schritt 3: Anbraten und würzen.",
  "Schritt 4: 10 Minuten köcheln lassen."
];

const step = ref(0);
const toast = ref("");
const timerOpen = ref(false);
const timerLabel = ref("00:00");

// Open palm progress tracking
const palmProgress = ref(0);

// Timer unit selection
const timerUnits = ['Sekunden', 'Minuten', 'Stunden'];
const currentUnit = ref(0); // 0=Sekunden, 1=Minuten, 2=Stunden
const timerValues = ref([0, 10, 0]); // [Stunden, Minuten, Sekunden]

// Timer clock rotation
const timerAngle = ref(0); // Current clock angle in radians
const maxMinutes = 60; // Maximum timer setting in minutes

function showToast(msg: string) {
  toast.value = msg;
  setTimeout(() => (toast.value = ""), 700);
}

function nextStep() {
  step.value = Math.min(step.value + 1, steps.length - 1);
  showToast("Weiter");
}
function prevStep() {
  step.value = Math.max(step.value - 1, 0);
  showToast("Zurück");
}
function toggleTimer(force?: boolean) {
  timerOpen.value = force ?? !timerOpen.value;
}

function adjustTimerValue(direction: number) {
  const unitIndex = [2, 1, 0][currentUnit.value]; // Map to timerValues index
  const maxValues = [23, 59, 59]; // hours, minutes, seconds
  const steps = [1, 1, 5]; // step sizes for each unit
  
  timerValues.value[unitIndex] = Math.max(0, 
    Math.min(maxValues[unitIndex], 
      timerValues.value[unitIndex] + (direction * steps[currentUnit.value])
    )
  );
  
  showToast(`${timerValues.value[unitIndex]} ${timerUnits[currentUnit.value]}`);
}

function handleClockPinch(angle: number) {
  // Set timer angle to pinch position (same as pointing, but with pinch gesture)
  timerAngle.value = angle;
  
  // Convert angle to minutes (full rotation = maxMinutes)
  let normalizedAngle = angle;
  
  // Keep angle in positive range 0 to 2π
  while (normalizedAngle < 0) normalizedAngle += 2 * Math.PI;
  while (normalizedAngle > 2 * Math.PI) normalizedAngle -= 2 * Math.PI;
  
  const minutes = Math.floor((normalizedAngle / (2 * Math.PI)) * maxMinutes);
  
  // Set timer values (convert to hours, minutes, seconds)
  timerValues.value[0] = Math.floor(minutes / 60); // hours
  timerValues.value[1] = minutes % 60; // minutes
  timerValues.value[2] = 0; // seconds
}

function handleClockPointing(angle: number) {
  // Set timer angle directly to where finger is pointing
  timerAngle.value = angle;
  
  // Convert angle to minutes (full rotation = maxMinutes)
  // Direct mapping: finger direction = clock hand direction
  let normalizedAngle = angle;
  
  // Keep angle in positive range 0 to 2π
  while (normalizedAngle < 0) normalizedAngle += 2 * Math.PI;
  while (normalizedAngle > 2 * Math.PI) normalizedAngle -= 2 * Math.PI;
  
  const minutes = Math.floor((normalizedAngle / (2 * Math.PI)) * maxMinutes);
  
  // Set timer values (convert to hours, minutes, seconds)
  timerValues.value[0] = Math.floor(minutes / 60); // hours
  timerValues.value[1] = minutes % 60; // minutes
  timerValues.value[2] = 0; // seconds
  
  // Show current time setting
  if (minutes > 0) {
    const timeStr = minutes >= 60 ? `${Math.floor(minutes/60)}h ${minutes%60}m` : `${minutes}m`;
    showToast(timeStr);
  }
}

function startTimerWithCustomTime() {
  const totalSeconds = timerValues.value[0] * 3600 + timerValues.value[1] * 60 + timerValues.value[2];
  if (totalSeconds > 0) {
    timer.setTime(totalSeconds);
    timer.start();
  }
}

const timer = new TimerController((label) => (timerLabel.value = label));
const engine = new GestureEngine();

let raf = 0;
let vision: Awaited<ReturnType<typeof initVision>> | null = null;

function handleGesture(ev: GestureEvent) {
  // Handle pinch-flick for recipe navigation (only when timer closed)
  if (!timerOpen.value) {
    if (ev.type === "PINCH_FLICK_LEFT") prevStep();
    if (ev.type === "PINCH_FLICK_RIGHT") nextStep();
  }
  
  // Handle timer unit navigation (only when timer open)
  if (timerOpen.value) {
    if (ev.type === "PINCH_CLOCK") {
      handleClockPinch(ev.angle);
    }
    if (ev.type === "POINT_CLOCK") {
      handleClockPointing(ev.angle);
    }
    if (ev.type === "SWIPE_LEFT") {
      currentUnit.value = Math.max(0, currentUnit.value - 1);
      showToast(timerUnits[currentUnit.value]);
    }
    if (ev.type === "SWIPE_RIGHT") {
      currentUnit.value = Math.min(2, currentUnit.value + 1);
      showToast(timerUnits[currentUnit.value]);
    }
    if (ev.type === "SWIPE_UP") {
      adjustTimerValue(1);
    }
    if (ev.type === "SWIPE_DOWN") {
      adjustTimerValue(-1);
    }
  }
  
  if (ev.type === "OPEN_PALM") {
    toggleTimer();
    palmProgress.value = 0; // Reset after activation
  }
  if (ev.type === "OPEN_PALM_PROGRESS") {
    palmProgress.value = ev.progress;
  }
  if (ev.type === "THUMBS_UP") {
    startTimerWithCustomTime();
    showToast("Timer Start");
  }
}

onMounted(async () => {
  if (!videoRef.value || !canvasRef.value) return;
  vision = await initVision(videoRef.value, canvasRef.value);

  const loop = async () => {
    if (!vision) return;
    const result = await vision.detectHands();
    engine.update(result, performance.now(), handleGesture);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
  vision?.stop();
});
</script>

<template>
  <div class="layout">
    <div class="left">
      <h1>Rezept</h1>
      <div class="step">
        <div>Schritt {{ step + 1 }}/{{ steps.length }}</div>
        <div class="stepText">
          {{ steps[step] }}
        </div>
      </div>

      <div class="controls">
        <button @click="prevStep">Zurück</button>
        <button @click="nextStep">Weiter</button>
        <button @click="toggleTimer()">Timer</button>
      </div>
    </div>

    <div class="right">
      <div class="videoWrap">
        <video ref="videoRef" autoplay playsinline muted></video>
        <canvas ref="canvasRef"></canvas>
        
        <!-- Palm progress indicator -->
        <div v-if="palmProgress > 0" class="palmProgress">
          <svg class="palmProgressRing" width="80" height="80">
            <circle 
              cx="40" cy="40" r="32" 
              fill="none" stroke="#374151" stroke-width="6"
            />
            <circle 
              cx="40" cy="40" r="32" 
              fill="none" stroke="#4ade80" stroke-width="6"
              stroke-linecap="round"
              :stroke-dasharray="`${palmProgress * 201} 201`"
              transform="rotate(-90 40 40)"
              class="palmProgressFill"
            />
          </svg>
          <div class="palmProgressText">{{ Math.round(palmProgress * 100) }}%</div>
          <div class="palmProgressLabel">{{ timerOpen ? 'Timer abbrechen' : 'Timer aufrufen' }}</div>
        </div>
      </div>
      <div class="hint">
        Gesten: Greifen & Flick (←/→ Rezept), Offene Hand 3s (Timer ↔), Daumen hoch (Timer Start)
      </div>
    </div>

    <div v-if="toast" class="toast">{{ toast }}</div>

    <div v-if="timerOpen" class="timerOverlay">
      <div class="timerCard">
        <h2>Timer</h2>
        <div class="timerLabel">{{ timerLabel }}</div>
        
        <div class="eggTimerContainer">
          <div class="eggTimer">
            <!-- Clock face -->
            <div class="clockFace">
              <!-- Hour markers -->
              <div v-for="i in 12" :key="i" class="hourMarker" :style="{ transform: `rotate(${i * 30}deg)` }">
                <div class="marker"></div>
              </div>
              
              <!-- Clock hand -->
              <div class="clockHand" :style="{ transform: `rotate(${timerAngle * 180 / Math.PI}deg)` }">
                <div class="handLine"></div>
                <div class="handTip"></div>
              </div>
              
              <!-- Center dot -->
              <div class="centerDot"></div>
            </div>
            
            <!-- Time display -->
            <div class="timeDisplay">
              {{ timerValues[0] > 0 ? `${timerValues[0]}h ` : '' }}{{ timerValues[1] > 0 ? `${timerValues[1]}m` : '' }}
            </div>
            
            <div class="clockInstructions">
              Mit Zeigefinger zeigen oder mit Pinch greifen & verschieben
            </div>
          </div>
        </div>

        <div class="timerRow">
          <button @click="timer.addSeconds(-30)">-30s</button>
          <button @click="timer.addSeconds(30)">+30s</button>
        </div>

        <div class="timerRow">
          <button @click="startTimerWithCustomTime()">Start</button>
          <button @click="timer.pause()">Pause</button>
          <button @click="timer.stop()">Stop</button>
        </div>

        <div class="timerRow">
          <button @click="toggleTimer(false)">Schließen</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.layout { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 16px; }
.left, .right { background: #151822; border-radius: 14px; padding: 16px; color: #e8e8e8; }
.step { background: #0f1220; padding: 14px; border-radius: 12px; min-height: 160px; }
.stepText { margin-top: 10px; }
.controls { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
button { background: #2a2f45; border: 0; color: #fff; padding: 10px 12px; border-radius: 10px; cursor: pointer; }
.videoWrap { position: relative; width: 100%; aspect-ratio: 4/3; background: #000; border-radius: 12px; overflow: hidden; }
video, canvas { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.hint { margin-top: 10px; opacity: .8; font-size: 14px; }
.zoom { margin-top: 10px; opacity: .9; }
.toast { position: fixed; left: 50%; bottom: 18px; transform: translateX(-50%); background: #1f2440; padding: 10px 14px; border-radius: 999px; }
.timerOverlay { position: fixed; inset: 0; display: grid; place-items: center; background: rgba(0,0,0,0.55); }
.timerCard { width: min(420px, 92vw); background: #151822; padding: 16px; border-radius: 14px; }
.timerRow { display: flex; gap: 10px; margin-top: 10px; justify-content: center; }
.timerLabel { font-size: 44px; text-align: center; }

.eggTimerContainer { display: flex; justify-content: center; margin: 20px 0; }
.eggTimer { text-align: center; }

.clockFace { 
  position: relative; width: 200px; height: 200px; 
  border: 4px solid #4ade80; border-radius: 50%; 
  background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
  margin: 0 auto;
}

.hourMarker { 
  position: absolute; top: 10px; left: 50%; width: 2px; height: 20px;
  transform-origin: 50% 90px; background: #6b7280;
}
.marker { width: 100%; height: 100%; background: #6b7280; }

.clockHand { 
  position: absolute; top: 50%; left: 50%; transform-origin: 0 0;
  pointer-events: none; transition: transform 0.1s ease;
}
.handLine { 
  width: 80px; height: 3px; background: #4ade80;
  transform: translateY(-1.5px);
}
.handTip { 
  position: absolute; right: -6px; top: -4.5px;
  width: 12px; height: 12px; border-radius: 50%;
  background: #4ade80;
}

.centerDot { 
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 12px; height: 12px; border-radius: 50%; background: #4ade80;
  z-index: 2;
}

.timeDisplay { 
  margin-top: 15px; font-size: 18px; font-weight: bold; color: #4ade80;
  min-height: 22px;
}

.clockInstructions { 
  margin-top: 10px; font-size: 12px; opacity: 0.7;
}

.palmProgress { position: absolute; top: 20px; right: 20px; width: 120px; height: 100px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.palmProgressRing { position: relative; }
.palmProgressFill { transition: stroke-dasharray 0.1s ease; }
.palmProgressText { 
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  color: #4ade80; font-size: 14px; font-weight: bold; z-index: 1;
}
.palmProgressLabel { 
  margin-top: 8px; color: #e8e8e8; font-size: 12px; text-align: center; 
  background: rgba(0,0,0,0.7); padding: 4px 8px; border-radius: 6px;
}
</style>
