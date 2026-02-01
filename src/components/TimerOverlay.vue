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
      <!-- Timer menu hint (when timers are running) -->
      <div v-if="props.timers.length > 0 && props.timers.some(t => !t.hasFinished)" class="timer-menu-hint">
        <div class="timer-menu-hint-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="hint-svg">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z" />
          </svg>
        </div>
        <div class="timer-menu-hint-text">3s für Timer-Menü</div>
      </div>

      <!-- Active timers -->
      <div 
        v-for="timer in props.timers" 
        :key="timer.id" 
        class="timer-item"
        :class="{ 'finished': timer.hasFinished }"
      >
        <div class="timer-icon">
          <svg v-if="!timer.hasFinished" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="timer-svg">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="timer-svg">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
        </div>
        <div class="timer-content">
          <div class="timer-label">{{ timer.label }}</div>
          <div class="timer-time">{{ timer.remaining }}</div>
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

.timer-svg {
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

.timer-menu-hint {
  background: rgba(59, 130, 246, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 10px;
  padding: 0.625rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  border: 2px solid #60a5fa;
  min-width: 180px;
  animation: slideIn 0.3s ease, pulseHint 2s ease-in-out infinite 0.5s;
}

.timer-menu-hint-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.timer-menu-hint-icon .hint-svg {
  width: 1.25rem;
  height: 1.25rem;
}

.timer-menu-hint-text {
  flex: 1;
  font-size: 0.8125rem;
  font-weight: 600;
  color: white;
  white-space: nowrap;
}

@keyframes pulseHint {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }
  50% {
    transform: scale(1.03);
    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.5);
  }
}
</style>
