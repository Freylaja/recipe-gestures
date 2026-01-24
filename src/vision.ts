import {
  FilesetResolver,
  HandLandmarker,
  DrawingUtils,
  type HandLandmarkerResult
} from "@mediapipe/tasks-vision";

export async function initVision(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user", width: 1280, height: 720 },
    audio: false
  });
  video.srcObject = stream;
  await video.play();

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d")!;
  const drawer = new DrawingUtils(ctx);

  const fileset = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  const handLandmarker = await HandLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"
    },
    runningMode: "VIDEO",
    numHands: 1
  });

  async function detectHands(): Promise<HandLandmarkerResult | null> {
    const now = performance.now();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const result = handLandmarker.detectForVideo(video, now);

    if (result.landmarks?.length) {
      for (const lm of result.landmarks) {
        drawer.drawConnectors(lm, HandLandmarker.HAND_CONNECTIONS);
        drawer.drawLandmarks(lm);
      }
      return result;
    }
    return null;
  }

  function stop() {
    stream.getTracks().forEach(t => t.stop());
  }

  return { detectHands, stop };
}
