import { v2 as cloudinary } from 'cloudinary';
import { ALLOWED_EVIDENCE_MIME_TYPES, MAX_FILE_SIZE_BYTES } from './validations/submission';

// Configure Cloudinary server-side
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export interface CloudinarySignatureResult {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  isMock?: boolean;
}

/**
 * Validates that the uploaded file matches strict SAKODE invariants:
 * - Allowed types: JPG, PNG, WebP, PDF
 * - Strict Invariant: Video is rejected for MVP
 * - Max size: 10 MB
 */
export function validateEvidenceFileProperties(
  fileType: string,
  fileSize: number,
  fileName?: string
): { valid: boolean; error?: string } {
  const lowerType = fileType.toLowerCase();
  const lowerName = (fileName || '').toLowerCase();

  // Strict check for video
  if (
    lowerType.startsWith('video/') ||
    lowerName.endsWith('.mp4') ||
    lowerName.endsWith('.mov') ||
    lowerName.endsWith('.webm') ||
    lowerName.endsWith('.avi') ||
    lowerName.endsWith('.mkv')
  ) {
    return {
      valid: false,
      error: 'Format video dilarang untuk bukti pekerjaan MVP. Harap gunakan tangkapan layar (JPG/PNG/WebP) atau dokumen PDF.',
    };
  }

  // Allowed whitelist
  const isAllowedMime = ALLOWED_EVIDENCE_MIME_TYPES.some((t) => lowerType === t);
  const isAllowedExtension = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'].some((ext) =>
    lowerName.endsWith(ext)
  );

  if (!isAllowedMime && !isAllowedExtension) {
    return {
      valid: false,
      error: 'Format berkas tidak diizinkan. Hanya berkas JPG, PNG, WebP, atau PDF yang didukung.',
    };
  }

  if (fileSize > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'Ukuran berkas melebihi batas maksimal 10 MB.',
    };
  }

  return { valid: true };
}

/**
 * Generates a signed upload signature for Cloudinary.
 * If credentials are missing, returns a mock signature for local dev mode.
 */
export function generateCloudinaryUploadSignature(
  taskId: string,
  folderName: string = 'sakode/evidence'
): CloudinarySignatureResult {
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `${folderName}/${taskId}`;

  if (!cloudName || !apiKey || !apiSecret || apiSecret === 'your_cloudinary_api_secret_here') {
    // Local mock signature fallback
    return {
      signature: 'mock_signature_' + timestamp,
      timestamp,
      apiKey: apiKey || 'mock_api_key',
      cloudName: cloudName || 'sakode-mock-cloud',
      folder,
      isMock: true,
    };
  }

  const paramsToSign = {
    folder,
    timestamp,
  };

  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

  return {
    signature,
    timestamp,
    apiKey,
    cloudName,
    folder,
    isMock: false,
  };
}
