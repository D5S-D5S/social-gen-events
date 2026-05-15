import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code || !state) {
    return NextResponse.redirect(`${origin}/settings?tab=integrations&calendar=error`);
  }

  let userId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
    userId = decoded.userId;
    if (!userId) throw new Error("No userId");
  } catch {
    return NextResponse.redirect(`${origin}/settings?tab=integrations&calendar=error`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri = `${origin}/api/calendar/callback`;

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    console.error("Token exchange failed:", await tokenRes.text());
    return NextResponse.redirect(`${origin}/settings?tab=integrations&calendar=error`);
  }

  const tokens = await tokenRes.json();

  // Store tokens in profiles table
  const { error: dbError } = await supabaseAdmin
    .from("profiles")
    .upsert({
      user_id: userId,
      google_calendar_access_token: tokens.access_token,
      google_calendar_refresh_token: tokens.refresh_token ?? null,
      google_calendar_token_expiry: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null,
    }, { onConflict: "user_id" });

  if (dbError) {
    console.error("Failed to store calendar tokens:", dbError);
    return NextResponse.redirect(`${origin}/settings?tab=integrations&calendar=error`);
  }

  return NextResponse.redirect(`${origin}/settings?tab=integrations&calendar=connected`);
}
