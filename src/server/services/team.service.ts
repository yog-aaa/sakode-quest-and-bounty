/**
 * SAKODE Task & Reward Platform - Team Lifecycle & Consensus Service
 * Menangani pembuatan tim, recruitment kode undangan, persetujuan member,
 * voting konsensus split reward, dan transaksi atomik penguncian roster.
 *
 * Strict Invariants (AGENTS.md & ARCHITECTURE.md):
 * 1. Saat tim ACTIVE, SELURUH anggota tim dihitung memegang 1 Active Task (activeTaskId = taskId).
 * 2. Roster tim terkunci permanen saat ACTIVE (hanya Admin yang dapat override).
 * 3. Timer durasi pengerjaan tim baru dimulai tepat saat task berubah status menjadi ACTIVE.
 * 4. Transaksi awal dan mutasi kritis WAJIB menggunakan firestore.runTransaction().
 */

import { getAdminFirestore } from '@/lib/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type {
  TeamDocument,
  TeamMembershipDocument,
  TaskDocument,
  UserDocument,
  FirestoreDate,
} from '@/types/database';
import {
  TASK_STATUS,
  TASK_DEADLINE_TYPES,
  TEAM_STATUS,
  TEAM_ROLES,
  TEAM_MEMBERSHIP_STATUS,
  INITIAL_SPLIT_PRINCIPLES,
  USER_APPROVAL_STATUS,
  type InitialSplitPrinciple,
} from '@/lib/constants';
import {
  type JoinTeamInput,
  type ApproveMemberInput,
  type RejectMemberInput,
  type TeamConsentInput,
  type AdminOverrideRosterInput,
} from '@/lib/validations/team';
import { assertAdminPrivilege } from './user.service';

/**
 * Helper: Menghasilkan kode undangan unik 6 karakter (alphanumeric uppercase)
 */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Inisialisasi dokumen tim baru saat Team Task diambil atau applicant dipilih.
 * Dijalankan dalam konteks transaksi Firestore yang sama dengan penugasan task.
 */
export async function initializeTeam(
  taskId: string,
  teamLeadUserId: string,
  initialSplitPrinciple: InitialSplitPrinciple = INITIAL_SPLIT_PRINCIPLES.EQUAL
): Promise<{ team: TeamDocument; membership: TeamMembershipDocument }> {
  const db = getAdminFirestore();

  const taskRef = db.collection('tasks').doc(taskId);
  const userRef = db.collection('users').doc(teamLeadUserId);

  const [taskSnap, userSnap] = await Promise.all([taskRef.get(), userRef.get()]);
  if (!taskSnap.exists) throw new Error('Task tidak ditemukan.');
  if (!userSnap.exists) throw new Error('Data Team Lead tidak ditemukan.');

  const taskData = taskSnap.data() as TaskDocument;
  const userData = userSnap.data() as UserDocument;

  const minMembers = taskData.minTeamSize || 2;
  const maxMembers = taskData.maxTeamSize || 4;
  const inviteCode = generateInviteCode();

  const teamRef = db.collection('teams').doc();
  const membershipRef = db.collection('teamMemberships').doc();

  const newTeamData: Omit<TeamDocument, 'id'> = {
    taskId,
    teamLeadUserId,
    minMembers,
    maxMembers,
    memberCount: 1,
    rosterLocked: false,
    initialSplitPrinciple,
    inviteCode,
    status: TEAM_STATUS.RECRUITING,
    taskTitle: taskData.title,
    taskTotalReward: taskData.totalReward,
    createdAt: FieldValue.serverTimestamp() as unknown as FirestoreDate,
    updatedAt: FieldValue.serverTimestamp() as unknown as FirestoreDate,
  };

  const newMembershipData: Omit<TeamMembershipDocument, 'id'> = {
    teamId: teamRef.id,
    taskId,
    userId: teamLeadUserId,
    roleInTeam: TEAM_ROLES.LEAD,
    status: TEAM_MEMBERSHIP_STATUS.TERMS_ACCEPTED,
    agreedTermsAt: FieldValue.serverTimestamp() as unknown as FirestoreDate,
    agreedTermsVersion: taskData.termsSnapshot?.version || 1,
    agreedSplitPrinciple: initialSplitPrinciple,
    userDisplayName: userData.displayName || 'Team Lead',
    userEmail: userData.email,
    userContactNumber: userData.contactNumber,
    userSkills: userData.skills || [],
    createdAt: FieldValue.serverTimestamp() as unknown as FirestoreDate,
    updatedAt: FieldValue.serverTimestamp() as unknown as FirestoreDate,
  };

  const batch = db.batch();
  batch.set(teamRef, newTeamData);
  batch.set(membershipRef, newMembershipData);
  batch.update(taskRef, {
    assignedTeamId: teamRef.id,
    assignedUserId: teamLeadUserId,
    status: TASK_STATUS.RECRUITING,
    updatedAt: FieldValue.serverTimestamp(),
  });
  batch.update(userRef, {
    activeTaskId: taskId,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Catat event inisialisasi tim
  const auditRef = db.collection('auditEvents').doc();
  batch.set(auditRef, {
    actorId: teamLeadUserId,
    actorRole: userData.role,
    action: 'TEAM_INITIALIZED',
    entityType: 'TEAM',
    entityId: teamRef.id,
    metadata: { taskId, inviteCode, minMembers, maxMembers },
    timestamp: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return {
    team: { ...newTeamData, id: teamRef.id } as TeamDocument,
    membership: { ...newMembershipData, id: membershipRef.id } as TeamMembershipDocument,
  };
}

/**
 * Mengambil detail tim beserta status task terkait.
 */
export async function getTeamDetail(teamId: string): Promise<TeamDocument | null> {
  const db = getAdminFirestore();
  const snap = await db.collection('teams').doc(teamId).get();
  if (!snap.exists) return null;
  return { ...(snap.data() as TeamDocument), id: snap.id };
}

/**
 * Mengambil dokumen tim berdasarkan taskId.
 */
export async function getTeamForTask(taskId: string): Promise<TeamDocument | null> {
  const db = getAdminFirestore();
  const snap = await db.collection('teams').where('taskId', '==', taskId).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { ...(doc.data() as TeamDocument), id: doc.id };
}

/**
 * Mengambil seluruh anggota/membership pada sebuah tim.
 */
export async function getTeamMembers(teamId: string): Promise<TeamMembershipDocument[]> {
  const db = getAdminFirestore();
  const snap = await db
    .collection('teamMemberships')
    .where('teamId', '==', teamId)
    .orderBy('createdAt', 'asc')
    .get();

  return snap.docs.map((d) => ({
    ...(d.data() as TeamMembershipDocument),
    id: d.id,
  }));
}

/**
 * Permintaan bergabung ke dalam tim oleh calon anggota menggunakan kode undangan.
 */
export async function requestJoinTeam(
  userId: string,
  input: JoinTeamInput
): Promise<TeamMembershipDocument> {
  const db = getAdminFirestore();

  // 1. Validasi user
  const userRef = db.collection('users').doc(userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) throw new Error('Data member tidak ditemukan.');
  const userData = userSnap.data() as UserDocument;

  if (userData.approvalStatus !== USER_APPROVAL_STATUS.APPROVED) {
    throw new Error('Akun Anda belum disetujui (APPROVED) untuk bergabung ke dalam tim.');
  }
  if (userData.activeTaskId) {
    throw new Error('Anda sedang memiliki 1 Active Task. Anda tidak dapat bergabung ke tim lain.');
  }

  // 2. Cari tim berdasarkan inviteCode
  let teamDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;
  if (input.inviteCode) {
    const teamSnap = await db
      .collection('teams')
      .where('inviteCode', '==', input.inviteCode.toUpperCase())
      .limit(1)
      .get();
    if (!teamSnap.empty) {
      teamDoc = teamSnap.docs[0];
    }
  } else if (input.teamId) {
    const teamSnap = await db.collection('teams').doc(input.teamId).get();
    if (teamSnap.exists) {
      teamDoc = teamSnap as unknown as FirebaseFirestore.QueryDocumentSnapshot;
    }
  }

  if (!teamDoc) {
    throw new Error('Kode undangan tim tidak valid atau tim tidak ditemukan.');
  }

  const teamData = teamDoc.data() as TeamDocument;
  const teamId = teamDoc.id;

  // 3. Verifikasi kapasitas dan status tim
  if (teamData.status !== TEAM_STATUS.RECRUITING) {
    throw new Error('Perekrutan anggota untuk tim ini telah ditutup.');
  }
  if (teamData.rosterLocked) {
    throw new Error('Roster anggota tim ini sudah dikunci permanen.');
  }
  if (teamData.memberCount >= teamData.maxMembers) {
    throw new Error(`Kapasitas tim sudah penuh (maksimal ${teamData.maxMembers} anggota).`);
  }

  // 4. Periksa apakah sudah terdaftar
  const existingSnap = await db
    .collection('teamMemberships')
    .where('teamId', '==', teamId)
    .where('userId', '==', userId)
    .limit(1)
    .get();

  if (!existingSnap.empty) {
    const existing = existingSnap.docs[0].data() as TeamMembershipDocument;
    if (existing.status === TEAM_MEMBERSHIP_STATUS.APPLIED) {
      throw new Error('Anda sudah mengajukan permohonan bergabung. Menunggu persetujuan Team Lead.');
    }
    if (existing.status === TEAM_MEMBERSHIP_STATUS.APPROVED || existing.status === TEAM_MEMBERSHIP_STATUS.TERMS_ACCEPTED) {
      throw new Error('Anda sudah menjadi anggota di tim ini.');
    }
  }

  // 5. Buat membership berstatus APPLIED
  const membershipRef = db.collection('teamMemberships').doc();
  const newMembership: Omit<TeamMembershipDocument, 'id'> = {
    teamId,
    taskId: teamData.taskId,
    userId,
    roleInTeam: TEAM_ROLES.MEMBER,
    status: TEAM_MEMBERSHIP_STATUS.APPLIED,
    agreedTermsAt: null,
    agreedTermsVersion: null,
    agreedSplitPrinciple: null,
    userDisplayName: userData.displayName || 'Calon Anggota',
    userEmail: userData.email,
    userContactNumber: userData.contactNumber,
    userSkills: userData.skills || [],
    createdAt: FieldValue.serverTimestamp() as unknown as FirestoreDate,
  };

  await membershipRef.set(newMembership);

  // Catat audit event
  await db.collection('auditEvents').add({
    actorId: userId,
    actorRole: userData.role,
    action: 'TEAM_JOIN_REQUESTED',
    entityType: 'TEAM',
    entityId: teamId,
    metadata: { inviteCode: teamData.inviteCode, message: input.message },
    timestamp: FieldValue.serverTimestamp(),
  });

  return { ...newMembership, id: membershipRef.id } as TeamMembershipDocument;
}

/**
 * Team Lead menyetujui calon anggota untuk bergabung ke tim.
 */
export async function approveJoinRequest(
  teamLeadUid: string,
  input: ApproveMemberInput
): Promise<TeamMembershipDocument> {
  const db = getAdminFirestore();

  return await db.runTransaction(async (transaction) => {
    const teamRef = db.collection('teams').doc(input.teamId);
    const teamSnap = await transaction.get(teamRef);
    if (!teamSnap.exists) throw new Error('Data tim tidak ditemukan.');

    const teamData = teamSnap.data() as TeamDocument;

    // Verifikasi hak Team Lead
    if (teamData.teamLeadUserId !== teamLeadUid) {
      throw new Error('Hanya Team Lead yang berhak menyetujui anggota tim.');
    }
    if (teamData.status !== TEAM_STATUS.RECRUITING) {
      throw new Error('Tim tidak sedang dalam fase perekrutan (RECRUITING).');
    }
    if (teamData.memberCount >= teamData.maxMembers) {
      throw new Error('Kapasitas tim sudah mencapai batas maksimal.');
    }

    // Cari dokumen membership
    const membershipQuery = await db
      .collection('teamMemberships')
      .where('teamId', '==', input.teamId)
      .where('userId', '==', input.memberUserId)
      .where('status', '==', TEAM_MEMBERSHIP_STATUS.APPLIED)
      .limit(1)
      .get();

    if (membershipQuery.empty) {
      throw new Error('Permintaan bergabung tidak ditemukan atau sudah diproses.');
    }

    const membershipDoc = membershipQuery.docs[0];
    const membershipRef = membershipDoc.ref;

    // Update status membership menjadi APPROVED
    transaction.update(membershipRef, {
      status: TEAM_MEMBERSHIP_STATUS.APPROVED,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Tambah memberCount
    transaction.update(teamRef, {
      memberCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Audit event
    const auditRef = db.collection('auditEvents').doc();
    transaction.set(auditRef, {
      actorId: teamLeadUid,
      action: 'TEAM_MEMBER_APPROVED',
      entityType: 'TEAM',
      entityId: input.teamId,
      metadata: { approvedUserId: input.memberUserId },
      timestamp: FieldValue.serverTimestamp(),
    });

    const updatedSnap = await transaction.get(membershipRef);
    return { ...(updatedSnap.data() as TeamMembershipDocument), id: membershipDoc.id };
  });
}

/**
 * Team Lead menolak calon anggota.
 */
export async function rejectJoinRequest(
  teamLeadUid: string,
  input: RejectMemberInput
): Promise<void> {
  const db = getAdminFirestore();

  const teamRef = db.collection('teams').doc(input.teamId);
  const teamSnap = await teamRef.get();
  if (!teamSnap.exists) throw new Error('Data tim tidak ditemukan.');

  const teamData = teamSnap.data() as TeamDocument;
  if (teamData.teamLeadUserId !== teamLeadUid) {
    throw new Error('Hanya Team Lead yang berhak menolak calon anggota.');
  }

  const membershipQuery = await db
    .collection('teamMemberships')
    .where('teamId', '==', input.teamId)
    .where('userId', '==', input.memberUserId)
    .where('status', '==', TEAM_MEMBERSHIP_STATUS.APPLIED)
    .limit(1)
    .get();

  if (membershipQuery.empty) {
    throw new Error('Permintaan pendaftaran tidak ditemukan.');
  }

  const membershipDoc = membershipQuery.docs[0];
  await membershipDoc.ref.delete();

  await db.collection('auditEvents').add({
    actorId: teamLeadUid,
    action: 'TEAM_MEMBER_REJECTED',
    entityType: 'TEAM',
    entityId: input.teamId,
    metadata: { rejectedUserId: input.memberUserId, reason: input.reason },
    timestamp: FieldValue.serverTimestamp(),
  });
}

/**
 * Anggota tim menyetujui syarat & ketentuan serta memberikan voting prinsip pembagian reward awal.
 */
export async function submitMemberConsent(
  userId: string,
  input: TeamConsentInput
): Promise<TeamMembershipDocument> {
  const db = getAdminFirestore();

  return await db.runTransaction(async (transaction) => {
    const teamRef = db.collection('teams').doc(input.teamId);
    const teamSnap = await transaction.get(teamRef);
    if (!teamSnap.exists) throw new Error('Data tim tidak ditemukan.');

    const teamData = teamSnap.data() as TeamDocument;
    if (teamData.rosterLocked) {
      throw new Error('Roster tim sudah dikunci. Tidak dapat mengubah persetujuan.');
    }

    const membershipQuery = await db
      .collection('teamMemberships')
      .where('teamId', '==', input.teamId)
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (membershipQuery.empty) {
      throw new Error('Anda bukan anggota dari tim ini.');
    }

    const membershipDoc = membershipQuery.docs[0];
    const membershipData = membershipDoc.data() as TeamMembershipDocument;

    if (
      membershipData.status !== TEAM_MEMBERSHIP_STATUS.APPROVED &&
      membershipData.roleInTeam !== TEAM_ROLES.LEAD
    ) {
      throw new Error('Status keanggotaan Anda belum disetujui untuk memberikan persetujuan.');
    }

    // Update status menjadi TERMS_ACCEPTED
    transaction.update(membershipDoc.ref, {
      status: TEAM_MEMBERSHIP_STATUS.TERMS_ACCEPTED,
      agreedTermsAt: FieldValue.serverTimestamp(),
      agreedTermsVersion: input.agreedTermsVersion,
      agreedSplitPrinciple: input.agreedSplitPrinciple,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Cek apakah seluruh anggota yang ada sudah menyetujui
    const allMembersQuery = await db
      .collection('teamMemberships')
      .where('teamId', '==', input.teamId)
      .get();

    let allConsented = true;
    let validCount = 0;

    for (const doc of allMembersQuery.docs) {
      const m = doc.data() as TeamMembershipDocument;
      if (doc.id === membershipDoc.id) {
        validCount++;
        continue;
      }
      if (m.status === TEAM_MEMBERSHIP_STATUS.TERMS_ACCEPTED) {
        validCount++;
      } else if (m.status === TEAM_MEMBERSHIP_STATUS.APPROVED) {
        allConsented = false;
      }
    }

    // Jika seluruh anggota yang disetujui sudah terms_accepted dan memenuhi minMembers, ubah status tim jadi READY
    if (allConsented && validCount >= teamData.minMembers) {
      transaction.update(teamRef, {
        status: TEAM_STATUS.READY,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    // Audit event
    const auditRef = db.collection('auditEvents').doc();
    transaction.set(auditRef, {
      actorId: userId,
      action: 'TEAM_MEMBER_CONSENT',
      entityType: 'TEAM',
      entityId: input.teamId,
      metadata: { agreedSplitPrinciple: input.agreedSplitPrinciple, agreedTermsVersion: input.agreedTermsVersion },
      timestamp: FieldValue.serverTimestamp(),
    });

    const updatedSnap = await transaction.get(membershipDoc.ref);
    return { ...(updatedSnap.data() as TeamMembershipDocument), id: membershipDoc.id };
  });
}

/**
 * Team Lead memulai pengerjaan task bersama tim (Memulai Fase ACTIVE).
 * Penegakan 4 Syarat & Transaksi Atomik (Strict Invariant):
 * 1. Jumlah anggota tim memenuhi batas minimal (memberCount >= minMembers).
 * 2. Seluruh anggota berstatus TERMS_ACCEPTED.
 * 3. Tidak ada anggota yang tiba-tiba memiliki activeTaskId lain.
 * 4. Penguncian roster (rosterLocked = true) dan SELURUH anggota ditandai activeTaskId = taskId.
 */
export async function startTeamTask(
  teamLeadUid: string,
  teamId: string
): Promise<{ team: TeamDocument; task: TaskDocument }> {
  const db = getAdminFirestore();

  return await db.runTransaction(async (transaction) => {
    const teamRef = db.collection('teams').doc(teamId);
    const teamSnap = await transaction.get(teamRef);
    if (!teamSnap.exists) throw new Error('Data tim tidak ditemukan.');

    const teamData = teamSnap.data() as TeamDocument;

    // 1. Verifikasi Pemanggil adalah Team Lead
    if (teamData.teamLeadUserId !== teamLeadUid) {
      throw new Error('Hanya Team Lead yang berwenang memulai pengerjaan task tim.');
    }
    if (teamData.rosterLocked || teamData.status === TEAM_STATUS.ACTIVE) {
      throw new Error('Task tim ini sudah berstatus ACTIVE dan roster telah terkunci.');
    }

    // 2. Ambil Task terkait
    const taskRef = db.collection('tasks').doc(teamData.taskId);
    const taskSnap = await transaction.get(taskRef);
    if (!taskSnap.exists) throw new Error('Data task tidak ditemukan.');
    const taskData = taskSnap.data() as TaskDocument;

    // 3. Ambil seluruh anggota tim
    const membersQuery = await db
      .collection('teamMemberships')
      .where('teamId', '==', teamId)
      .get();

    const members: TeamMembershipDocument[] = [];
    const memberUserIds: string[] = [];

    for (const doc of membersQuery.docs) {
      const m = doc.data() as TeamMembershipDocument;
      if (m.status === TEAM_MEMBERSHIP_STATUS.TERMS_ACCEPTED) {
        members.push(m);
        memberUserIds.push(m.userId);
      } else if (m.status === TEAM_MEMBERSHIP_STATUS.APPROVED) {
        throw new Error(`Anggota "${m.userDisplayName || m.userId}" belum menyetujui Terms & Conditions serta pembagian reward.`);
      }
    }

    // 4. Syarat 1: Kuota minimum anggota
    if (members.length < teamData.minMembers) {
      throw new Error(`Jumlah anggota yang siap belum memenuhi kuota minimum (${members.length}/${teamData.minMembers} anggota).`);
    }

    // 5. Syarat 2: Verifikasi seluruh user doc: akun APPROVED & tidak memiliki active task lain
    const userDocs = await Promise.all(
      memberUserIds.map((uid) => transaction.get(db.collection('users').doc(uid)))
    );

    for (const uDoc of userDocs) {
      if (!uDoc.exists) {
        throw new Error(`Data salah satu member tim tidak ditemukan.`);
      }
      const uData = uDoc.data() as UserDocument;
      if (uData.approvalStatus !== USER_APPROVAL_STATUS.APPROVED) {
        throw new Error(`Akun member ${uData.displayName} belum disetujui (APPROVED) oleh Admin.`);
      }
      // Khusus anggota selain Team Lead (Team Lead sudah mengikat activeTaskId saat init), pastikan belum punya task aktif lain
      if (uData.id !== teamLeadUid && uData.activeTaskId && uData.activeTaskId !== teamData.taskId) {
        throw new Error(`Member ${uData.displayName} sedang mengerjakan task lain. Tidak dapat memulai tim.`);
      }
    }

    // 6. Hitung deadlineAt (Zero-Cron Rule: timer durasi baru dimulai saat status tim berganti menjadi ACTIVE)
    let calculatedDeadline: Timestamp | null = null;
    const now = Date.now();

    if (taskData.deadlineType === TASK_DEADLINE_TYPES.DURATION && taskData.durationMinutes) {
      calculatedDeadline = Timestamp.fromDate(new Date(now + taskData.durationMinutes * 60 * 1000));
    } else if (taskData.deadlineType === TASK_DEADLINE_TYPES.FIXED && taskData.fixedDeadlineAt) {
      const fixed = taskData.fixedDeadlineAt;
      if (typeof fixed === 'object' && fixed !== null && 'toDate' in fixed && typeof fixed.toDate === 'function') {
        calculatedDeadline = Timestamp.fromDate(fixed.toDate());
      } else {
        calculatedDeadline = Timestamp.fromDate(new Date(fixed as unknown as string));
      }
    }

    // 7. MUTASI ATOMIK TRANSACIONAL
    // a. Kunci status tim dan roster
    transaction.update(teamRef, {
      status: TEAM_STATUS.ACTIVE,
      rosterLocked: true,
      updatedAt: FieldValue.serverTimestamp() as unknown as FirestoreDate,
    });

    // b. Update task menjadi ACTIVE
    transaction.update(taskRef, {
      status: TASK_STATUS.ACTIVE,
      assignedTeamId: teamId,
      deadlineAt: calculatedDeadline as unknown as FirestoreDate,
      updatedAt: FieldValue.serverTimestamp() as unknown as FirestoreDate,
    });

    // c. STRICT INVARIANT: Tandai seluruh anggota tim memegang 1 Active Task (activeTaskId = taskId)
    for (const uid of memberUserIds) {
      const uRef = db.collection('users').doc(uid);
      transaction.update(uRef, {
        activeTaskId: teamData.taskId,
        updatedAt: FieldValue.serverTimestamp() as unknown as FirestoreDate,
      });
    }

    // d. Catat Audit Event
    const auditRef = db.collection('auditEvents').doc();
    transaction.set(auditRef, {
      actorId: teamLeadUid,
      action: 'TEAM_TASK_STARTED',
      entityType: 'TEAM',
      entityId: teamId,
      metadata: {
        taskId: teamData.taskId,
        memberCount: members.length,
        memberUserIds,
        deadlineAt: calculatedDeadline ? calculatedDeadline.toDate().toISOString() : null,
      },
      timestamp: FieldValue.serverTimestamp(),
    });

    return {
      team: {
        ...teamData,
        status: TEAM_STATUS.ACTIVE,
        rosterLocked: true,
      },
      task: {
        ...taskData,
        status: TASK_STATUS.ACTIVE,
        assignedTeamId: teamId,
        deadlineAt: calculatedDeadline ? calculatedDeadline.toDate().toISOString() : null,
      },
    };
  });
}

/**
 * Pengecualian darurat: Admin Override Roster Tim (hanya oleh Admin / Super Admin dengan alasan wajib).
 */
export async function adminOverrideTeamRoster(
  adminUid: string,
  input: AdminOverrideRosterInput
): Promise<void> {
  await assertAdminPrivilege(adminUid);
  const db = getAdminFirestore();

  const teamRef = db.collection('teams').doc(input.teamId);
  const teamSnap = await teamRef.get();
  if (!teamSnap.exists) throw new Error('Data tim tidak ditemukan.');
  const teamData = teamSnap.data() as TeamDocument;

  const targetUserRef = db.collection('users').doc(input.targetUserId);
  const targetUserSnap = await targetUserRef.get();
  if (!targetUserSnap.exists) throw new Error('Target user tidak ditemukan.');
  const targetUserData = targetUserSnap.data() as UserDocument;

  const batch = db.batch();

  if (input.action === 'ADD') {
    if (targetUserData.activeTaskId && targetUserData.activeTaskId !== teamData.taskId) {
      throw new Error(`User ${targetUserData.displayName} sedang memegang task aktif lain.`);
    }

    const membershipRef = db.collection('teamMemberships').doc();
    batch.set(membershipRef, {
      teamId: input.teamId,
      taskId: teamData.taskId,
      userId: input.targetUserId,
      roleInTeam: TEAM_ROLES.MEMBER,
      status: TEAM_MEMBERSHIP_STATUS.TERMS_ACCEPTED,
      agreedTermsAt: FieldValue.serverTimestamp(),
      agreedTermsVersion: 1,
      agreedSplitPrinciple: teamData.initialSplitPrinciple,
      userDisplayName: targetUserData.displayName || 'Anggota',
      userEmail: targetUserData.email,
      userSkills: targetUserData.skills || [],
      createdAt: FieldValue.serverTimestamp(),
    });

    batch.update(teamRef, {
      memberCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (teamData.status === TEAM_STATUS.ACTIVE) {
      batch.update(targetUserRef, {
        activeTaskId: teamData.taskId,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  } else if (input.action === 'REMOVE') {
    const memberQuery = await db
      .collection('teamMemberships')
      .where('teamId', '==', input.teamId)
      .where('userId', '==', input.targetUserId)
      .limit(1)
      .get();

    if (!memberQuery.empty) {
      batch.delete(memberQuery.docs[0].ref);
      batch.update(teamRef, {
        memberCount: FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp(),
      });

      if (targetUserData.activeTaskId === teamData.taskId) {
        batch.update(targetUserRef, {
          activeTaskId: null,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }
  }

  // Audit Event
  const auditRef = db.collection('auditEvents').doc();
  batch.set(auditRef, {
    actorId: adminUid,
    action: 'TEAM_ROSTER_OVERRIDE',
    entityType: 'TEAM',
    entityId: input.teamId,
    metadata: {
      action: input.action,
      targetUserId: input.targetUserId,
      reason: input.reason,
    },
    timestamp: FieldValue.serverTimestamp(),
  });

  await batch.commit();
}
