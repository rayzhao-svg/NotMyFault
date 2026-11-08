// Leave room below Vercel's 4.5 MB request limit for JSON metadata and encoding.
const MAX_REQUEST_BYTES = 4_000_000;
const MAX_IMAGE_DATA_URL_LENGTH = 1_700_000;
const MAX_IMAGE_DIMENSION = 2048;

export function serializeApiRequest(payload: unknown): string {
  const body = JSON.stringify(payload);
  if (new Blob([body]).size > MAX_REQUEST_BYTES) {
    throw new Error('This case is too large to send. Please shorten the case details or use smaller photos, then try again.');
  }
  return body;
}

export async function prepareAnalysisImage(
  dataUrl: string,
  mimeType: string
): Promise<{ dataUrl: string; mimeType: string }> {
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('A photo could not be opened. Please select a valid JPEG, PNG, or WebP image.'));
    image.src = dataUrl;
  });

  if (!image.naturalWidth || !image.naturalHeight) {
    throw new Error('A photo has invalid dimensions. Please select another image.');
  }

  // Keep small supported images unchanged. Originals stay in the preview/report.
  if (
    /^image\/(jpeg|png|webp)$/.test(mimeType) &&
    dataUrl.length <= MAX_IMAGE_DATA_URL_LENGTH &&
    Math.max(image.naturalWidth, image.naturalHeight) <= MAX_IMAGE_DIMENSION
  ) {
    return { dataUrl, mimeType };
  }

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Photo preparation is unavailable in this browser. Please try another browser.');
  }

  let scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
  for (let attempt = 0; attempt < 5; attempt += 1) {
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.88, 0.78, 0.68]) {
      const prepared = canvas.toDataURL('image/jpeg', quality);
      if (prepared.startsWith('data:image/jpeg;base64,') && prepared.length <= MAX_IMAGE_DATA_URL_LENGTH) {
        return { dataUrl: prepared, mimeType: 'image/jpeg' };
      }
    }
    scale *= 0.8;
  }

  throw new Error('A photo could not be reduced for upload. Please choose a smaller image.');
}
