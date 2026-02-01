<script setup lang="ts">
import { onMounted, ref, watch } from "vue";

const props = defineProps<{
  recipeName: string
  thumbUpProgress: number
}>()

const emit = defineEmits<{
  (e: 'back-to-selection'): void
}>()

const countdownSeconds = ref(3)
const isVisible = ref(false)
let countdownInterval: NodeJS.Timeout | null = null

onMounted(() => {
  isVisible.value = true
})

// Watch thumbUpProgress: countdown only runs when gesture is detected
watch(() => props.thumbUpProgress, (progress) => {
  if (progress >= 1.0) {
    // Gesture held for 3 seconds - return to selection
    emit('back-to-selection')
    if (countdownInterval) clearInterval(countdownInterval)
  } else if (progress > 0 && !countdownInterval) {
    // Gesture detected and countdown not running - start countdown
    countdownInterval = setInterval(() => {
      countdownSeconds.value--
      if (countdownSeconds.value <= 0) {
        if (countdownInterval) clearInterval(countdownInterval)
        countdownInterval = null
        // Auto-return after countdown reaches 0
        setTimeout(() => {
          emit('back-to-selection')
        }, 500)
      }
    }, 1000)
  } else if (progress === 0 && countdownInterval) {
    // Gesture released - stop countdown and reset
    if (countdownInterval) clearInterval(countdownInterval)
    countdownInterval = null
    countdownSeconds.value = 3
  }
})
</script>

<template>
  <div class="completion-container">
    <!-- Main content area -->
    <div class="content-wrapper">
      <div class="completion-card" :class="{ 'visible': isVisible }">

        <!-- Main text -->
        <div class="completion-content">
          <h1 class="completion-title">Glückwunsch!</h1>
          <p class="completion-text">{{ props.recipeName }} ist fertig</p>
          <p class="completion-subtitle">Du hast es geschafft! 🥳</p>
        </div>

        <!-- Thumbs up gesture indicator -->
        <div class="gesture-indicator">
          <div class="gesture-instruction">
            <div class="gesture-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </div>
            <div class="gesture-text">
              <div class="gesture-label">Daumen hoch halten um zurückzugehen</div>
              <div class="gesture-timer">{{ countdownSeconds }}s</div>
            </div>
          </div>
          
          <!-- Progress bar for thumbs up -->
          <div class="progress-ring-container">
            <svg class="progress-ring" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#f59e0b;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#f97316;stop-opacity:1" />
                </linearGradient>
              </defs>
              <circle class="progress-ring-bg" cx="50" cy="50" r="45" />
              <circle 
                class="progress-ring-progress" 
                cx="50" 
                cy="50" 
                r="45"
                :style="{ 
                  strokeDashoffset: 283 * (1 - props.thumbUpProgress)
                }"
              />
            </svg>
            <div class="progress-text">{{ Math.round(props.thumbUpProgress * 100) }}%</div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.completion-container {
  position: fixed;
  inset: 0;
  background: linear-gradient(to bottom right, #fffbeb, white, #fff7ed);
  overflow: hidden;
}

.content-wrapper {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.completion-card {
  background: white;
  border-radius: 2rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  padding: 3rem;
  max-width: 32rem;
  text-align: center;
  opacity: 0;
  transform: scale(0.8) translateY(20px);
  animation: slideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.completion-card.visible {
  opacity: 1;
  transform: scale(1) translateY(0);
}

.celebration-icon {
  position: relative;
  margin-bottom: 2rem;
}

.celebration-emoji {
  font-size: 5rem;
  animation: bounce 1s ease-in-out infinite;
}

.celebration-stars {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
}

.star {
  font-size: 2rem;
  animation: twinkle 1.5s ease-in-out infinite;
  display: inline-block;
}

.star:nth-child(1) {
  animation-delay: 0s;
}

.star:nth-child(2) {
  animation-delay: 0.3s;
}

.star:nth-child(3) {
  animation-delay: 0.6s;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes twinkle {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.8);
  }
}

.completion-content {
  margin-bottom: 2rem;
}

.completion-title {
  font-size: 2.5rem;
  font-weight: bold;
  color: #f59e0b;
  margin-bottom: 0.5rem;
}

.completion-text {
  font-size: 1.5rem;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.completion-subtitle {
  font-size: 1rem;
  color: #64748b;
}

.gesture-indicator {
  background: linear-gradient(to right, #fef3c7, #fed7aa);
  border-radius: 1.5rem;
  padding: 2rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 2rem;
}

.gesture-instruction {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.gesture-icon {
  width: 3.5rem;
  height: 3.5rem;
  background: linear-gradient(to bottom right, #f59e0b, #f97316);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  animation: pulse 2s ease-in-out infinite;
}

.gesture-icon svg {
  width: 1.75rem;
  height: 1.75rem;
  color: white;
  stroke-width: 2.5;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(245, 158, 11, 0);
  }
}

.gesture-text {
  text-align: left;
}

.gesture-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.gesture-timer {
  font-size: 1.25rem;
  font-weight: bold;
  color: #f59e0b;
}

.progress-ring-container {
  position: relative;
  width: 5rem;
  height: 5rem;
  flex-shrink: 0;
}

.progress-ring {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.progress-ring-bg {
  fill: none;
  stroke: rgba(102, 126, 234, 0.1);
  stroke-width: 4;
}

.progress-ring-progress {
  fill: none;
  stroke: url(#orangeGradient);
  stroke-width: 4;
  stroke-linecap: round;
  stroke-dasharray: 283;
  stroke-dashoffset: 283;
  transition: stroke-dashoffset 0.1s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.875rem;
  font-weight: bold;
  color: #f59e0b;
}

.auto-return-info {
  font-size: 0.875rem;
  color: #64748b;
  opacity: 0.8;
  font-style: italic;
}

/* SVG gradient definition */
::before {
  content: '';
}
</style>
