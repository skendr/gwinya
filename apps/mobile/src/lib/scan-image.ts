import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

// Mirror the web's downscale (components/food-scan/camera-capture.tsx):
// cap the longest edge at 1280px, JPEG quality 0.82. Keeps the vision upload
// small (~200-500 KB) and well under the route's 5 MiB cap.
const MAX_EDGE = 1280;
const JPEG_QUALITY = 0.82;

export type CapturedImage = { dataUrl: string; localUri: string };

async function downscale(uri: string, width: number, height: number): Promise<CapturedImage> {
  const longest = Math.max(width, height);
  const actions =
    longest > MAX_EDGE
      ? [{ resize: width >= height ? { width: MAX_EDGE } : { height: MAX_EDGE } }]
      : [];
  const out = await manipulateAsync(uri, actions, {
    compress: JPEG_QUALITY,
    format: SaveFormat.JPEG,
    base64: true,
  });
  return { dataUrl: `data:image/jpeg;base64,${out.base64 ?? ""}`, localUri: out.uri };
}

/** Take a photo with the rear camera (device only). Returns null if denied/cancelled. */
export async function captureFromCamera(): Promise<CapturedImage | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 1 });
  const asset = res.canceled ? null : res.assets[0];
  return asset ? downscale(asset.uri, asset.width, asset.height) : null;
}

/** Pick from the photo library (works on the simulator for testing). */
export async function captureFromLibrary(): Promise<CapturedImage | null> {
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1 });
  const asset = res.canceled ? null : res.assets[0];
  return asset ? downscale(asset.uri, asset.width, asset.height) : null;
}
