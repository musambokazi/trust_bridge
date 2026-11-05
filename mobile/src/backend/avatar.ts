import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { File } from "expo-file-system";
import { supabase } from "./client";

export async function chooseAvatar(userId: string): Promise<string | null> {
  const selection = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8, exif: false,
  });
  if (selection.canceled || !selection.assets[0]) return null;
  const resized = await manipulateAsync(selection.assets[0].uri, [{ resize: { width: 512 } }], { compress: 0.8, format: SaveFormat.JPEG });
  const bytes = await new File(resized.uri).arrayBuffer();
  if (bytes.byteLength > 2097152) throw Error("Choose a smaller photo.");
  const path = userId + "/avatar.jpg";
  const { error } = await supabase.storage.from("avatars").upload(path, bytes, { contentType: "image/jpeg", upsert: true, cacheControl: "60" });
  if (error) throw Error("Photo upload failed. Check your connection.");
  return path;
}
