<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  mode: 'recipe-selection' | 'ingredients' | 'recipe' | 'recipe-completion'
  timerOpen: boolean
  palmProgress: number
  pinchSwipeDeltaX: number
  pinchSwipeDeltaY: number
  recognitionHint: string
  recognitionSuccess: boolean
  thumbHoldProgress: number
  thumbDownProgress: number
  fistProgress: number
  hasRunningTimers: boolean
}>()

// Invert X because camera is mirrored (scaleX(-1))
const invertedDeltaX = computed(() => -props.pinchSwipeDeltaX)
const invertedDeltaY = computed(() => props.pinchSwipeDeltaY)
</script>
<template>
  <!-- Palm progress indicator (only show in recipe mode when timers are running or menu is open) -->
  <div v-if="props.mode === 'recipe' && props.palmProgress > 0 && (props.hasRunningTimers || props.timerOpen)" class="palmProgress">
    <svg width="90" height="90">
      <circle cx="45" cy="45" r="34" fill="none" stroke="#374151" stroke-width="6" />
      <circle cx="45" cy="45" r="34" fill="none" stroke="#4ade80" stroke-width="6" stroke-linecap="round" :stroke-dasharray="`${props.palmProgress * 213} 213`" transform="rotate(-90 45 45)" />
    </svg>
    <div class="palmProgressText"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="hint-svg">
  <path stroke-linecap="round" stroke-linejoin="round" d="M10.05 4.575a1.575 1.575 0 1 0-3.15 0v3m3.15-3v-1.5a1.575 1.575 0 0 1 3.15 0v1.5m-3.15 0 .075 5.925m3.075.75V4.575m0 0a1.575 1.575 0 0 1 3.15 0V15M6.9 7.575a1.575 1.575 0 1 0-3.15 0v8.175a6.75 6.75 0 0 0 6.75 6.75h2.018a5.25 5.25 0 0 0 3.712-1.538l1.732-1.732a5.25 5.25 0 0 0 1.538-3.712l.003-2.024a.668.668 0 0 1 .198-.471 1.575 1.575 0 1 0-2.228-2.228 3.818 3.818 0 0 0-1.12 2.687M6.9 7.575V12m6.27 4.318A4.49 4.49 0 0 1 16.35 15m.002 0h-.002" />
</svg>
 {{ props.timerOpen ? 'Menü schließen' : 'Timer aufrufen' }}: {{ Math.round(props.palmProgress * 100) }}%</div>
  </div>

  <!-- Recognition hint overlay (ingredients mode) -->
  <div v-if="props.mode === 'ingredients' && props.recognitionHint" class="recognitionHint" :class="{ success: props.recognitionSuccess, pending: !props.recognitionSuccess }">
    <span class="hintIcon">{{ props.recognitionSuccess ? '✅' : '👀' }}</span>
    <span class="hintText">{{ props.recognitionHint }}</span>
  </div>

  <!-- Thumbs-up hold progress (ingredients mode OR recipe mode with timer confirmation OR recipe-completion mode) -->
  <div v-if="(props.mode === 'ingredients' || props.mode === 'recipe' || props.mode === 'recipe-completion') && props.thumbHoldProgress > 0" class="thumbHoldProgress">
    <svg width="90" height="90">
      <circle cx="45" cy="45" r="34" fill="none" stroke="#374151" stroke-width="6" />
      <circle cx="45" cy="45" r="34" fill="none" stroke="#3b82f6" stroke-width="6" stroke-linecap="round" :stroke-dasharray="`${props.thumbHoldProgress * 213} 213`" transform="rotate(-90 45 45)" />
    </svg>
    <div class="thumbHoldProgressText"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="hint-svg">
  <path stroke-linecap="round" stroke-linejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z" />
</svg>
 Daumen halten: {{ Math.round(props.thumbHoldProgress * 100) }}%</div>
  </div>

  <!-- Fist hold progress (recipe mode - for canceling) -->
  <div v-if="props.mode === 'recipe' && props.fistProgress > 0" class="fistProgress">
    <svg width="90" height="90">
      <circle cx="45" cy="45" r="34" fill="none" stroke="#374151" stroke-width="6" />
      <circle cx="45" cy="45" r="34" fill="none" stroke="#ef4444" stroke-width="6" stroke-linecap="round" :stroke-dasharray="`${props.fistProgress * 213} 213`" transform="rotate(-90 45 45)" />
    </svg>
    <div class="fistText">✊ Rezept abbrechen: {{ Math.round(props.fistProgress * 100) }}%</div>
  </div>

  <!-- Thumbs-down hold progress (recipe mode - for canceling timers) -->
  <div v-if="props.mode === 'recipe' && props.thumbDownProgress > 0" class="thumbDownProgress">
    <svg width="90" height="90">
      <circle cx="45" cy="45" r="34" fill="none" stroke="#374151" stroke-width="6" />
      <circle cx="45" cy="45" r="34" fill="none" stroke="#f97316" stroke-width="6" stroke-linecap="round" :stroke-dasharray="`${props.thumbDownProgress * 213} 213`" transform="rotate(-90 45 45)" />
    </svg>
    <div class="thumbDownText">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="hint-svg">
        <path stroke-linecap="round" stroke-linejoin="round" d="M7.498 15.25H4.372c-1.026 0-1.945-.694-2.054-1.715a12.137 12.137 0 0 1-.068-1.285c0-2.848.992-5.464 2.649-7.521C5.287 4.247 5.886 4 6.504 4h4.016a4.5 4.5 0 0 1 1.423.23l3.114 1.04a4.5 4.5 0 0 0 1.423.23h1.294M7.498 15.25c.618 0 .991.724.725 1.282A7.471 7.471 0 0 0 7.5 19.75 2.25 2.25 0 0 0 9.75 22a.75.75 0 0 0 .75-.75v-.633c0-.573.11-1.14.322-1.672.304-.76.93-1.33 1.653-1.715a9.04 9.04 0 0 0 2.86-2.4c.498-.634 1.226-1.08 2.032-1.08h.384m-10.253 1.5H9.7m8.075-9.75c.01.05.027.1.05.148.593 1.2.925 2.55.925 3.977 0 1.487-.36 2.89-.999 4.125m.023-8.25c-.076-.365.183-.75.575-.75h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398-.306.774-1.086 1.227-1.918 1.227h-1.053c-.472 0-.745-.556-.5-.96a8.95 8.95 0 0 0 .303-.54" />
      </svg>
      Alle Timer abbrechen: {{ Math.round(props.thumbDownProgress * 100) }}%
    </div>
  </div>

  <!-- Pinch swipe indicator - visible on recipe-selection and recipe modes -->
  <div v-if="(props.mode === 'recipe-selection' || props.mode === 'recipe') && Math.abs(invertedDeltaX) > 0.005 && Math.abs(invertedDeltaX) > Math.abs(invertedDeltaY)" class="pinchSwipeIndicator" :class="{ 'small': props.mode === 'recipe-selection' }">
    <!-- SVG mit Pfeilen und Linien -->
    <svg class="pinchSwipeSvg" width="140" height="140" viewBox="0 0 140 140">
      <defs>
        <filter id="pinchGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" filter="url(#pinchGlow)" />
        </marker>
      </defs>
      
      <!-- Start circle -->
      <circle cx="70" cy="70" r="8" fill="#3b82f6" opacity="0.8" filter="url(#pinchGlow)" />
      <circle cx="70" cy="70" r="8" fill="none" stroke="#60a5fa" stroke-width="2" opacity="0.5" />
      
      <!-- Direction line (only horizontal) -->
      <line 
        x1="70" y1="70" 
        :x2="70 + invertedDeltaX * 300" 
        y2="70" 
        stroke="#3b82f6" stroke-width="4" stroke-linecap="round" 
        filter="url(#pinchGlow)" marker-end="url(#arrowhead)"
        class="pinchLine"
      />
      
      <!-- End circle (direction indicator) -->
      <circle 
        :cx="70 + invertedDeltaX * 300" 
        cy="70" 
        r="7" fill="none" stroke="#3b82f6" stroke-width="2" 
        filter="url(#pinchGlow)" class="pinchEndCircle"
      />
      <circle 
        :cx="70 + invertedDeltaX * 300" 
        cy="70" 
        r="4" fill="#3b82f6" filter="url(#pinchGlow)" class="pinchEndDot"
      />
    </svg>
    
    <!-- Direction label -->
    <div class="pinchSwipeLabel">
      <div class="pinchSwipeText">
        {{ invertedDeltaX > 0 ? 'Zurück' : 'Weiter' }}
      </div>
    </div>
  </div>
</template>

<style scoped>
/* All overlays are absolutely positioned within the parent */
.palmProgress {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(0, 0, 0, 0.85);
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(74, 222, 128, 0.3);
  border: 2px solid #4ade80;
}

.palmProgress svg {
  margin-bottom: 8px;
}

.palmProgressText {
  color: #dcfce7;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
}

.palmProgressText .hint-svg {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.fistProgress {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(0, 0, 0, 0.85);
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  border: 2px solid #ef4444;
}

.fistProgress svg {
  margin-bottom: 8px;
}

.fistText {
  color: #fee2e2;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
}

.thumbDownProgress {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(0, 0, 0, 0.85);
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
  border: 2px solid #f97316;
}

.thumbDownProgress svg {
  margin-bottom: 8px;
}

.thumbDownText {
  color: #fed7aa;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
}

.thumbDownText .hint-svg {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.pinchSwipeIndicator { 
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  pointer-events: none; z-index: 10; opacity: 1;
}

.pinchSwipeIndicator.small .pinchSwipeSvg {
  width: 100px;
  height: 100px;
}

.pinchSwipeIndicator.small .pinchSwipeArrow {
  font-size: 20px;
  padding: 3px 6px;
}

.pinchSwipeIndicator.small .pinchSwipeText {
  font-size: 10px;
  padding: 2px 8px;
}

.pinchSwipeSvg {
  width: 140px;
  height: 140px;
  filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.6));
  animation: pinchPulse 0.6s ease-in-out infinite;
}

.pinchLine {
  animation: pinchLineGrow 0.3s ease-out forwards;
}

.pinchEndCircle {
  animation: pinchEndPulse 0.5s ease-in-out infinite;
}

.pinchEndDot {
  animation: pinchDotGlow 0.6s ease-in-out infinite;
}

@keyframes pinchLineGrow {
  from {
    stroke-dasharray: 0 1000;
    stroke-dashoffset: 0;
  }
  to {
    stroke-dasharray: 1000 1000;
    stroke-dashoffset: 0;
  }
}

@keyframes pinchEndPulse {
  0%, 100% {
    r: 14;
    stroke-width: 4;
    opacity: 0.8;
  }
  50% {
    r: 18;
    stroke-width: 5;
    opacity: 1;
  }
}

@keyframes pinchDotGlow {
  0%, 100% {
    r: 8;
    opacity: 0.9;
  }
  50% {
    r: 12;
    opacity: 1;
  }
}

@keyframes pinchPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.pinchSwipeLabel { 
  margin-top: 12px; 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  gap: 6px;
  z-index: 20;
  position: relative;
}

.pinchSwipeArrow { 
  color: #3b82f6;
  font-size: 28px; 
  font-weight: bold; 
  text-shadow: 0 0 20px rgba(59, 130, 246, 0.8); 
  background: rgba(0, 0, 0, 0.85);
  padding: 4px 8px;
  border-radius: 8px; 
  border: 2px solid #3b82f6;
  animation: arrowBounce 0.6s ease-in-out infinite;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
}

@keyframes arrowBounce {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
}

.pinchSwipeText { 
  color: #3b82f6;
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 1px;
  background: rgba(0, 0, 0, 0.85);
  padding: 4px 12px;
  border-radius: 8px;
  border: 1px solid #3b82f6;
  text-transform: uppercase;
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);
}

.recognitionHint { 
  position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); 
  display: flex; align-items: center; gap: 6px; 
  padding: 6px 10px; border-radius: 999px; backdrop-filter: blur(6px); 
  font-size: 9px; font-weight: 600; border: 2px solid; 
  max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.recognitionHint.pending { background: rgba(234, 179, 8, 0.15); border-color: #f59e0b; color: #fbbf24; }
.recognitionHint.success { background: rgba(74, 222, 128, 0.15); border-color: #22c55e; color: #4ade80; }
.recognitionHint .hintIcon { font-size: 12px; }
.recognitionHint .hintText { letter-spacing: 0.2px; }

.thumbHoldProgress {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(0, 0, 0, 0.85);
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  border: 2px solid #3b82f6;
}

.thumbHoldProgress svg {
  margin-bottom: 8px;
}

.thumbHoldProgressText {
  color: #dbeafe;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
}

.thumbHoldProgressText .hint-svg {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.thumbHold { 
  position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%);
  display: flex; flex-direction: column; align-items: center;
  background: rgba(0, 0, 0, 0.85); padding: 12px 16px; border-radius: 12px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); border: 2px solid #3b82f6;
}
.thumbHold svg { margin-bottom: 8px; }
.thumbHoldText { color: #dbeafe; font-weight: 600; font-size: 14px; text-align: center; white-space: nowrap; }
</style>
