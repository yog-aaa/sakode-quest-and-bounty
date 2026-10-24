/**
 * SAKODE Task & Reward Platform - Claim & Financial Ledger Service
 * Mengimplementasikan modul Reward Ledger, Solo Batch Claim, dan Team 100% Consensus Distribution.
 * Sesuai pedoman ARCHITECTURE.md, AGENTS.md, dan panduan security-best-practices.
 * 
 * Strict Invariants:
 * 1. Seluruh nominal reward adalah number integer Rupiah (dilarang float).
 * 2. 1 Reward item tidak dapat dicairkan sebagian (utuh per ledger).
 * 3. Snapshot rekening perbankan disimpan permanen pada dokumen claim.
 * 4. Idempotency Key unik per permohonan klaim untuk mencegah duplikasi.
 * 5. Konsensus tim 100%: 1 penolakan mengembalikan ke tahap musyawarah.
 */

import { getAdminFirestore } from '@/lib/firebase/admin';
import { FieldValue, Timestamp, Transaction } from 'firebase-admin/firestore';
import {
  REWARD_LEDGER_STATUS,
  CLAIM_STATUS,
  TASK_STATUS,
  TEAM_STATUS,
  USER_ROLES,
  NOTIFICATION_CATEGORIES,
  type ClaimStatus,
} from '@/lib/constants';
import { decryptBankAccount } from '@/lib/crypto';
import { formatCurrencyIDR, formatMaskedPaymentAccount } from '@/lib/utils';
import { dispatchNotification } from './notification.service';
import { claimPaidEmail, teamConsensusEmail } from './email/templates';
import {
  createClaimSchema,
  processClaimSchema,
  proposeTeamSplitSchema,
  voteTeamSplitSchema,
  uploadLeadTransferProofSchema,
  type CreateClaimInput,
  type ProcessClaimInput,
  type ProposeTeamSplitInput,
  type VoteTeamSplitInput,
  type UploadLeadTransferProofInput,
} from '@/lib/validations/claim';
import type {
  RewardLedgerDocument,
  ClaimDocument,
  TeamDistributionDocument,
  UserDocument,
  TaskDocument,
  TeamDocument,
  TeamMembershipDocument,
  BankAccountSnapshot,
  FirestoreDate,
} from '@/types/database';

/**
 * Helper untuk verifikasi hak akses Admin
 */
async function assertAdminPrivilege(adminUid: string): Promise<UserDocument> {
  const db = getAdminFirestore();
  const userSnap = await db.collection('users').doc(adminUid).get();
  if (!userSnap.exists) {
    throw new Error('Data admin tidak ditemukan.');
  }
  const userData = userSnap.data() as UserDocument;
  if (userData.role !== USER_ROLES.ADMIN && userData.role !== USER_ROLES.SUPER_ADMIN) {
    throw new Error('Akses ditolak: Operasi ini membutuhkan hak istimewa Admin.');
  }
  return userData;
}

/**
 * 1. Helper Atomik: Membuat Reward Ledger di dalam Transaction Firestore
 */
export function createRewardLedgerInsideTransaction(
  transaction: Transaction,
  data: {
    taskId: string;
    ownerUserId: string;
    amount: number;
    teamId?: string | null;
    taskTitle?: string;
  }
): { ledgerId: string; amount: number } {
  const db = getAdminFirestore();
  const integerAmount = Math.floor(data.amount);
  if (integerAmount <= 0) {
    throw new Error('Nominal reward harus berupa bilangan bulat positif.');
  }

  // Gunakan ID deterministik untuk mencegah duplikasi reward dari task yang sama
  const docId = data.teamId
    ? `rw_team_${data.taskId}_${data.teamId}`
    : `rw_solo_${data.taskId}_${data.ownerUserId}`;

  const ledgerRef = db.collection('rewardLedgers').doc(docId);

  const payload: Omit<RewardLedgerDocument, 'id'> = {
    taskId: data.taskId,
    ownerUserId: data.ownerUserId,
    teamId: data.teamId || null,
    amount: integerAmount,
    status: REWARD_LEDGER_STATUS.AVAILABLE,
    claimId: null,
    taskTitle: data.taskTitle || '',
    createdAt: FieldValue.serverTimestamp() as unknown as FirestoreDate,
    updatedAt: FieldValue.serverTimestamp() as unknown as FirestoreDate,
  };

  transaction.set(ledgerRef, payload, { merge: true });
  return { ledgerId: docId, amount: integerAmount };
}

/**
 * 2. Mengambil Semua Dokumen Reward Ledger Milik User
 */
export async function getUserRewardLedgers(userId: string): Promise<RewardLedgerDocument[]> {
  const db = getAdminFirestore();
  const snap = await db
    .collection('rewardLedgers')
    .where('ownerUserId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();

  return snap.docs.map((d) => ({
    ...(d.data() as RewardLedgerDocument),
    id: d.id,
  }));
}

/**
 * 3. Mengambil Semua Riwayat Klaim Milik User
 */
export async function getUserClaims(userId: string): Promise<ClaimDocument[]> {
  const db = getAdminFirestore();
  const snap = await db
    .collection('claims')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();

  return snap.docs.map((d) => ({
    ...(d.data() as ClaimDocument),
    id: d.id,
  }));
}

/**
 * 4. Mengambil Semua Antrean Klaim untuk Admin
 */
export async function getAllClaimsForAdmin(
  adminUid: string,
  filterStatus?: ClaimStatus
): Promise<ClaimDocument[]> {
  await assertAdminPrivilege(adminUid);
  const db = getAdminFirestore();

  let query = db.collection('claims').orderBy('createdAt', 'desc');
  if (filterStatus) {
    query = query.where('status', '==', filterStatus);
  }

  const snap = await query.get();
  return snap.docs.map((d) => ({
    ...(d.data() as ClaimDocument),
    id: d.id,
  }));
}

/**
 * 5. Mengajukan Batch Claim Reward (Solo / Team Lead)
 * WAJIB: firestore.runTransaction()
 * Menjamin:
 * - Idempotensi (idempotencyKey)
 * - Snapshot permanen data rekening yang didekripsi
 * - Satu item reward tidak dapat dicairkan sebagian
 * - Seluruh ledger berubah status ke CLAIMED
 */
export async function submitBatchClaim(
  userId: string,
  input: CreateClaimInput
): Promise<ClaimDocument> {
  const validated = createClaimSchema.parse(input);
  const db = getAdminFirestore();

  return await db.runTransaction(async (transaction) => {
    // 1. Verifikasi Idempotensi
    const claimDocId = `claim_${validated.idempotencyKey}`;
    const existingClaimRef = db.collection('claims').doc(claimDocId);
    const existingClaimSnap = await transaction.get(existingClaimRef);

    if (existingClaimSnap.exists) {
      // Idempotent: jika sudah dibuat sebelumnya, kembalikan data yang ada
      return {
        ...(existingClaimSnap.data() as ClaimDocument),
        id: existingClaimSnap.id,
      };
    }

    // 2. Ambil data profil user & dekripsi rekening bank
    const userRef = db.collection('users').doc(userId);
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists) {
      throw new Error('Data pengguna tidak ditemukan.');
    }
    const userData = userSnap.data() as UserDocument;

    if (!userData.paymentAccountEncrypted) {
      throw new Error(
        'Rekening pencairan dana belum diatur. Silakan lengkapi profil rekening perbankan Anda terlebih dahulu.'
      );
    }

    let bankSnapshot: BankAccountSnapshot;
    try {
      const decrypted = decryptBankAccount(userData.paymentAccountEncrypted);
      bankSnapshot = {
        bankName: decrypted.bankName,
        accountNumber: decrypted.accountNumber,
        accountHolderName: decrypted.accountHolderName,
      };
    } catch {
      throw new Error('Gagal mendekripsi data rekening perbankan. Hubungi tim support.');
    }

    // 3. Ambil dan validasi seluruh Reward Ledger yang dipilih
    let calculatedTotal = 0;
    const ledgerRefs: FirebaseFirestore.DocumentReference[] = [];

    for (const ledgerId of validated.rewardLedgerIds) {
      const ledgerRef = db.collection('rewardLedgers').doc(ledgerId);
      const ledgerSnap = await transaction.get(ledgerRef);

      if (!ledgerSnap.exists) {
        throw new Error(`Item reward ${ledgerId} tidak ditemukan.`);
      }

      const ledgerData = ledgerSnap.data() as RewardLedgerDocument;

      if (ledgerData.ownerUserId !== userId) {
        throw new Error(`Anda tidak memiliki hak atas reward item ${ledgerId}.`);
      }

      if (ledgerData.status !== REWARD_LEDGER_STATUS.AVAILABLE) {
        throw new Error(
          `Reward item "${ledgerData.taskTitle || ledgerId}" telah dicairkan sebelumnya.`
        );
      }

      if (ledgerData.claimId) {
        throw new Error(`Reward item "${ledgerData.taskTitle || ledgerId}" telah terikat pada klaim lain.`);
      }

      calculatedTotal += Math.floor(ledgerData.amount);
      ledgerRefs.push(ledgerRef);
    }

    if (calculatedTotal <= 0) {
      throw new Error('Total nominal pencairan harus lebih besar dari 0 Rupiah.');
    }

    // 4. Buat dokumen Claim baru dengan snapshot data rekening
    const newClaimPayload: Omit<ClaimDocument, 'id'> = {
      userId,
      rewardLedgerIds: validated.rewardLedgerIds,
      totalAmount: calculatedTotal,
      bankAccountSnapshot: bankSnapshot,
      status: CLAIM_STATUS.CLAIMED,
      transferProofUrl: null,
      idempotencyKey: validated.idempotencyKey,
      processedByAdminId: null,
      processedAt: null,
      confirmedAt: null,
      userDisplayName: userData.displayName || userData.email || 'Member',
      userEmail: userData.email || '',
      createdAt: FieldValue.serverTimestamp() as unknown as FirestoreDate,
      updatedAt: FieldValue.serverTimestamp() as unknown as FirestoreDate,
    };

    transaction.set(existingClaimRef, newClaimPayload);

    // 5. Perbarui status seluruh Reward Ledger menjadi CLAIMED
    for (const ref of ledgerRefs) {
      transaction.update(ref, {
        status: REWARD_LEDGER_STATUS.CLAIMED,
        claimId: claimDocId,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    // 6. Catat Audit Trail Permanen
    const auditRef = db.collection('auditEvents').doc();
    transaction.set(auditRef, {
      actorId: userId,
      actorRole: userData.role || USER_ROLES.MEMBER,
      action: 'CLAIM_CREATED',
      entityType: 'CLAIM',
      entityId: claimDocId,
      metadata: {
        totalAmount: calculatedTotal,
        rewardCount: validated.rewardLedgerIds.length,
        bankName: bankSnapshot.bankName,
      },
      timestamp: FieldValue.serverTimestamp(),
    });

    return {
      ...newClaimPayload,
      id: claimDocId,
      createdAt: Timestamp.now() as unknown as FirestoreDate,
      updatedAt: Timestamp.now() as unknown as FirestoreDate,
    } as ClaimDocument;
  });
}

/**
 * 6. Admin Memproses / Membayar Klaim
 * WAJIB: firestore.runTransaction()
 */
export async function adminProcessClaim(
  adminUid: string,
  input: ProcessClaimInput
): Promise<ClaimDocument> {
  const adminData = await assertAdminPrivilege(adminUid);
  const validated = processClaimSchema.parse(input);
  const db = getAdminFirestore();

  return await db.runTransaction(async (transaction) => {
    const claimRef = db.collection('claims').doc(validated.claimId);
    const claimSnap = await transaction.get(claimRef);

    if (!claimSnap.exists) {
      throw new Error('Data permohonan klaim tidak ditemukan.');
    }

    const claimData = claimSnap.data() as ClaimDocument;

    const updates: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (validated.action === 'PROCESS') {
      if (claimData.status !== CLAIM_STATUS.CLAIMED) {
        throw new Error('Hanya klaim berstatus CLAIMED yang dapat diproses ke tahap verifikasi.');
      }
      updates.status = CLAIM_STATUS.PROCESSING;
      updates.processedByAdminId = adminUid;
      if (validated.adminNotes) {
        updates.adminNotes = validated.adminNotes;
      }
    } else if (validated.action === 'PAY') {
      if (
        claimData.status !== CLAIM_STATUS.CLAIMED &&
        claimData.status !== CLAIM_STATUS.PROCESSING
      ) {
        throw new Error('Klaim ini tidak dalam status yang dapat dibayarkan.');
      }

      updates.status = CLAIM_STATUS.PAID;
      updates.transferProofUrl = validated.transferProofUrl;
      updates.processedByAdminId = adminUid;
      updates.processedAt = FieldValue.serverTimestamp();
      if (validated.adminNotes) {
        updates.adminNotes = validated.adminNotes;
      }
    }

    transaction.update(claimRef, updates);

    // Audit Event
    const auditRef = db.collection('auditEvents').doc();
    transaction.set(auditRef, {
      actorId: adminUid,
      actorRole: adminData.role || USER_ROLES.ADMIN,
      action: validated.action === 'PAY' ? 'CLAIM_PAID' : 'CLAIM_PROCESSING',
      entityType: 'CLAIM',
      entityId: validated.claimId,
      metadata: {
        action: validated.action,
        totalAmount: claimData.totalAmount,
        transferProofUrl: validated.transferProofUrl || null,
        adminNotes: validated.adminNotes || null,
      },
      timestamp: FieldValue.serverTimestamp(),
    });

    return {
      ...claimData,
      ...updates,
      id: claimSnap.id,
      updatedAt: Timestamp.now() as unknown as FirestoreDate,
      processedAt: updates.processedAt ? (Timestamp.now() as unknown as FirestoreDate) : claimData.processedAt,
    } as ClaimDocument;
  }).then(async (updatedClaim) => {
    // Strict Invariant: Non-blocking Notification Dispatch
    try {
      if (validated.action === 'PAY' && updatedClaim.userId) {
        const maskedAccount = updatedClaim.bankAccountSnapshot
          ? formatMaskedPaymentAccount(
              updatedClaim.bankAccountSnapshot.bankName,
              updatedClaim.bankAccountSnapshot.accountNumber,
              updatedClaim.bankAccountSnapshot.accountHolderName
            )
          : 'Rekening Terdaftar';
        const formattedAmount = formatCurrencyIDR(updatedClaim.totalAmount);
        const claimUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://sakode.id'}/member/rewards`;
        const emailData = claimPaidEmail(
          updatedClaim.userDisplayName || 'Member SAKODE',
          formattedAmount,
          maskedAccount,
          claimUrl
        );

        dispatchNotification(updatedClaim.userId, {
          title: `Reward Berhasil Ditransfer: ${formattedAmount}`,
          message: `Klaim reward Anda sebesar ${formattedAmount} telah berhasil ditransfer oleh Admin ke ${maskedAccount}. Silakan cek mutasi dan konfirmasi penerimaan.`,
          category: NOTIFICATION_CATEGORIES.CLAIM,
          link: '/member/rewards',
          emailPayload: {
            toEmail: updatedClaim.userEmail,
            subject: emailData.subject,
            html: emailData.html,
            text: emailData.text,
          },
        }).catch((err) => console.warn('[adminProcessClaim] notif error:', err));
      }
    } catch (notifErr) {
      console.warn('[adminProcessClaim] Notification non-blocking error:', notifErr);
    }
    return updatedClaim;
  });
}

/**
 * 7. Member Mengonfirmasi Penerimaan Dana Klaim Solo
 */
export async function confirmClaimReceipt(
  userId: string,
  claimId: string
): Promise<ClaimDocument> {
  const db = getAdminFirestore();

  return await db.runTransaction(async (transaction) => {
    const claimRef = db.collection('claims').doc(claimId);
    const claimSnap = await transaction.get(claimRef);

    if (!claimSnap.exists) {
      throw new Error('Data klaim tidak ditemukan.');
    }

    const claimData = claimSnap.data() as ClaimDocument;

    if (claimData.userId !== userId) {
      throw new Error('Anda tidak memiliki otorisasi untuk mengonfirmasi klaim ini.');
    }

    if (claimData.status !== CLAIM_STATUS.PAID) {
      throw new Error('Klaim belum dibayarkan oleh Admin.');
    }

    const updates = {
      status: CLAIM_STATUS.CONFIRMED,
      confirmedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    transaction.update(claimRef, updates);

    // Audit
    const auditRef = db.collection('auditEvents').doc();
    transaction.set(auditRef, {
      actorId: userId,
      actorRole: USER_ROLES.MEMBER,
      action: 'CLAIM_CONFIRMED',
      entityType: 'CLAIM',
      entityId: claimId,
      metadata: {
        totalAmount: claimData.totalAmount,
      },
      timestamp: FieldValue.serverTimestamp(),
    });

    return {
      ...claimData,
      ...updates,
      id: claimSnap.id,
      confirmedAt: Timestamp.now() as unknown as FirestoreDate,
      updatedAt: Timestamp.now() as unknown as FirestoreDate,
    } as ClaimDocument;
  });
}

/**
 * 8. Mengambil Data Distribusi Reward Tim
 */
export async function getTeamDistribution(
  teamId: string
): Promise<TeamDistributionDocument | null> {
  const db = getAdminFirestore();
  const docRef = db.collection('teamDistributions').doc(`dist_${teamId}`);
  const snap = await docRef.get();

  if (!snap.exists) {
    return null;
  }

  return {
    ...(snap.data() as TeamDistributionDocument),
    id: snap.id,
  };
}

/**
 * 9. Team Lead Mengajukan Proposal Pembagian Reward Tim (Konsensus 100%)
 */
export async function proposeTeamSplitDistribution(
  teamLeadUid: string,
  input: ProposeTeamSplitInput
): Promise<TeamDistributionDocument> {
  const validated = proposeTeamSplitSchema.parse(input);
  const db = getAdminFirestore();

  // 1. Verifikasi Tim & Team Lead
  const teamRef = db.collection('teams').doc(validated.teamId);
  const teamSnap = await teamRef.get();
  if (!teamSnap.exists) {
    throw new Error('Data tim tidak ditemukan.');
  }
  const teamData = teamSnap.data() as TeamDocument;

  if (teamData.teamLeadUserId !== teamLeadUid) {
    throw new Error('Hanya Team Lead yang berhak mengajukan proposal pembagian reward tim.');
  }

  // 2. Verifikasi Task Terkait
  const taskRef = db.collection('tasks').doc(validated.taskId);
  const taskSnap = await taskRef.get();
  if (!taskSnap.exists) {
    throw new Error('Data task terkait tidak ditemukan.');
  }
  const taskData = taskSnap.data() as TaskDocument;

  // 3. Verifikasi Jumlah Nominal Alokasi Harus 100% Cocok dengan Bounty Task
  const sumAllocations = validated.allocations.reduce((sum, a) => sum + Math.floor(a.amount), 0);
  if (sumAllocations !== taskData.totalReward) {
    throw new Error(
      `Total nominal alokasi (Rp ${sumAllocations.toLocaleString(
        'id-ID'
      )}) harus persis sama dengan total bounty task (Rp ${taskData.totalReward.toLocaleString(
        'id-ID'
      )}). Sisa alokasi harus Rp 0.`
    );
  }

  // 4. Ambil Anggota Tim Aktif untuk Mendapatkan Nama/Email
  const membersSnap = await db
    .collection('teamMemberships')
    .where('teamId', '==', validated.teamId)
    .where('status', 'in', ['APPROVED', 'TERMS_ACCEPTED'])
    .get();

  const memberMap = new Map<string, TeamMembershipDocument>();
  membersSnap.docs.forEach((doc) => {
    const data = doc.data() as TeamMembershipDocument;
    memberMap.set(data.userId, data);
  });

  // Validasi seluruh anggota tim aktif terdaftar dalam alokasi
  for (const [memberUid] of memberMap) {
    const hasAllocation = validated.allocations.some((a) => a.userId === memberUid);
    if (!hasAllocation) {
      throw new Error(`Anggota tim dengan ID ${memberUid} belum disertakan dalam alokasi nominal.`);
    }
  }

  // Buat alokasi dengan metadata user & persetujuan awal
  const finalAllocations = validated.allocations.map((a) => {
    const memberDoc = memberMap.get(a.userId);
    const isLead = a.userId === teamLeadUid;
    return {
      userId: a.userId,
      userDisplayName: memberDoc?.userDisplayName || (isLead ? 'Team Lead' : 'Anggota Tim'),
      userEmail: memberDoc?.userEmail || '',
      amount: Math.floor(a.amount),
      // Team Lead otomatis menyetujui proposal yang diajukannya sendiri
      agreed: isLead,
      agreedAt: isLead ? (Timestamp.now() as unknown as FirestoreDate) : null,
      rejectionReason: null,
    };
  });

  const distDocId = `dist_${validated.teamId}`;
  const distRef = db.collection('teamDistributions').doc(distDocId);

  const distPayload: Omit<TeamDistributionDocument, 'id'> = {
    taskId: validated.taskId,
    teamId: validated.teamId,
    totalReward: taskData.totalReward,
    allocations: finalAllocations,
    consensusReached: false,
    paidToLeadByAdmin: false,
    leadTransferProofs: [],
    status: 'DELIBERATION',
    taskTitle: taskData.title,
    teamName: teamData.taskTitle ? `Tim ${teamData.taskTitle}` : `Tim #${validated.teamId.slice(0, 6)}`,
    teamLeadUserId: teamLeadUid,
    rejectionNotes: null,
    rejectedByUserId: null,
    createdAt: FieldValue.serverTimestamp() as unknown as FirestoreDate,
    updatedAt: FieldValue.serverTimestamp() as unknown as FirestoreDate,
  };

  await distRef.set(distPayload, { merge: true });

  // Audit
  await db.collection('auditEvents').add({
    actorId: teamLeadUid,
    actorRole: USER_ROLES.MEMBER,
    action: 'TEAM_SPLIT_PROPOSED',
    entityType: 'TEAM_DISTRIBUTION',
    entityId: distDocId,
    metadata: {
      teamId: validated.teamId,
      taskId: validated.taskId,
      totalReward: taskData.totalReward,
      allocationsCount: finalAllocations.length,
    },
    timestamp: FieldValue.serverTimestamp(),
  });

  const saved = await distRef.get();

  // Strict Invariant: Non-blocking notification dispatch ke seluruh anggota tim yang voting
  try {
    const membersToNotify = finalAllocations.filter((a) => a.userId !== teamLeadUid);
    const voteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://sakode.id'}/member/teams/${validated.teamId}`;

    membersToNotify.forEach((alloc) => {
      const emailData = teamConsensusEmail(
        alloc.userDisplayName || 'Anggota Tim',
        teamData.taskTitle ? `Tim ${teamData.taskTitle}` : 'Tim Task',
        taskData.title,
        formatCurrencyIDR(alloc.amount),
        voteUrl
      );

      dispatchNotification(alloc.userId, {
        title: `Proposal Musyawarah Reward: ${taskData.title}`,
        message: `Team Lead telah mengajukan draf pembagian bounty tim untuk "${taskData.title}". Alokasi Anda: ${formatCurrencyIDR(alloc.amount)}. Suara persetujuan Anda diperlukan.`,
        category: NOTIFICATION_CATEGORIES.CONSENSUS,
        link: `/member/teams/${validated.teamId}`,
        emailPayload: {
          toEmail: alloc.userEmail,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
        },
      }).catch((err) => console.warn('[proposeTeamSplit] Member notif error:', err));
    });
  } catch (notifErr) {
    console.warn('[proposeTeamSplit] Non-blocking notification error:', notifErr);
  }

  return {
    ...(saved.data() as TeamDistributionDocument),
    id: distDocId,
  };
}

/**
 * 10. Anggota Tim Memberikan Suara Persetujuan / Penolakan Pembagian Reward
 * Aturan Konsensus 100%:
 * - 1 Penolakan langsung menggagalkan konsensus (status: DELIBERATION_REJECTED)
 * - Seluruh anggota harus setuju agar konsensus tercapai (status: CONSENSUS_REACHED)
 * - Ketika tercapai 100%, otomatis membuat Reward Ledger untuk Team Lead
 */
export async function voteTeamSplitDistribution(
  userId: string,
  input: VoteTeamSplitInput
): Promise<TeamDistributionDocument> {
  const validated = voteTeamSplitSchema.parse(input);
  const db = getAdminFirestore();

  return await db.runTransaction(async (transaction) => {
    const distRef = db.collection('teamDistributions').doc(`dist_${validated.teamId}`);
    const distSnap = await transaction.get(distRef);

    if (!distSnap.exists) {
      throw new Error('Proposal pembagian reward tim belum diajukan oleh Team Lead.');
    }

    const distData = distSnap.data() as TeamDistributionDocument;

    // Cari alokasi untuk user
    const memberIndex = distData.allocations.findIndex((a) => a.userId === userId);
    if (memberIndex === -1) {
      throw new Error('Anda tidak terdaftar sebagai penerima alokasi dalam tim ini.');
    }

    const currentAllocations = [...distData.allocations];

    if (!validated.agreed) {
      // PENOLAKAN KONSENSUS
      currentAllocations[memberIndex] = {
        ...currentAllocations[memberIndex],
        agreed: false,
        rejectionReason: validated.rejectionReason || 'Menolak proposal alokasi',
      };

      const updates = {
        allocations: currentAllocations,
        consensusReached: false,
        status: 'DELIBERATION_REJECTED' as const,
        rejectionNotes: validated.rejectionReason,
        rejectedByUserId: userId,
        updatedAt: FieldValue.serverTimestamp(),
      };

      transaction.update(distRef, updates);

      // Audit
      const auditRef = db.collection('auditEvents').doc();
      transaction.set(auditRef, {
        actorId: userId,
        actorRole: USER_ROLES.MEMBER,
        action: 'TEAM_SPLIT_REJECTED',
        entityType: 'TEAM_DISTRIBUTION',
        entityId: distSnap.id,
        metadata: {
          reason: validated.rejectionReason,
        },
        timestamp: FieldValue.serverTimestamp(),
      });

      return {
        ...distData,
        ...updates,
        id: distSnap.id,
        updatedAt: Timestamp.now() as unknown as FirestoreDate,
      } as TeamDistributionDocument;
    }

    // PERSETUJUAN KONSENSUS
    currentAllocations[memberIndex] = {
      ...currentAllocations[memberIndex],
      agreed: true,
      agreedAt: Timestamp.now() as unknown as FirestoreDate,
      rejectionReason: null,
    };

    // Evaluasi apakah SEMUA anggota telah menyetujui (100% Konsensus)
    const allAgreed = currentAllocations.every((a) => a.agreed);

    const updates: Record<string, unknown> = {
      allocations: currentAllocations,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (allAgreed) {
      updates.consensusReached = true;
      updates.status = 'CONSENSUS_REACHED';

      // Buat 1 Dokumen Reward Ledger untuk Team Lead
      createRewardLedgerInsideTransaction(transaction, {
        taskId: distData.taskId,
        ownerUserId: distData.teamLeadUserId || distData.allocations[0].userId,
        teamId: distData.teamId,
        amount: distData.totalReward,
        taskTitle: `[Klaim Tim] ${distData.taskTitle || 'Bounty Tim'}`,
      });
    }

    transaction.update(distRef, updates);

    // Audit
    const auditRef = db.collection('auditEvents').doc();
    transaction.set(auditRef, {
      actorId: userId,
      actorRole: USER_ROLES.MEMBER,
      action: allAgreed ? 'TEAM_SPLIT_CONSENSUS_REACHED' : 'TEAM_SPLIT_VOTED',
      entityType: 'TEAM_DISTRIBUTION',
      entityId: distSnap.id,
      metadata: {
        allAgreed,
        votedUserId: userId,
      },
      timestamp: FieldValue.serverTimestamp(),
    });

    return {
      ...distData,
      ...updates,
      id: distSnap.id,
      updatedAt: Timestamp.now() as unknown as FirestoreDate,
    } as TeamDistributionDocument;
  });
}

/**
 * 11. Team Lead Mengunggah Bukti Transfer per Anggota Tim
 */
export async function uploadTeamLeadMemberProof(
  teamLeadUid: string,
  input: UploadLeadTransferProofInput
): Promise<TeamDistributionDocument> {
  const validated = uploadLeadTransferProofSchema.parse(input);
  const db = getAdminFirestore();

  const distRef = db.collection('teamDistributions').doc(`dist_${validated.teamId}`);
  const distSnap = await distRef.get();

  if (!distSnap.exists) {
    throw new Error('Data distribusi tim tidak ditemukan.');
  }

  const distData = distSnap.data() as TeamDistributionDocument;

  if (distData.teamLeadUserId !== teamLeadUid) {
    throw new Error('Hanya Team Lead yang berhak mengunggah bukti transfer antar anggota.');
  }

  const proofs = [...(distData.leadTransferProofs || [])];
  const existingIdx = proofs.findIndex((p) => p.memberUserId === validated.memberUserId);

  const proofEntry = {
    memberUserId: validated.memberUserId,
    proofUrl: validated.transferProofUrl,
    uploadedAt: Timestamp.now() as unknown as FirestoreDate,
    confirmedByMember: false,
    confirmedAt: null,
  };

  if (existingIdx >= 0) {
    proofs[existingIdx] = proofEntry;
  } else {
    proofs.push(proofEntry);
  }

  await distRef.update({
    leadTransferProofs: proofs,
    updatedAt: FieldValue.serverTimestamp(),
  });

  const updatedSnap = await distRef.get();
  return {
    ...(updatedSnap.data() as TeamDistributionDocument),
    id: distRef.id,
  };
}

/**
 * 12. Anggota Tim Mengonfirmasi Penerimaan Dana dari Team Lead
 * Jika SELURUH anggota tim telah mengonfirmasi, status task dan tim diubah menjadi CLOSED / COMPLETED.
 */
export async function confirmTeamMemberDistribution(
  userId: string,
  teamId: string
): Promise<TeamDistributionDocument> {
  const db = getAdminFirestore();

  return await db.runTransaction(async (transaction) => {
    const distRef = db.collection('teamDistributions').doc(`dist_${teamId}`);
    const distSnap = await transaction.get(distRef);

    if (!distSnap.exists) {
      throw new Error('Data distribusi tim tidak ditemukan.');
    }

    const distData = distSnap.data() as TeamDistributionDocument;

    const proofs = [...(distData.leadTransferProofs || [])];
    const proofIdx = proofs.findIndex((p) => p.memberUserId === userId);

    if (proofIdx === -1) {
      throw new Error('Bukti transfer dari Team Lead untuk akun Anda belum diunggah.');
    }

    proofs[proofIdx] = {
      ...proofs[proofIdx],
      confirmedByMember: true,
      confirmedAt: Timestamp.now() as unknown as FirestoreDate,
    };

    // Evaluasi apakah SEMUA anggota selain lead (atau semua bukti yang ada) sudah mengonfirmasi
    const nonLeadMembers = distData.allocations.filter((a) => a.userId !== distData.teamLeadUserId);
    const allMembersConfirmed =
      nonLeadMembers.length === 0 ||
      nonLeadMembers.every((m) => {
        const p = proofs.find((proof) => proof.memberUserId === m.userId);
        return p && p.confirmedByMember;
      });

    const distUpdates: Record<string, unknown> = {
      leadTransferProofs: proofs,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (allMembersConfirmed) {
      distUpdates.status = 'COMPLETED';

      // Ubah status Task menjadi CLOSED
      const taskRef = db.collection('tasks').doc(distData.taskId);
      transaction.update(taskRef, {
        status: TASK_STATUS.CLOSED,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Ubah status Team menjadi COMPLETED
      const teamRef = db.collection('teams').doc(distData.teamId);
      transaction.update(teamRef, {
        status: TEAM_STATUS.COMPLETED,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    transaction.update(distRef, distUpdates);

    // Audit
    const auditRef = db.collection('auditEvents').doc();
    transaction.set(auditRef, {
      actorId: userId,
      actorRole: USER_ROLES.MEMBER,
      action: allMembersConfirmed ? 'TEAM_DISTRIBUTION_COMPLETED' : 'TEAM_PAYMENT_CONFIRMED',
      entityType: 'TEAM_DISTRIBUTION',
      entityId: distRef.id,
      metadata: {
        allMembersConfirmed,
        confirmedUserId: userId,
      },
      timestamp: FieldValue.serverTimestamp(),
    });

    return {
      ...distData,
      ...distUpdates,
      id: distRef.id,
      updatedAt: Timestamp.now() as unknown as FirestoreDate,
    } as TeamDistributionDocument;
  });
}
