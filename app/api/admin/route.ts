import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {
      // fallback if JSON parsing fails
      try {
        const text = await request.text();
        body = text ? JSON.parse(text) : {};
      } catch {
        body = {};
      }
    }

    const password = String(body.password ?? "");
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json(
        { error: "ADMIN_PASSWORD is not configured." },
        { status: 500 }
      );
    }

    if (password !== adminPassword) {
      return NextResponse.json({ error: "Invalid password." }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    // Return the error message for debugging (do not include secrets)
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
