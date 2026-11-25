// lib/shrinkPhoto.ts
//
// Photos straight from the camera roll are often 3-5 MB. Before uploading,
// scale them so the longer side is at most MAX_SIDE pixels and save as a
// compressed JPEG (usually a few hundred KB), so every feed tile and card
// downloads far less. Small photos keep their size and are only recompressed.
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const MAX_SIDE = 1080;
const QUALITY = 0.8;

/** A local URI of a smaller JPEG copy of the photo, or the original URI if
 *  shrinking fails (so an upload never breaks because of it). */
export async function shrinkPhoto(uri: string, maxSide = MAX_SIDE): Promise<string> {
  const context = ImageManipulator.manipulate(uri);
  try {
    let image = await context.renderAsync();
    const { width, height } = image;
    if (Math.max(width, height) > maxSide) {
      context.resize(width >= height ? { width: maxSide } : { height: maxSide });
      image.release();
      image = await context.renderAsync();
    }
    const saved = await image.saveAsync({ compress: QUALITY, format: SaveFormat.JPEG });
    image.release();
    return saved.uri;
  } catch (err) {
    console.warn('Could not shrink photo, uploading the original:', err);
    return uri;
  } finally {
    context.release();
  }
}
