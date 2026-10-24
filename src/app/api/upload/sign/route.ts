import { NextResponse } from 'next/server';
import {
  generateCloudinaryUploadSignature,
  validateEvidenceFileProperties,
} from '@/lib/cloudinary';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { taskId, fileName, fileType, fileSize } = body;

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'taskId wajib disertakan' },
        { status: 400 }
      );
    }

    // Pre-flight file validation if provided
    if (fileType && typeof fileSize === 'number') {
      const validation = validateEvidenceFileProperties(fileType, fileSize, fileName);
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: validation.error },
          { status: 400 }
        );
      }
    }

    const signData = generateCloudinaryUploadSignature(taskId);

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
