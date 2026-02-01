<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  steps: string[]
  step: number
  timerOpen: boolean
  showTimerConfirmation: boolean
  detectedTimerSeconds: number | null
}>()

const stepText = computed(() => props.steps[props.step] ?? "");

const emit = defineEmits<{
  (e: 'prev'): void
  (e: 'next'): void
  (e: 'toggle-timer'): void
}>()

// Format seconds to readable time string
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return minutes > 0 ? `${hours} Std ${minutes} Min` : `${hours} Std`
  }
  if (minutes > 0) {
    return secs > 0 ? `${minutes} Min ${secs} Sek` : `${minutes} Min`
  }
  return `${secs} Sek`
}
</script>

<template>
  <!-- Fullscreen gradient background -->
  <div class="recipe-container">
    <!-- Main content area -->
    <div class="content-wrapper">
      <div class="card-container">
        <!-- Step card -->
        <div class="step-card">
          <!-- Step number badge -->
          <div class="step-badge">
            {{ props.step + 1 }}
          </div>

          <!-- Step content -->
          <div class="step-content">
            <h2 class="step-title">Schritt {{ props.step + 1 }} von {{ props.steps.length }}</h2>
            <p class="step-text">{{ stepText }}</p>
          </div>

          <!-- Timer confirmation prompt (when timer detected in step) -->
          <div v-if="props.showTimerConfirmation && props.detectedTimerSeconds" class="timer-confirmation">
            <div class="timer-confirmation-icon">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="timer-confirmation-content">
              <div class="timer-confirmation-title">Timer erkannt</div>
              <div class="timer-confirmation-time">{{ formatTime(props.detectedTimerSeconds) }}</div>
              <div class="timer-confirmation-action">
                <svg class="thumbs-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
                <span>Daumen hoch 3s halten zum Starten</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation arrows -->
        <button
          v-if="props.step > 0"
          @click="emit('prev')"
          class="nav-arrow nav-arrow-left"
        >
          <svg class="arrow-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          v-if="props.step < props.steps.length - 1"
          @click="emit('next')"
          class="nav-arrow nav-arrow-right"
        >
          <svg class="arrow-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <!-- Progress dots -->
        <div class="progress-dots">
          <div
            v-for="(_, index) in props.steps"
            :key="index"
            class="dot"
            :class="{ 'dot-active': index === props.step, 'dot-completed': index < props.step }"
          />
        </div>
      </div>
    </div>

    <!-- Navigation instructions -->
    <div class="navigation-help">
      <div class="help-card">
        <div class="help-section">
          <div class="help-icon-group">
            <svg class="help-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            <svg class="help-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <div>
            <div class="help-label">Navigieren</div>
            <div class="help-action">Pinch & Flick</div>
          </div>
        </div>

        <div class="help-divider" />

        <div class="help-section cancel-section">
          <div class="help-gesture-icon">
            <span class="fist-emoji">✊</span>
          </div>
          <div>
            <div class="help-label">Abbrechen</div>
            <div class="help-action">Faust 5s</div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.recipe-container {
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

.card-container {
  max-width: 64rem;
  width: 100%;
  position: relative;
}

.step-card {
  background: white;
  border-radius: 1.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  padding: 3rem;
  min-height: 500px;
  display: flex;
  flex-direction: column;
  position: relative;
}

.step-badge {
  position: absolute;
  top: 2rem;
  right: 2rem;
  width: 4rem;
  height: 4rem;
  border-radius: 9999px;
  background: linear-gradient(to bottom right, #f59e0b, #f97316);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
}

.step-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.step-title {
  font-size: 1.5rem;
  color: #64748b;
  margin-bottom: 2rem;
  font-weight: 500;
}

.step-text {
  font-size: 2rem;
  line-height: 1.5;
  color: #1e293b;
  font-weight: 500;
  max-width: 48rem;
}

.timer-hint {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(to right, #fef3c7, #fed7aa);
  border: 2px solid #fbbf24;
  border-radius: 1rem;
  margin-top: auto;
}

.timer-hint-icon {
  width: 3rem;
  height: 3rem;
  background: #f59e0b;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.timer-hint-icon svg {
  width: 1.5rem;
  height: 1.5rem;
  color: white;
}

.timer-hint-text {
  text-align: left;
}

.hint-label {
  font-size: 0.75rem;
  color: #92400e;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.hint-action {
  font-size: 0.875rem;
  color: #78350f;
  font-weight: 500;
}

/* Timer confirmation prompt */
.timer-confirmation {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, #10b981, #059669);
  border-radius: 1.25rem;
  margin-top: auto;
  box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
  animation: slideUp 0.5s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.timer-confirmation-icon {
  width: 4rem;
  height: 4rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.timer-confirmation-icon svg {
  width: 2rem;
  height: 2rem;
  color: white;
}

.timer-confirmation-content {
  flex: 1;
  color: white;
  text-align: left;
}

.timer-confirmation-title {
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
  opacity: 0.9;
}

.timer-confirmation-time {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.timer-confirmation-action {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  opacity: 0.95;
  font-weight: 500;
}

.thumbs-icon {
  width: 1.25rem;
  height: 1.25rem;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

.nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 3.5rem;
  height: 3.5rem;
  background: white;
  border-radius: 9999px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: transform 0.2s;
}

.nav-arrow:hover {
  transform: translateY(-50%) scale(1.1);
}

.nav-arrow-left {
  left: -5rem;
}

.nav-arrow-right {
  right: -5rem;
}

.arrow-icon {
  width: 2rem;
  height: 2rem;
  color: #1e293b;
}

.progress-dots {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
}

.dot {
  height: 0.5rem;
  width: 0.5rem;
  border-radius: 9999px;
  background: #cbd5e1;
  transition: all 0.3s;
}

.dot-active {
  width: 2rem;
  background: #f59e0b;
}

.dot-completed {
  background: #22c55e;
}

.navigation-help {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
}

.help-card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  padding: 1rem 1.5rem;
  border: 2px solid #fed7aa;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.help-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.help-icon-group {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.help-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #f59e0b;
}

.help-gesture-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  background: linear-gradient(to bottom right, #fbbf24, #f59e0b);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.help-gesture-icon.thumbs-up {
  background: linear-gradient(to bottom right, #4ade80, #22c55e);
}

.gesture-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: white;
  stroke-width: 2.5;
}

.help-label {
  font-size: 0.625rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.help-action {
  font-size: 0.875rem;
  color: #1e293b;
  font-weight: 500;
}

.help-divider {
  width: 1px;
  height: 2.5rem;
  background: #cbd5e1;
}

.cancel-section {
  opacity: 0.85;
}

.fist-emoji {
  font-size: 1.25rem;
  display: block;
}

.w-6 { width: 1.5rem; height: 1.5rem; }
</style>
