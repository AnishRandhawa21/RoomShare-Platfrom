import { createClient } from "@/lib/supabase/server";
import { syncAppUser } from "@/lib/auth/user";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/profile";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      await syncAppUser(data.user);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If exchange fails, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=Invalid%20or%20expired%20auth%20token`);
}
