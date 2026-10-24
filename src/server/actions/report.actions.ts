'use server';

/**
 * SAKODE Task & Reward Platform - Report & Penalty Server Actions
 * App Router server actions untuk pelaporan sengketa berbukti dan resolusi penalti.
 */

import {
  createReport,
  getReportsQueue,
  getReportDetail,
  resolveReport,
} from '@/server/services/report.service';
import {
  type CreateReportInput,
  type ResolveReportInput,
} from '@/lib/validations/report';
import { serializeReportDoc } from '@/server/serializers';
import type { ReportDocument } from '@/types/database';

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  return fallback;
}

/**
 * 1. Pengguna Mengajukan Laporan Sengketa Berbukti
 */
export async function createReportAction(
  reporterUid: string,
  input: CreateReportInput
): Promise<{ success: boolean; report?: ReportDocument; error?: string }> {
  try {
    const report = await createReport(reporterUid, input);
    return {
      success: true,
      report: serializeReportDoc(report),
    };
  } catch (error: unknown) {
    console.error('Error on createReportAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal mengirimkan laporan masalah.'),
    };
  }
}

/**
 * 2. Mengambil Antrean Laporan untuk Admin / Super Admin (Disaring Anti-Konflik)
 */
export async function getReportsQueueAction(
  adminUid: string
): Promise<{ success: boolean; reports?: ReportDocument[]; error?: string }> {
  try {
    const list = await getReportsQueue(adminUid);
    return {
      success: true,
      reports: list.map(serializeReportDoc),
    };
  } catch (error: unknown) {
    console.error('Error on getReportsQueueAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal memuat antrean laporan sengketa.'),
    };
  }
}

/**
 * 3. Mengambil Detail Laporan Sengketa Tertentu
 */
export async function getReportDetailAction(
  adminUid: string,
  reportId: string
): Promise<{ success: boolean; report?: ReportDocument; error?: string }> {
  try {
    const report = await getReportDetail(adminUid, reportId);
    return {
      success: true,
      report: serializeReportDoc(report),
    };
  } catch (error: unknown) {
    console.error('Error on getReportDetailAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal memuat rincian laporan.'),
    };
  }
}

/**
 * 4. Menyelesaikan Laporan & Menjatuhkan Penalti Progresif (Atomik Transaction)
 */
export async function resolveReportAction(
  adminUid: string,
  input: ResolveReportInput
): Promise<{ success: boolean; report?: ReportDocument; error?: string }> {
  try {
    const report = await resolveReport(adminUid, input);
    return {
      success: true,
      report: serializeReportDoc(report),
    };
  } catch (error: unknown) {
    console.error('Error on resolveReportAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal menyelesaikan laporan sengketa.'),
    };
  }
}
