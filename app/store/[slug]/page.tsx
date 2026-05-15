import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import StorefrontClient from "./StorefrontClient";

export const dynamic = "force-dynamic";

interface StorefrontPackage {
  id: string;
  storefront_id: string;
  title: string;
  description: string;
  starting_price: number | null;
  fixed_price: number | null;
  tags: string[];
  occasion: string;
  image_url: string | null;
  visible: boolean;
  sort_order: number;
}

interface StorefrontData {
  id: string;
  user_id: string;
  slug: string;
  business_name: string;
  tagline: string;
  bio: string | null;
  logo_url: string | null;
  hero_url: string | null;
  brand_primary: string;
  brand_accent: string;
  enquiry_mode: "enquire" | "book";
  show_prices: boolean;
  collect_deposit: boolean;
  published: boolean;
  template: "studio" | "fiesta" | "luxe";
  gallery_urls: string[];
  contact_email: string | null;
  contact_phone: string | null;
  instagram_handle: string | null;
}

interface Testimonial {
  id: string;
  author_name: string;
  body: string;
  occasion: string;
  rating: number;
  sort_order: number;
}

async function getStorefront(slug: string) {
  const { data: storefront } = await supabaseAdmin
    .from("storefronts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!storefront) return null;

  const [{ data: packages }, { data: testimonials }] = await Promise.all([
    supabaseAdmin
      .from("storefront_packages")
      .select("*")
      .eq("storefront_id", storefront.id)
      .eq("visible", true)
      .order("sort_order", { ascending: true }),
    supabaseAdmin
      .from("storefront_testimonials")
      .select("*")
      .eq("storefront_id", storefront.id)
      .order("sort_order", { ascending: true }),
  ]);

  return { storefront, packages: packages ?? [], testimonials: testimonials ?? [] };
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const data = await getStorefront(params.slug);
  if (!data) return { title: "Storefront not found" };
  return {
    title: `${data.storefront.business_name} — Balloon Decor`,
    description: data.storefront.tagline,
  };
}

export default async function StorefrontPage({ params }: { params: { slug: string } }) {
  const data = await getStorefront(params.slug);
  if (!data) notFound();

  return (
    <StorefrontClient
      storefront={data.storefront as StorefrontData}
      packages={data.packages as StorefrontPackage[]}
      testimonials={data.testimonials as Testimonial[]}
    />
  );
}
