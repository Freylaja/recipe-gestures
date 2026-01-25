<script setup lang="ts">
import { defineProps } from 'vue'

const props = defineProps<{
  mode: 'ingredients' | 'recipe'
  timerOpen: boolean
  palmProgress: number
  pinchSwipeDeltaX: number
  pinchSwipeDeltaY: number
  recognitionHint: string
  recognitionSuccess: boolean
  thumbHoldProgress: number
}>()
</script>

<template>
  <!-- Palm progress indicator -->
  <div v-if="props.palmProgress > 0" class="palmProgress">
    <svg class="palmProgressRing" width="80" height="80">
      <circle cx="40" cy="40" r="32" fill="none" stroke="#374151" stroke-width="6" />
      <circle 
        cx="40" cy="40" r="32" fill="none" stroke="#4ade80" stroke-width="6" stroke-linecap="round"
        :stroke-dasharray="`${props.palmProgress * 201} 201`" transform="rotate(-90 40 40)" class="palmProgressFill"
      />
    </svg>
    <div class="palmProgressText">{{ Math.round(props.palmProgress * 100) }}%</div>
    <div class="palmProgressLabel">{{ props.timerOpen ? 'Timer abbrechen' : 'Timer aufrufen' }}</div>
  </div>

  <!-- Recognition hint overlay (ingredients mode) -->
  <div v-if="props.mode === 'ingredients' && props.recognitionHint" class="recognitionHint" :class="{ success: props.recognitionSuccess, pending: !props.recognitionSuccess }">
    <span class="hintIcon">{{ props.recognitionSuccess ? '✅' : '👀' }}</span>
    <span class="hintText">{{ props.recognitionHint }}</span>
  </div>

  <!-- Thumbs-up hold progress (ingredients mode) -->
  <div v-if="props.mode === 'ingredients' && props.thumbHoldProgress > 0" class="thumbHold">
    <svg width="90" height="90">
      <circle cx="45" cy="45" r="34" fill="none" stroke="#374151" stroke-width="6" />
      <circle cx="45" cy="45" r="34" fill="none" stroke="#60a5fa" stroke-width="6" stroke-linecap="round" :stroke-dasharray="`${props.thumbHoldProgress * 213} 213`" transform="rotate(-90 45 45)" />
    </svg>
    <div class="thumbHoldText">Daumen halten: {{ Math.round(props.thumbHoldProgress * 100) }}%</div>
  </div>

  <!-- Pinch swipe indicator -->
  <div v-if="Math.abs(props.pinchSwipeDeltaX) > 0.005 || Math.abs(props.pinchSwipeDeltaY) > 0.005" class="pinchSwipeIndicator">
    <svg width="200" height="200" viewBox="0 0 200 200">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <line x1="100" y1="100" :x2="100 + props.pinchSwipeDeltaX * 500" :y2="100 + props.pinchSwipeDeltaY * 500" stroke="#60a5fa" stroke-width="6" stroke-linecap="round" filter="url(#glow)" />
      <circle :cx="100 + props.pinchSwipeDeltaX * 500" :cy="100 + props.pinchSwipeDeltaY * 500" r="12" fill="#60a5fa" filter="url(#glow)" />
      <circle cx="100" cy="100" r="8" fill="#60a5fa" opacity="0.6" />
    </svg>
    <div class="pinchSwipeLabel">
      <div class="pinchSwipeArrow">
        {{ Math.abs(props.pinchSwipeDeltaX) > Math.abs(props.pinchSwipeDeltaY) ? (props.pinchSwipeDeltaX > 0 ? '→' : '←') : (props.pinchSwipeDeltaY > 0 ? '↓' : '↑') }}
      </div>
      <div class="pinchSwipeText">
        {{ Math.abs(props.pinchSwipeDeltaX) > Math.abs(props.pinchSwipeDeltaY) ? (props.pinchSwipeDeltaX > 0 ? 'Weiter' : 'Zurück') : (props.pinchSwipeDeltaY > 0 ? 'Runter' : 'Hoch') }}
      </div>
    </div>
  </div>
</template>

<style scoped>
/* All overlays are absolutely positioned within the parent */
.palmProgress { 
  position: absolute; top: 8px; right: 8px; 
  width: 60px; height: 60px; 
  display: flex; flex-direction: column; 
  align-items: center; justify-content: center; 
}
.palmProgressRing { position: relative; width: 100%; height: 100%; }
.palmProgressFill { transition: stroke-dasharray 0.1s ease; }
.palmProgressText { 
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  color: #4ade80; font-size: 10px; font-weight: bold; z-index: 1;
}
.palmProgressLabel { 
  margin-top: 2px; color: #e8e8e8; font-size: 8px; text-align: center; 
  background: rgba(0,0,0,0.7); padding: 2px 4px; border-radius: 4px;
  white-space: nowrap; max-width: 80px; overflow: hidden; text-overflow: ellipsis;
}

.pinchSwipeIndicator { 
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  pointer-events: none; z-index: 10; opacity: 0.9;
}
.pinchSwipeLabel { margin-top: 8px; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.pinchSwipeArrow { 
  color: #60a5fa; font-size: 24px; font-weight: bold; 
  text-shadow: 0 0 10px rgba(96, 165, 250, 0.8); 
  background: rgba(0,0,0,0.85); padding: 6px 12px; border-radius: 8px; 
  border: 2px solid #60a5fa; animation: pulse 0.8s ease-in-out infinite; 
}
.pinchSwipeText { 
  color: #60a5fa; font-size: 10px; font-weight: bold; 
  background: rgba(0,0,0,0.85); padding: 3px 8px; border-radius: 6px; 
  border: 1px solid #60a5fa; 
}

@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }

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

.thumbHold { 
  position: absolute; top: 8px; left: 8px; 
  display: flex; align-items: center; gap: 6px; 
  background: rgba(96, 165, 250, 0.12); border: 1px solid rgba(96, 165, 250, 0.4); 
  padding: 4px 8px; border-radius: 8px; 
}
.thumbHoldText { color: #60a5fa; font-weight: 600; font-size: 10px; }
</style>
