<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  ingredients: Array<{ name: string; checked: boolean; detectClass: string | null }>
  detectedObjects: string[]
  recognitionHint: string
  recognitionSuccess: boolean
}>()

const detectedCount = computed(() => props.ingredients.filter(i => i.checked).length)
const totalCount = computed(() => props.ingredients.length)
const allDetected = computed(() => detectedCount.value === totalCount.value)
const currentIngredient = computed(() => props.ingredients.find(i => !i.checked))
</script>

<template>
  <!-- Fullscreen camera overlay -->
  <div class="scanner-container">
    <!-- Camera overlay effects -->
    <div class="camera-overlay" />
    
    <!-- Scanning grid -->
    <div class="scanning-grid">
      <div v-for="i in 48" :key="i" class="grid-cell" />
    </div>

    <!-- Center scanning frame -->
    <div class="scanning-frame-wrapper">
      <div class="scanning-frame">
        <div class="corner corner-tl" />
        <div class="corner corner-tr" />
        <div class="corner corner-bl" />
        <div class="corner corner-br" />
        <div v-if="recognitionSuccess" class="scan-line" />
      </div>
    </div>

    <!-- Camera icon indicator -->
    <div class="camera-indicator">
      <div class="indicator-content">
        <svg class="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <div>
          <div class="indicator-title">Kamera aktiv</div>
          <div class="indicator-subtitle">Zutaten scannen</div>
        </div>
      </div>
    </div>

    <!-- Detection feedback center -->
    <div v-if="currentIngredient && recognitionSuccess" class="detection-popup">
      <svg class="sparkle-icon" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z" />
      </svg>
      <p class="detection-text">{{ currentIngredient.name }} erkannt!</p>
    </div>

    <!-- Ingredients checklist panel -->
    <div class="ingredients-panel">
      <div class="panel-card">
        <!-- Header -->
        <div class="panel-header">
          <h2 class="panel-title">Zutaten scannen</h2>
          <p class="panel-subtitle">Halte jede Zutat in die Kamera</p>
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${(detectedCount / totalCount) * 100}%` }" />
            </div>
            <span class="progress-text">{{ detectedCount }}/{{ totalCount }}</span>
          </div>
        </div>

        <!-- Ingredients list -->
        <div class="ingredients-list">
          <div 
            v-for="(ingredient, idx) in ingredients" 
            :key="idx"
            class="ingredient-card"
            :class="{
              'ingredient-checked': ingredient.checked,
              'ingredient-detecting': currentIngredient?.name === ingredient.name && recognitionSuccess
            }"
          >
            <div class="ingredient-checkbox" :class="{ 'checkbox-checked': ingredient.checked, 'checkbox-detecting': currentIngredient?.name === ingredient.name && recognitionSuccess }">
              <svg v-if="ingredient.checked" class="check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
              </svg>
              <svg v-else-if="currentIngredient?.name === ingredient.name && recognitionSuccess" class="spinner-icon" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div class="ingredient-info">
              <div class="ingredient-name" :class="{ 'name-checked': ingredient.checked }">{{ ingredient.name }}</div>
            </div>
            <div v-if="ingredient.checked" class="check-badge">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" class="check-badge-icon">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div v-if="allDetected" class="panel-footer">
          <div class="completion-content">
            <div class="completion-icon">
              <svg class="check-big" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p class="completion-title">Alle Zutaten gefunden!</p>
            <p class="completion-subtitle">Weiter zum Rezept...</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Help text -->
    <div class="help-text">
      <div class="help-bubble">
        <p class="help-content">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="help-icon">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
          </svg>
          Tipp: Halte Zutaten ins Bild oder nutze
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="help-icon">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z" />
          </svg>
          Daumen zum Bestätigen
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scanner-container {
  position: fixed;
  inset: 0;
  background: linear-gradient(to bottom right, #0f172a, #1e293b);
  overflow: hidden;
}

.camera-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.4), transparent 40%, transparent 60%, rgba(0,0,0,0.6));
}

.scanning-grid {
  position: absolute;
  inset: 0;
  opacity: 0.2;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(6, 1fr);
}

.grid-cell {
  border: 1px solid rgba(249, 115, 22, 0.3);
}

.scanning-frame-wrapper {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.scanning-frame {
  position: relative;
  width: 384px;
  height: 384px;
}

.corner {
  position: absolute;
  width: 64px;
  height: 64px;
  border-color: #fb923c;
}

.corner-tl { top: 0; left: 0; border-top: 4px solid; border-left: 4px solid; border-top-left-radius: 8px; }
.corner-tr { top: 0; right: 0; border-top: 4px solid; border-right: 4px solid; border-top-right-radius: 8px; }
.corner-bl { bottom: 0; left: 0; border-bottom: 4px solid; border-left: 4px solid; border-bottom-left-radius: 8px; }
.corner-br { bottom: 0; right: 0; border-bottom: 4px solid; border-right: 4px solid; border-bottom-right-radius: 8px; }

.scan-line {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.scan-line::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 4px;
  background: linear-gradient(to right, transparent, #fb923c, transparent);
  animation: scan 2s ease-in-out infinite;
}

@keyframes scan {
  0% { transform: translateY(0); }
  100% { transform: translateY(384px); }
}

.camera-indicator {
  position: absolute;
  top: 2rem;
  left: 2rem;
}

.indicator-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(12px);
  border-radius: 9999px;
  padding: 0.75rem 1rem;
  color: white;
}

.w-6 { width: 1.5rem; height: 1.5rem; }
.indicator-title { font-size: 0.875rem; font-weight: 500; }
.indicator-subtitle { font-size: 0.75rem; color: #fdba74; }

.detection-popup {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(249, 115, 22, 0.9);
  backdrop-filter: blur(12px);
  border-radius: 1rem;
  padding: 1.5rem 2rem;
  text-align: center;
  animation: pulse 1s ease-in-out infinite;
}

.sparkle-icon {
  width: 3rem;
  height: 3rem;
  color: white;
  margin: 0 auto 0.5rem;
}

.detection-text {
  color: white;
  font-size: 1.25rem;
  font-weight: 500;
}

.ingredients-panel {
  position: absolute;
  top: 1rem;
  right: 1rem;
  bottom: 1rem;
  width: 400px;
  display: flex;
  flex-direction: column;
}

.panel-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(16px);
  border-radius: 1.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 100%;
}

.panel-header {
  background: linear-gradient(to right, #f97316, #f59e0b);
  padding: 1.25rem 1.5rem;
  flex-shrink: 0;
}

.panel-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  margin-bottom: 0.5rem;
}

.panel-subtitle {
  font-size: 0.875rem;
  color: #fed7aa;
}

.progress-container {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.progress-bar {
  flex: 1;
  height: 0.5rem;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 9999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: white;
  border-radius: 9999px;
  transition: width 0.5s;
}

.progress-text {
  color: white;
  font-weight: 500;
  font-size: 0.875rem;
}

.ingredients-list {
  padding: 1rem 1.5rem 1.5rem 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
  min-height: 0;
}

/* Scrollbar styling */
.ingredients-list::-webkit-scrollbar {
  width: 8px;
}

.ingredients-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 10px;
  margin: 8px 0;
}

.ingredients-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

.ingredients-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.ingredient-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 1rem;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  transition: all 0.3s;
}

.ingredient-checked {
  background: #f0fdf4;
  border-color: #86efac;
}

.ingredient-detecting {
  background: #fff7ed;
  border-color: #fb923c;
  animation: pulse 1s ease-in-out infinite;
}

.ingredient-checkbox {
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  background: #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s;
}

.checkbox-checked {
  background: #22c55e;
}

.checkbox-detecting {
  background: #f97316;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.check-icon, .spinner-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: white;
  stroke-width: 3;
}

.ingredient-info {
  flex: 1;
  text-align: left;
}

.ingredient-name {
  font-size: 1rem;
  font-weight: 500;
  color: #1e293b;
  transition: all 0.3s;
}

.name-checked {
  color: #22c55e;
  text-decoration: line-through;
  opacity: 0.7;
}

.check-badge {
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  background: #22c55e;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  animation: checkPop 0.3s ease;
}

@keyframes checkPop {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.panel-footer {
  padding: 1.5rem;
  background: linear-gradient(to right, #f0fdf4, #d1fae5);
  border-top: 2px solid #86efac;
}

.completion-content {
  text-align: center;
}

.completion-icon {
  width: 4rem;
  height: 4rem;
  background: #22c55e;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.75rem;
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.check-big {
  width: 2.5rem;
  height: 2.5rem;
  color: white;
  stroke-width: 3;
}

.completion-title {
  color: #166534;
  font-weight: 500;
  font-size: 1.125rem;
  margin-bottom: 0.25rem;
}

.completion-subtitle {
  color: #16a34a;
  font-size: 0.875rem;
}

.help-text {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
}

.help-bubble {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(12px);
  border-radius: 9999px;
  padding: 0.75rem 1.5rem;
}

.help-bubble p {
  color: white;
  font-size: 0.875rem;
  margin: 0;
}

.help-content {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-wrap: wrap;
  justify-content: center;
}

.help-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.check-badge-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: white;
}

@keyframes pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.05); }
}
</style>
