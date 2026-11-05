/** Limits and sizing for photos on a review. */
export const REVIEW_PHOTO_BUCKET = 'review-photos'
export const REVIEW_PHOTO_MAX = 5
export const REVIEW_PHOTO_MAX_BYTES = 10 * 1024 * 1024
export const REVIEW_PHOTO_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
}

const MAX_EDGE = 1600

/** The size to resize to: the longest edge at most 1600px, never scaled up. */
export function fitPhoto(width: number, height: number) {
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

/** Shrinks a photo so five still fit one request; one the browser can't read (HEIC on Chrome) goes as it is. */
export async function shrinkPhoto(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file)
    const size = fitPhoto(bitmap.width, bitmap.height)
    const canvas = document.createElement('canvas')
    canvas.width = size.width
    canvas.height = size.height
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, size.width, size.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85))
    return blob ? new File([blob], 'review.jpg', { type: 'image/jpeg' }) : file
  } catch {
    return file
  }
}
