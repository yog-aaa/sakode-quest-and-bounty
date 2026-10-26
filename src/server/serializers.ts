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

export function serializeUserDoc(user: UserDocument): UserDocument {
  return {
    ...user,
    createdAt: serializeDate(user.createdAt),
    updatedAt: serializeDate(user.updatedAt),
    approvedAt: user.approvedAt ? serializeDate(user.approvedAt) : null,
  };
}

export function serializeTaskDoc(task: TaskDocument): TaskDocument {
  return {
    ...task,
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
    reviewLockedByAdminId: task.reviewLockedByAdminId || null,
    reviewLockedUntil: serializeNullableDate(task.reviewLockedUntil),
    createdByAdminId: task.createdByAdminId || 'admin',
    createdAt: serializeDate(task.createdAt),
    updatedAt: serializeDate(task.updatedAt),
  };
}

export function serializeApplicationDoc(app: ApplicationDocument): ApplicationDocument {
  return {
    ...app,
    createdAt: serializeDate(app.createdAt),
    updatedAt: serializeDate(app.updatedAt),
  };
}

export function serializeTeamDoc(team: TeamDocument): TeamDocument {
  return {
    ...team,
    createdAt: serializeDate(team.createdAt),
    updatedAt: serializeDate(team.updatedAt),
  };
}

export function serializeTeamMembershipDoc(m: TeamMembershipDocument): TeamMembershipDocument {
  return {
    ...m,
    agreedTermsAt: serializeNullableDate(m.agreedTermsAt),
    createdAt: serializeDate(m.createdAt),
    updatedAt: m.updatedAt ? serializeDate(m.updatedAt) : undefined,
  };
}

export function serializeSubmissionDoc(sub: SubmissionDocument): SubmissionDocument {
  return {
    ...sub,
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
  return {
    ...ledger,
    createdAt: serializeDate(ledger.createdAt),
    updatedAt: serializeDate(ledger.updatedAt),
  };
}

export function serializeClaimDoc(claim: ClaimDocument): ClaimDocument {
  return {
    ...claim,
    processedAt: serializeNullableDate(claim.processedAt),
    confirmedAt: serializeNullableDate(claim.confirmedAt),
    createdAt: serializeDate(claim.createdAt),
    updatedAt: serializeDate(claim.updatedAt),
  };
}

export function serializeTeamDistributionDoc(
  dist: TeamDistributionDocument
): TeamDistributionDocument {
  return {
    ...dist,
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
  return {
    ...report,
    createdAt: serializeDate(report.createdAt),
    updatedAt: serializeDate(report.updatedAt),
  };
}

export function serializePenaltyDoc(penalty: PenaltyDocument): PenaltyDocument {
  return {
    ...penalty,
    validUntil: serializeNullableDate(penalty.validUntil),
    createdAt: serializeDate(penalty.createdAt),
  };
}

export function serializeAuditEventDoc(event: AuditEventDocument): AuditEventDocument {
  return {
    ...event,
    timestamp: serializeDate(event.timestamp),
  };
}

export function serializeNotificationDoc(notif: NotificationDocument): NotificationDocument {
  return {
    ...notif,
    createdAt: serializeDate(notif.createdAt),
  };
}
