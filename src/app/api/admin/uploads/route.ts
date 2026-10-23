import { NextRequest, NextResponse } from "next/server";
import { fileTypeFromBuffer } from "file-type";
import { authenticateAdmin } from "@/lib/admin-auth";
import { AppError, handleApiError } from "@/lib/errors";
import { UploadRepository } from "@/repositories/upload.repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = Number(
  process.env.PRODUCT_IMAGE_MAX_BYTES || 5 * 1024 * 1024,
);
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: NextRequest) {
  try {
    const admin = await authenticateAdmin(req);
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File))
      return NextResponse.json(
        { success: false, error: { message: "No image file supplied." } },
        { status: 400 },
      );
    if (file.size > MAX_BYTES)
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `Image must be ${Math.round(MAX_BYTES / 1024 / 1024)} MB or smaller.`,
          },
        },
        { status: 413 },
      );
    const buffer = Buffer.from(await file.arrayBuffer());
    const detected = await fileTypeFromBuffer(buffer);
    if (!detected || !ALLOWED.has(detected.mime))
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Only JPG, PNG, and WEBP image files are allowed.",
          },
        },
        { status: 415 },
      );

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-100);
    const stored = await UploadRepository.create({
      filename: safeName || "image",
      contentType: detected.mime,
      data: buffer,
      uploadedById: admin.userId,
    });

    return NextResponse.json({
      success: true,
      data: {
        url: `/api/uploads/${stored.id}`,
        storageKey: stored.id,
        storage: "neon",
        filename: file.name,
        size: stored.size,
        contentType: stored.contentType,
      },
    });
  } catch (error) {
    // Typed errors (401/403 auth, validation) keep their real status; only
    // unexpected failures collapse to the friendly upload 500.
    if (error instanceof AppError) {
      const err = handleApiError(error);
      return NextResponse.json(err.body, { status: err.status });
    }
    console.error("Product image upload failed", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: "Image upload failed. Please try again." },
      },
      { status: 500 },
    );
  }
}
