import { NextResponse } from "next/server";

export const runtime = "nodejs";

function signParams(params: Record<string, string>, apiSecret: string) {
  const crypto = require("crypto") as typeof import("crypto");
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return crypto.createHash("sha1").update(toSign + apiSecret).digest("hex");
}

function getCloudinaryEnvStatus() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? process.env.CLOUDINARY_CLOUD_NAME ?? "";
  const apiKey = process.env.CLOUDINARY_API_KEY ?? "";
  const apiSecret = process.env.CLOUDINARY_API_SECRET ?? "";

  const missing: string[] = [];
  if (!cloudName) missing.push("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME (or CLOUDINARY_CLOUD_NAME)");
  if (!apiKey) missing.push("CLOUDINARY_API_KEY");
  if (!apiSecret) missing.push("CLOUDINARY_API_SECRET");

  return { cloudName, apiKey, apiSecret, missing };
}

export async function GET() {
  const { missing } = getCloudinaryEnvStatus();
  return NextResponse.json({ ok: missing.length === 0, missing });
}

export async function POST(request: Request) {
  // Endpoint ký (signed upload) cho Cloudinary.
  // Lưu ý: Nên xác thực user trước khi trả signature để tránh bị lạm dụng.
  const body = await request.json().catch(() => null);
  const folderRaw = typeof body?.folder === "string" ? body.folder : "farm2art";
  const folder = folderRaw.trim() || "farm2art";

  try {
    const { cloudName, apiKey, apiSecret, missing } = getCloudinaryEnvStatus();
    if (missing.length) {
      return NextResponse.json({ error: "Missing Cloudinary env config", missing }, { status: 500 });
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = signParams({ folder, timestamp }, apiSecret);

    return NextResponse.json({ cloudName, apiKey, timestamp, folder, signature });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to sign";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
