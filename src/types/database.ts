/**
 * SAKODE Task & Reward Platform - Firestore Database Type Definitions
 * Didefinisikan berdasarkan spesifikasi resmi ARCHITECTURE.md & AGENTS.md.
 * 
 * Strict Invariants:
 * 1. Seluruh nominal uang adalah number integer Rupiah (dilarang float).
 * 2. Waktu disimpan dalam UTC Firestore Timestamp.
 * 3. 1 Active Task & maksimal 3 Pending Application per member.
 */

import type {
  ApplicationStatus,
  ClaimStatus,
  InitialSplitPrinciple,
  PenaltyType,
  ReportStatus,
  ReportTargetType,
  RewardLedgerStatus,
  SubmissionStatus,
  TaskAssignmentType,
  TaskDeadlineType,
  TaskMode,
  TaskStatus,
  TeamMembershipStatus,
  TeamRole,
  TeamStatus,
  UserApprovalStatus,
  UserRole,
} from '@/lib/constants';

// =============================================================================
// Helper Timestamp Serializer
// =============================================================================
export interface FirestoreTimestampLike {
  seconds: number;
  nanoseconds: number;
  toDate?: () => Date;
}

export type FirestoreDate = FirestoreTimestampLike | Date | string | number;

// =============================================================================
// Sub-tipe Pendukung
// =============================================================================
export interface UserStats {
  completedTasks: number;
  onTimeTasks: number;
  failedTasks: number;
  provenReports: number;
}

export interface TaskTermsSnapshot {
  version: number;
  content: string;
  capturedAt: FirestoreDate;
}

export interface EvidenceFile {
  url: string;
  publicId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface SubmissionAppeal {
  appealedByUserId: string;
  reason: string;
  evidenceFiles: EvidenceFile[];
  filedAt: FirestoreDate;
  reviewedByAdminId?: string | null;
  reviewedAt?: FirestoreDate | null;
  resolutionStatus?: 'APPROVED' | 'REJECTED';
  resolutionNotes?: string | null;
}

export interface BankAccountSnapshot {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
}

export interface TeamAllocation {
  userId: string;
  amount: number; // Integer Rupiah
  agreed: boolean;
  agreedAt: FirestoreDate | null;
}

export interface LeadTransferProof {
  memberUserId: string;
  proofUrl: string;
  uploadedAt: FirestoreDate;
  confirmedByMember: boolean;
  confirmedAt: FirestoreDate | null;
}

// =============================================================================
// 1. Koleksi: users
// =============================================================================
export interface UserDocument {
  id: string; // Firebase Auth UID
  email: string;
  displayName: string;
  contactNumber: string; // WhatsApp / Telegram
  skills: string[]; // Tag keahlian member
  role: UserRole;
  approvalStatus: UserApprovalStatus;
  paymentAccountEncrypted: string; // AES-256 info bank / e-wallet
  paymentAccountMasked: string; // contoh: "BCA ****5678 a.n J*** D**"
  activeTaskId: string | null; // Id task aktif saat ini (Maksimal 1)
  pendingApplicationCount: number; // Maksimal 3
  stats: UserStats;
  rejectionReason?: string | null; // Catatan jika status REJECTED
  revisionNotes?: string | null; // Catatan perbaikan dari admin
  approvedByAdminId?: string | null;
  approvedAt?: FirestoreDate | null;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

// =============================================================================
// 2. Koleksi: tasks
// =============================================================================
export interface TaskDocument {
  id: string;
  title: string;
  description: string;
  scope: string;
  deliverableGuidelines: string;
  acceptanceCriteria: string[];
  mode: TaskMode;
  minTeamSize?: number | null;
  maxTeamSize?: number | null;
  assignmentType: TaskAssignmentType;
  requiredSkills: string[];
  totalReward: number; // Integer Rupiah
  deadlineType: TaskDeadlineType;
  fixedDeadlineAt: FirestoreDate | null;
  durationMinutes: number | null;
  deadlineAt: FirestoreDate | null; // Batas aktual terhitung
  status: TaskStatus;
  termsSnapshot: TaskTermsSnapshot;
  assignedUserId: string | null;
  assignedTeamId: string | null;
  reviewLockedByAdminId: string | null;
  reviewLockedUntil: FirestoreDate | null;
  parentTaskId: string | null; // Terisi jika Continuation Task
  continuationTaskId: string | null; // Terisi jika task ini dilanjutkan
  createdByAdminId: string;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

// =============================================================================
// 3. Koleksi: applications
// =============================================================================
export interface ApplicationDocument {
  id: string;
  taskId: string;
  userId: string;
  message: string;
  portfolioLinks: string[];
  status: ApplicationStatus;
  withdrawalReason: string | null;
  applicantDisplayName?: string;
  applicantEmail?: string;
  applicantContactNumber?: string;
  applicantSkills?: string[];
  taskTitle?: string;
  taskReward?: number;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

// =============================================================================
// 4. Koleksi: teams
// =============================================================================
export interface TeamDocument {
  id: string;
  taskId: string;
  teamLeadUserId: string;
  minMembers: number;
  maxMembers: number;
  memberCount: number;
  rosterLocked: boolean;
  initialSplitPrinciple: InitialSplitPrinciple;
  inviteCode: string;
  status: TeamStatus;
  taskTitle?: string;
  taskTotalReward?: number;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

// =============================================================================
// 5. Koleksi: teamMemberships
// =============================================================================
export interface TeamMembershipDocument {
  id: string;
  teamId: string;
  taskId: string;
  userId: string;
  roleInTeam: TeamRole;
  status: TeamMembershipStatus;
  agreedTermsAt: FirestoreDate | null;
  agreedTermsVersion: number | null;
  agreedSplitPrinciple: InitialSplitPrinciple | null;
  userDisplayName?: string;
  userEmail?: string;
  userContactNumber?: string;
  userSkills?: string[];
  createdAt: FirestoreDate;
  updatedAt?: FirestoreDate;
}

// =============================================================================
// 6. Koleksi: submissions
// =============================================================================
export interface SubmissionDocument {
  id: string;
  taskId: string;
  submittedByUserId: string;
  teamId: string | null;
  version: number;
  notes: string;
  deliverableLinks: string[];
  evidenceFiles: EvidenceFile[];
  status: SubmissionStatus;
  revisionNotes: string | null;
  revisionDeadlineAt: FirestoreDate | null;
  extensionReason: string | null;
  appeal: SubmissionAppeal | null;
  reviewedByAdminId: string | null;
  reviewedAt?: FirestoreDate | null;
  // Shared Review Queue Lock fields
  reviewLockedByAdminId?: string | null;
  reviewLockedUntil?: FirestoreDate | null;
  reviewerDisplayName?: string | null;
  // Metadata helper fields
  taskTitle?: string;
  taskTotalReward?: number;
  submitterDisplayName?: string;
  submitterEmail?: string;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

// =============================================================================
// 7. Koleksi: rewardLedgers
// =============================================================================
export interface RewardLedgerDocument {
  id: string;
  taskId: string;
  ownerUserId: string;
  teamId: string | null;
  amount: number; // Integer Rupiah
  status: RewardLedgerStatus;
  claimId: string | null;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

// =============================================================================
// 8. Koleksi: claims
// =============================================================================
export interface ClaimDocument {
  id: string;
  userId: string;
  rewardLedgerIds: string[];
  totalAmount: number; // Integer Rupiah
  bankAccountSnapshot: BankAccountSnapshot;
  status: ClaimStatus;
  transferProofUrl: string | null;
  idempotencyKey: string;
  processedByAdminId: string | null;
  processedAt: FirestoreDate | null;
  confirmedAt: FirestoreDate | null;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

// =============================================================================
// 9. Koleksi: teamDistributions
// =============================================================================
export interface TeamDistributionDocument {
  id: string;
  taskId: string;
  teamId: string;
  totalReward: number; // Integer Rupiah
  allocations: TeamAllocation[];
  consensusReached: boolean;
  paidToLeadByAdmin: boolean;
  leadTransferProofs: LeadTransferProof[];
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

// =============================================================================
// 10. Koleksi: reports
// =============================================================================
export interface ReportDocument {
  id: string;
  reporterUserId: string;
  targetType: ReportTargetType;
  targetId: string;
  category: string;
  chronology: string;
  evidenceFiles: EvidenceFile[];
  status: ReportStatus;
  assignedAdminId: string | null;
  resolutionNotes: string | null;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

// =============================================================================
// 11. Koleksi: penalties
// =============================================================================
export interface PenaltyDocument {
  id: string;
  userId: string;
  reportId: string | null;
  type: PenaltyType;
  validUntil: FirestoreDate | null;
  reason: string;
  issuedByAdminId: string;
  isOverridden: boolean;
  overrideReason: string | null;
  createdAt: FirestoreDate;
}

// =============================================================================
// 12. Koleksi: notifications
// =============================================================================
export interface NotificationDocument {
  id: string;
  userId: string;
  title: string;
  message: string;
  category: 'TASK' | 'CLAIM' | 'TEAM' | 'REPORT' | 'SYSTEM';
  link: string | null;
  isRead: boolean;
  createdAt: FirestoreDate;
}

// =============================================================================
// 13. Koleksi: auditEvents (Append-Only)
// =============================================================================
export interface AuditEventDocument {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeSnapshot: Record<string, unknown> | null;
  afterSnapshot: Record<string, unknown> | null;
  reason: string | null;
  timestamp: FirestoreDate;
}
