import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  const admin = process.env.ADMIN_PASSWORD;
  if (!admin) {
    return NextResponse.json({ error: "ADMIN_PASSWORD not set" }, { status: 500 });
  }

  const hash = crypto.createHash("sha256").update(admin, "utf8").digest("hex");
  return NextResponse.json({ hash, length: admin.length });
}
