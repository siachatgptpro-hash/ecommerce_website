import { randomUUID } from "node:crypto";
import { isPostgresConfigured, pgQuery } from "@/lib/postgres";

export interface StoredUpload {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  data: Buffer;
  uploadedById: string | null;
  createdAt: string;
}

export type StoredUploadMetadata = Omit<StoredUpload, "data">;

interface CreateUploadInput {
  filename: string;
  contentType: string;
  data: Buffer;
  uploadedById?: string | null;
}

type UploadMetadataRow = {
  id: string;
  filename: string;
  contentType: string;
  size: number | string;
  uploadedById: string | null;
  createdAt: Date | string;
};

type UploadRow = UploadMetadataRow & {
  data: Buffer | Uint8Array;
};

const globalForUploads = globalThis as typeof globalThis & {
  shlokvedaUploadedFiles?: Map<string, StoredUpload>;
  shlokvedaUploadedFileTableReady?: Promise<void>;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function memoryFiles(): Map<string, StoredUpload> {
  if (!globalForUploads.shlokvedaUploadedFiles) {
    globalForUploads.shlokvedaUploadedFiles = new Map();
  }
  return globalForUploads.shlokvedaUploadedFiles;
}

function isMissingTableError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "42P01"
  );
}

function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toMetadata(row: UploadMetadataRow): StoredUploadMetadata {
  return {
    id: row.id,
    filename: row.filename,
    contentType: row.contentType,
    size: Number(row.size),
    uploadedById: row.uploadedById ?? null,
    createdAt: toIsoString(row.createdAt),
  };
}

export class UploadRepository {
  /**
   * The canonical schema lives in prisma/schema.prisma,
   * prisma/neon-setup.sql, and prisma/migrations/20261024_add_uploaded_files.sql.
   * This idempotent guard is a deployment safety net: if an existing Neon
   * database has not had that one migration applied yet, the first admin
   * upload creates the table instead of failing after the code deploy.
   */
  private static async ensureTable(): Promise<void> {
    if (!globalForUploads.shlokvedaUploadedFileTableReady) {
      globalForUploads.shlokvedaUploadedFileTableReady = (async () => {
        await pgQuery(`
          CREATE TABLE IF NOT EXISTS "UploadedFile" (
            "id" TEXT PRIMARY KEY,
            "filename" TEXT NOT NULL,
            "contentType" TEXT NOT NULL,
            "size" INTEGER NOT NULL,
            "data" BYTEA NOT NULL,
            "uploadedById" TEXT REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `);
        await pgQuery(
          'CREATE INDEX IF NOT EXISTS "UploadedFile_createdAt_idx" ON "UploadedFile" ("createdAt")',
        );
      })().catch((error) => {
        delete globalForUploads.shlokvedaUploadedFileTableReady;
        throw error;
      });
    }
    return globalForUploads.shlokvedaUploadedFileTableReady;
  }

  public static async create(input: CreateUploadInput): Promise<StoredUploadMetadata> {
    const file: StoredUpload = {
      id: randomUUID(),
      filename: input.filename,
      contentType: input.contentType,
      size: input.data.byteLength,
      data: Buffer.from(input.data),
      uploadedById: input.uploadedById ?? null,
      createdAt: new Date().toISOString(),
    };

    if (isPostgresConfigured()) {
      await this.ensureTable();
      const result = await pgQuery<UploadMetadataRow>(
        'INSERT INTO "UploadedFile" ("id","filename","contentType","size","data","uploadedById","createdAt") VALUES ($1,$2,$3,$4,$5,$6,CURRENT_TIMESTAMP) RETURNING "id","filename","contentType","size","uploadedById","createdAt"',
        [file.id, file.filename, file.contentType, file.size, file.data, file.uploadedById],
      );
      return toMetadata(result.rows[0]);
    }

    // Local/sandbox runs without DATABASE_URL use the same URL contract,
    // backed by process memory. Production is required to configure Neon,
    // where the bytes are durably stored in the UploadedFile table.
    memoryFiles().set(file.id, file);
    const { data: _data, ...metadata } = file;
    return metadata;
  }

  public static async findById(id: string): Promise<StoredUpload | null> {
    if (!UUID_PATTERN.test(id)) return null;

    if (isPostgresConfigured()) {
      try {
        const result = await pgQuery<UploadRow>(
          'SELECT "id","filename","contentType","size","data","uploadedById","createdAt" FROM "UploadedFile" WHERE "id"=$1 LIMIT 1',
          [id],
        );
        const row = result.rows[0];
        if (!row) return null;
        return {
          ...toMetadata(row),
          data: Buffer.isBuffer(row.data) ? row.data : Buffer.from(row.data),
        };
      } catch (error) {
        if (isMissingTableError(error)) return null;
        throw error;
      }
    }

    const file = memoryFiles().get(id);
    return file ? { ...file, data: Buffer.from(file.data) } : null;
  }

  public static async findMetadataById(id: string): Promise<StoredUploadMetadata | null> {
    if (!UUID_PATTERN.test(id)) return null;

    if (isPostgresConfigured()) {
      try {
        const result = await pgQuery<UploadMetadataRow>(
          'SELECT "id","filename","contentType","size","uploadedById","createdAt" FROM "UploadedFile" WHERE "id"=$1 LIMIT 1',
          [id],
        );
        const row = result.rows[0];
        return row ? toMetadata(row) : null;
      } catch (error) {
        if (isMissingTableError(error)) return null;
        throw error;
      }
    }

    const file = memoryFiles().get(id);
    if (!file) return null;
    const { data: _data, ...metadata } = file;
    return metadata;
  }
}
