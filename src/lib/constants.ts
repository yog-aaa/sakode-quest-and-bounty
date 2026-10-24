/**
 * SAKODE Task & Reward Platform - Global Constants
 * Mematuhi invariants di AGENTS.md, ARCHITECTURE.md, dan DESIGN.md
 */

// =============================================================================
// 1. Peran & Akses Pengguna (User Roles & Access)
// =============================================================================
export const USER_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const USER_APPROVAL_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type UserApprovalStatus =
  (typeof USER_APPROVAL_STATUS)[keyof typeof USER_APPROVAL_STATUS];

// =============================================================================
// 2. Siklus Hidup Task (Task Lifecycle)
// =============================================================================
export const TASK_MODES = {
  SOLO: 'SOLO',
  TEAM: 'TEAM',
} as const;

export type TaskMode = (typeof TASK_MODES)[keyof typeof TASK_MODES];

export const TASK_ASSIGNMENT_TYPES = {
  INSTANT_TAKE: 'INSTANT_TAKE',
  APPLICATION: 'APPLICATION',
} as const;

export type TaskAssignmentType =
  (typeof TASK_ASSIGNMENT_TYPES)[keyof typeof TASK_ASSIGNMENT_TYPES];

export const TASK_DEADLINE_TYPES = {
  FIXED: 'FIXED',
  DURATION: 'DURATION',
} as const;

export type TaskDeadlineType =
  (typeof TASK_DEADLINE_TYPES)[keyof typeof TASK_DEADLINE_TYPES];

export const TASK_STATUS = {
  DRAFT: 'DRAFT',
  OPEN: 'OPEN',
  RECRUITING: 'RECRUITING',
  READY: 'READY',
  ACTIVE: 'ACTIVE',
  SUBMITTED: 'SUBMITTED',
  IN_REVIEW: 'IN_REVIEW',
  REVISION: 'REVISION',
  APPEALED: 'APPEALED',
  APPROVED: 'APPROVED',
  PARTIAL: 'PARTIAL',
  FAILED: 'FAILED',
  CLOSED: 'CLOSED',
} as const;

export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

// =============================================================================
// 3. Pendaftaran / Application Task
// =============================================================================
export const APPLICATION_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
} as const;

export type ApplicationStatus =
  (typeof APPLICATION_STATUS)[keyof typeof APPLICATION_STATUS];

// =============================================================================
// 4. Manajemen Tim (Team Dynamics)
// =============================================================================
export const TEAM_STATUS = {
  RECRUITING: 'RECRUITING',
  READY: 'READY',
  ACTIVE: 'ACTIVE',
} as const;

export type TeamStatus = (typeof TEAM_STATUS)[keyof typeof TEAM_STATUS];

export const TEAM_ROLES = {
  LEAD: 'LEAD',
  MEMBER: 'MEMBER',
} as const;

export type TeamRole = (typeof TEAM_ROLES)[keyof typeof TEAM_ROLES];

export const TEAM_MEMBERSHIP_STATUS = {
  INVITED: 'INVITED',
  APPLIED: 'APPLIED',
  APPROVED: 'APPROVED',
  TERMS_ACCEPTED: 'TERMS_ACCEPTED',
} as const;

export type TeamMembershipStatus =
  (typeof TEAM_MEMBERSHIP_STATUS)[keyof typeof TEAM_MEMBERSHIP_STATUS];

export const INITIAL_SPLIT_PRINCIPLES = {
  EQUAL: 'EQUAL',
  CONTRIBUTION_BASED: 'CONTRIBUTION_BASED',
} as const;

export type InitialSplitPrinciple =
  (typeof INITIAL_SPLIT_PRINCIPLES)[keyof typeof INITIAL_SPLIT_PRINCIPLES];

// =============================================================================
// 5. Pengiriman & Penilaian (Submission & Review)
// =============================================================================
export const SUBMISSION_STATUS = {
  SUBMITTED: 'SUBMITTED',
  IN_REVIEW: 'IN_REVIEW',
  REVISION_REQUESTED: 'REVISION_REQUESTED',
  APPROVED: 'APPROVED',
  PARTIAL: 'PARTIAL',
  REJECTED: 'REJECTED',
} as const;

export type SubmissionStatus =
  (typeof SUBMISSION_STATUS)[keyof typeof SUBMISSION_STATUS];

// =============================================================================
// 6. Finansial & Klaim Reward
// =============================================================================
export const REWARD_LEDGER_STATUS = {
  AVAILABLE: 'AVAILABLE',
  CLAIMED: 'CLAIMED',
} as const;

export type RewardLedgerStatus =
  (typeof REWARD_LEDGER_STATUS)[keyof typeof REWARD_LEDGER_STATUS];

export const CLAIM_STATUS = {
  CLAIMED: 'CLAIMED',
  PROCESSING: 'PROCESSING',
  PAID: 'PAID',
  CONFIRMED: 'CONFIRMED',
} as const;

export type ClaimStatus = (typeof CLAIM_STATUS)[keyof typeof CLAIM_STATUS];

// =============================================================================
// 7. Laporan, Penalti & Audit
// =============================================================================
export const REPORT_TARGET_TYPES = {
  TASK: 'TASK',
  SUBMISSION: 'SUBMISSION',
  CLAIM: 'CLAIM',
  TEAM_DISTRIBUTION: 'TEAM_DISTRIBUTION',
} as const;

export type ReportTargetType =
  (typeof REPORT_TARGET_TYPES)[keyof typeof REPORT_TARGET_TYPES];

export const REPORT_STATUS = {
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  NEED_MORE_EVIDENCE: 'NEED_MORE_EVIDENCE',
  RESOLVED: 'RESOLVED',
  REJECTED: 'REJECTED',
} as const;

export type ReportStatus = (typeof REPORT_STATUS)[keyof typeof REPORT_STATUS];

export const PENALTY_TYPES = {
  WARNING: 'WARNING',
  COOLDOWN: 'COOLDOWN',
  TEAM_ONLY: 'TEAM_ONLY',
  NO_LEAD: 'NO_LEAD',
  TEMPORARY_SUSPEND: 'TEMPORARY_SUSPEND',
  ACCOUNT_SUSPEND: 'ACCOUNT_SUSPEND',
} as const;

export type PenaltyType = (typeof PENALTY_TYPES)[keyof typeof PENALTY_TYPES];

// =============================================================================
// 8. Strict Business Invariants
// =============================================================================
export const INVARIANTS = {
  /** Maksimal task aktif per member dalam satu waktu */
  MAX_ACTIVE_TASKS_PER_MEMBER: 1,
  /** Maksimal permohonan pending per member */
  MAX_PENDING_APPLICATIONS_PER_MEMBER: 3,
  /** Durasi lock review admin (15 menit) untuk mencegah collision */
  REVIEW_LOCK_DURATION_MINUTES: 15,
  /** Zona waktu baku aplikasi */
  DEFAULT_TIMEZONE: 'Asia/Jakarta',
  /** Locale format angka & mata uang */
  DEFAULT_LOCALE: 'id-ID',
} as const;

// =============================================================================
// 9. Design System SAKODE Tokens
// =============================================================================
export const SAKODE_COLORS = {
  text: '#172033',
  textMuted: '#64748B',
  cyan: '#71CFFE',
  purple: '#BC71FE',
  orange: '#F9723B',
  border: '#DBE8F0',
  bg: '#F7FBFE',
  card: '#FFFFFF',
} as const;
