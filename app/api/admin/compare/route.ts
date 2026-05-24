import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      const text = await request.text();
      try {
        body = text ? JSON.parse(text) : {};
      } catch {
        body = {};
      }
    }

    const supplied = String(body.password ?? "");
    const hash = crypto.createHash("sha256").update(supplied, "utf8").digest("hex");
    return NextResponse.json({ supplied_length: supplied.length, supplied_hash: hash });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
