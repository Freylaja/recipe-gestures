# Natural Recipe Interface

Eine interaktive Kochanwendung mit gestenbasierter Steuerung für freihändiges Kochen. Das Projekt nutzt Hand-Tracking, um eine natürliche Interaktion zu ermöglichen.

## Features

### Gestensteuerung
- **Pinch & Flick**: Schnelle Navigation durch Rezepte
- **Daumen hoch/runter**: Bestätigen oder Abbrechen von Aktionen
- **Faust**: Abbruch-Geste

### Objekterkennung
- Automatisches Erkennen von Zutaten per Kamera (COCO-SSD)
- Visuelles Feedback bei erkannten Objekten
- Zuordnung zu Rezeptzutaten

### Timer-Management
- Mehrere parallel laufende Timer möglich
- Gestenbasierte Steuerung (Öffnen/Schließen/Slider)
- Visuelle Countdown-Anzeige
- Akustisches Signal bei Ablauf

### Rezept-Features
- Rezeptauswahl mit Vorschau
- Schritt-für-Schritt-Anleitung
- Zutatenliste
- Abschlussansicht

## Technologie-Stack

- **Frontend**: Vue 3 
- **Sprache**: TypeScript
- **Build-Tool**: Vite
- **Kamera**: 
  - MediaPipe Tasks Vision (Hand-Tracking)
  - TensorFlow.js mit COCO-SSD (Objekterkennung)

## Voraussetzungen

- Node.js (v18 oder höher)
- pnpm (empfohlen) oder npm
- Webcam für Hand-Tracking und Objekterkennung

## Installation

```bash
# Repository klonen
git clone <repository-url>
cd recipe-gestures

# Abhängigkeiten installieren
pnpm install

# Entwicklungsserver starten
pnpm run dev
```

## Projektstruktur

```
src/
├── App.vue                 # Hauptkomponente mit Anwendungslogik
├── main.ts                 # Entry Point
├── gestures.ts            # Gestenerkennung und -verarbeitung
├── vision.ts              # MediaPipe Hand-Tracking Setup
├── objectDetection.ts     # TensorFlow COCO-SSD Integration
├── timer.ts               # Timer-Logik und Multi-Timer-Management
├── components/
│   ├── RecipeSelection.vue     # Rezeptauswahl-Ansicht
│   ├── IngredientScanner.vue   # Zutatenerkennung per Kamera
│   ├── RecipeView.vue          # Schritt-für-Schritt-Ansicht
│   ├── GestureOverlays.vue     # Visuelle Gesten-Feedbacks
│   ├── TimerOverlay.vue        # Timer-Anzeige und -Steuerung
│   └── RecipeCompletion.vue    # Erfolgsansicht nach Abschluss
└── data/
    └── recipes.ts         # Rezeptdaten und Typen
```


**Viel Spaß beim Kochen! 👨‍🍳👩‍🍳**