import { NextResponse } from 'next/server';
import { getAdminDashboardOverview } from '@/server/services/admin-manage.service';
import { serializeAuditEventDoc, sanitizeForSerialization } from '@/server/serializers';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json(
        { success: false, error: 'UID admin wajib disertakan' },
        { status: 400 }
      );
    }

    const overview = await getAdminDashboardOverview(uid);
    const cleanData = sanitizeForSerialization({
      ...overview,
      recentAuditEvents: overview.recentAuditEvents.map(serializeAuditEventDoc),
    });

    return NextResponse.json({
      success: true,
      data: cleanData,
    });
  } catch (error: unknown) {
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
