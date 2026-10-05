import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const MAX_SIZE = 3 * 1024 * 1024; // 3 MB per image
const MAX_FILES = 4;
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const files = formData.getAll("file");

  if (!files.length || files.length > MAX_FILES) {
    return NextResponse.json({ error: `Upload 1–${MAX_FILES} images` }, { status: 400 });
  }

  const dir = path.join(process.cwd(), "public", "uploads", "repairs");
  await mkdir(dir, { recursive: true });

  const urls: string[] = [];
  for (const file of files) {
    if (!(file instanceof File)) continue;
    const ext = ALLOWED[file.type];
    if (!ext) {
      return NextResponse.json({ error: "Only JPG, PNG or WebP images allowed" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Each image must be under 3 MB" }, { status: 400 });
    }
    const filename = `${randomUUID()}.${ext}`;
    await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
    urls.push(`/uploads/repairs/${filename}`);
  }

  return NextResponse.json({ urls });
}
