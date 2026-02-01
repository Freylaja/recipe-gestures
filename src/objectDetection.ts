import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

export interface DetectedObject {
  class: string;
  score: number;
}

let model: cocoSsd.ObjectDetection | null = null;

export async function loadObjectDetectionModel() {
  if (!model) {
    console.log('Loading COCO-SSD model...');
    model = await cocoSsd.load();
    console.log('COCO-SSD model loaded!');
  }
  return model;
}

export async function detectObjects(video: HTMLVideoElement): Promise<DetectedObject[]> {
  if (!model) {
    await loadObjectDetectionModel();
  }
  
  if (!model) return [];
  
  const predictions = await model.detect(video);
  return predictions.map(pred => ({
    class: pred.class.toLowerCase(), // Normalize to lowercase
    score: pred.score
  }));
}

// Mapping von erkennbaren Objekten zu Zutaten-Namen
export const objectToIngredient: Record<string, string> = {
  'apple': 'Äpfel',
  'banana': 'Bananen',
  'orange': 'Orangen',
  'broccoli': 'Brokkoli',
  'carrot': 'Karotten',
  'bottle': 'Öl',
  'bowl': 'Schüssel',
  'spoon': 'Löffel',
  'cup': 'Tasse',
  'knife': 'Messer'
};

// Extended aliases for better detection
export const objectAliases: Record<string, string[]> = {
  'apple': ['apple', 'apfel'],
  'banana': ['banana', 'banane'],
  'orange': ['orange', 'oranges', 'citrus', 'orange fruit', 'fruit', 'ball', 'sphere', 'round', 'fruit ball'],
  'bottle': ['bottle', 'flasche', 'container'],
  'bowl': ['bowl', 'schüssel', 'dish'],
  'spoon': ['spoon', 'löffel'],
  'cup': ['cup', 'tasse', 'mug'],
  'knife': ['knife', 'messer'],
  'broccoli': ['broccoli', 'brokkoli'],
  'carrot': ['carrot', 'karotte']
};

export function matchIngredient(detectedClass: string, detectClassTarget: string | null): boolean {
  if (!detectClassTarget) return false;
  
  const normalized = detectedClass.toLowerCase().trim();
  const target = detectClassTarget.toLowerCase().trim();
  
  // Direct match
  if (normalized === target) return true;
  
  // Check aliases
  const aliases = objectAliases[target] || [];
  if (aliases.includes(normalized)) return true;
  
  // Special handling: generic terms for fruits
  const genericFruitTerms = ['fruit', 'ball', 'sphere', 'round', 'fruit ball'];
  if (genericFruitTerms.includes(normalized) && (target === 'apple' || target === 'orange' || target === 'banana')) {
    return true;
  }
  
  // Partial match (e.g., "apple" contains "apple")
  if (target.includes(normalized) || normalized.includes(target)) {
    return true;
  }
  
  // Check if target maps to ingredient and detected class contains part of ingredient name
  const mappedName = objectToIngredient[target];
  if (mappedName) {
    const mappedLower = mappedName.toLowerCase();
    return normalized.includes(mappedLower) || mappedLower.includes(normalized);
  }
  
  return false;
}

export function findMatchingDetectClass(detectedClass: string, availableDetectClasses: (string | null)[]): string | null {
  const normalized = detectedClass.toLowerCase().trim();
  
  for (const detectClass of availableDetectClasses) {
    if (matchIngredient(normalized, detectClass)) {
      return detectClass;
    }
  }
  
  return null;
}
