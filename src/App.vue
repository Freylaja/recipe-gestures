<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";
import { initVision } from "./vision";
import { GestureEngine, type GestureEvent } from "./gestures";
import { TimerController } from "./timer";
import { loadObjectDetectionModel, detectObjects } from "./objectDetection";

import IngredientScanner from "./components/IngredientScanner.vue";
import RecipeView from "./components/RecipeView.vue";
import GestureOverlays from "./components/GestureOverlays.vue";
import RecipeSelection from "./components/RecipeSelection.vue";

const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

// Recipes list
const recipes = ref([
  {
    id: '1',
    title: 'Apfelkuchen',
    prepTime: '60-70 Min.',
    servings: 8,
    difficulty: 'Mittel',
    category: 'Kuchen',
    image: '/applepie.png',
    ingredients: [
      { name: "Äpfel", checked: false, detectClass: "apple" },
      { name: "Mehl", checked: false, detectClass: null },
      { name: "Zucker", checked: false, detectClass: null },
      { name: "Eier", checked: false, detectClass: null },
      { name: "Öl", checked: false, detectClass: "bottle" },
      { name: "Backpulver", checked: false, detectClass: null },
      { name: "Zimt", checked: false, detectClass: null },
      { name: "Puderzucker", checked: false, detectClass: null }
    ],
    steps: [
      "Ofen auf 180°C Ober-/Unterhitze vorheizen.",
      "Äpfel schälen, entkernen und in dünne Spalten schneiden.",
      "Mehl mit Backpulver und Zimt in einer Schüssel vermischen.",
      "Eier, Zucker und Öl in einer separaten Schüssel schaumig schlagen.",
      "Mehlmischung unter die Ei-Masse heben, bis ein glatter Teig entsteht.",
      "Apfelspalten vorsichtig unter den Teig heben.",
      "Teig in eine gefettete Springform (26 cm) füllen und glatt streichen.",
      "Kuchen im vorgeheizten Ofen etwa 45-50 Minuten backen.",
      "Stäbchenprobe machen: Holzstäbchen sollte sauber herauskommen.",
      "Kuchen aus dem Ofen nehmen und 10 Minuten in der Form abkühlen lassen.",
      "Kuchen aus der Form lösen und auf einem Kuchengitter vollständig auskühlen lassen.",
      "Mit Puderzucker bestäuben und servieren. Guten Appetit!"
    ]
  },
  {
    id: '2',
    title: 'Spaghetti Carbonara',
    prepTime: '25 Min.',
    servings: 4,
    difficulty: 'Einfach',
    category: 'Pasta',
    image: '/spaghetti.jpg',
    ingredients: [
      { name: "Spaghetti", checked: false, detectClass: null },
      { name: "Eier", checked: false, detectClass: null },
      { name: "Speck", checked: false, detectClass: null },
      { name: "Parmesan", checked: false, detectClass: null },
      { name: "Pfeffer", checked: false, detectClass: null }
    ],
    steps: [
      "Spaghetti in kochendem Salzwasser nach Packungsanweisung al dente kochen.",
      "Speck in kleine Würfel schneiden.",
      "Speck in einer Pfanne knusprig braten.",
      "Eier mit geriebenem Parmesan verquirlen und mit Pfeffer würzen.",
      "Gekochte Spaghetti abgießen, dabei etwas Nudelwasser auffangen.",
      "Spaghetti zum Speck in die Pfanne geben und gut vermischen.",
      "Pfanne vom Herd nehmen und Ei-Mischung unter ständigem Rühren zugeben.",
      "Bei Bedarf mit Nudelwasser verdünnen, bis eine cremige Sauce entsteht.",
      "Sofort servieren mit extra Parmesan und schwarzem Pfeffer."
    ]
  },
  {
    id: '3',
    title: 'Schokoladenkuchen',
    prepTime: '50 Min.',
    servings: 12,
    difficulty: 'Einfach',
    category: 'Kuchen',
    image: '/schokokuchen.jpg',
    ingredients: [
      { name: "Mehl", checked: false, detectClass: null },
      { name: "Kakao", checked: false, detectClass: null },
      { name: "Zucker", checked: false, detectClass: null },
      { name: "Eier", checked: false, detectClass: null },
      { name: "Butter", checked: false, detectClass: null },
      { name: "Milch", checked: false, detectClass: null },
      { name: "Backpulver", checked: false, detectClass: null }
    ],
    steps: [
      "Ofen auf 175°C vorheizen und Backform fetten.",
      "Butter und Zucker schaumig rühren.",
      "Eier einzeln unterrühren.",
      "Mehl, Kakao und Backpulver mischen.",
      "Mehlmischung abwechselnd mit Milch unterrühren.",
      "Teig in die Form füllen und glatt streichen.",
      "35-40 Minuten backen.",
      "Abkühlen lassen und nach Wunsch glasieren."
    ]
  }
]);

const currentRecipeIndex = ref(0);
const selectedRecipe = ref<typeof recipes.value[0] | null>(null);

// Ingredients list - will be populated from selected recipe
const ingredients = ref<Array<{name: string, checked: boolean, detectClass: string | null}>>([]);

// Detected objects
const detectedObjects = ref<string[]>([]);
// Visual detection hint
const recognitionHint = ref("");
const recognitionSuccess = ref(false);
// Thumb hold to confirm all ingredients
const thumbHoldProgress = ref(0);

// Mode: 'recipe-selection', 'ingredients' or 'recipe'
const mode = ref<'recipe-selection' | 'ingredients' | 'recipe'>('recipe-selection');

// Steps - will be populated from selected recipe
const steps = ref<string[]>([]);

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
  step.value = Math.min(step.value + 1, steps.value.length - 1);
  showToast("Weiter");
}
function prevStep() {
  step.value = Math.max(step.value - 1, 0);
  showToast("Zurück");
}

function selectRecipe(index: number) {
  selectedRecipe.value = recipes.value[index];
  ingredients.value = JSON.parse(JSON.stringify(selectedRecipe.value.ingredients));
  steps.value = [...selectedRecipe.value.steps];
  mode.value = 'ingredients';
  step.value = 0;
  showToast(`${selectedRecipe.value.title} ausgewählt!`);
}

function nextRecipe() {
  currentRecipeIndex.value = Math.min(currentRecipeIndex.value + 1, recipes.value.length - 1);
}

function prevRecipe() {
  currentRecipeIndex.value = Math.max(currentRecipeIndex.value - 1, 0);
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
  // Recipe selection mode - thumbs up to select, swipes to navigate
  if (mode.value === 'recipe-selection') {
    if (ev.type === "THUMBS_UP_PROGRESS") {
      thumbHoldProgress.value = ev.progress;
    }
    if (ev.type === "THUMBS_UP_HOLD") {
      selectRecipe(currentRecipeIndex.value);
      thumbHoldProgress.value = 0;
    }
    if (ev.type === "PINCH_FLICK_LEFT") {
      prevRecipe();
    }
    if (ev.type === "PINCH_FLICK_RIGHT") {
      nextRecipe();
    }
    return; // Don't handle other gestures in recipe-selection mode
  }
  
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
  <!-- Fullscreen container -->
  <div class="app-container">
    <!-- Recipe Selection Screen -->
    <RecipeSelection 
      v-if="mode === 'recipe-selection'"
      :recipes="recipes"
      :current-recipe-index="currentRecipeIndex"
      :thumb-progress="thumbHoldProgress"
      @select-recipe="selectRecipe"
      @next-recipe="nextRecipe"
      @prev-recipe="prevRecipe"
    />
    
    <!-- Ingredient Scanner -->
    <IngredientScanner 
      v-else-if="mode === 'ingredients'"
      :ingredients="ingredients"
      :detected-objects="detectedObjects"
      :recognition-hint="recognitionHint"
      :recognition-success="recognitionSuccess"
    />
    
    <!-- Recipe Steps View -->
    <RecipeView 
      v-else
      :steps="steps"
      :step="step"
      :timer-open="timerOpen"
      @prev="prevStep"
      @next="nextStep"
      @toggle-timer="toggleTimer"
    />

    <!-- Hidden video and canvas for gesture detection -->
    <div class="gesture-capture">
      <video ref="videoRef" autoplay playsinline muted></video>
      <canvas ref="canvasRef"></canvas>
      
      <GestureOverlays 
        :mode="mode"
        :timer-open="timerOpen"
        :palm-progress="palmProgress"
        :pinch-swipe-delta-x="pinchSwipeDeltaX"
        :pinch-swipe-delta-y="pinchSwipeDeltaY"
        :recognition-hint="recognitionHint"
        :recognition-success="recognitionSuccess"
        :thumb-hold-progress="thumbHoldProgress"
      />
    </div>

    <div v-if="toast" class="toast">{{ toast }}</div>

    <!-- Timer Gesture Menu -->
    <div v-if="timerOpen" class="timer-gesture-menu">
      <div class="timer-menu-card">
        <div class="timer-menu-header">
          <h2 class="timer-menu-title">Timer Steuerung</h2>
          <p class="timer-menu-subtitle">Verwende Gesten zur Steuerung</p>
        </div>

        <!-- Current Timer Display -->
        <div class="timer-display-box">
          <div class="timer-display-content">
            <div class="timer-icon-wrapper">
              <svg class="timer-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="timer-time-display">{{ timerLabel }}</div>
            <div class="timer-status-text">{{ timer.isRunning ? 'Läuft' : timer.isPaused ? 'Pausiert' : 'Bereit' }}</div>
          </div>
        </div>

        <!-- Gesture Controls Grid -->
        <div class="gesture-controls-grid">
          <!-- Start Timer (Thumbs Up) -->
          <button @click="startTimerWithCustomTime()" :disabled="timer.isRunning" class="gesture-control-btn" :class="{ 'btn-disabled': timer.isRunning }">
            <div class="gesture-icon-circle green">
              <svg class="gesture-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </div>
            <div class="gesture-label">Timer starten</div>
            <div class="gesture-hint">👍 Daumen hoch</div>
          </button>

          <!-- Pause Timer (Peace) -->
          <button @click="timer.pause()" :disabled="!timer.isRunning" class="gesture-control-btn" :class="{ 'btn-disabled': !timer.isRunning }">
            <div class="gesture-icon-circle blue">
              <svg class="gesture-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="gesture-label">Pausieren</div>
            <div class="gesture-hint">✌️ Peace Zeichen</div>
          </button>

          <!-- Stop Timer (Fist) -->
          <button @click="timer.stop()" :disabled="!timer.isRunning && !timer.isPaused" class="gesture-control-btn" :class="{ 'btn-disabled': !timer.isRunning && !timer.isPaused }">
            <div class="gesture-icon-circle red">
              <svg class="gesture-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10h6v4H9z" />
              </svg>
            </div>
            <div class="gesture-label">Stoppen</div>
            <div class="gesture-hint">✊ Faust</div>
          </button>

          <!-- Close Menu (Open Hand) -->
          <button @click="toggleTimer(false)" class="gesture-control-btn">
            <div class="gesture-icon-circle amber">
              <svg class="gesture-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div class="gesture-label">Schließen</div>
            <div class="gesture-hint">✋ Offene Hand</div>
          </button>
        </div>

        <!-- Quick Time Adjust -->
        <div class="quick-time-adjust">
          <button @click="timer.addSeconds(-30)" class="time-adjust-btn">
            <span class="time-adjust-text">-30s</span>
          </button>
          <button @click="timer.addSeconds(30)" class="time-adjust-btn">
            <span class="time-adjust-text">+30s</span>
          </button>
          <button @click="timer.addSeconds(60)" class="time-adjust-btn">
            <span class="time-adjust-text">+1min</span>
          </button>
        </div>

        <!-- Help Text -->
        <div class="timer-help-text">
          💡 Halte die Geste 3-5 Sekunden
        </div>
      </div>
    </div>

    <!-- Timer Finished Notification -->
    <div v-if="timerLabel === '00:00' && timer.hasFinished" class="timer-finished-overlay">
      <div class="timer-finished-card">
        <div class="timer-finished-icon">
          <svg class="finished-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 class="timer-finished-title">Zeit abgelaufen!</h2>
        <p class="timer-finished-text">Dein Timer ist fertig</p>
        <button @click="timer.stop(); timer.hasFinished = false" class="timer-finished-btn">
          Okay
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  position: fixed;
  inset: 0;
  overflow: hidden;
}

.gesture-capture {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  width: 240px;
  height: 180px;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  z-index: 50;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

video, canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

video {
  opacity: 0.3;
}

.toast {
  position: fixed;
  left: 50%;
  bottom: 2rem;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  font-weight: 500;
  z-index: 100;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
}

/* Timer Gesture Menu */
.timer-gesture-menu {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.timer-menu-card {
  background: white;
  border-radius: 1.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  padding: 2rem;
  max-width: 42rem;
  width: calc(100% - 4rem);
  max-height: 90vh;
  overflow-y: auto;
}

.timer-menu-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.timer-menu-title {
  font-size: 1.875rem;
  font-weight: bold;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.timer-menu-subtitle {
  color: #64748b;
}

.timer-display-box {
  background: linear-gradient(to bottom right, #fff7ed, #fed7aa);
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 1.5rem;
}

.timer-display-content {
  text-align: center;
}

.timer-icon-wrapper {
  width: 4rem;
  height: 4rem;
  background: #f97316;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.timer-icon {
  width: 2rem;
  height: 2rem;
  color: white;
}

.timer-time-display {
  font-size: 3rem;
  font-weight: bold;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.timer-status-text {
  color: #78350f;
  font-weight: 500;
}

.gesture-controls-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.gesture-control-btn {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 1rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.gesture-control-btn:hover:not(.btn-disabled) {
  border-color: #f97316;
  transform: scale(1.02);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.gesture-control-btn:active:not(.btn-disabled) {
  transform: scale(0.98);
}

.btn-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.gesture-icon-circle {
  width: 4rem;
  height: 4rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.75rem;
}

.gesture-icon-circle.green {
  background: linear-gradient(to bottom right, #4ade80, #22c55e);
}

.gesture-icon-circle.blue {
  background: linear-gradient(to bottom right, #60a5fa, #3b82f6);
}

.gesture-icon-circle.red {
  background: linear-gradient(to bottom right, #f87171, #ef4444);
}

.gesture-icon-circle.amber {
  background: linear-gradient(to bottom right, #fbbf24, #f59e0b);
}

.gesture-svg {
  width: 2rem;
  height: 2rem;
  color: white;
  stroke-width: 2.5;
}

.gesture-label {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.gesture-hint {
  font-size: 0.875rem;
  color: #64748b;
}

.quick-time-adjust {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.time-adjust-btn {
  background: #f1f5f9;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.time-adjust-btn:hover {
  background: #e2e8f0;
  transform: scale(1.05);
}

.time-adjust-text {
  font-size: 0.875rem;
}

.timer-help-text {
  text-align: center;
  font-size: 0.875rem;
  color: #64748b;
}

/* Timer Finished Notification */
.timer-finished-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 60;
}

.timer-finished-card {
  background: white;
  border-radius: 1.5rem;
  padding: 3rem;
  text-align: center;
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.timer-finished-icon {
  width: 6rem;
  height: 6rem;
  background: #22c55e;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
}

.finished-icon-svg {
  width: 3rem;
  height: 3rem;
  color: white;
}

.timer-finished-title {
  font-size: 2.25rem;
  font-weight: bold;
  color: #1e293b;
  margin-bottom: 1rem;
}

.timer-finished-text {
  font-size: 1.25rem;
  color: #64748b;
  margin-bottom: 1.5rem;
}

.timer-finished-btn {
  background: linear-gradient(to right, #22c55e, #10b981);
  color: white;
  padding: 1rem 2rem;
  border-radius: 9999px;
  font-size: 1.125rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: transform 0.2s;
}

.timer-finished-btn:hover {
  transform: scale(1.05);
}


</style>
