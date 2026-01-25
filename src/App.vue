<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";
import { initVision } from "./vision";
import { GestureEngine, type GestureEvent } from "./gestures";
import { TimerController } from "./timer";
import { loadObjectDetectionModel, detectObjects } from "./objectDetection";

const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

// Ingredients list - based on recipe, only some are auto-detectable
const ingredients = ref([
  { name: "Äpfel", checked: false, detectClass: "apple" },
  { name: "Mehl", checked: false, detectClass: null },
  { name: "Zucker", checked: false, detectClass: null },
  { name: "Eier", checked: false, detectClass: null },
  { name: "Öl", checked: false, detectClass: "bottle" },
  { name: "Backpulver", checked: false, detectClass: null },
  { name: "Zimt", checked: false, detectClass: null },
  { name: "Puderzucker", checked: false, detectClass: null }
]);

// Detected objects
const detectedObjects = ref<string[]>([]);
// Visual detection hint
const recognitionHint = ref("");
const recognitionSuccess = ref(false);
// Thumb hold to confirm all ingredients
const thumbHoldProgress = ref(0);

// Mode: 'ingredients' or 'recipe'
const mode = ref<'ingredients' | 'recipe'>('ingredients');

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

// Pinch swipe progress tracking
const pinchSwipeDeltaX = ref(0);
const pinchSwipeDeltaY = ref(0);

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

function checkNextIngredient() {
  const uncheckedIndex = ingredients.value.findIndex(ing => !ing.checked);
  if (uncheckedIndex !== -1) {
    ingredients.value[uncheckedIndex].checked = true;
    showToast(`✓ ${ingredients.value[uncheckedIndex].name}`);
    
    // Check if all ingredients are checked
    if (ingredients.value.every(ing => ing.checked)) {
      setTimeout(() => {
        mode.value = 'recipe';
        showToast("Alle Zutaten da! Los geht's!");
      }, 800);
    }
  }
}

function uncheckLastIngredient() {
  const checkedIndex = ingredients.value.findIndex(ing => ing.checked);
  if (checkedIndex !== -1) {
    // Find last checked
    let lastChecked = -1;
    for (let i = ingredients.value.length - 1; i >= 0; i--) {
      if (ingredients.value[i].checked) {
        lastChecked = i;
        break;
      }
    }
    if (lastChecked !== -1) {
      ingredients.value[lastChecked].checked = false;
      showToast(`✗ ${ingredients.value[lastChecked].name}`);
    }
  }
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
let objectDetectionRaf = 0;
let vision: Awaited<ReturnType<typeof initVision>> | null = null;
let objectDetectionModel: any = null;

function handleGesture(ev: GestureEvent) {
  // Ingredients mode - check items with thumbs up or auto-detect
  if (mode.value === 'ingredients') {
    if (ev.type === "THUMBS_UP_PROGRESS") {
      thumbHoldProgress.value = ev.progress;
    }
    if (ev.type === "THUMBS_UP_HOLD") {
      // Confirm all ingredients present
      ingredients.value = ingredients.value.map(i => ({ ...i, checked: true }));
      showToast("Alle Zutaten bestätigt!");
      setTimeout(() => { mode.value = 'recipe'; }, 800);
    }
    if (ev.type === "PINCH_FLICK_LEFT") {
      uncheckLastIngredient();
    }
    return; // Don't handle other gestures in ingredients mode
  }
  
  // Recipe mode
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
  if (ev.type === "PINCH_SWIPE_PROGRESS") {
    pinchSwipeDeltaX.value = ev.deltaX;
    pinchSwipeDeltaY.value = ev.deltaY;
  }
  if (ev.type === "THUMBS_UP") {
    startTimerWithCustomTime();
    showToast("Timer Start");
  }
}

// Object detection loop
async function detectObjectsLoop() {
  if (mode.value !== 'ingredients' || !videoRef.value) {
    recognitionHint.value = "";
    recognitionSuccess.value = false;
    objectDetectionRaf = requestAnimationFrame(detectObjectsLoop);
    return;
  }

  try {
    const objects = await detectObjects(videoRef.value);
    const detected = objects
      .filter(obj => obj.score > 0.5)
      .map(obj => obj.class);
    
    detectedObjects.value = detected;
    
    // Determine current (first unchecked) ingredient
    const currentIndex = ingredients.value.findIndex(ing => !ing.checked);
    const currentIngredient = currentIndex !== -1 ? ingredients.value[currentIndex] : null;
    
    if (currentIngredient) {
      const detectClass = (currentIngredient as any).detectClass;
      const isDetected = !!detectClass && detected.includes(detectClass);
      recognitionSuccess.value = isDetected;
      if (isDetected) {
        recognitionHint.value = `${currentIngredient.name} erkannt!`;
      } else {
        recognitionHint.value = detectClass
          ? `${currentIngredient.name} noch nicht erkannt, Ausrichtung ändern`
          : `${currentIngredient.name} wird nicht automatisch erkannt – 👍 Daumen 3s halten zum Bestätigen`;
      }
    } else {
      recognitionHint.value = "";
      recognitionSuccess.value = false;
    }
    
    // Auto-check ingredients based on detected objects
    for (const ingredient of ingredients.value) {
      if (!ingredient.checked && ingredient.detectClass && detected.includes(ingredient.detectClass)) {
        ingredient.checked = true;
        showToast(`✓ ${ingredient.name} erkannt!`);
        recognitionHint.value = `${ingredient.name} erkannt!`;
        recognitionSuccess.value = true;
        
        // Check if all ingredients are now checked
        if (ingredients.value.every(ing => ing.checked)) {
          setTimeout(() => {
            mode.value = 'recipe';
            showToast("Alle Zutaten da! Los geht's!");
          }, 1000);
        }
        
        // Wait a bit before checking next to avoid duplicates
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
  } catch (error) {
    console.error('Object detection error:', error);
  }

  objectDetectionRaf = requestAnimationFrame(detectObjectsLoop);
}

onMounted(async () => {
  if (!videoRef.value || !canvasRef.value) return;
  
  // Load object detection model
  console.log('Loading object detection model...');
  objectDetectionModel = await loadObjectDetectionModel();
  console.log('Object detection ready!');
  
  vision = await initVision(videoRef.value, canvasRef.value);

  const loop = async () => {
    if (!vision) return;
    const result = await vision.detectHands();
    engine.update(result, performance.now(), handleGesture);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  
    // Start object detection loop
    objectDetectionRaf = requestAnimationFrame(detectObjectsLoop);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
    cancelAnimationFrame(objectDetectionRaf);
  vision?.stop();
});
</script>

<template>
  <div class="layout">
    <div class="left">
      <!-- Ingredients Mode -->
      <div v-if="mode === 'ingredients'">
        <h1>Zutaten Check</h1>
          <p class="subtitle">Halte jede Zutat ins Bild - sie wird automatisch erkannt!</p>
        
          <!-- Detection feedback -->
          <div v-if="detectedObjects.length > 0" class="detectionFeedback">
            🔍 Erkannt: {{ detectedObjects.join(', ') }}
          </div>
        
        <div class="ingredientsList">
          <div 
            v-for="(ingredient, idx) in ingredients" 
            :key="idx"
            class="ingredientItem"
            :class="{ checked: ingredient.checked }"
          >
            <div class="checkbox">
              <span v-if="ingredient.checked" class="checkmark">✓</span>
            </div>
            <span class="ingredientName">{{ ingredient.name }}</span>
          </div>
        </div>
        
        <div class="ingredientsHint">
           Die Kamera erkennt automatisch: Äpfel, Bananen, Orangen, Karotten, Flaschen<br>
           Alternativ: 👍 Daumen hoch zum manuellen Abhaken
        </div>
      </div>
      
      <!-- Recipe Mode -->
      <div v-else>
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
        
        <!-- Recognition hint overlay (ingredients mode) -->
        <div v-if="mode === 'ingredients' && recognitionHint" 
             class="recognitionHint" 
             :class="{ success: recognitionSuccess, pending: !recognitionSuccess }">
          <span class="hintIcon">{{ recognitionSuccess ? '✅' : '👀' }}</span>
          <span class="hintText">{{ recognitionHint }}</span>
        </div>

        <!-- Thumbs-up hold progress (ingredients mode) -->
        <div v-if="mode === 'ingredients' && thumbHoldProgress > 0" class="thumbHold">
          <svg width="90" height="90">
            <circle cx="45" cy="45" r="34" fill="none" stroke="#374151" stroke-width="6" />
            <circle 
              cx="45" cy="45" r="34" fill="none" stroke="#60a5fa" stroke-width="6" stroke-linecap="round"
              :stroke-dasharray="`${thumbHoldProgress * 213} 213`" transform="rotate(-90 45 45)"
            />
          </svg>
          <div class="thumbHoldText">Daumen halten: {{ Math.round(thumbHoldProgress * 100) }}%</div>
        </div>

        <!-- Pinch swipe indicator -->
        <div v-if="Math.abs(pinchSwipeDeltaX) > 0.005 || Math.abs(pinchSwipeDeltaY) > 0.005" class="pinchSwipeIndicator">
          <svg width="200" height="200" viewBox="0 0 200 200">
            <!-- Glow effect -->
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            <!-- Direction line -->
            <line 
              x1="100" y1="100" 
              :x2="100 + pinchSwipeDeltaX * 500" 
              :y2="100 + pinchSwipeDeltaY * 500"
              stroke="#60a5fa" 
              stroke-width="6" 
              stroke-linecap="round"
              filter="url(#glow)"
            />
            
            <!-- End point -->
            <circle 
              :cx="100 + pinchSwipeDeltaX * 500" 
              :cy="100 + pinchSwipeDeltaY * 500"
              r="12" 
              fill="#60a5fa"
              filter="url(#glow)"
            />
            
            <!-- Start point -->
            <circle cx="100" cy="100" r="8" fill="#60a5fa" opacity="0.6" />
          </svg>
          
          <!-- Direction arrow with text -->
          <div class="pinchSwipeLabel">
            <div class="pinchSwipeArrow">
              {{ Math.abs(pinchSwipeDeltaX) > Math.abs(pinchSwipeDeltaY) 
                 ? (pinchSwipeDeltaX > 0 ? '→' : '←')
                 : (pinchSwipeDeltaY > 0 ? '↓' : '↑') }}
            </div>
            <div class="pinchSwipeText">
              {{ Math.abs(pinchSwipeDeltaX) > Math.abs(pinchSwipeDeltaY) 
                 ? (pinchSwipeDeltaX > 0 ? 'Weiter' : 'Zurück')
                 : (pinchSwipeDeltaY > 0 ? 'Runter' : 'Hoch') }}
            </div>
          </div>
        </div>
      </div>
      <div class="hint">
        <span v-if="mode === 'ingredients'">
           Halte Zutaten ins Bild zur automatischen Erkennung | 👍 Daumen zum manuellen Abhaken
        </span>
        <span v-else>
          Greifen & Flick (←/→ Rezept), Offene Hand 3s (Timer ↔), Daumen hoch (Timer Start)
        </span>
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
video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; }
canvas { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
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

.pinchSwipeIndicator { 
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  pointer-events: none; z-index: 10;
}
.pinchSwipeLabel {
  margin-top: 15px; display: flex; flex-direction: column; align-items: center; gap: 8px;
}
.pinchSwipeArrow {
  color: #60a5fa; font-size: 48px; font-weight: bold;
  text-shadow: 0 0 20px rgba(96, 165, 250, 0.8), 0 0 40px rgba(96, 165, 250, 0.4);
  background: rgba(0,0,0,0.85); padding: 12px 24px; border-radius: 12px;
  border: 2px solid #60a5fa;
  animation: pulse 0.8s ease-in-out infinite;
}
.pinchSwipeText {
  color: #60a5fa; font-size: 16px; font-weight: bold;
  background: rgba(0,0,0,0.85); padding: 6px 16px; border-radius: 8px;
  border: 1px solid #60a5fa;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.subtitle {
  opacity: 0.8; font-size: 14px; margin-top: -8px; margin-bottom: 16px;
}

.ingredientsList {
  display: flex; flex-direction: column; gap: 12px;
  background: #0f1220; padding: 16px; border-radius: 12px;
}

.ingredientItem {
  display: flex; align-items: center; gap: 12px;
  padding: 12px; border-radius: 8px;
  background: #1a1f35;
  transition: all 0.3s ease;
}

.ingredientItem.checked {
  background: #1a3a2a;
  border-left: 4px solid #4ade80;
}

.checkbox {
  width: 28px; height: 28px; border-radius: 6px;
  border: 2px solid #4a5568;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.3s ease;
}

.ingredientItem.checked .checkbox {
  background: #4ade80;
  border-color: #4ade80;
}

.checkmark {
  color: #fff; font-size: 20px; font-weight: bold;
  animation: checkPop 0.3s ease;
}

@keyframes checkPop {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.ingredientName {
  font-size: 16px;
  transition: all 0.3s ease;
}

.ingredientItem.checked .ingredientName {
  color: #4ade80;
  text-decoration: line-through;
  opacity: 0.7;
}

.ingredientsHint {
  margin-top: 16px;
  padding: 12px;
  background: rgba(96, 165, 250, 0.1);
  border: 1px solid rgba(96, 165, 250, 0.3);
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.6;
  color: #60a5fa;
}

.recognitionHint {
  position: absolute; bottom: 18px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 10px;
  padding: 10px 16px; border-radius: 999px; backdrop-filter: blur(6px);
  font-size: 14px; font-weight: 600;
  border: 2px solid;
}
.recognitionHint.pending { 
  background: rgba(234, 179, 8, 0.15); border-color: #f59e0b; color: #fbbf24;
}
.recognitionHint.success { 
  background: rgba(74, 222, 128, 0.15); border-color: #22c55e; color: #4ade80;
}
.recognitionHint .hintIcon { font-size: 16px; }
.recognitionHint .hintText { letter-spacing: 0.2px; }

.thumbHold {
  position: absolute; top: 20px; left: 20px; display: flex; align-items: center; gap: 10px;
  background: rgba(96, 165, 250, 0.12); border: 1px solid rgba(96, 165, 250, 0.4);
  padding: 8px 12px; border-radius: 10px;
}
.thumbHoldText { color: #60a5fa; font-weight: 600; }

.detectionFeedback {
  margin-top: 12px;
  padding: 10px 14px;
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.15) 0%, rgba(34, 197, 94, 0.1) 100%);
  border: 2px solid #4ade80;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  color: #4ade80;
  animation: pulse 1.5s ease-in-out infinite;
  text-align: center;
}
</style>
