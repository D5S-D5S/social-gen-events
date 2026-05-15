type BrandLogoProps = {
  dark?: boolean;
  compact?: boolean;
  size?: "sm" | "md";
};

export default function BrandLogo({ dark = false, compact = false, size = "md" }: BrandLogoProps) {
  const textSize = size === "sm" ? 15 : 19;

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span
        aria-label="BalloonBase"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: textSize,
          fontWeight: 900,
          color: dark ? "#fff" : "var(--text)",
          letterSpacing: 0,
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        {compact ? (
          <>
            B<span style={{ color: "var(--orange)" }}>B</span>
          </>
        ) : (
          <>
            Balloon<span style={{ color: "var(--orange)" }}>Base</span>
          </>
        )}
      </span>
      {!compact && size === "md" && (
        <span
          aria-hidden="true"
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--orange)",
            boxShadow: "0 0 0 4px rgba(240,80,0,0.12)",
          }}
        />
      )}
    </div>
  );
}
