<script setup lang="ts">
import { computed } from 'vue'

interface Recipe {
  id: string
  title: string
  prepTime: string
  servings: number
  difficulty: string
  category: string
  image?: string
}

const props = defineProps<{
  recipes: Recipe[]
  thumbProgress: number
  currentRecipeIndex: number
}>()

const emit = defineEmits<{
  (e: 'select-recipe', index: number): void
  (e: 'next-recipe'): void
  (e: 'prev-recipe'): void
}>()

const currentRecipe = computed<Recipe | null>(() => props.recipes[props.currentRecipeIndex] ?? null)
const isSelecting = computed(() => props.thumbProgress > 0)
</script>

<template>
  <div class="recipe-selection" v-if="currentRecipe">
    <!-- Recipe Card -->
    <div class="card-wrapper">
      <div class="recipe-card">
        <!-- Recipe Header -->
        <div class="recipe-header">
          <div class="recipe-image">
            <img 
              v-if="currentRecipe.image" 
              :src="currentRecipe.image" 
              :alt="currentRecipe.title"
              class="recipe-img"
            />
            <div v-else class="image-placeholder">
              <svg class="placeholder-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div class="gradient-overlay" />
            
            <!-- Category Badge -->
            <div class="category-badge">{{ currentRecipe.category }}</div>
            
            <!-- Card Counter -->
            <div class="card-counter">{{ props.currentRecipeIndex + 1 }} / {{ props.recipes.length }}</div>
          </div>
        </div>

        <!-- Recipe Content -->
        <div class="recipe-content">
          <h2 class="recipe-title">{{ currentRecipe.title }}</h2>

          <!-- Meta Info -->
          <div class="meta-info">
            <div class="meta-item">
              <div class="meta-icon amber">
                <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="meta-text">
                <div class="meta-label">Zeit</div>
                <div class="meta-value">{{ currentRecipe.prepTime }}</div>
              </div>
            </div>

            <div class="meta-item">
              <div class="meta-icon blue">
                <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div class="meta-text">
                <div class="meta-label">Portionen</div>
                <div class="meta-value">{{ currentRecipe.servings }}</div>
              </div>
            </div>

            <div class="meta-item">
              <div class="meta-icon purple">
                <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div class="meta-text">
                <div class="meta-label">Level</div>
                <div class="meta-value">{{ currentRecipe.difficulty }}</div>
              </div>
            </div>
          </div>

          <!-- Selection Section -->
          <div class="selection-section">
            <div class="selection-text-area">
              <p class="selection-main-text">
                {{ isSelecting ? 'Halte die Geste...' : 'Daumen hoch zum Auswählen' }}
              </p>
              
            </div>

            <!-- Thumbs Up Button -->
            <div class="thumbs-button-wrapper">
              <button class="thumbs-button" :class="{ 'thumbs-selecting': isSelecting }">
                <svg class="thumbs-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </button>
            </div>

            <!-- Progress Bar -->
            <div class="progress-bar-container">
              <div class="progress-bar-bg">
                <div 
                  class="progress-bar-fill" 
                  :style="{ width: (props.thumbProgress * 100) + '%' }" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation Arrows -->
      <button
        v-if="props.currentRecipeIndex > 0"
        @click="emit('prev-recipe')"
        class="nav-arrow nav-left"
      >
        <svg class="arrow-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        v-if="props.currentRecipeIndex < props.recipes.length - 1"
        @click="emit('next-recipe')"
        class="nav-arrow nav-right"
      >
        <svg class="arrow-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>

    <!-- Swipe Indicator Dots -->
    <div class="swipe-dots">
      <div
        v-for="(_, index) in props.recipes"
        :key="index"
        class="dot"
        :class="{ 'dot-active': index === props.currentRecipeIndex }"
      />
    </div>

    <!-- Help Text -->
    <div class="help-overlay">
      <div class="help-card">
        <div class="help-section">
          <div class="help-icons">
            <svg class="help-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            <svg class="help-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <div>
            <div class="help-label">Navigieren</div>
            <div class="help-action">🤏 Pinch & Wischen oder Pfeile</div>
          </div>
        </div>

        <div class="help-divider" />

        <div class="help-section">
          <div class="help-gesture-icon">
            <svg class="gesture-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
          </div>
          <div>
            <div class="help-label">Auswählen</div>
            <div class="help-action">3 Sek. halten</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.recipe-selection {
  position: fixed;
  inset: 0;
  background: linear-gradient(to bottom right, #0f172a, #1e293b);
  overflow: hidden;
}

.card-wrapper {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.recipe-card {
  max-width: 48rem;
  width: 100%;
  max-height: 90vh;
  background: white;
  border-radius: 1.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

.recipe-header {
  position: relative;
}

.recipe-image {
  position: relative;
  height: 24rem;
  overflow: hidden;
}

.recipe-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-icon {
  width: 8rem;
  height: 8rem;
  color: rgba(255, 255, 255, 0.5);
}

.gradient-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent 40%, transparent);
}

.category-badge {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-weight: 500;
  color: #1e293b;
}

.card-counter {
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-weight: 500;
  color: #1e293b;
}

.recipe-content {
  flex: 1;
  padding: 2rem;
  display: flex;
  flex-direction: column;
}

.recipe-title {
  font-size: 2.25rem;
  font-family: serif;
  margin-bottom: 1.5rem;
  color: #1e293b;
}

.meta-info {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.meta-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.meta-icon.amber {
  background: #fef3c7;
}

.meta-icon.blue {
  background: #dbeafe;
}

.meta-icon.purple {
  background: #f3e8ff;
}

.icon {
  width: 1.5rem;
  height: 1.5rem;
}

.meta-icon.amber .icon {
  color: #b45309;
}

.meta-icon.blue .icon {
  color: #1e40af;
}

.meta-icon.purple .icon {
  color: #6b21a8;
}

.meta-text {
  text-align: left;
}

.meta-label {
  font-size: 0.75rem;
  color: #64748b;
}

.meta-value {
  font-weight: 500;
  color: #1e293b;
}

.selection-section {
  margin-top: auto;
}

.selection-text-area {
  text-align: center;
  margin-bottom: 1rem;
}

.selection-main-text {
  font-size: 1.125rem;
  color: #64748b;
  margin-bottom: 0.5rem;
  transition: all 0.3s;
}

.selection-sub-text {
  font-size: 0.875rem;
  color: #94a3b8;
  transition: all 0.3s;
}

.thumbs-button-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.thumbs-button {
  width: 6rem;
  height: 6rem;
  border-radius: 9999px;
  background: linear-gradient(to bottom right, #4ade80, #22c55e);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
}

.thumbs-button:hover {
  transform: scale(1.05);
}

.thumbs-button:active {
  transform: scale(0.95);
}

.thumbs-selecting {
  background: linear-gradient(to bottom right, #22c55e, #16a34a);
  transform: scale(1.1);
  animation: button-pulse 0.6s ease-in-out infinite;
  box-shadow: 0 0 40px rgba(34, 197, 94, 0.6);
}

@keyframes button-pulse {
  0%, 100% {
    transform: scale(1.1);
    box-shadow: 0 0 40px rgba(34, 197, 94, 0.6);
  }
  50% {
    transform: scale(1.15);
    box-shadow: 0 0 50px rgba(34, 197, 94, 0.8);
  }
}

.thumbs-icon {
  width: 3rem;
  height: 3rem;
  color: white;
  stroke-width: 2.5;
}

.progress-bar-container {
  position: relative;
  width: 100%;
  height: 0.75rem;
  background: #e2e8f0;
  border-radius: 9999px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.progress-bar-bg {
  position: relative;
  width: 100%;
  height: 100%;
}

.progress-bar-fill {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  background: linear-gradient(to right, #22c55e, #10b981);
  border-radius: 9999px;
  transition: width 0.1s linear;
  height: 100%;
}

/* Animation nur wenn thumbProgress > 0 */
.thumbs-selecting ~ .progress-bar-container .progress-bar-fill {
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.5);
  animation: glow-pulse 1s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%, 100% {
    box-shadow: 0 0 20px rgba(34, 197, 94, 0.5);
  }
  50% {
    box-shadow: 0 0 30px rgba(34, 197, 94, 0.9), 0 0 40px rgba(34, 197, 94, 0.6);
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

.nav-left {
  left: -5rem;
}

.nav-right {
  right: -5rem;
}

.arrow-icon {
  width: 2rem;
  height: 2rem;
  color: #1e293b;
}

.swipe-dots {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.5rem;
}

.dot {
  height: 0.5rem;
  width: 0.5rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.5);
  transition: all 0.3s;
}

.dot-active {
  width: 2rem;
  background: white;
}

.help-overlay {
  position: absolute;
  top: 2rem;
  left: 50%;
  transform: translateX(-50%);
}

.help-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-radius: 1rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 2rem;
}

.help-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.help-icons {
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
  background: linear-gradient(to bottom right, #4ade80, #22c55e);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
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
</style>
