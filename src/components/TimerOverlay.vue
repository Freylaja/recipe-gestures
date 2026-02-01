<script setup lang="ts">
export interface RunningTimer {
  id: number
  label: string
  remaining: string
  hasFinished: boolean
}

const props = defineProps<{
  timers: RunningTimer[]
}>()
</script>

<template>
  <div class="timer-overlay">
    <div class="timer-container">
      <!-- Active timers -->
      <div 
        v-for="timer in props.timers" 
        :key="timer.id" 
        class="timer-item"
        :class="{ 'finished': timer.hasFinished }"
      >
        <div class="timer-icon">
          <svg v-if="!timer.hasFinished" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div class="timer-content">
          <div class="timer-label">{{ timer.label }}</div>
          <div class="timer-time">{{ timer.remaining }}</div>
        </div>
      </div>
      
      <!-- Manual timer hint (only if no timers are running) -->
      <div v-if="props.timers.length === 0" class="timer-hint-item">
        <div class="timer-hint-icon">
          <svg class="hand-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
          </svg>
        </div>
        <div class="timer-hint-content">
          <div class="timer-hint-label">Manueller Timer</div>
          <div class="timer-hint-action">Hand 3s öffnen</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timer-overlay {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 1000;
  pointer-events: none;
}

.timer-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.timer-item {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 0.875rem 1.125rem;
  display: flex;
  align-items: center;
  gap: 0.875rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05);
  border: 2px solid #10b981;
  min-width: 180px;
  transition: all 0.3s ease;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.timer-item.finished {
  border-color: #f59e0b;
  background: rgba(254, 243, 199, 0.95);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3), 0 0 0 2px rgba(245, 158, 11, 0.2);
  }
  50% {
    box-shadow: 0 4px 20px rgba(245, 158, 11, 0.5), 0 0 0 4px rgba(245, 158, 11, 0.3);
  }
}

.timer-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  flex-shrink: 0;
}

.timer-item.finished .timer-icon {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  animation: ringBell 1s ease-in-out infinite;
}

@keyframes ringBell {
  0%, 100% {
    transform: rotate(0deg);
  }
  10%, 30% {
    transform: rotate(-10deg);
  }
  20%, 40% {
    transform: rotate(10deg);
  }
}

.timer-icon svg {
  width: 1.25rem;
  height: 1.25rem;
}

.timer-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.timer-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.timer-item.finished .timer-label {
  color: #92400e;
}

.timer-time {
  font-size: 1.125rem;
  font-weight: 700;
  color: #10b981;
  font-variant-numeric: tabular-nums;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.timer-item.finished .timer-time {
  color: #f59e0b;
}

/* Manual timer hint */
.timer-hint-item {
  background: rgba(249, 250, 251, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05);
  border: 2px dashed #d1d5db;
  min-width: 180px;
  transition: all 0.3s ease;
}

.timer-hint-item:hover {
  border-color: #9ca3af;
  background: rgba(243, 244, 246, 0.98);
}

.timer-hint-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #f59e0b, #f97316);
  color: white;
  flex-shrink: 0;
}

.hand-icon {
  width: 1.125rem;
  height: 1.125rem;
}

.timer-hint-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.timer-hint-label {
  font-size: 0.6875rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.timer-hint-action {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #374151;
}
</style>
