'use server';

import {
  getTeamDetail,
  getTeamForTask,
  getTeamMembers,
  requestJoinTeam,
  approveJoinRequest,
  rejectJoinRequest,
  submitMemberConsent,
  startTeamTask,
  adminOverrideTeamRoster,
} from '@/server/services/team.service';
import type {
  JoinTeamInput,
  ApproveMemberInput,
  RejectMemberInput,
  TeamConsentInput,
  AdminOverrideRosterInput,
} from '@/lib/validations/team';
import type { TeamDocument, TeamMembershipDocument, TaskDocument } from '@/types/database';
import {
  serializeTeamDoc,
  serializeTeamMembershipDoc,
  serializeTaskDoc,
} from '@/server/serializers';

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

export async function getTeamDetailAction(
  teamId: string
): Promise<{ success: boolean; team?: TeamDocument | null; error?: string }> {
  try {
    const team = await getTeamDetail(teamId);
    return { success: true, team: team ? serializeTeamDoc(team) : null };
  } catch (error: unknown) {
    console.error('Error on getTeamDetailAction:', error);
    return { success: false, error: getErrorMessage(error, 'Gagal memuat detail tim.') };
  }
}

export async function getTeamForTaskAction(
  taskId: string
): Promise<{ success: boolean; team?: TeamDocument | null; error?: string }> {
  try {
    const team = await getTeamForTask(taskId);
    return { success: true, team: team ? serializeTeamDoc(team) : null };
  } catch (error: unknown) {
    console.error('Error on getTeamForTaskAction:', error);
    return { success: false, error: getErrorMessage(error, 'Gagal memuat tim untuk task.') };
  }
}

export async function getTeamMembersAction(
  teamId: string
): Promise<{ success: boolean; members?: TeamMembershipDocument[]; error?: string }> {
  try {
    const members = await getTeamMembers(teamId);
    return { success: true, members: members.map(serializeTeamMembershipDoc) };
  } catch (error: unknown) {
    console.error('Error on getTeamMembersAction:', error);
    return { success: false, error: getErrorMessage(error, 'Gagal memuat anggota tim.') };
  }
}

export async function requestJoinTeamAction(
  userId: string,
  input: JoinTeamInput
): Promise<{ success: boolean; membership?: TeamMembershipDocument; error?: string }> {
  try {
    const membership = await requestJoinTeam(userId, input);
    return { success: true, membership: serializeTeamMembershipDoc(membership) };
  } catch (error: unknown) {
    console.error('Error on requestJoinTeamAction:', error);
    return { success: false, error: getErrorMessage(error, 'Gagal mengajukan permintaan gabung tim.') };
  }
}

export async function approveJoinRequestAction(
  teamLeadUid: string,
  input: ApproveMemberInput
): Promise<{ success: boolean; membership?: TeamMembershipDocument; error?: string }> {
  try {
    const membership = await approveJoinRequest(teamLeadUid, input);
    return { success: true, membership: serializeTeamMembershipDoc(membership) };
  } catch (error: unknown) {
    console.error('Error on approveJoinRequestAction:', error);
    return { success: false, error: getErrorMessage(error, 'Gagal menyetujui anggota tim.') };
  }
}

export async function rejectJoinRequestAction(
  teamLeadUid: string,
  input: RejectMemberInput
): Promise<{ success: boolean; error?: string }> {
  try {
    await rejectJoinRequest(teamLeadUid, input);
    return { success: true };
  } catch (error: unknown) {
    console.error('Error on rejectJoinRequestAction:', error);
    return { success: false, error: getErrorMessage(error, 'Gagal menolak calon anggota.') };
  }
}

export async function submitMemberConsentAction(
  userId: string,
  input: TeamConsentInput
): Promise<{ success: boolean; membership?: TeamMembershipDocument; error?: string }> {
  try {
    const membership = await submitMemberConsent(userId, input);
    return { success: true, membership: serializeTeamMembershipDoc(membership) };
  } catch (error: unknown) {
    console.error('Error on submitMemberConsentAction:', error);
    return { success: false, error: getErrorMessage(error, 'Gagal menyimpan persetujuan anggota.') };
  }
}

export async function startTeamTaskAction(
  teamLeadUid: string,
  teamId: string
): Promise<{ success: boolean; team?: TeamDocument; task?: TaskDocument; error?: string }> {
  try {
    const result = await startTeamTask(teamLeadUid, teamId);
    return {
      success: true,
      team: serializeTeamDoc(result.team),
      task: serializeTaskDoc(result.task),
    };
  } catch (error: unknown) {
    console.error('Error on startTeamTaskAction:', error);
    return { success: false, error: getErrorMessage(error, 'Gagal memulai pengerjaan task tim.') };
  }
}

export async function adminOverrideTeamRosterAction(
  adminUid: string,
  input: AdminOverrideRosterInput
): Promise<{ success: boolean; error?: string }> {
  try {
    await adminOverrideTeamRoster(adminUid, input);
    return { success: true };
  } catch (error: unknown) {
    console.error('Error on adminOverrideTeamRosterAction:', error);
    return { success: false, error: getErrorMessage(error, 'Gagal melakukan override roster tim.') };
  }
}
