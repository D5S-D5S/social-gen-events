"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ls, lsSet, LS_KEYS, SidebarState } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { isAdminEmail } from "@/lib/admin";
import BrandLogo from "@/components/BrandLogo";
import { getPlan } from "@/lib/plans";

const DEFAULT_STATE: SidebarState = {
  iconOnly: false,
  groups: { sales: true, tools: true, catalog: true, settings: true },
};

const GROUPS = [
  {
    key: "sales",
    label: "Sales",
    items: [
      { href: "/app/quick-quote", label: "Quick Quote" },
      { href: "/app/detailed-quote", label: "Detailed Quote" },
      { href: "/app/quotes", label: "Quotes" },
    ],
  },
  {
    key: "tools",
    label: "Tools",
    items: [
      { href: "/app/ai-length-estimator", label: "AI Length Estimator", badge: "PRO" },
      { href: "/app/mockup-builder", label: "Mockup Generator", badge: "PRO" },
    ],
  },
  {
    key: "catalog",
    label: "Catalog",
    items: [
      { href: "/app/catalog", label: "Catalog" },
      { href: "/app/inventory", label: "Inventory" },
      { href: "/app/packages", label: "Packages" },
      { href: "/app/add-ons", label: "Add-ons" },
    ],
  },
] as const;

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<SidebarState>(() => {
    const stored = ls(LS_KEYS.SIDEBAR, DEFAULT_STATE);
    return { ...DEFAULT_STATE, ...stored, groups: { ...DEFAULT_STATE.groups, ...(stored.groups ?? {}) } };
  });
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [plan, setPlan] = useState("starter");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      setUserEmail(user.email ?? null);
      setUserName(user.user_metadata?.business_name || user.user_metadata?.full_name || null);
      if (isAdminEmail(user.email)) setIsAdmin(true);

      supabase
        .from("profiles")
        .select("plan, is_admin")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.plan) setPlan(getPlan(String(data.plan)).label);
          if (data?.is_admin || isAdminEmail(user.email)) setIsAdmin(true);
        });
    });
  }, []);

  const save = (next: SidebarState) => {
    setState(next);
    lsSet(LS_KEYS.SIDEBAR, next);
  };

  const toggleGroup = (key: string) =>
    save({ ...state, groups: { ...state.groups, [key]: !state.groups[key] } });

  const toggleIconOnly = () => save({ ...state, iconOnly: !state.iconOnly });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  const width = state.iconOnly ? 58 : 236;
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const initials = userName
    ? userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : userEmail
      ? userEmail.slice(0, 2).toUpperCase()
      : "?";

  return (
    <aside style={{
      width,
      minWidth: width,
      height: "100vh",
      background: "var(--surface)",
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      transition: "width 0.2s ease, min-width 0.2s ease",
      overflow: "hidden",
    }}>
      <div style={{
        padding: state.iconOnly ? "16px 0" : "16px 14px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: state.iconOnly ? "center" : "space-between",
        minHeight: 58,
      }}>
        <BrandLogo size="sm" compact={state.iconOnly} />
        {!state.iconOnly && (
          <button onClick={toggleIconOnly} title="Collapse sidebar" style={iconButton}>
            {"<"}
          </button>
        )}
      </div>

      <nav style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>
        <Link href="/app/dashboard">
          <NavItem label="Dashboard" active={isActive("/app/dashboard")} iconOnly={state.iconOnly} icon="D" />
        </Link>

        {GROUPS.map((group) => {
          const open = state.groups[group.key] ?? true;
          return (
            <div key={group.key} style={{ marginTop: 16 }}>
              {!state.iconOnly && (
                <button onClick={() => toggleGroup(group.key)} style={groupButton}>
                  <span>{group.label}</span>
                  <span style={{ opacity: 0.7 }}>{open ? "v" : ">"}</span>
                </button>
              )}
              {(open || state.iconOnly) && group.items.map((item) => (
                <Link key={item.href} href={item.href}>
                  <NavItem label={item.label} badge={"badge" in item ? item.badge : undefined} active={isActive(item.href)} iconOnly={state.iconOnly} icon={item.label.slice(0, 1)} />
                </Link>
              ))}
            </div>
          );
        })}

        <div style={{ marginTop: 18 }}>
          {!state.iconOnly && <div style={sectionLabel}>Settings</div>}
          <Link href="/app/settings">
            <NavItem label="Settings" active={isActive("/app/settings")} iconOnly={state.iconOnly} icon="S" muted />
          </Link>
          <Link href="/app/account">
            <NavItem label="Account" active={isActive("/app/account")} iconOnly={state.iconOnly} icon="A" muted />
          </Link>
          <Link href="/app/billing">
            <NavItem label="Billing" active={isActive("/app/billing")} iconOnly={state.iconOnly} icon="B" muted />
          </Link>
          <Link href="/app/integrations">
            <NavItem label="Integrations" active={isActive("/app/integrations")} iconOnly={state.iconOnly} icon="I" muted />
          </Link>
          {isAdmin && (
            <Link href="/app/admin">
              <NavItem label="Admin" active={isActive("/app/admin")} iconOnly={state.iconOnly} icon="A" muted />
            </Link>
          )}
        </div>
      </nav>

      <div style={{ padding: state.iconOnly ? "8px 6px 12px" : "10px", borderTop: "1px solid var(--border)", position: "relative" }}>
        {state.iconOnly && (
          <button onClick={toggleIconOnly} title="Expand sidebar" style={{ ...iconButton, width: "100%", marginBottom: 6 }}>
            {">"}
          </button>
        )}

        <button
          onClick={() => setUserMenuOpen((v) => !v)}
          title={userEmail ?? "Account"}
          style={{
            width: "100%",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: state.iconOnly ? "6px 0" : "8px",
            borderRadius: "var(--r-md)",
            display: "flex",
            alignItems: "center",
            justifyContent: state.iconOnly ? "center" : "flex-start",
            gap: 8,
            textAlign: "left",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
        >
          <div style={avatar}>{initials}</div>
          {!state.iconOnly && (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {userName ?? userEmail ?? "Account"}
                </div>
                <span style={pill}>{isAdmin ? "admin" : plan}</span>
              </div>
              <span style={{ fontSize: 10, color: "var(--text-3)", opacity: 0.6 }}>^</span>
            </>
          )}
        </button>

        {userMenuOpen && (
          <>
            <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setUserMenuOpen(false)} />
            <div style={userMenu}>
              <Link href="/app/settings" onClick={() => setUserMenuOpen(false)} style={menuLink}>
                Settings
              </Link>
              <Link href="/app/account" onClick={() => setUserMenuOpen(false)} style={menuLink}>
                Account
              </Link>
              <Link href="/app/billing" onClick={() => setUserMenuOpen(false)} style={menuLink}>
                Billing
              </Link>
              <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
              <button onClick={() => { setUserMenuOpen(false); handleLogout(); }} style={logoutButton}>
                Log out
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

function NavItem({ label, badge, active, iconOnly, icon, muted }: { label: string; badge?: string; active: boolean; iconOnly: boolean; icon: string; muted?: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: iconOnly ? "9px 8px" : "8px 10px",
        borderRadius: "var(--r-md)",
        background: active ? "var(--orange-dim)" : hovered ? "var(--hover)" : "transparent",
        color: active ? "var(--orange)" : muted ? "var(--text-3)" : "var(--text-2)",
        fontSize: 13,
        fontWeight: active ? 800 : 600,
        display: "flex",
        alignItems: "center",
        gap: 9,
        justifyContent: iconOnly ? "center" : "flex-start",
        cursor: "pointer",
        marginBottom: 2,
        transition: "background 0.1s, color 0.1s",
        borderLeft: active ? "2px solid var(--orange)" : "2px solid transparent",
        paddingLeft: iconOnly ? undefined : active ? 8 : 10,
      }}
      title={iconOnly ? label : undefined}
    >
      {iconOnly ? (
        <span style={{ fontSize: 11, fontWeight: 900, fontFamily: "var(--font-display)", width: 18, textAlign: "center", opacity: active ? 1 : 0.6 }}>
          {icon}
        </span>
      ) : (
        <>
          <span style={{ flex: 1 }}>{label}</span>
          {badge && <span style={{ fontSize: 9, fontWeight: 900, color: "var(--orange)", border: "1px solid var(--orange-border)", borderRadius: 99, padding: "1px 5px", background: "var(--surface)" }}>{badge}</span>}
        </>
      )}
    </div>
  );
}

const iconButton: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "var(--text-2)",
  fontSize: 13,
  fontWeight: 900,
  padding: "4px 6px",
  borderRadius: "var(--r-sm)",
  lineHeight: 1,
};

const groupButton: React.CSSProperties = {
  width: "100%",
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "0 10px 8px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: 11,
  fontWeight: 900,
  fontFamily: "var(--font-ui)",
  color: "var(--text)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const sectionLabel: React.CSSProperties = {
  padding: "0 10px 8px",
  fontSize: 11,
  fontWeight: 900,
  color: "var(--text)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const avatar: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: "50%",
  background: "var(--orange-dim)",
  border: "1.5px solid var(--orange-border)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 10,
  fontWeight: 800,
  color: "var(--orange)",
  flexShrink: 0,
};

const pill: React.CSSProperties = {
  display: "inline-flex",
  marginTop: 3,
  fontSize: 9,
  fontWeight: 800,
  background: "var(--orange-dim)",
  color: "var(--orange)",
  border: "1px solid var(--orange-border)",
  padding: "1px 5px",
  borderRadius: 99,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const userMenu: React.CSSProperties = {
  position: "absolute",
  bottom: "calc(100% + 4px)",
  left: 8,
  right: 8,
  background: "var(--surface)",
  border: "1.5px solid var(--border)",
  borderRadius: "var(--r-lg)",
  boxShadow: "var(--shadow-xl)",
  zIndex: 50,
  overflow: "hidden",
  padding: 4,
};

const menuLink: React.CSSProperties = {
  display: "block",
  padding: "8px 10px",
  fontSize: 12,
  fontWeight: 700,
  color: "var(--text-2)",
  textDecoration: "none",
  borderRadius: "var(--r-sm)",
};

const logoutButton: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "8px 10px",
  fontSize: 12,
  fontWeight: 700,
  color: "var(--red)",
  background: "none",
  border: "none",
  cursor: "pointer",
  textAlign: "left",
  borderRadius: "var(--r-sm)",
};
