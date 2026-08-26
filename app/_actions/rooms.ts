"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export async function getStaffRooms(): Promise<{ rooms: Array<{ id: string; name: string }> }> {
  const supabase = createClient(await cookies());

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { rooms: [] };
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!userData || userData.role !== "staff") {
    return { rooms: [] };
  }

  const { data: staffRooms, error } = await supabase
    .from("staff_rooms")
    .select(`
      room_id,
      rooms:rooms (
        id,
        name
      )
    `)
    .eq("staff_id", user.id);

  if (error || !staffRooms) {
    return { rooms: [] };
  }

  const rooms = staffRooms
    .map((sr) => {
      const room = sr.rooms as unknown as { id: string; name: string } | null;
      return room;
    })
    .filter((room): room is { id: string; name: string } => room !== null);

  return { rooms };
}

export async function getRoomChildren(roomId: string): Promise<{ children: Array<{ id: string; full_name: string; avatar_url: string | null }> }> {
  const supabase = createClient(await cookies());

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { children: [] };
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!userData || userData.role !== "staff") {
    return { children: [] };
  }

  const { data: staffRoom } = await supabase
    .from("staff_rooms")
    .select("room_id")
    .eq("staff_id", user.id)
    .eq("room_id", roomId)
    .single();

  if (!staffRoom) {
    return { children: [] };
  }

  const { data: children, error } = await supabase
    .from("children")
    .select("id, full_name, avatar_url")
    .eq("room_id", roomId)
    .eq("status", "active")
    .order("full_name");

  if (error || !children) {
    return { children: [] };
  }

  return { children };
}

export async function getUserPreferences(): Promise<{ lastRoomId: string | null }> {
  const supabase = createClient(await cookies());

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { lastRoomId: null };
  }

  const { data: preferences, error } = await supabase
    .from("user_preferences")
    .select("last_room_id")
    .eq("user_id", user.id)
    .single();

  if (error || !preferences) {
    return { lastRoomId: null };
  }

  return { lastRoomId: preferences.last_room_id };
}

export async function updateLastRoomId(roomId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient(await cookies());

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "No autorizado" };
  }

  const { error } = await supabase
    .from("user_preferences")
    .upsert(
      {
        user_id: user.id,
        last_room_id: roomId,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      },
    );

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
