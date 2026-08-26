import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { Sidebar } from "./_components/Sidebar";
import { QuickComposer } from "./_components/QuickComposer";
import { FeedPost, type FeedPostProps, type BadgeKind } from "./_components/FeedPost";

type PostType = "meal" | "nap" | "activity" | "achievement" | "mood" | "photo" | "announcement";

const BADGE_MAP: Record<PostType, { kind: BadgeKind; label: string }> = {
  meal: { kind: "comida", label: "COMIDA" },
  nap: { kind: "siesta", label: "SIESTA" },
  activity: { kind: "actividad", label: "ACTIVIDAD" },
  achievement: { kind: "logro", label: "LOGRO" },
  mood: { kind: "animo", label: "ÁNIMO" },
  photo: { kind: "foto", label: "FOTO" },
  announcement: { kind: "anuncio", label: "ANUNCIO" },
};

async function getFeedPosts(): Promise<FeedPostProps[]> {
  const supabase = createClient(await cookies());

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (!userData) {
    return [];
  }

  let query = supabase
    .from("posts")
    .select(`
      id,
      type,
      body,
      published_at,
      author:users!author_id (
        id,
        full_name,
        avatar_url
      ),
      room:rooms (
        id,
        name
      ),
      post_children (
        child:children (
          id,
          full_name
        )
      ),
      post_photos (
        id,
        url,
        position
      )
    `)
    .order("published_at", { ascending: false });

  if (userData.role === "staff") {
    const { data: staffRooms } = await supabase
      .from("staff_rooms")
      .select("room_id")
      .eq("staff_id", user.id);

    const roomIds = staffRooms?.map((sr) => sr.room_id) || [];
    if (roomIds.length > 0) {
      query = query.in("room_id", roomIds);
    } else {
      return [];
    }
  } else if (userData.role === "parent") {
    const { data: parentChildren } = await supabase
      .from("parent_children")
      .select("child_id")
      .eq("parent_id", user.id);

    const childIds = parentChildren?.map((pc) => pc.child_id) || [];
    
    if (childIds.length > 0) {
      query = query.or(
        `post_children.child_id.in.(${childIds.join(",")}),type.eq.announcement`
      );
    } else {
      query = query.eq("type", "announcement");
    }
  }

  const { data: posts, error } = await query;

  if (error || !posts) {
    console.error("Error fetching posts:", error);
    return [];
  }

  const feedPosts: FeedPostProps[] = [];

  for (const post of posts) {
    const author = post.author as unknown as { id: string; full_name: string; avatar_url: string | null } | null;
    const postChildren = post.post_children as unknown as Array<{ child: { id: string; full_name: string } }>;
    const postPhotos = post.post_photos as unknown as Array<{ id: string; url: string; position: number }>;

    const authorName = author?.full_name || "Staff";
    const authorInitial = authorName.charAt(0).toUpperCase();
    
    const publishedDate = new Date(post.published_at);
    const timeStr = publishedDate.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    let audience = "toda la sala";
    if (postChildren && postChildren.length > 0) {
      if (postChildren.length === 1) {
        audience = `familia de ${postChildren[0].child.full_name}`;
      } else if (postChildren.length <= 3) {
        const names = postChildren.map((pc) => pc.child.full_name).join(", ");
        audience = `familias de ${names}`;
      } else {
        audience = `${postChildren.length} familias`;
      }
    }

    let photos: FeedPostProps["photos"] | undefined;
    if (postPhotos && postPhotos.length > 0) {
      const sortedPhotos = [...postPhotos].sort((a, b) => a.position - b.position);
      const photoUrls: Array<{ url: string; alt: string }> = [];
      
      for (const photo of sortedPhotos) {
        const { data: signedUrlData } = await supabase.storage
          .from("post-photos")
          .createSignedUrl(photo.url, 3600);
        
        if (signedUrlData?.signedUrl) {
          photoUrls.push({
            url: signedUrlData.signedUrl,
            alt: `Foto de ${authorName}`,
          });
        }
      }
      
      if (photoUrls.length > 0) {
        photos = photoUrls;
      }
    }

    feedPosts.push({
      avatar: {
        letter: authorInitial,
        bg: "#A9D9E8",
        color: "#1F7A93",
      },
      name: authorName,
      time: timeStr,
      badge: BADGE_MAP[post.type as PostType],
      audience,
      text: post.body,
      photos: photos,
      postId: post.id,
      likes: 0,
      comments: 0,
    });
  }

  return feedPosts;
}

export default async function Home() {
  const posts = await getFeedPosts();
  return (
    <div className="flex min-h-screen bg-app-bg">
      <Sidebar active="feed" />

      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        <div className="max-w-[760px] w-full mx-auto px-10 pt-[34px] pb-20">
          <div className="mb-6">
            <div className="text-[12.5px] font-extrabold tracking-[0.8px] text-primary mb-1">
              GUARDERÍA · SALA SOLES
            </div>
            <h1 className="font-display font-semibold text-[30px] m-0 text-ink">
              Buenas, Caro
            </h1>
            <p className="m-[5px_0_0] text-ink-muted text-[14.5px]">
              12 niños · martes 17 jun
            </p>
          </div>

          <QuickComposer />

          <div className="flex items-center gap-[14px] mb-[14px]">
            <span
              className="text-[12.5px] font-extrabold tracking-[0.8px]"
              style={{ color: "#8A7C6D" }}
            >
              PUBLICADO HOY
            </span>
            <span className="flex-1 h-px bg-rule" />
          </div>

          <div className="flex flex-col gap-4">
            {posts.map((post, i) => (
              <FeedPost key={i} {...post} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}