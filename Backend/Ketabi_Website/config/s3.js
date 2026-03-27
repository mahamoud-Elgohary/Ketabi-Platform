import fs from "fs/promises";
import path from "path";

const PROJECT_ROOT = process.cwd();
const UPLOADS_DIR = path.join(PROJECT_ROOT, "uploads");

async function ensureUploadsDir() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

function toPublicUploadUrl(fileKey) {
  const port = process.env.PORT || 3000;
  const backendBaseUrl = process.env.BACKEND_BASE_URL || `http://localhost:${port}`;
  return `${backendBaseUrl}/uploads/${fileKey}`;
}

// Kept function name for compatibility with existing controllers.
export async function uploadBufferToS3(buffer, filename, contentType, folder = "books") {
  await ensureUploadsDir();

  const timestamp = Date.now();
  const ext = path.extname(filename || "") || ".pdf";
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const fileKey = `${folder}/${timestamp}-${randomSuffix}${ext}`;
  const outputPath = path.join(UPLOADS_DIR, fileKey);

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, buffer);

  return {
    key: fileKey,
    url: toPublicUploadUrl(fileKey),
    fileName: filename,
    size: buffer.length,
    mimeType: contentType,
    uploadedAt: new Date(),
  };
}

// Kept function name for compatibility with existing download flow.
export async function generateSignedDownloadUrl(key) {
  const filePath = path.join(UPLOADS_DIR, key);
  await fs.access(filePath);
  return toPublicUploadUrl(key);
}