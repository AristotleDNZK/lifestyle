"use client";

export const MAX_OPTIMIZATION_IMAGE_EDGE = 1280;
export const MAX_OPTIMIZATION_IMAGE_BYTES = 360_000;

function dataUrlBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] || "";
  return Math.floor((base64.length * 3) / 4);
}

function loadImageFromBlob(blob: Blob) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image."));
    };
    image.src = url;
  });
}

function canvasToDataUrl(canvas: HTMLCanvasElement, quality: number) {
  return canvas.toDataURL("image/jpeg", quality);
}

function drawImageToCanvas(image: HTMLImageElement, maxEdge: number) {
  const largestEdge = Math.max(image.naturalWidth || 1, image.naturalHeight || 1);
  const scale = Math.min(1, maxEdge / largestEdge);
  const width = Math.max(1, Math.round((image.naturalWidth || 1) * scale));
  const height = Math.max(1, Math.round((image.naturalHeight || 1) * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Image compression is not available in this browser.");
  }

  ctx.drawImage(image, 0, 0, width, height);
  return canvas;
}

export async function compressImageToDataUrl(
  source: Blob,
  options: {
    maxEdge?: number;
    maxBytes?: number;
  } = {}
) {
  const maxEdge = options.maxEdge || MAX_OPTIMIZATION_IMAGE_EDGE;
  const maxBytes = options.maxBytes || MAX_OPTIMIZATION_IMAGE_BYTES;
  const image = await loadImageFromBlob(source);

  let edge = maxEdge;
  let quality = 0.86;
  let dataUrl = "";

  while (edge >= 640) {
    const canvas = drawImageToCanvas(image, edge);
    quality = 0.86;
    dataUrl = canvasToDataUrl(canvas, quality);

    while (dataUrlBytes(dataUrl) > maxBytes && quality > 0.44) {
      quality -= 0.08;
      dataUrl = canvasToDataUrl(canvas, quality);
    }

    if (dataUrlBytes(dataUrl) <= maxBytes) break;
    edge = Math.floor(edge * 0.82);
  }

  return dataUrl;
}
