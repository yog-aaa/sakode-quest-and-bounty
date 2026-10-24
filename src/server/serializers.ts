import type {
  UserDocument,
  TaskDocument,
  ApplicationDocument,
  TeamDocument,
  TeamMembershipDocument,
  SubmissionDocument,
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
    fixedDeadlineAt: serializeNullableDate(task.fixedDeadlineAt),
    deadlineAt: serializeNullableDate(task.deadlineAt),
    reviewLockedUntil: serializeNullableDate(task.reviewLockedUntil),
    termsSnapshot: {
      ...task.termsSnapshot,
      capturedAt: serializeDate(task.termsSnapshot?.capturedAt),
    },
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
