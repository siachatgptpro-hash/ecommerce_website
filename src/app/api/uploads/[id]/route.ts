import { NextRequest, NextResponse } from "next/server";
import {
  UploadRepository,
  type StoredUploadMetadata,
} from "@/repositories/upload.repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeFilename(filename: string): string {
  return filename.replace(/["\\\r\n]/g, "-").slice(0, 120) || "image";
}

function fileHeaders(file: StoredUploadMetadata): HeadersInit {
  return {
    "Content-Type": file.contentType,
    "Content-Length": String(file.size),
    "Content-Disposition": `inline; filename="${safeFilename(file.filename)}"`,
    "Cache-Control": "public, max-age=31536000, immutable",
    ETag: `"${file.id}"`,
    "Last-Modified": new Date(file.createdAt).toUTCString(),
    "X-Content-Type-Options": "nosniff",
    // Uploads are restricted to JPG/PNG/WEBP bytes, but if a browser ever
    // opens one as a document it gets no script/navigation privileges.
    "Content-Security-Policy": "default-src 'none'; sandbox",
  };
}

function notFound(): NextResponse {
  return NextResponse.json(
    { success: false, error: { message: "Uploaded file not found." } },
    { status: 404, headers: { "Cache-Control": "no-store" } },
  );
}

function serverError(): NextResponse {
  return NextResponse.json(
    { success: false, error: { message: "Uploaded file could not be loaded." } },
    { status: 500, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const file = await UploadRepository.findById(params.id);
    if (!file) return notFound();
    return new NextResponse(new Uint8Array(file.data), {
      headers: fileHeaders(file),
    });
  } catch (error) {
    console.error("Uploaded file fetch failed", error);
    return serverError();
  }
}

export async function HEAD(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const file = await UploadRepository.findMetadataById(params.id);
    if (!file) return notFound();
    return new NextResponse(null, { headers: fileHeaders(file) });
  } catch (error) {
    console.error("Uploaded file metadata fetch failed", error);
    return serverError();
  }
}
