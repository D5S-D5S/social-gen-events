import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "BalloonBase — The Balloon Business Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#fff",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px 96px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
          <div style={{ width: 48, height: 48, background: "#F05000", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 24, height: 24, background: "#fff", borderRadius: 4 }} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#0D0D0D", letterSpacing: "-0.02em" }}>
            Balloon<span style={{ color: "#F05000" }}>Base</span>
          </div>
        </div>

        {/* Headline */}
        <div style={{ fontSize: 68, fontWeight: 900, color: "#0D0D0D", letterSpacing: "-0.04em", lineHeight: 1.05, marginBottom: 24, maxWidth: 800 }}>
          Run your balloon business without the chaos.
        </div>

        {/* Sub */}
        <div style={{ fontSize: 26, color: "#6B7280", lineHeight: 1.5, maxWidth: 640 }}>
          Bookings, quotes, inventory, and clients — all in one place.
        </div>

        {/* Accent bar */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 8, background: "#F05000" }} />
      </div>
    ),
    { ...size }
  );
}
