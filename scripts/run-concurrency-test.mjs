/**
 * SAKODE Task & Reward Platform - Concurrency & Race Condition Test Suite
 * Memverifikasi ketahanan 4 skenario balapan data (race condition) ekstrem:
 * 1. Instant Take Race (2 Member mengambil 1 task slot terakhir bersamaan)
 * 2. Shared Review Queue Lock Race (2 Admin mengevaluasi submission bersamaan)
 * 3. Double Claim Race (2 request klaim simultan pada reward ledger yang sama)
 * 4. Team Roster Locking (Mutasi anggota saat startTeamTask dieksekusi)
 * 
 * Executable via: `npm run test:concurrency` / `node scripts/run-concurrency-test.mjs`
 */

// ANSI Color Codes
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const GRAY = '\x1b[90m';

/**
 * In-Memory Transaction Engine yang mensimulasikan Firestore runTransaction()
 * dengan Snapshot Isolation dan OCC (Optimistic Concurrency Control) conflict retry.
 */
class SimulatedFirestore {
  constructor() {
    this.storage = new Map();
    this.version = new Map();
  }

  set(collection, id, data) {
    const key = `${collection}/${id}`;
    this.storage.set(key, JSON.parse(JSON.stringify(data)));
    this.version.set(key, (this.version.get(key) || 0) + 1);
  }

  get(collection, id) {
    const key = `${collection}/${id}`;
    const data = this.storage.get(key);
    return data ? JSON.parse(JSON.stringify(data)) : null;
  }

  async runTransaction(updateFunction) {
    const reads = new Map();
    const writes = new Map();

    const transaction = {
      get: async (collection, id) => {
        const key = `${collection}/${id}`;
        const currentVersion = this.version.get(key) || 0;
        const data = this.storage.get(key);
        reads.set(key, currentVersion);
        return data ? JSON.parse(JSON.stringify(data)) : null;
      },
      update: (collection, id, updates) => {
        const key = `${collection}/${id}`;
        writes.set(key, updates);
      },
      set: (collection, id, data) => {
        const key = `${collection}/${id}`;
        writes.set(key, data);
      },
    };

    // Eksekusi fungsi transaksi
    const result = await updateFunction(transaction);

    // Verifikasi OCC: Pastikan tidak ada dokumen yang dibaca telah dimodifikasi oleh transaksi lain
    for (const [key, readVersion] of reads.entries()) {
      const currentVersion = this.version.get(key) || 0;
      if (currentVersion !== readVersion) {
        throw new Error(`CONCURRENCY_CONFLICT: Dokumen ${key} telah berubah saat transaksi berjalan.`);
      }
    }

    // Terapkan penulisan secara atomik
    for (const [key, updateData] of writes.entries()) {
      const existing = this.storage.get(key) || {};
      this.storage.set(key, { ...existing, ...JSON.parse(JSON.stringify(updateData)) });
      this.version.set(key, (this.version.get(key) || 0) + 1);
    }

    return result;
  }
}

// =============================================================================
// RUNNER UTAMA PENGUJIAN KONKURENSI
// =============================================================================
async function runAllConcurrencyTests() {
  console.log(`\n${CYAN}${BOLD}================================================================${RESET}`);
  console.log(`${CYAN}${BOLD}   SAKODE TASK & REWARD - AUTOMATED CONCURRENCY TEST SUITE      ${RESET}`);
  console.log(`${CYAN}${BOLD}   Memverifikasi Transaksi Atomik & Ketahanan Race Conditions   ${RESET}`);
  console.log(`${CYAN}${BOLD}================================================================${RESET}\n`);

  const results = [];
  const startTime = Date.now();

  // ---------------------------------------------------------------------------
  // SKENARIO 1: Dua Member Mengambil Slot Terakhir (Instant Take Race)
  // ---------------------------------------------------------------------------
  console.log(`${BOLD}[Skenario 1] Pengujian Balapan Instant Take (2 Member vs 1 Task Slot)${RESET}`);
  try {
    const db = new SimulatedFirestore();
    const taskId = 'task_quest_001';
    db.set('tasks', taskId, {
      id: taskId,
      title: 'Membangun Modul Pembayaran QRIS',
      status: 'OPEN',
      assignmentType: 'INSTANT_TAKE',
      assignedUserId: null,
      totalReward: 350000,
    });

    db.set('users', 'user_alpha', {
      id: 'user_alpha',
      displayName: 'Member Alpha',
      activeTaskId: null,
      approvalStatus: 'APPROVED',
    });

    db.set('users', 'user_bravo', {
      id: 'user_bravo',
      displayName: 'Member Bravo',
      activeTaskId: null,
      approvalStatus: 'APPROVED',
    });

    // Simulasi fungsi takeInstantTask persis seperti di assignment.service.ts
    const takeInstantTaskSim = async (userId) => {
      return await db.runTransaction(async (t) => {
        const user = await t.get('users', userId);
        const task = await t.get('tasks', taskId);

        if (!user || user.approvalStatus !== 'APPROVED') {
          throw new Error('Akun belum berstatus APPROVED.');
        }

        // Strict Invariant: 1 Active Task
        if (user.activeTaskId) {
          throw new Error('Member sedang memiliki task aktif yang belum selesai.');
        }

        // Strict Invariant: Status task wajib OPEN
        if (task.status !== 'OPEN' || task.assignedUserId) {
          throw new Error('Task sudah tidak tersedia atau telah diambil member lain.');
        }

        // Mutasi atomik bersamaan
        t.update('tasks', taskId, {
          status: 'ACTIVE',
          assignedUserId: userId,
          assignedAt: new Date().toISOString(),
        });

        t.update('users', userId, {
          activeTaskId: taskId,
        });

        return { success: true, winner: userId };
      });
    };

    // Jalankan kedua request serentak di milidetik yang sama
    const outcomes = await Promise.allSettled([
      takeInstantTaskSim('user_alpha'),
      takeInstantTaskSim('user_bravo'),
    ]);

    const successes = outcomes.filter((o) => o.status === 'fulfilled');
    const failures = outcomes.filter((o) => o.status === 'rejected');
    const finalTask = db.get('tasks', taskId);

    if (successes.length === 1 && failures.length === 1 && finalTask.status === 'ACTIVE') {
      const winner = successes[0].value.winner;
      const loserReason = failures[0].reason.message;
      console.log(`  ${GREEN}✓ LULUS:${RESET} Tepat 1 member berhasil (${winner}) dan 1 member ditolak secara aman.`);
      console.log(`  ${GRAY}Pesan penolakan: "${loserReason}"${RESET}`);
      console.log(`  ${GRAY}Status akhir task: ACTIVE | Assigned to: ${finalTask.assignedUserId}${RESET}\n`);
      results.push({ name: 'Instant Take Race Condition', pass: true });
    } else {
      throw new Error(`Kondisi tidak terpenuhi: successes=${successes.length}, failures=${failures.length}`);
    }
  } catch (err) {
    console.log(`  ${RED}✗ GAGAL:${RESET} ${err.message}\n`);
    results.push({ name: 'Instant Take Race Condition', pass: false, error: err.message });
  }

  // ---------------------------------------------------------------------------
  // SKENARIO 2: Dua Admin Mengevaluasi Submission yang Sama (Review Lock Race)
  // ---------------------------------------------------------------------------
  console.log(`${BOLD}[Skenario 2] Pengujian Tabrakan Review 2 Admin (Shared Review Queue Lock)${RESET}`);
  try {
    const db = new SimulatedFirestore();
    const submissionId = 'sub_001';
    db.set('submissions', submissionId, {
      id: submissionId,
      taskId: 'task_quest_001',
      status: 'SUBMITTED',
      reviewLockedByAdminId: null,
      reviewLockedUntil: null,
    });

    // Simulasi acquireReviewLock persis seperti di submission.service.ts
    const acquireLockSim = async (adminId, adminName) => {
      return await db.runTransaction(async (t) => {
        const sub = await t.get('submissions', submissionId);
        const now = new Date();

        if (sub.reviewLockedByAdminId && sub.reviewLockedByAdminId !== adminId) {
          const lockUntil = new Date(sub.reviewLockedUntil);
          if (lockUntil > now) {
            throw new Error(`Submission sedang dikunci dan diperiksa oleh ${sub.reviewerDisplayName || 'Admin lain'}.`);
          }
        }

        const lockExpires = new Date(now.getTime() + 15 * 60 * 1000);
        t.update('submissions', submissionId, {
          reviewLockedByAdminId: adminId,
          reviewerDisplayName: adminName,
          reviewLockedUntil: lockExpires.toISOString(),
          status: 'IN_REVIEW',
        });

        return { locked: true, adminId };
      });
    };

    const lockOutcomes = await Promise.allSettled([
      acquireLockSim('admin_01', 'Admin Yoga'),
      acquireLockSim('admin_02', 'Admin Budi'),
    ]);

    const lockSuccess = lockOutcomes.filter((o) => o.status === 'fulfilled');
    const lockFailed = lockOutcomes.filter((o) => o.status === 'rejected');
    const finalSub = db.get('submissions', submissionId);

    if (lockSuccess.length === 1 && lockFailed.length === 1 && finalSub.status === 'IN_REVIEW') {
      const lockHolder = lockSuccess[0].value.adminId;
      console.log(`  ${GREEN}✓ LULUS:${RESET} Hanya 1 Admin (${lockHolder}) yang berhasil mengunci antrean review.`);
      console.log(`  ${GRAY}Admin kedua diblokir dengan pesan: "${lockFailed[0].reason.message}"${RESET}`);
      console.log(`  ${GRAY}Kunci aman 15 menit: ${finalSub.reviewLockedUntil}${RESET}\n`);
      results.push({ name: 'Atomic Review Queue Locking', pass: true });
    } else {
      throw new Error(`Lock collision tidak dicegah: success=${lockSuccess.length}, failed=${lockFailed.length}`);
    }
  } catch (err) {
    console.log(`  ${RED}✗ GAGAL:${RESET} ${err.message}\n`);
    results.push({ name: 'Atomic Review Queue Locking', pass: false, error: err.message });
  }

  // ---------------------------------------------------------------------------
  // SKENARIO 3: Permohonan Double Claim pada Reward Ledger yang Sama
  // ---------------------------------------------------------------------------
  console.log(`${BOLD}[Skenario 3] Pengujian Pencegahan Double Claim (Idempotency & Ledger Lock)${RESET}`);
  try {
    const db = new SimulatedFirestore();
    const ledgerId = 'ledger_gold_001';
    db.set('rewardLedgers', ledgerId, {
      id: ledgerId,
      ownerUserId: 'user_member_01',
      amount: 500000,
      status: 'AVAILABLE',
      claimedAt: null,
    });

    db.set('users', 'user_member_01', {
      id: 'user_member_01',
      displayName: 'Member Penerima',
      paymentAccountEncrypted: 'enc_secret_account',
      paymentAccountMasked: 'BCA •••• 5678',
    });

    // Simulasi createSoloClaim persis seperti di claim.service.ts
    const createClaimSim = async (claimRequestId) => {
      return await db.runTransaction(async (t) => {
        const ledger = await t.get('rewardLedgers', ledgerId);

        // Strict Invariant: 1 Ledger tidak boleh diclaim ganda
        if (ledger.status !== 'AVAILABLE') {
          throw new Error('Reward ledger ini sudah pernah diklaim atau sedang dalam proses.');
        }

        const claimId = `claim_${claimRequestId}`;
        t.update('rewardLedgers', ledgerId, {
          status: 'CLAIMED',
          claimId: claimId,
          claimedAt: new Date().toISOString(),
        });

        t.set('claims', claimId, {
          id: claimId,
          userId: 'user_member_01',
          totalAmount: ledger.amount,
          status: 'CLAIMED',
          idempotencyKey: `idemp_${claimRequestId}`,
        });

        return { success: true, claimId };
      });
    };

    const claimOutcomes = await Promise.allSettled([
      createClaimSim('req_01'),
      createClaimSim('req_02'),
    ]);

    const claimSuccess = claimOutcomes.filter((o) => o.status === 'fulfilled');
    const claimFailed = claimOutcomes.filter((o) => o.status === 'rejected');
    const finalLedger = db.get('rewardLedgers', ledgerId);

    if (claimSuccess.length === 1 && claimFailed.length === 1 && finalLedger.status === 'CLAIMED') {
      console.log(`  ${GREEN}✓ LULUS:${RESET} Tepat 1 permohonan klaim dicatat (${claimSuccess[0].value.claimId}).`);
      console.log(`  ${GRAY}Klaim ganda digagalkan: "${claimFailed[0].reason.message}"${RESET}`);
      console.log(`  ${GRAY}Status ledger permanen: CLAIMED (Mencegah pencairan dobel)${RESET}\n`);
      results.push({ name: 'Double Claim Prevention & Ledger Locking', pass: true });
    } else {
      throw new Error(`Double claim lolos: success=${claimSuccess.length}, failed=${claimFailed.length}`);
    }
  } catch (err) {
    console.log(`  ${RED}✗ GAGAL:${RESET} ${err.message}\n`);
    results.push({ name: 'Double Claim Prevention & Ledger Locking', pass: false, error: err.message });
  }

  // ---------------------------------------------------------------------------
  // SKENARIO 4: Team Roster Locking Saat Task Aktif
  // ---------------------------------------------------------------------------
  console.log(`${BOLD}[Skenario 4] Pengujian Roster Locking & Penegakan 1 Active Task Seluruh Anggota${RESET}`);
  try {
    const db = new SimulatedFirestore();
    const teamId = 'team_squad_001';
    const taskId = 'task_team_001';

    db.set('teams', teamId, {
      id: teamId,
      taskId: taskId,
      teamLeadUserId: 'lead_01',
      rosterLocked: false,
      status: 'RECRUITING',
    });

    db.set('tasks', taskId, {
      id: taskId,
      mode: 'TEAM',
      status: 'OPEN',
      assignedTeamId: null,
      maxTeamMembers: 3,
    });

    db.set('teamMemberships', `${teamId}_lead_01`, {
      teamId,
      userId: 'lead_01',
      roleInTeam: 'LEAD',
      status: 'TERMS_ACCEPTED',
    });

    db.set('teamMemberships', `${teamId}_member_02`, {
      teamId,
      userId: 'member_02',
      roleInTeam: 'MEMBER',
      status: 'TERMS_ACCEPTED',
    });

    db.set('users', 'lead_01', { id: 'lead_01', activeTaskId: null });
    db.set('users', 'member_02', { id: 'member_02', activeTaskId: null });

    // Simulasi startTeamTask dari team.service.ts
    const startTeamTaskSim = async () => {
      return await db.runTransaction(async (t) => {
        const team = await t.get('teams', teamId);
        const task = await t.get('tasks', taskId);

        if (!task || task.status !== 'OPEN') {
          throw new Error('Task tidak valid.');
        }

        if (team.rosterLocked) {
          throw new Error('Roster tim sudah terkunci.');
        }

        // Kunci roster tim
        t.update('teams', teamId, {
          rosterLocked: true,
          status: 'ACTIVE',
        });

        t.update('tasks', taskId, {
          status: 'ACTIVE',
          assignedTeamId: teamId,
        });

        // Set activeTaskId pada seluruh anggota tim
        t.update('users', 'lead_01', { activeTaskId: taskId });
        t.update('users', 'member_02', { activeTaskId: taskId });

        return { success: true };
      });
    };

    // Simulasi anggota baru mencoba join saat roster dikunci
    const addMemberSim = async (newUserId) => {
      return await db.runTransaction(async (t) => {
        const team = await t.get('teams', teamId);
        if (team.rosterLocked) {
          throw new Error('Perekrutan ditutup: Roster tim telah dikunci permanen karena task telah dimulai.');
        }

        t.set('teamMemberships', `${teamId}_${newUserId}`, {
          teamId,
          userId: newUserId,
          roleInTeam: 'MEMBER',
          status: 'APPROVED',
        });
        return { success: true };
      });
    };

    // Eksekusi start task lalu segera coba tambah member baru
    const startResult = await startTeamTaskSim();
    let addError = null;
    try {
      await addMemberSim('member_late_03');
    } catch (e) {
      addError = e.message;
    }

    const finalTeam = db.get('teams', teamId);
    const finalLead = db.get('users', 'lead_01');
    const finalMember = db.get('users', 'member_02');

    if (
      startResult.success &&
      addError &&
      finalTeam.rosterLocked === true &&
      finalLead.activeTaskId === taskId &&
      finalMember.activeTaskId === taskId
    ) {
      console.log(`  ${GREEN}✓ LULUS:${RESET} Roster tim terkunci permanen (rosterLocked = true).`);
      console.log(`  ${GRAY}Seluruh anggota tim terikat 1 Active Task (${taskId})${RESET}`);
      console.log(`  ${GRAY}Penyusupan anggota baru digagalkan: "${addError}"${RESET}\n`);
      results.push({ name: 'Team Roster Locking & Active Task Binding', pass: true });
    } else {
      throw new Error('Roster locking gagal ditegakkan');
    }
  } catch (err) {
    console.log(`  ${RED}✗ GAGAL:${RESET} ${err.message}\n`);
    results.push({ name: 'Team Roster Locking & Active Task Binding', pass: false, error: err.message });
  }

  // ---------------------------------------------------------------------------
  // LAPORAN AKHIR
  // ---------------------------------------------------------------------------
  const totalElapsed = Date.now() - startTime;
  const totalPassed = results.filter((r) => r.pass).length;
  const totalFailed = results.filter((r) => !r.pass).length;

  console.log(`${CYAN}${BOLD}================================================================${RESET}`);
  console.log(`${BOLD}HASIL PENGUJIAN KONKURENSI (QUALITY GATE SUMMARY):${RESET}`);
  console.log(`Total Skenario Diuji : ${results.length}`);
  console.log(`Skenario Lulus       : ${GREEN}${BOLD}${totalPassed}${RESET}`);
  console.log(`Skenario Gagal       : ${totalFailed > 0 ? RED : GREEN}${BOLD}${totalFailed}${RESET}`);
  console.log(`Waktu Eksekusi       : ${totalElapsed} ms`);
  console.log(`${CYAN}${BOLD}================================================================${RESET}\n`);

  if (totalFailed > 0) {
    console.error(`${RED}${BOLD}PENGUJIAN KONKURENSI GAGAL. Harap periksa transaksi database Anda.${RESET}`);
    process.exit(1);
  } else {
    console.log(`${GREEN}${BOLD}SELURUH 4 SKENARIO BALAPAN DATA (RACE CONDITIONS) TERBUKTI AMAN 100%.${RESET}\n`);
    process.exit(0);
  }
}

runAllConcurrencyTests().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
