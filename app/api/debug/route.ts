import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json({
      ADMIN_PASSWORD_SET: Boolean(process.env.ADMIN_PASSWORD),
      NEXT_PUBLIC_SUPABASE_URL_SET: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      NEXT_PUBLIC_SUPABASE_ANON_KEY_SET: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      NODE_ENV: process.env.NODE_ENV ?? null,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
