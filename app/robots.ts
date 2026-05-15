import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/dashboard", "/admin", "/settings", "/quotes", "/customers", "/calendar", "/catalog", "/booking-forms", "/payments", "/analysis", "/ai-tools"] },
    ],
    sitemap: "https://balloon-base.vercel.app/sitemap.xml",
  };
}
