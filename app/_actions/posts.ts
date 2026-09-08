"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function createPost(formData: FormData): Promise<{ success?: boolean; postId?: string; error?: string }> {
  const supabase = createClient(await cookies());

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "No autorizado" };
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!userData || userData.role !== "staff") {
    return { success: false, error: "No autorizado" };
  }

  const descripcion = formData.get("descripcion") as string;
  const tipo = (formData.get("tipo") as string) || "activity";
  const roomId = formData.get("room_id") as string;
  const childIdsJson = formData.get("child_ids") as string;
  const photoPathsJson = formData.get("photo_paths") as string;

  let childIds: string[] = [];
  let photoPaths: string[] = [];

  try {
    childIds = childIdsJson ? JSON.parse(childIdsJson) : [];
    photoPaths = photoPathsJson ? JSON.parse(photoPathsJson) : [];
  } catch {
    return { success: false, error: "Datos inválidos" };
  }

  if (!descripcion || descripcion.trim() === "") {
    return { success: false, error: "La descripción es obligatoria" };
  }

  if (!roomId) {
    return { success: false, error: "La sala es obligatoria" };
  }

  const { data: post, error: postError } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      room_id: roomId,
      type: tipo,
      body: descripcion.trim(),
      published_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (postError || !post) {
    return { success: false, error: postError?.message || "Error al crear publicación" };
  }

  if (childIds.length > 0) {
    const postChildren = childIds.map((childId) => ({
      post_id: post.id,
      child_id: childId,
    }));

    const { error: childrenError } = await supabase.from("post_children").insert(postChildren);

    if (childrenError) {
      return { success: false, error: childrenError.message };
    }
  }

  if (photoPaths.length > 0) {
    const postPhotos = photoPaths.map((tempPath, index) => {
      const fileName = tempPath.split("/").pop();
      const newPath = `${user.id}/${post.id}/${index}_${fileName}`;

      return {
        post_id: post.id,
        url: newPath,
        position: index,
        tempPath,
        newPath,
      };
    });

    for (const photo of postPhotos) {
      const { error: moveError } = await supabase.storage
        .from("post-photos")
        .move(photo.tempPath, photo.newPath);

      if (moveError) {
        return { success: false, error: `Error al mover foto: ${moveError.message}` };
      }
    }

    const photosToInsert = postPhotos.map((photo) => ({
      post_id: photo.post_id,
      url: photo.newPath,
      position: photo.position,
    }));

    const { error: photosError } = await supabase.from("post_photos").insert(photosToInsert);

    if (photosError) {
      return { success: false, error: photosError.message };
    }
  }

  const { error: prefError } = await supabase.from("user_preferences").upsert(
    {
      user_id: user.id,
      last_room_id: roomId,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id",
    },
  );

  if (prefError) {
    console.error("Error al actualizar preferencias:", prefError.message);
  }

  revalidatePath("/");

  return { success: true, postId: post.id };
}

export async function uploadPostPhoto(file: File): Promise<{ success?: boolean; url?: string; path?: string; error?: string }> {
  const supabase = createClient(await cookies());

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error("uploadPostPhoto: No user");
    return { success: false, error: "No autorizado" };
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!userData || userData.role !== "staff") {
    console.error("uploadPostPhoto: User is not staff", userData);
    return { success: false, error: "No autorizado" };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: "La imagen no debe superar 5MB" };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { success: false, error: "Formato no permitido. Use JPEG, PNG o WebP" };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileName = `${crypto.randomUUID()}.webp`;
    const storagePath = `${user.id}/temp/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("post-photos")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("uploadPostPhoto: Upload error", uploadError);
      return { success: false, error: uploadError.message };
    }

    const { data: urlData } = supabase.storage.from("post-photos").getPublicUrl(storagePath);

    return { success: true, url: urlData.publicUrl, path: storagePath };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al procesar imagen";
    console.error("uploadPostPhoto: Exception", err);
    return { success: false, error: message };
  }
}

export async function deleteOrphanedPhotos(paths: string[]): Promise<{ success?: boolean; error?: string }> {
  const supabase = createClient(await cookies());

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "No autorizado" };
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!userData || userData.role !== "staff") {
    return { success: false, error: "No autorizado" };
  }

  if (paths.length === 0) {
    return { success: true };
  }

  const { error } = await supabase.storage.from("post-photos").remove(paths);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
