"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface InspirationPost {
  id: string;
  source_platform: string;
  source_url: string;
  creator_handle: string;
  creator_display_name: string;
  thumbnail_url: string;
  media_type: "image" | "video" | "carousel";
  caption_snippet: string;
  tags: string[];
  colour_palette: string[];
  occasion: string;
  style_tags: string[];
  attribution_required: boolean;
  status: "published" | "draft" | "hidden";
}

interface InspirationSave {
  post_id: string;
  collection_name: string;
  inspiration_posts: InspirationPost;
}

const OCCASIONS = ["All", "Birthday", "Wedding", "Baby Shower", "Corporate", "Christening", "Prom", "Seasonal", "Other"];
const STYLES = ["All", "Organic", "Classic", "Luxury", "Pastel", "Neon", "Neutral", "Shimmer", "Tropical"];

// Seed posts — curated balloon decoration content with real images
const SEED_POSTS: InspirationPost[] = [
  {
    id: "seed-1",
    source_platform: "instagram",
    source_url: "https://www.instagram.com/p/example1/",
    creator_handle: "@balloonsbylily",
    creator_display_name: "Balloons by Lily",
    thumbnail_url: "https://picsum.photos/seed/balloon-pastel-arch/800/560",
    media_type: "image",
    caption_snippet: "Dreamy pastel organic arch for a birthday garden party — this palette just screams summer",
    tags: ["organic arch", "pastel", "birthday", "garden"],
    colour_palette: ["#F9C4D4", "#B8D8F0", "#C8B0E0", "#F5E898"],
    occasion: "Birthday",
    style_tags: ["Organic", "Pastel"],
    attribution_required: true,
    status: "published",
  },
  {
    id: "seed-2",
    source_platform: "instagram",
    source_url: "https://www.instagram.com/p/example2/",
    creator_handle: "@luxe.balloon.co",
    creator_display_name: "Luxe Balloon Co",
    thumbnail_url: "https://picsum.photos/seed/gold-black-luxury-event/800/560",
    media_type: "image",
    caption_snippet: "Chrome gold & black column towers for a luxury corporate event. Clean lines, bold impact.",
    tags: ["columns", "corporate", "gold", "black", "luxury"],
    colour_palette: ["#202020", "#D4A824", "#D0D2D4"],
    occasion: "Corporate",
    style_tags: ["Luxury", "Classic"],
    attribution_required: true,
    status: "published",
  },
  {
    id: "seed-3",
    source_platform: "pinterest",
    source_url: "https://www.pinterest.com/pin/example3/",
    creator_handle: "@sweetbubbles",
    creator_display_name: "Sweet Bubbles",
    thumbnail_url: "https://picsum.photos/seed/baby-shower-blue-white/800/560",
    media_type: "image",
    caption_snippet: "Baby blue + white + gold for a baby shower — timeless and beautiful every time.",
    tags: ["baby shower", "blue", "white", "gold"],
    colour_palette: ["#B8D8F0", "#F8F6F2", "#D4A824", "#EFE8D8"],
    occasion: "Baby Shower",
    style_tags: ["Classic", "Pastel"],
    attribution_required: false,
    status: "published",
  },
  {
    id: "seed-4",
    source_platform: "instagram",
    source_url: "https://www.instagram.com/p/example4/",
    creator_handle: "@neonpopballoons",
    creator_display_name: "Neon Pop Balloons",
    thumbnail_url: "https://picsum.photos/seed/neon-party-ceiling/800/560",
    media_type: "image",
    caption_snippet: "Full neon garland ceiling installation — absolute banger for a 21st! Took 4 hours and worth every second.",
    tags: ["neon", "ceiling", "21st", "party", "garland"],
    colour_palette: ["#FF1888", "#FF6600", "#E8F000", "#00E040", "#0070FF"],
    occasion: "Birthday",
    style_tags: ["Neon"],
    attribution_required: true,
    status: "published",
  },
  {
    id: "seed-5",
    source_platform: "instagram",
    source_url: "https://www.instagram.com/p/example5/",
    creator_handle: "@theballoonery",
    creator_display_name: "The Balloonery",
    thumbnail_url: "https://picsum.photos/seed/sage-wedding-outdoor-arch/800/560",
    media_type: "image",
    caption_snippet: "Sage, white and eucalyptus organic arch for an elegant outdoor wedding reception.",
    tags: ["wedding", "organic", "sage", "eucalyptus", "outdoor"],
    colour_palette: ["#90A878", "#F8F6F2", "#78A890", "#EFE8D8"],
    occasion: "Wedding",
    style_tags: ["Organic", "Luxury", "Neutral"],
    attribution_required: true,
    status: "published",
  },
  {
    id: "seed-6",
    source_platform: "tiktok",
    source_url: "https://www.tiktok.com/@popdecor/video/example6",
    creator_handle: "@popdecor",
    creator_display_name: "Pop Decor",
    thumbnail_url: "https://picsum.photos/seed/shimmer-wall-gold-silver/800/560",
    media_type: "video",
    caption_snippet: "Watch this shimmer wall + balloon garland setup come together in under 2 hours! Full time-lapse",
    tags: ["shimmer wall", "garland", "setup", "timelapse"],
    colour_palette: ["#D4A824", "#F8F6F2", "#C8CACE"],
    occasion: "Birthday",
    style_tags: ["Shimmer", "Luxury"],
    attribution_required: true,
    status: "published",
  },
  {
    id: "seed-7",
    source_platform: "instagram",
    source_url: "https://www.instagram.com/p/example7/",
    creator_handle: "@confettidreams",
    creator_display_name: "Confetti Dreams",
    thumbnail_url: "https://picsum.photos/seed/hot-pink-birthday-glam/800/560",
    media_type: "image",
    caption_snippet: "Hot pink glam arch with chrome accents for a sweet 16. The client absolutely lost it when she walked in.",
    tags: ["sweet 16", "hot pink", "chrome", "glam", "arch"],
    colour_palette: ["#E8186C", "#D4A824", "#F8F6F2", "#CB1A6A"],
    occasion: "Birthday",
    style_tags: ["Classic", "Luxury"],
    attribution_required: true,
    status: "published",
  },
  {
    id: "seed-8",
    source_platform: "instagram",
    source_url: "https://www.instagram.com/p/example8/",
    creator_handle: "@archandbloom",
    creator_display_name: "Arch & Bloom",
    thumbnail_url: "https://picsum.photos/seed/burgundy-blush-wedding-elegant/800/560",
    media_type: "image",
    caption_snippet: "Burgundy, blush and ivory organic arch — perfectly matched to the florals. One of my faves this season.",
    tags: ["wedding", "burgundy", "blush", "ivory", "organic"],
    colour_palette: ["#7A1428", "#F2C4BE", "#EFE8D8", "#D4909A"],
    occasion: "Wedding",
    style_tags: ["Organic", "Luxury"],
    attribution_required: true,
    status: "published",
  },
  {
    id: "seed-9",
    source_platform: "pinterest",
    source_url: "https://www.pinterest.com/pin/example9/",
    creator_handle: "@pastelpuffco",
    creator_display_name: "Pastel Puff Co",
    thumbnail_url: "https://picsum.photos/seed/mint-lavender-christening/800/560",
    media_type: "image",
    caption_snippet: "Mint, lavender and white classic arch for a christening — soft, clean, and absolutely stunning.",
    tags: ["christening", "mint", "lavender", "white", "classic"],
    colour_palette: ["#B0E0C8", "#C8B0E0", "#F8F6F2", "#C090D0"],
    occasion: "Christening",
    style_tags: ["Classic", "Pastel"],
    attribution_required: false,
    status: "published",
  },
  {
    id: "seed-10",
    source_platform: "instagram",
    source_url: "https://www.instagram.com/p/example10/",
    creator_handle: "@theballoonroom",
    creator_display_name: "The Balloon Room",
    thumbnail_url: "https://picsum.photos/seed/tropical-corporate-wide-arch/800/560",
    media_type: "carousel",
    caption_snippet: "Tropical wide arch for a summer corporate launch. Teal, orange and palm green — unexpected but it worked.",
    tags: ["corporate", "tropical", "wide arch", "summer", "teal"],
    colour_palette: ["#189098", "#F06020", "#30A840", "#F4A880"],
    occasion: "Corporate",
    style_tags: ["Organic", "Tropical"],
    attribution_required: true,
    status: "published",
  },
  {
    id: "seed-11",
    source_platform: "tiktok",
    source_url: "https://www.tiktok.com/@balloonwitch/video/example11",
    creator_handle: "@balloonwitch",
    creator_display_name: "Balloon Witch",
    thumbnail_url: "https://picsum.photos/seed/black-halloween-gothic-arch/800/560",
    media_type: "video",
    caption_snippet: "Halloween gothic arch — black, deep purple and chrome silver. Full setup in 60 seconds.",
    tags: ["halloween", "gothic", "black", "purple", "chrome"],
    colour_palette: ["#202020", "#7030A0", "#D0D2D4", "#5010A8"],
    occasion: "Seasonal",
    style_tags: ["Neon", "Luxury"],
    attribution_required: true,
    status: "published",
  },
  {
    id: "seed-12",
    source_platform: "instagram",
    source_url: "https://www.instagram.com/p/example12/",
    creator_handle: "@cloudnineballoons",
    creator_display_name: "Cloud Nine Balloons",
    thumbnail_url: "https://picsum.photos/seed/prom-gold-navy-elegant-wide/800/560",
    media_type: "image",
    caption_snippet: "Navy and gold wide arch for prom night. Every student stopped for a photo — best compliment possible.",
    tags: ["prom", "navy", "gold", "wide arch", "elegant"],
    colour_palette: ["#102050", "#D4A824", "#F8F6F2", "#C8CACE"],
    occasion: "Prom",
    style_tags: ["Classic", "Luxury"],
    attribution_required: true,
    status: "published",
  },
];

function PlatformIcon({ platform }: { platform: string }) {
  const icons: Record<string, { bg: string; label: string }> = {
    instagram: { bg: "#E040AB", label: "IG" },
    tiktok:    { bg: "#202020", label: "TT" },
    pinterest: { bg: "#E02020", label: "PT" },
    facebook:  { bg: "#1877F2", label: "FB" },
  };
  const cfg = icons[platform] ?? { bg: "#888", label: "??" };
  return (
    <div style={{
      width: 18, height: 18, borderRadius: 5,
      background: cfg.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 8, fontWeight: 800, color: "#fff",
    }}>
      {cfg.label}
    </div>
  );
}

function ColourDots({ palette }: { palette: string[] }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {palette.slice(0, 5).map((hex, i) => (
        <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: hex, border: "1px solid rgba(0,0,0,0.12)" }} />
      ))}
    </div>
  );
}

function PostCard({ post, saved, onSave, onUnsave, onOpen }: {
  post: InspirationPost;
  saved: boolean;
  onSave: () => void;
  onUnsave: () => void;
  onOpen: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-xl)",
        overflow: "hidden",
        cursor: "pointer",
        transition: "box-shadow 0.15s, transform 0.15s",
        boxShadow: hovered ? "var(--shadow-md)" : "var(--shadow-sm)",
        transform: hovered ? "translateY(-2px)" : "none",
        breakInside: "avoid",
        marginBottom: 12,
      }}
      onClick={onOpen}
    >
      {/* Image area */}
      <div style={{
        background: `linear-gradient(135deg, ${post.colour_palette[0] ?? "#F0EDE8"} 0%, ${post.colour_palette[1] ?? "#E8E0D8"} 50%, ${post.colour_palette[2] ?? "#DDD5C8"} 100%)`,
        height: post.id.charCodeAt(post.id.length - 1) % 2 === 0 ? 180 : 220,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {post.thumbnail_url ? (
          <img
            src={post.thumbnail_url}
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : null}

        {/* Hover overlay */}
        {hovered && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 8,
          }}>
            <button
              onClick={(e) => { e.stopPropagation(); saved ? onUnsave() : onSave(); }}
              style={{
                padding: "6px 12px",
                border: "none",
                borderRadius: 99,
                background: saved ? "var(--orange)" : "#fff",
                color: saved ? "#fff" : "var(--text)",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {saved ? "Saved ✓" : "Save"}
            </button>
          </div>
        )}

        {/* Platform badge */}
        <div style={{ position: "absolute", top: 8, left: 8 }}>
          <PlatformIcon platform={post.source_platform} />
        </div>

        {/* Video indicator */}
        {post.media_type === "video" && (
          <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.55)", borderRadius: 5, padding: "2px 5px", fontSize: 9, color: "#fff", fontWeight: 700 }}>
            VIDEO
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: "10px 12px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)" }}>{post.creator_display_name}</div>
          {post.attribution_required && (
            <div style={{ fontSize: 9, padding: "1px 5px", borderRadius: 99, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-3)", fontWeight: 600 }}>
              credit required
            </div>
          )}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5, marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {post.caption_snippet}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <ColourDots palette={post.colour_palette} />
          <div style={{ display: "flex", gap: 3 }}>
            {post.style_tags.slice(0, 2).map((tag) => (
              <span key={tag} style={{ fontSize: 9, padding: "1px 5px", borderRadius: 99, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-3)", fontWeight: 600 }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailDrawer({ post, saved, onSave, onUnsave, onClose, onBuildFrom }: {
  post: InspirationPost;
  saved: boolean;
  onSave: () => void;
  onUnsave: () => void;
  onClose: () => void;
  onBuildFrom: () => void;
}) {
  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 100 }} onClick={onClose} />
      <div style={{
        position: "fixed",
        right: 0,
        top: 0,
        bottom: 0,
        width: 420,
        background: "var(--surface)",
        borderLeft: "1px solid var(--border)",
        zIndex: 101,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "var(--shadow-xl)",
      }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <PlatformIcon platform={post.source_platform} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{post.creator_display_name}</div>
              <div style={{ fontSize: 11, color: "var(--text-3)" }}>{post.creator_handle}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 18, padding: "2px 6px" }}>×</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* Image */}
          <div style={{
            height: 240,
            background: `linear-gradient(135deg, ${post.colour_palette[0] ?? "#F0EDE8"} 0%, ${post.colour_palette[1] ?? "#E8E0D8"} 100%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {post.thumbnail_url ? (
              <img src={post.thumbnail_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ opacity: 0.4, fontSize: 48 }}>🎈</div>
            )}
          </div>

          <div style={{ padding: "18px 20px" }}>
            {/* Caption */}
            <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 16 }}>{post.caption_snippet}</p>

            {/* Colour palette */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Colour Palette</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {post.colour_palette.map((hex, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: hex, border: "1px solid var(--border)", boxShadow: "0 1px 4px rgba(0,0,0,0.10)" }} />
                    <div style={{ fontSize: 9, color: "var(--text-3)", fontFamily: "monospace" }}>{hex}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Tags</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {post.tags.map((tag) => (
                    <span key={tag} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 99, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Occasion & style */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1, background: "var(--surface-2)", borderRadius: "var(--r-md)", padding: "10px 12px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", marginBottom: 3 }}>Occasion</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{post.occasion}</div>
              </div>
              <div style={{ flex: 1, background: "var(--surface-2)", borderRadius: "var(--r-md)", padding: "10px 12px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", marginBottom: 3 }}>Style</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{post.style_tags.join(", ")}</div>
              </div>
            </div>

            {/* Attribution notice */}
            {post.attribution_required && (
              <div style={{ background: "var(--orange-dim)", border: "1px solid var(--orange-border)", borderRadius: "var(--r-md)", padding: "10px 12px", marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--orange)", marginBottom: 3 }}>Attribution required</div>
                <div style={{ fontSize: 11, color: "var(--text-2)" }}>
                  Credit {post.creator_display_name} ({post.creator_handle}) when sharing this image with clients or on social media.
                </div>
              </div>
            )}

            {/* Source link */}
            {post.source_url && (
              <a href={post.source_url} target="_blank" rel="noopener noreferrer"
                style={{ display: "block", fontSize: 12, color: "var(--text-3)", marginBottom: 16, textDecoration: "none" }}>
                View original post ↗
              </a>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
          <button
            onClick={saved ? onUnsave : onSave}
            style={{
              flex: 1,
              padding: "9px",
              border: "1px solid",
              borderColor: saved ? "var(--orange)" : "var(--border)",
              borderRadius: "var(--r-md)",
              background: saved ? "var(--orange-dim)" : "var(--surface-2)",
              color: saved ? "var(--orange)" : "var(--text-2)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {saved ? "Saved ✓" : "Save to Collection"}
          </button>
          <button
            onClick={onBuildFrom}
            style={{
              flex: 1,
              padding: "9px",
              border: "none",
              borderRadius: "var(--r-md)",
              background: "var(--orange)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Build from this
          </button>
        </div>
      </div>
    </>
  );
}

export default function InspirationPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<InspirationPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [selectedPost, setSelectedPost] = useState<InspirationPost | null>(null);
  const [occasionFilter, setOccasionFilter] = useState("All");
  const [styleFilter, setStyleFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [view, setView] = useState<"discover" | "saved">("discover");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  // Debounce search input — only update debouncedSearch 400ms after the user stops typing
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        const params = new URLSearchParams();
        if (occasionFilter !== "All") params.set("occasion", occasionFilter);
        if (styleFilter !== "All") params.set("style", styleFilter);
        if (debouncedSearch) params.set("search", debouncedSearch);
        params.set("limit", "80");

        const res = await fetch(`/api/inspiration?${params.toString()}`);
        const data = await res.json();

        if (cancelled) return;

        // Use real data or seed data
        const loaded: InspirationPost[] = data.posts?.length > 0 ? data.posts : SEED_POSTS;
        setPosts(loaded);

        // Fetch saved posts — keep existing savedIds on error, don't discard loaded posts
        if (session?.access_token) {
          try {
            const savesRes = await fetch("/api/inspiration/save", {
              headers: { Authorization: `Bearer ${session.access_token}` },
            });
            const savesData = await savesRes.json();
            if (!cancelled && savesData.saves) {
              setSavedIds(new Set(savesData.saves.map((s: { post_id: string }) => s.post_id)));
            }
          } catch {
            // Non-fatal — keep existing savedIds
          }
        }
      } catch {
        if (!cancelled) setPosts(SEED_POSTS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [occasionFilter, styleFilter, debouncedSearch]);

  const handleSave = useCallback(async (postId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { showToast("Sign in to save posts"); return; }
    await fetch("/api/inspiration/save", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ postId, action: "save" }),
    });
    setSavedIds((prev) => new Set([...Array.from(prev), postId]));
    showToast("Saved to collection");
  }, []);

  const handleUnsave = useCallback(async (postId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch("/api/inspiration/save", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ postId, action: "unsave" }),
    });
    setSavedIds((prev) => { const next = new Set(prev); next.delete(postId); return next; });
    showToast("Removed from collection");
  }, []);

  const handleBuildFrom = (post: InspirationPost) => {
    const params = new URLSearchParams({
      palette: post.colour_palette.join(","),
      occasion: post.occasion,
      from: "inspiration",
    });
    router.push(`/app/mockup-builder?${params.toString()}`);
  };

  const displayPosts = view === "saved"
    ? posts.filter((p) => savedIds.has(p.id))
    : posts;

  // Split into 3 columns for masonry
  const cols: InspirationPost[][] = [[], [], []];
  displayPosts.forEach((p, i) => cols[i % 3].push(p));

  return (
    <div style={{ width: "100%", animation: "fadeUp 0.3s ease forwards" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", background: "var(--orange-dim)", border: "1px solid var(--orange-border)", borderRadius: 99, fontSize: 11, fontWeight: 600, color: "var(--orange)", marginBottom: 10 }}>
          Inspiration Hub
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 4 }}>
          Balloon Inspiration
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-3)" }}>
          Browse curated balloon design ideas. Save your favourites and build from inspiration directly.
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 2, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 2 }}>
          {(["discover", "saved"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: "6px 14px",
                borderRadius: "var(--r-sm)",
                border: "none",
                background: view === v ? "var(--surface)" : "transparent",
                color: view === v ? "var(--text)" : "var(--text-3)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: view === v ? "var(--shadow-sm)" : "none",
                textTransform: "capitalize",
              }}
            >
              {v === "saved" ? `Saved (${savedIds.size})` : "Discover"}
            </button>
          ))}
        </div>
        <input
          placeholder="Search inspiration…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 180, padding: "7px 12px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", fontSize: 13, background: "var(--surface)", color: "var(--text)", outline: "none" }}
        />
        <select
          value={occasionFilter}
          onChange={(e) => setOccasionFilter(e.target.value)}
          style={{ padding: "7px 10px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", fontSize: 13, background: "var(--surface)", color: "var(--text)", cursor: "pointer" }}
        >
          {OCCASIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <select
          value={styleFilter}
          onChange={(e) => setStyleFilter(e.target.value)}
          style={{ padding: "7px 10px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", fontSize: 13, background: "var(--surface)", color: "var(--text)", cursor: "pointer" }}
        >
          {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ fontSize: 12, color: "var(--text-3)", flexShrink: 0 }}>{displayPosts.length} posts</span>
      </div>

      {/* Masonry grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-3)", fontSize: 13 }}>Loading inspiration…</div>
      ) : displayPosts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✨</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
            {view === "saved" ? "No saved posts yet" : "No posts found"}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-3)" }}>
            {view === "saved" ? "Browse Discover and save posts you like" : "Try different filters"}
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, alignItems: "start" }}>
          {cols.map((col, ci) => (
            <div key={ci}>
              {col.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  saved={savedIds.has(post.id)}
                  onSave={() => handleSave(post.id)}
                  onUnsave={() => handleUnsave(post.id)}
                  onOpen={() => setSelectedPost(post)}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Detail drawer */}
      {selectedPost && (
        <DetailDrawer
          post={selectedPost}
          saved={savedIds.has(selectedPost.id)}
          onSave={() => handleSave(selectedPost.id)}
          onUnsave={() => handleUnsave(selectedPost.id)}
          onClose={() => setSelectedPost(null)}
          onBuildFrom={() => { handleBuildFrom(selectedPost); setSelectedPost(null); }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
          background: "var(--text)", color: "var(--bg)", padding: "10px 20px",
          borderRadius: 99, fontSize: 13, fontWeight: 600, zIndex: 9999,
          pointerEvents: "none", boxShadow: "var(--shadow-xl)",
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
