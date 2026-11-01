'use server';

/**
 * SAKODE Task & Reward Platform - Super Admin & Audit Server Actions
 * App Router server actions untuk manajemen staf admin dan penelusuran audit log.
 */

import {
  manageAdminRole,
  getAdminStaffList,
  getEligibleMembersForPromotion,
  getAdminDashboardOverview,
  type AdminDashboardOverviewData,
} from '@/server/services/admin-manage.service';
import { getAuditEvents, type AuditFilterParams } from '@/server/services/audit.service';
import {
  type AdminRoleManagementInput,
} from '@/lib/validations/report';
import { serializeUserDoc, serializeAuditEventDoc } from '@/server/serializers';
import type { UserDocument, AuditEventDocument } from '@/types/database';

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  return fallback;
}

/**
 * 1. Super Admin Mengangkat atau Mencabut Role Administrator
 */
export async function manageAdminRoleAction(
  superAdminUid: string,
  input: AdminRoleManagementInput
): Promise<{ success: boolean; user?: UserDocument; error?: string }> {
  try {
    const updatedUser = await manageAdminRole(superAdminUid, input);
    return {
      success: true,
      user: serializeUserDoc(updatedUser),
    };
  } catch (error: unknown) {
    console.error('Error on manageAdminRoleAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal memutasi role administrator.'),
    };
  }
}

/**
 * 2. Mengambil Daftar Staf Admin & Super Admin
 */
export async function getAdminStaffListAction(
  superAdminUid: string
): Promise<{ success: boolean; staff?: UserDocument[]; error?: string }> {
  try {
    const staff = await getAdminStaffList(superAdminUid);
    return {
      success: true,
      staff: staff.map(serializeUserDoc),
    };
  } catch (error: unknown) {
    console.error('Error on getAdminStaffListAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal memuat daftar staf admin.'),
    };
  }
}

/**
 * 3. Mengambil Anggota Layak untuk Promosi
 */
export async function getEligibleMembersForPromotionAction(
  superAdminUid: string
): Promise<{ success: boolean; members?: UserDocument[]; error?: string }> {
  try {
    const members = await getEligibleMembersForPromotion(superAdminUid);
    return {
      success: true,
      members: members.map(serializeUserDoc),
    };
  } catch (error: unknown) {
    console.error('Error on getEligibleMembersForPromotionAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal memuat daftar member.'),
    };
  }
}

/**
 * 4. Mengambil Riwayat Log Audit Permanen (Append-Only)
 */
export async function getAuditEventsAction(
  adminUid: string,
  filters: AuditFilterParams = {}
): Promise<{ success: boolean; events?: AuditEventDocument[]; error?: string }> {
  try {
    const list = await getAuditEvents(adminUid, filters);
    return {
      success: true,
      events: list.map(serializeAuditEventDoc),
    };
  } catch (error: unknown) {
    console.error('Error on getAuditEventsAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal mengambil log audit trail.'),
    };
  }
}

/**
 * 5. Agregasi Metrik Real-time Dashboard Admin
 */
export async function getAdminDashboardOverviewAction(
  adminUid: string
): Promise<{ success: boolean; data?: AdminDashboardOverviewData; error?: string }> {
  try {
    const overview = await getAdminDashboardOverview(adminUid);
    return {
      success: true,
      data: {
        ...overview,
        recentAuditEvents: overview.recentAuditEvents.map(serializeAuditEventDoc),
      },
    };
  } catch (error: unknown) {
    console.error('Error on getAdminDashboardOverviewAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal memuat ringkasan operasional dashboard admin.'),
    };
  }
}
