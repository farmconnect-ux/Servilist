import { NextResponse, type NextRequest } from "next/server";
import { createDb } from "@/lib/db/server";
import { getSessionUser } from "@/server/auth/session";
import { canParticipate } from "@/server/policies/access";

/**
 * Upload one listing photo.
 *
 * The file is checked here (size, and its real type from the first bytes, not
 * the name or the type the browser claims) and stored as the signed-in member,
 * under their own folder. The storage rules refuse any other folder.
 */

const MAX_BYTES = 5 * 1024 * 1024;
const BUCKET = "listing-images";

function detectType(bytes: Uint8Array): { mime: string; extension: string } | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: "image/jpeg", extension: "jpg" };
  }
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { mime: "image/png", extension: "png" };
  }
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") {
    return { mime: "image/webp", extension: "webp" };
  }
  return null;
}

function refuse(status: number, code: string, message: string) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return refuse(401, "AUTH_REQUIRED", "Sign in to add photos.");
  if (!canParticipate(user)) return refuse(403, "FORBIDDEN", "Your account cannot add photos.");

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return refuse(400, "VALIDATION_ERROR", "Choose a photo to upload.");
  if (file.size === 0 || file.size > MAX_BYTES) {
    return refuse(400, "VALIDATION_ERROR", "Each photo must be smaller than 5 MB.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectType(bytes);
  if (!type) return refuse(400, "VALIDATION_ERROR", "Photos must be JPEG, PNG or WebP images.");

  const db = await createDb();
  const path = `${user.userId}/${crypto.randomUUID()}.${type.extension}`;
  const { error } = await db.storage.from(BUCKET).upload(path, bytes, {
    contentType: type.mime,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) return refuse(500, "UPLOAD_FAILED", "We couldn't save that photo. Please try again.");

  const { data } = db.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ success: true, data: { url: data.publicUrl } }, { status: 201 });
}
