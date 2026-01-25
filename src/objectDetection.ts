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
    class: pred.class,
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

export function matchIngredient(detectedClass: string, ingredientName: string): boolean {
  const mappedName = objectToIngredient[detectedClass];
  if (mappedName) {
    return ingredientName.toLowerCase().includes(mappedName.toLowerCase());
  }
  return detectedClass.toLowerCase() === ingredientName.toLowerCase();
}
