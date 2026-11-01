import { NextRequest, NextResponse } from 'next/server';
import { getAdminDashboardOverview } from '@/server/services/admin-manage.service';
import { serializeAuditEventDoc, sanitizeForSerialization } from '@/server/serializers';

export async function GET(req: NextRequest) {
  try {
    const uid = req.nextUrl.searchParams.get('uid');

    if (!uid) {
      return NextResponse.json(
        { success: false, error: 'UID admin wajib disertakan' },
        { status: 400 }
      );
    }

    const overview = await getAdminDashboardOverview(uid);
    const cleanData = sanitizeForSerialization({
      ...overview,
      recentAuditEvents: (overview.recentAuditEvents || []).map(serializeAuditEventDoc),
    });

    return NextResponse.json({
      success: true,
      data: cleanData,
    });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'digest' in error &&
      String((error as { digest?: string }).digest).startsWith('NEXT_')
    ) {
      throw error;
    }

    console.error('Error fetching admin dashboard overview API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memuat ringkasan operasional admin',
      },
      { status: 200 }
    );
  }
}
