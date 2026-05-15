import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getPackageDetail(slug: string, packageId: string) {
  const { data: storefront } = await supabaseAdmin
    .from("storefronts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!storefront) return null;

  const { data: pkg } = await supabaseAdmin
    .from("storefront_packages")
    .select("*")
    .eq("id", packageId)
    .eq("storefront_id", storefront.id)
    .eq("visible", true)
    .single();

  if (!pkg) return null;

  const { data: related } = await supabaseAdmin
    .from("storefront_packages")
    .select("*")
    .eq("storefront_id", storefront.id)
    .eq("visible", true)
    .neq("id", packageId)
    .limit(3);

  return { storefront, pkg, related: related ?? [] };
}

export default async function PackageDetailPage({
  params,
}: {
  params: { slug: string; packageId: string };
}) {
  const data = await getPackageDetail(params.slug, params.packageId);
  if (!data) notFound();

  const { storefront, pkg, related } = data;
  const primary = storefront.brand_primary;
  const priceLabel = pkg.fixed_price
    ? `£${Number(pkg.fixed_price).toFixed(2)}`
    : pkg.starting_price
    ? `from £${Number(pkg.starting_price).toFixed(2)}`
    : null;

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif", background: "#FAFAF8", minHeight: "100vh" }}>
      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(250,250,248,0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #EDE8E3",
        padding: "0 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 60,
      }}>
        <Link href={`/store/${params.slug}`} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          {storefront.logo_url ? (
            <img src={storefront.logo_url} alt={storefront.business_name} style={{ height: 30, objectFit: "contain" }} />
          ) : (
            <div style={{ width: 30, height: 30, borderRadius: 8, background: primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff" }}>
              {storefront.business_name.charAt(0)}
            </div>
          )}
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A", letterSpacing: "-0.02em" }}>{storefront.business_name}</span>
        </Link>
        <Link href={`/store/${params.slug}#packages`} style={{ fontSize: 12, color: "#888", textDecoration: "none" }}>
          ← All Packages
        </Link>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 40, alignItems: "start" }}>
          {/* Left: image + description */}
          <div>
            {/* Hero image */}
            <div style={{
              height: 380,
              background: pkg.image_url ? "none" : `linear-gradient(135deg, ${primary}18 0%, ${primary}06 100%)`,
              borderRadius: 20,
              overflow: "hidden",
              marginBottom: 32,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {pkg.image_url ? (
                <img src={pkg.image_url} alt={pkg.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ fontSize: 60, opacity: 0.3 }}>🎈</div>
              )}
            </div>

            {/* Description */}
            <h1 style={{ fontSize: 30, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.03em", marginBottom: 12 }}>
              {pkg.title}
            </h1>

            {pkg.occasion && (
              <div style={{ marginBottom: 16 }}>
                <span style={{
                  fontSize: 11, padding: "3px 10px", borderRadius: 99,
                  background: `${primary}12`, color: primary,
                  fontWeight: 700, border: `1px solid ${primary}30`,
                }}>
                  {pkg.occasion}
                </span>
              </div>
            )}

            <p style={{ fontSize: 15, color: "#555", lineHeight: 1.7, marginBottom: 24 }}>
              {pkg.description}
            </p>

            {/* Tags */}
            {pkg.tags?.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Includes / Style</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {pkg.tags.map((tag: string) => (
                    <span key={tag} style={{
                      fontSize: 12, padding: "4px 12px", borderRadius: 99,
                      background: "#F4F0EB", color: "#555",
                      border: "1px solid #E8E0D8",
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: sticky booking sidebar */}
          <div style={{ position: "sticky", top: 80 }}>
            <div style={{
              background: "#fff",
              border: "1px solid #EDE8E3",
              borderRadius: 20,
              padding: "24px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            }}>
              {storefront.show_prices && priceLabel ? (
                <div style={{ fontSize: 28, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.03em", marginBottom: 4 }}>
                  {priceLabel}
                </div>
              ) : (
                <div style={{ fontSize: 16, color: "#888", marginBottom: 4 }}>Price on enquiry</div>
              )}

              {!pkg.fixed_price && pkg.starting_price && (
                <div style={{ fontSize: 12, color: "#999", marginBottom: 16 }}>Starting price — final price depends on requirements</div>
              )}

              <a
                href={`/store/${params.slug}?enquire=${pkg.id}`}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "13px",
                  border: "none",
                  borderRadius: 12,
                  background: primary,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  textAlign: "center",
                  textDecoration: "none",
                  marginBottom: 10,
                  boxSizing: "border-box",
                }}
              >
                {storefront.enquiry_mode === "book" ? "Book Now" : "Enquire About This Package"}
              </a>

              <Link
                href={`/store/${params.slug}`}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #DDD",
                  borderRadius: 12,
                  background: "transparent",
                  color: "#555",
                  fontSize: 13,
                  fontWeight: 600,
                  textAlign: "center",
                  textDecoration: "none",
                  boxSizing: "border-box",
                }}
              >
                View All Packages
              </Link>

              <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #EDE8E3" }}>
                <div style={{ fontSize: 11, color: "#999", lineHeight: 1.6 }}>
                  Get in touch and we&apos;ll tailor this package to your vision, budget, and colour scheme.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related packages */}
        {related.length > 0 && (
          <div style={{ marginTop: 60 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.03em", marginBottom: 24 }}>
              You might also like
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
              {related.map((r: { id: string; title: string; description: string; starting_price: number | null; fixed_price: number | null; image_url: string | null; occasion: string }) => (
                <Link
                  key={r.id}
                  href={`/store/${params.slug}/packages/${r.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <div style={{
                    background: "#fff",
                    border: "1px solid #EDE8E3",
                    borderRadius: 16,
                    overflow: "hidden",
                    transition: "box-shadow 0.2s",
                  }}>
                    <div style={{
                      height: 140,
                      background: r.image_url ? "none" : `${primary}12`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {r.image_url ? (
                        <img src={r.image_url} alt={r.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ fontSize: 28, opacity: 0.3 }}>🎈</div>
                      )}
                    </div>
                    <div style={{ padding: "12px 14px" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>{r.title}</div>
                      {storefront.show_prices && (
                        <div style={{ fontSize: 12, color: "#888" }}>
                          {r.fixed_price ? `£${Number(r.fixed_price).toFixed(2)}` : r.starting_price ? `from £${Number(r.starting_price).toFixed(2)}` : "Price on enquiry"}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ background: "#1A1A1A", padding: "24px", textAlign: "center", marginTop: 60 }}>
        <div style={{ fontSize: 13, color: "#666" }}>
          {storefront.business_name} · Powered by <span style={{ color: primary, fontWeight: 700 }}>BalloonBase</span>
        </div>
      </footer>
    </div>
  );
}
