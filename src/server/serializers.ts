import type {
  UserDocument,
  TaskDocument,
  ApplicationDocument,
  TeamDocument,
  TeamMembershipDocument,
  SubmissionDocument,
  RewardLedgerDocument,
  ClaimDocument,
  TeamDistributionDocument,
  ReportDocument,
  PenaltyDocument,
  AuditEventDocument,
  NotificationDocument,
} from '@/types/database';

function serializeDate(d: unknown): string {
  if (!d) return new Date().toISOString();
  if (typeof (d as { toDate?: () => Date }).toDate === 'function') {
    return (d as { toDate: () => Date }).toDate!().toISOString();
  }
  if (typeof (d as { seconds?: number }).seconds === 'number') {
    return new Date((d as { seconds: number }).seconds! * 1000).toISOString();
  }
  if (d instanceof Date) {
    return d.toISOString();
  }
  return String(d);
}

function serializeNullableDate(d: unknown): string | null {
  if (!d) return null;
  return serializeDate(d);
}

export function sanitizeForSerialization<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  const raw = obj as unknown;
  if (typeof (raw as { toDate?: () => Date })?.toDate === 'function') {
    return (raw as { toDate: () => Date }).toDate().toISOString() as unknown as T;
  }
  if (raw instanceof Date) {
    return raw.toISOString() as unknown as T;
  }
  if (
    typeof (raw as { seconds?: number; nanoseconds?: number })?.seconds === 'number' &&
    typeof (raw as { seconds?: number; nanoseconds?: number })?.nanoseconds === 'number'
  ) {
    return new Date((raw as { seconds: number }).seconds * 1000).toISOString() as unknown as T;
  }
  if (Array.isArray(raw)) {
    return raw.map((item) => sanitizeForSerialization(item)) as unknown as T;
  }
  if (typeof raw === 'object') {
    const res: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      if (value === undefined) {
        res[key] = null;
      } else {
        res[key] = sanitizeForSerialization(value);
      }
    }
    return res as unknown as T;
  }
  return obj;
}

export function serializeUserDoc(user: UserDocument): UserDocument {
  const sanitized = sanitizeForSerialization(user);
  return {
    ...sanitized,
    createdAt: serializeDate(user.createdAt),
    updatedAt: serializeDate(user.updatedAt),
    approvedAt: user.approvedAt ? serializeDate(user.approvedAt) : null,
  };
}

export function serializeTaskDoc(task: TaskDocument): TaskDocument {
  const sanitized = sanitizeForSerialization(task);
  return {
    ...sanitized,
    id: String(task.id || ''),
    title: String(task.title || ''),
    description: String(task.description || ''),
    scope: String(task.scope || ''),
    deliverableGuidelines: String(task.deliverableGuidelines || ''),
    acceptanceCriteria: Array.isArray(task.acceptanceCriteria) ? task.acceptanceCriteria : [],
    mode: task.mode || 'SOLO',
    assignmentType: task.assignmentType || 'INSTANT_TAKE',
    requiredSkills: Array.isArray(task.requiredSkills) ? task.requiredSkills : [],
    totalReward: typeof task.totalReward === 'number' ? task.totalReward : 0,
    deadlineType: task.deadlineType || 'DURATION',
    fixedDeadlineAt: serializeNullableDate(task.fixedDeadlineAt),
    durationMinutes: task.durationMinutes || null,
    deadlineAt: serializeNullableDate(task.deadlineAt),
    status: task.status || 'OPEN',
    termsSnapshot: task.termsSnapshot
      ? {
          ...task.termsSnapshot,
          version: task.termsSnapshot.version || 1,
          content: task.termsSnapshot.content || '',
          capturedAt: serializeDate(task.termsSnapshot.capturedAt),
        }
      : {
          version: 1,
          content: 'Syarat & Ketentuan Pengerjaan Task SAKODE v1',
          capturedAt: serializeDate(task.createdAt),
        },
    assignedUserId: task.assignedUserId || null,
    assignedTeamId: task.assignedTeamId || null,
    attachments: Array.isArray(task.attachments) ? task.attachments : [],
    links: Array.isArray(task.links) ? task.links : [],
    reviewLockedByAdminId: task.reviewLockedByAdminId || null,
    reviewLockedUntil: serializeNullableDate(task.reviewLockedUntil),
    createdByAdminId: task.createdByAdminId || 'admin',
    createdAt: serializeDate(task.createdAt),
    updatedAt: serializeDate(task.updatedAt),
  };
}

export function serializeApplicationDoc(app: ApplicationDocument): ApplicationDocument {
  const sanitized = sanitizeForSerialization(app);
  return {
    ...sanitized,
    createdAt: serializeDate(app.createdAt),
    updatedAt: serializeDate(app.updatedAt),
  };
}

export function serializeTeamDoc(team: TeamDocument): TeamDocument {
  const sanitized = sanitizeForSerialization(team);
  return {
    ...sanitized,
    createdAt: serializeDate(team.createdAt),
    updatedAt: serializeDate(team.updatedAt),
  };
}

export function serializeTeamMembershipDoc(m: TeamMembershipDocument): TeamMembershipDocument {
  const sanitized = sanitizeForSerialization(m);
  return {
    ...sanitized,
    agreedTermsAt: serializeNullableDate(m.agreedTermsAt),
    createdAt: serializeDate(m.createdAt),
    updatedAt: m.updatedAt ? serializeDate(m.updatedAt) : undefined,
  };
}

export function serializeSubmissionDoc(sub: SubmissionDocument): SubmissionDocument {
  const sanitized = sanitizeForSerialization(sub);
  return {
    ...sanitized,
    revisionDeadlineAt: serializeNullableDate(sub.revisionDeadlineAt),
    reviewedAt: serializeNullableDate(sub.reviewedAt),
    reviewLockedUntil: serializeNullableDate(sub.reviewLockedUntil),
    appeal: sub.appeal
      ? {
          ...sub.appeal,
          filedAt: serializeDate(sub.appeal.filedAt),
          reviewedAt: serializeNullableDate(sub.appeal.reviewedAt),
        }
      : null,
    createdAt: serializeDate(sub.createdAt),
    updatedAt: serializeDate(sub.updatedAt),
  };
}

export function serializeRewardLedgerDoc(ledger: RewardLedgerDocument): RewardLedgerDocument {
  const sanitized = sanitizeForSerialization(ledger);
  return {
    ...sanitized,
    createdAt: serializeDate(ledger.createdAt),
    updatedAt: serializeDate(ledger.updatedAt),
  };
}

export function serializeClaimDoc(claim: ClaimDocument): ClaimDocument {
  const sanitized = sanitizeForSerialization(claim);
  return {
    ...sanitized,
    processedAt: serializeNullableDate(claim.processedAt),
    confirmedAt: serializeNullableDate(claim.confirmedAt),
    createdAt: serializeDate(claim.createdAt),
    updatedAt: serializeDate(claim.updatedAt),
  };
}

export function serializeTeamDistributionDoc(
  dist: TeamDistributionDocument
): TeamDistributionDocument {
  const sanitized = sanitizeForSerialization(dist);
  return {
    ...sanitized,
    allocations: dist.allocations.map((a) => ({
      ...a,
      agreedAt: serializeNullableDate(a.agreedAt),
    })),
    leadTransferProofs: (dist.leadTransferProofs || []).map((p) => ({
      ...p,
      uploadedAt: serializeDate(p.uploadedAt),
      confirmedAt: serializeNullableDate(p.confirmedAt),
    })),
    createdAt: serializeDate(dist.createdAt),
    updatedAt: serializeDate(dist.updatedAt),
  };
}

export function serializeReportDoc(report: ReportDocument): ReportDocument {
  const sanitized = sanitizeForSerialization(report);
  return {
    ...sanitized,
    createdAt: serializeDate(report.createdAt),
    updatedAt: serializeDate(report.updatedAt),
  };
}

export function serializePenaltyDoc(penalty: PenaltyDocument): PenaltyDocument {
  const sanitized = sanitizeForSerialization(penalty);
  return {
    ...sanitized,
    validUntil: serializeNullableDate(penalty.validUntil),
    createdAt: serializeDate(penalty.createdAt),
  };
}

export function serializeAuditEventDoc(event: AuditEventDocument): AuditEventDocument {
  const sanitized = sanitizeForSerialization(event);
  return {
    ...sanitized,
    timestamp: serializeDate(event.timestamp),
  };
}

export function serializeNotificationDoc(notif: NotificationDocument): NotificationDocument {
  const sanitized = sanitizeForSerialization(notif);
  return {
    ...sanitized,
    createdAt: serializeDate(notif.createdAt),
  };
}
