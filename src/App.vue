<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, computed } from "vue";
import { initVision } from "./vision";
import { GestureEngine, type GestureEvent } from "./gestures";
import { TimerController, MultiTimerManager, type RunningTimer } from "./timer";
import { loadObjectDetectionModel, detectObjects, findMatchingDetectClass } from "./objectDetection";

import IngredientScanner from "./components/IngredientScanner.vue";
import RecipeView from "./components/RecipeView.vue";
import GestureOverlays from "./components/GestureOverlays.vue";
import RecipeSelection from "./components/RecipeSelection.vue";
import TimerOverlay from "./components/TimerOverlay.vue";
import RecipeCompletion from "./components/RecipeCompletion.vue";

const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

// Recipes list
const recipes = ref([
  {
id: '1' ,
title: 'Vegane Apfelmuffins', 
prepTime: '45 Minuten',
servings: 12,
difficulty: 'Einfach',
category: 'Muffins',
image: '/Apfelmuffins.png',
ingredients: [
{ name: "Apfel", checked: false, detectClass: "apple" },
{ name: "Mehl", checked: false, detectClass: null },
{ name: "Backpulver", checked: false, detectClass: null },
{ name: "brauner Zucker", checked: false, detectClass: null },
{ name: "Zimt", checked: false, detectClass: null },
{ name: "Salz", checked: false, detectClass: null },
{ name: "Apfelmus", checked: false, detectClass: null },
{ name: "geschmacksneutrales Öl", checked: false, detectClass: "bottle" },
{ name: "Pflanzlicher Drink", checked: false, detectClass: null },
],
steps: [
"Backofen auf 190 Grad Ober- und Unterhitze vorheizen",
"Äpfel waschen, halbieren und das Gehäuse entfernen. Anschließend in kleine Würfel schneiden. Optional: Eine der Hälften für die Dekoration der Muffins in feine Scheiben schneiden.",
"Mehl, Backpulver, brauner Zucker, Zimt und Salz in eine große Schüssel geben und miteinander vermengen.",
"Apfelmus, Öl und Pflanzendrink dazugeben und mit dem Schneebesen oder Kuchenspatel zu einem klümpchenfreien Teig verrühren. Nicht länger als nötig rühren, da der Teig sonst beim Backen zu fest wird und nicht aufgeht.",
"Eine Handvoll Apfelstücke aufheben. Die restlichen Apfelstücke unter den Teig heben.",
"Ein Muffinblech mit Papierförmchen auslegen. Den Teig gleichmäßig auf die Mulden verteilen.",
"Die übrigen Apfelwürfel auf die Muffins legen und mit einer Prise Zimt bestreuen.",
"Auf der mittleren Schiene 25 Minuten goldbraun backen. Sie sind fertig, sobald an einem Holzstäbchen, dass du in die Mitte des Teiges steckst, nur noch ganz vereinzelt Krümel hängen bleiben.",
"Apfelmuffins aus dem Ofen nehmen, aus dem Blech lösen und abkühlen lassen. Luftdicht verpackt und kühl gelagert bleiben sie 2-3 Tage lecker saftig! Lass es dir schmecken!"

]
},
    {
id: '2', 
title: 'Obstsalat',
prepTime: '15 Minuten',
servings: 4,
difficulty: 'Einfach',
category: 'Salat',
image: '/Obstsalat.png',
ingredients: [
{ name: "Orange", checked: false, detectClass: "orange" },
{ name: "Apfel", checked: false, detectClass: "apple" },
{ name: "Banane", checked: false, detectClass: "banana" }
],
steps: [
"Den Apfel waschen, entkernen und in Würfel schneiden",
"Die Orange schälen und in mundgerechte Stücke teilen",
"Die Banane schälen und in Scheiben schneiden",
"Alles zusammen in eine Schüssel geben und gleichmäßig vermengen",
"Pur servieren"
]
},
  {
    id: '3',
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
      "Drei Äpfel schälen, entkernen und in dünne Spalten schneiden.",
      "200 Gramm Mehl mit Backpulver und Zimt in einer Schüssel vermischen.",
      "Drei Eier, 100 Gramm Zucker und einen Schuss Öl in einer separaten Schüssel schaumig schlagen.",
      "Mehlmischung unter die Ei-Masse heben, bis ein glatter Teig entsteht.",
      "Apfelspalten vorsichtig unter den Teig heben.",
      "Teig in eine gefettete Springform (26 cm) füllen und glatt streichen.",
      "Kuchen im vorgeheizten Ofen etwa 45-50 Minuten backen.",
      "Stäbchenprobe machen: Holzstäbchen sollte sauber herauskommen.",
      "Kuchen aus dem Ofen nehmen und 10 Minuten in der Form abkühlen lassen.",
      "Kuchen aus der Form lösen und auf einem Kuchengitter vollständig auskühlen lassen.",
      "Mit etwas Puderzucker bestäuben und servieren. Guten Appetit!"
    ]
  },
  {
    id: '4',
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
    id: '5',
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

// Mode: 'recipe-selection', 'ingredients', 'recipe', or 'recipe-completion'
const mode = ref<'recipe-selection' | 'ingredients' | 'recipe' | 'recipe-completion'>('recipe-selection');

// Steps - will be populated from selected recipe
const steps = ref<string[]>([]);

const step = ref(0);
const toast = ref("");
const timerOpen = ref(false);
const timerLabel = ref("00:00");

// Active timers for overlay
const activeTimers = ref<RunningTimer[]>([]);

// Computed: Check if any timers are running (not finished)
const hasRunningTimers = computed(() => activeTimers.value.some(t => !t.hasFinished));

// Detected timer from current step
const detectedTimerSeconds = ref<number | null>(null);
const showTimerConfirmation = ref(false);

// Track completion state for recipe-completion mode
const completionThumbProgress = ref(0);// Fist progress for canceling
const fistProgress = ref(0);

// Open palm progress tracking
const palmProgress = ref(0);

// Pinch swipe progress tracking
const pinchSwipeDeltaX = ref(0);
const pinchSwipeDeltaY = ref(0);

// Timer add minutes slider
const addTimerMinutes = ref(5);
const timerSliderPosition = ref(0.5); // 0.0 to 1.0 for smooth continuous position
const pinchStartX = ref<number | null>(null);
const pinchStartSliderPosition = ref<number | null>(null);

// Track which timers have been "pinged" to avoid multiple sounds
const timersPinged = ref<Set<number>>(new Set());

// Function to play bell sound when timer finishes
function playBellSound() {
  // Play bell sound 3 times with delays
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Bell-like sound: 800Hz sine wave
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      // Quick volume envelope for bell effect
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    }, i * 800); // 800ms between each beep
  }
}

function showToast(msg: string) {
  toast.value = msg;
  setTimeout(() => (toast.value = ""), 700);
}

// Extract time duration from step text (e.g., "25 Minuten", "1 Stunde", "30 Sekunden")
function extractTimerFromStep(stepText: string): number | null {
  const text = stepText.toLowerCase();
  
  // Match patterns like "25 Minuten", "1 Stunde", "30 Sekunden", "2-3 Minuten"
  const minuteMatch = text.match(/(\d+)(?:-\d+)?\s*(?:min|minute|minuten)/);
  if (minuteMatch && minuteMatch[1]) {
    return parseInt(minuteMatch[1]) * 60; // Convert to seconds
  }
  
  const hourMatch = text.match(/(\d+)(?:-\d+)?\s*(?:std|stunde|stunden)/);
  if (hourMatch && hourMatch[1]) {
    return parseInt(hourMatch[1]) * 3600; // Convert to seconds
  }
  
  const secondMatch = text.match(/(\d+)(?:-\d+)?\s*(?:sek|sekunde|sekunden)/);
  if (secondMatch && secondMatch[1]) {
    return parseInt(secondMatch[1]); // Already in seconds
  }
  
  return null;
}

function checkTimerInCurrentStep() {
  const currentStepText = steps.value[step.value];
  if (currentStepText) {
    const timerSeconds = extractTimerFromStep(currentStepText);
    detectedTimerSeconds.value = timerSeconds;
    showTimerConfirmation.value = timerSeconds !== null;
  } else {
    detectedTimerSeconds.value = null;
    showTimerConfirmation.value = false;
  }
}

function nextStep() {
  // Check if we're at the last step
  if (step.value >= steps.value.length - 1) {
    // Go to completion screen
    mode.value = 'recipe-completion';
    completionThumbProgress.value = 0;
    showToast("✨ Glückwunsch!");
  } else {
    step.value = Math.min(step.value + 1, steps.value.length - 1);
    checkTimerInCurrentStep();
    showToast("Weiter");
  }
}
function prevStep() {
  step.value = Math.max(step.value - 1, 0);
  checkTimerInCurrentStep();
  showToast("Zurück");
}

function selectRecipe(index: number) {
  const recipe = recipes.value[index];
  if (!recipe) return;
  selectedRecipe.value = recipe;
  ingredients.value = JSON.parse(JSON.stringify(recipe.ingredients));
  steps.value = [...recipe.steps];
  mode.value = 'ingredients';
  step.value = 0;
  showToast(`${recipe.title} ausgewählt!`);
}

function startRecipeMode() {
  mode.value = 'recipe';
  step.value = 0;
  checkTimerInCurrentStep();
}

function cancelRecipe() {
  mode.value = 'recipe-selection';
  step.value = 0;
  selectedRecipe.value = null;
  ingredients.value = [];
  steps.value = [];
  detectedTimerSeconds.value = null;
  showTimerConfirmation.value = false;
  multiTimerManager.clearAllTimers();
  showToast("Rezept abgebrochen");
}

function backToRecipeSelection() {
  mode.value = 'recipe-selection';
  step.value = 0;
  selectedRecipe.value = null;
  ingredients.value = [];
  steps.value = [];
  detectedTimerSeconds.value = null;
  showTimerConfirmation.value = false;
  completionThumbProgress.value = 0;
  multiTimerManager.clearAllTimers();
  showToast("Neue Rezeptauswahl");
}

function nextRecipe() {
  currentRecipeIndex.value = (currentRecipeIndex.value + 1) % recipes.value.length;
}

function prevRecipe() {
  currentRecipeIndex.value = (currentRecipeIndex.value - 1 + recipes.value.length) % recipes.value.length;
}
function toggleTimer(force?: boolean) {
  timerOpen.value = force ?? !timerOpen.value;
}

function uncheckLastIngredient() {
  const checkedIndex = ingredients.value.findIndex(ing => ing.checked);
  if (checkedIndex !== -1) {
    // Find last checked
    let lastChecked = -1;
    for (let i = ingredients.value.length - 1; i >= 0; i--) {
      const item = ingredients.value[i];
      if (item?.checked) {
        lastChecked = i;
        break;
      }
    }
    if (lastChecked !== -1) {
      const item = ingredients.value[lastChecked];
      if (item) {
        item.checked = false;
        showToast(`✗ ${item.name}`);
      }
    }
  }
}

function startDetectedTimer() {
  if (detectedTimerSeconds.value && detectedTimerSeconds.value > 0) {
    const timerLabel = `Schritt ${step.value + 1}`;
    multiTimerManager.createTimer(detectedTimerSeconds.value, timerLabel);
    showTimerConfirmation.value = false;
    
    const minutes = Math.floor(detectedTimerSeconds.value / 60);
    const seconds = detectedTimerSeconds.value % 60;
    const timeStr = minutes > 0 ? `${minutes} Min` : `${seconds} Sek`;
    showToast(`Timer gestartet: ${timeStr}`);
  }
}

const timer = new TimerController((label) => (timerLabel.value = label));
const multiTimerManager = new MultiTimerManager(() => {
  const newTimers = multiTimerManager.getActiveTimers();
  // Clean up pinged timers that no longer exist
  const activeIds = new Set(newTimers.map(t => t.id));
  timersPinged.value = new Set([...timersPinged.value].filter(id => activeIds.has(id)));
  activeTimers.value = newTimers;
});
const engine = new GestureEngine();

let raf = 0;
let objectDetectionRaf = 0;
let vision: Awaited<ReturnType<typeof initVision>> | null = null;

function handleGesture(ev: GestureEvent) {
  // Handle pinch swipe progress globally (for visual feedback)
  if (ev.type === "PINCH_SWIPE_PROGRESS") {
    pinchSwipeDeltaX.value = ev.deltaX;
    pinchSwipeDeltaY.value = ev.deltaY;
  }
  // Reset pinch swipe deltas when flick completes
  if (ev.type === "PINCH_FLICK_LEFT" || ev.type === "PINCH_FLICK_RIGHT") {
    pinchSwipeDeltaX.value = 0;
    pinchSwipeDeltaY.value = 0;
  }

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
      setTimeout(() => { startRecipeMode(); }, 800);
    }
    if (ev.type === "PINCH_FLICK_LEFT") {
      uncheckLastIngredient();
    }
    return; // Don't handle other gestures in ingredients mode
  }

  // Recipe Completion mode - thumbs up within 3 seconds to return
  if (mode.value === 'recipe-completion') {
    if (ev.type === "THUMBS_UP_PROGRESS") {
      completionThumbProgress.value = ev.progress;
    }
    if (ev.type === "THUMBS_UP_HOLD") {
      backToRecipeSelection();
      completionThumbProgress.value = 0;
    }
    return; // Don't handle other gestures in completion mode
  }
  
  // Recipe mode
  // Handle fist for canceling/exiting recipe
  if (ev.type === "FIST_PROGRESS") {
    fistProgress.value = ev.progress;
  }
  if (ev.type === "FIST") {
    cancelRecipe();
    fistProgress.value = 0;
  }
  
  // Handle thumbs up for timer confirmation (if timer detected in current step)
  if (showTimerConfirmation.value) {
    if (ev.type === "THUMBS_UP_PROGRESS") {
      thumbHoldProgress.value = ev.progress;
    }
    if (ev.type === "THUMBS_UP_HOLD") {
      startDetectedTimer();
      thumbHoldProgress.value = 0;
    }
  } else if (!timerOpen.value) {
    // Only reset thumb progress if NOT in timer menu
    if (ev.type === "THUMBS_UP_PROGRESS") {
      thumbHoldProgress.value = 0;
    }
  }
  
  // Handle pinch-flick for recipe navigation (only when timer closed)
  if (!timerOpen.value) {
    if (ev.type === "PINCH_FLICK_LEFT") prevStep();
    if (ev.type === "PINCH_FLICK_RIGHT") nextStep();
  }
  
  // Handle timer menu slider (only when timer open)
  if (timerOpen.value) {
    // Track thumbs up progress for visual feedback
    if (ev.type === "THUMBS_UP_PROGRESS") {
      thumbHoldProgress.value = ev.progress;
    }
    
    // Adjust timer slider with pinch-swipe gesture
    if (ev.type === "PINCH_SWIPE_PROGRESS") {
      // Only update if we have a valid hand position
      if (typeof ev.x === 'number' && !isNaN(ev.x)) {
        // Initialize start position on first progress event
        if (pinchStartX.value === null) {
          pinchStartX.value = ev.x;
          pinchStartSliderPosition.value = timerSliderPosition.value;
        }
        
        // Calculate movement relative to start of THIS pinch
        const movementAmount = ev.x - pinchStartX.value;
        
        // Movement range: 1.0 units = full slider range (0.0 to 1.0)
        // Invert because camera is mirrored: moving RIGHT = moving LEFT in slider = MORE minutes
        const baselinePosition = pinchStartSliderPosition.value!;
        const newPosition = baselinePosition - movementAmount; // negative because of camera mirror
        
        // Clamp to 0.0 to 1.0
        timerSliderPosition.value = Math.max(0, Math.min(1, newPosition));
        
        // Convert position to minutes for display
        addTimerMinutes.value = Math.round(1 + timerSliderPosition.value * 59);
      }
    }
    
    // Reset start position when pinch ends
    if (ev.type === "PINCH_FLICK_LEFT" || ev.type === "PINCH_FLICK_RIGHT") {
      pinchStartX.value = null;
      pinchStartSliderPosition.value = null;
    }
    
    // Add minutes to all active timers with thumbs up (3 seconds)
    if (ev.type === "THUMBS_UP_HOLD") {
      activeTimers.value.forEach(timer => {
        timer.controller.addSeconds(addTimerMinutes.value * 60);
      });
      showToast(`⏱️ ${addTimerMinutes.value} Min zu allen Timern hinzugefügt`);
      thumbHoldProgress.value = 0;
      return;
    }
  }
  
  if (ev.type === "OPEN_PALM") {
    // Only allow timer menu if timers are actually running (not finished) and no confirmation is pending
    const hasRunningTimers = activeTimers.value.some(t => !t.hasFinished);
    if (!showTimerConfirmation.value && hasRunningTimers) {
      if (timerOpen.value) {
        toggleTimer(false);
      } else {
        toggleTimer(true);
      }
      palmProgress.value = 0;
    }
  }
  if (ev.type === "OPEN_PALM_PROGRESS") {
    palmProgress.value = ev.progress;
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
    
    // Debug: Log all detected objects with scores (including low confidence)
    if (objects.length > 0) {
      const allDetectedLog = objects.map(o => `${o.class} (${(o.score * 100).toFixed(1)}%)`).join(', ');
      console.log('All detected objects (unfiltered):', allDetectedLog);
    }
    
    const detected = objects
      .filter(obj => obj.score > 0.25) // Further lowered threshold for orange detection
      .map(obj => obj.class);
    
    // Debug: Log filtered objects and current ingredient requirements
    if (detected.length > 0 || ingredients.value.some(ing => !ing.checked)) {
      const currentUnchecked = ingredients.value.find(ing => !ing.checked);
      if (currentUnchecked) {
        console.log(`Current ingredient: ${currentUnchecked.name} (looking for: ${currentUnchecked.detectClass}), Detected (threshold 0.25): [${detected.join(', ')}]`);
      }
    }
    
    detectedObjects.value = detected;
    
    // Auto-check ingredients based on detected objects FIRST
    let allIngredientsChecked = false;
    for (const ingredient of ingredients.value) {
      if (!ingredient.checked && ingredient.detectClass) {
        // Check if any detected object matches this ingredient's detectClass
        const matchedDetected = detected.find(d => findMatchingDetectClass(d, [ingredient.detectClass]) !== null);
        if (matchedDetected) {
          ingredient.checked = true;
          showToast(`✓ ${ingredient.name} erkannt!`);
          
          // Check if all ingredients are now checked
          if (ingredients.value.every(ing => ing.checked)) {
            allIngredientsChecked = true;
            setTimeout(() => {
              startRecipeMode();
              showToast("Alle Zutaten da! Los geht's!");
            }, 1000);
          }
          
          // Only check ONE ingredient per detection loop
          break;
        }
      }
    }
    
    // If all ingredients are checked, skip hint update and wait before returning
    if (allIngredientsChecked) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      objectDetectionRaf = requestAnimationFrame(detectObjectsLoop);
      return;
    }
    
    // Wait a bit before next detection to avoid duplicates
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // AFTER auto-checking, determine current (first unchecked) ingredient for hint
    const currentIndex = ingredients.value.findIndex(ing => !ing.checked);
    const currentIngredient = currentIndex !== -1 ? ingredients.value[currentIndex] : null;
    
    if (currentIngredient) {
      const detectClass = (currentIngredient as any).detectClass;
      // Check if any detected object matches this ingredient's detectClass
      const isDetected = !!detectClass && detected.some(d => findMatchingDetectClass(d, [detectClass]) !== null);
      recognitionSuccess.value = isDetected;
      if (isDetected) {
        recognitionHint.value = `${currentIngredient.name} erkannt!`;
      } else {
        recognitionHint.value = detectClass
          ? `Zutat noch nicht erkannt, Ausrichtung ändern`
          : `${currentIngredient.name} wird nicht automatisch erkannt – 👍 Daumen 3s halten zum Bestätigen`;
      }
    } else {
      recognitionHint.value = "";
      recognitionSuccess.value = false;
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
  await loadObjectDetectionModel();
  console.log('Object detection ready!');
  
  vision = await initVision(videoRef.value, canvasRef.value);

  // Watch for finished timers and play sound
  watch(() => activeTimers.value, (timers) => {
    timers.forEach(timer => {
      if (timer.hasFinished && !timersPinged.value.has(timer.id)) {
        timersPinged.value.add(timer.id);
        playBellSound();
        
        // Remove timer after 3 seconds (after 3 beeps finish: 0.5s + 0.8s + 0.8s = 2.1s, so 3s is safe)
        setTimeout(() => {
          multiTimerManager.removeTimer(timer.id);
        }, 3000);
      }
    });
  }, { deep: true });

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
    
    <!-- Recipe Completion Screen -->
    <RecipeCompletion 
      v-else-if="mode === 'recipe-completion'"
      :recipe-name="selectedRecipe?.title ?? 'Rezept'"
      :thumb-up-progress="completionThumbProgress"
      @back-to-selection="backToRecipeSelection"
    />
    
    <!-- Recipe Steps View -->
    <RecipeView 
      v-else
      :steps="steps"
      :step="step"
      :timer-open="timerOpen"
      :show-timer-confirmation="showTimerConfirmation"
      :detected-timer-seconds="detectedTimerSeconds"
      @prev="prevStep"
      @next="nextStep"
      @toggle-timer="toggleTimer"
    />

    <!-- Timer Overlay - shows all active timers (only in recipe mode) -->
    <TimerOverlay v-if="mode === 'recipe'" :timers="activeTimers" />

    <!-- Hidden video and canvas for gesture detection -->
    <div class="gesture-capture" :class="{ 'centered': mode === 'ingredients' }">
       <video 
      ref="videoRef" 
      class="video-feed" 
      autoplay 
      playsinline 
    />
    <canvas 
      ref="canvasRef" 
      class="canvas-overlay" 
    />
      
      <GestureOverlays 
        :mode="mode"
        :timer-open="timerOpen"
        :palm-progress="palmProgress"
        :pinch-swipe-delta-x="pinchSwipeDeltaX"
        :pinch-swipe-delta-y="pinchSwipeDeltaY"
        :recognition-hint="recognitionHint"
        :recognition-success="recognitionSuccess"
        :thumb-hold-progress="thumbHoldProgress"
        :fist-progress="fistProgress"
        :has-running-timers="hasRunningTimers"
      />
    </div>

    <div v-if="toast" class="toast">{{ toast }}</div>

    <!-- Timer Settings Menu - Shows active timers only -->
    <div v-if="timerOpen" class="timer-gesture-menu">
      <div class="timer-menu-card">
        <div class="timer-menu-header">
          <h2 class="timer-menu-title">⏱️ Timer Einstellungen</h2>
          <p class="timer-menu-subtitle">{{ activeTimers.length }} Timer aktiv</p>
        </div>

        <!-- Active Timers List -->
        <div class="active-timers-list">
          <div v-for="t in activeTimers" :key="t.id" class="active-timer-item">
            <div class="timer-item-label">{{ t.label }}</div>
            <div class="timer-item-time">{{ t.remaining }}</div>
            <div :class="['timer-item-status', t.hasFinished ? 'finished' : 'running']">
              {{ t.hasFinished ? '✓ Fertig' : '⏱️ Läuft' }}
            </div>
          </div>
        </div>

        <!-- Add Time Slider -->
        <div class="timer-slider-section">
          <div class="timer-slider-header">
            <label class="timer-slider-label">Zeit hinzufügen</label>
            <div class="timer-slider-value">{{ addTimerMinutes }} Min</div>
          </div>
          <input 
            type="range" 
            v-model.number="addTimerMinutes" 
            min="1" 
            max="60" 
            step="1" 
            class="timer-slider"
          />
          <div class="timer-slider-markers">
            <span>1 Min</span>
            <span>15 Min</span>
            <span>30 Min</span>
            <span>45 Min</span>
            <span>60 Min</span>
          </div>
        </div>

        <!-- Gesture Controls -->
        <div class="gesture-controls-grid-timer">
          <!-- Add Time (Thumbs Up) -->
          <div class="gesture-control-card">
            <div class="gesture-icon-circle green">
              <svg class="gesture-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </div>
            <div class="gesture-label">Zeit hinzufügen</div>
            <div class="gesture-hint">👍 Daumen hoch 3s</div>
            <div class="gesture-detail">{{ addTimerMinutes }} Min zu allen Timern</div>
          </div>

          <!-- Close Menu (Open Hand) -->
          <div class="gesture-control-card">
            <div class="gesture-icon-circle amber">
              <svg class="gesture-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div class="gesture-label">Schließen</div>
            <div class="gesture-hint">✋ Offene Hand 3s</div>
            <div class="gesture-detail">Menü schließen</div>
          </div>
        </div>

        <!-- Help Text -->
        <div class="timer-help-text">
          🤏 Slider: Pinch & Slide | 👍 Zeit hinzufügen: Daumen 3s | ✋ Schließen: Hand 3s
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
.video-feed {

  transform: scaleX(-1); /* Horizontale Spiegelung */
}

.canvas-overlay {

  transform: scaleX(-1); /* Canvas auch spiegeln */
}
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
  overflow: visible;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  z-index: 50;
  border: 2px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.gesture-capture.centered {
  top: 50%;
  left: 50%;
  right: auto;
  bottom: auto;
  transform: translate(-50%, -50%);
  width: 400px;
  height: 300px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.3);
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

/* Active Timers List */
.active-timers-list {
  background: #f8fafc;
  border-radius: 1rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  max-height: 200px;
  overflow-y: auto;
}

.active-timer-item {
  background: white;
  border-left: 4px solid #3b82f6;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.active-timer-item:last-child {
  margin-bottom: 0;
}

.timer-item-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  flex: 1;
}

.timer-item-time {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1e293b;
  margin: 0 1rem;
  min-width: 80px;
  text-align: right;
}

.timer-item-status {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
}

.timer-item-status.running {
  background: #dbeafe;
  color: #0369a1;
}

.timer-item-status.finished {
  background: #dcfce7;
  color: #166534;
}

/* Timer Slider Section */
.timer-slider-section {
  background: #f8fafc;
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.timer-slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.timer-slider-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
}

.timer-slider-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #3b82f6;
}

.timer-slider {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(to right, #dbeafe, #3b82f6);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
}

.timer-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
  transition: all 0.2s;
}

.timer-slider::-webkit-slider-thumb:hover {
  background: #2563eb;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.6);
}

.timer-slider::-moz-range-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
  transition: all 0.2s;
}

.timer-slider::-moz-range-thumb:hover {
  background: #2563eb;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.6);
}

.timer-slider-markers {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #94a3b8;
}

.gesture-controls-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.gesture-controls-grid-timer {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.gesture-control-card {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 1rem;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.2s;
}

.gesture-control-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
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
  margin-bottom: 0.5rem;
}

.gesture-detail {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
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
