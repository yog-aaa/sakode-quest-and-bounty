import { NextResponse } from 'next/server';
import {
  generateCloudinaryUploadSignature,
  validateEvidenceFileProperties,
} from '@/lib/cloudinary';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { taskId, fileName, fileType, fileSize } = body;

    const targetFolderId = taskId || 'profile';

    // Pre-flight file validation if provided
    if (fileType && typeof fileSize === 'number') {
      const isAvatar = targetFolderId === 'profile' || targetFolderId === 'avatar';
      const isAllowedImageType =
        fileType.startsWith('image/') ||
        ['.jpg', '.jpeg', '.png', '.webp'].some((ext) => (fileName || '').toLowerCase().endsWith(ext));

      if (isAvatar && !isAllowedImageType) {
        return NextResponse.json(
          { success: false, error: 'Foto profil harus berupa format gambar (JPG, PNG, atau WebP).' },
          { status: 400 }
        );
      }

      if (!isAvatar) {
        const validation = validateEvidenceFileProperties(fileType, fileSize, fileName);
        if (!validation.valid) {
          return NextResponse.json(
            { success: false, error: validation.error },
            { status: 400 }
          );
        }
      }
    }

    const signData = generateCloudinaryUploadSignature(targetFolderId, targetFolderId === 'profile' ? 'sakode/avatars' : 'sakode/evidence');

    return NextResponse.json({
      success: true,
      ...signData,
    });
  } catch (error: unknown) {
    console.error('Error generating upload signature:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal menghasilkan tanda tangan upload',
      },
      { status: 500 }
    );
  }
}
