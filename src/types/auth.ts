/**
 * SAKODE Task & Reward Platform - Authentication & Session Types
 */

import type { UserRole, UserApprovalStatus } from '@/lib/constants';
import type { UserDocument } from './database';

export interface AuthUserProfile extends UserDocument {
  // Shortcut flag untuk kemudahan authorization check di client/server
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isApprovedMember: boolean;
}

export interface AuthState {
  user: AuthUserProfile | null;
  firebaseUid: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface RegisterUserInput {
  email: string;
  password?: string;
  displayName: string;
  contactNumber: string;
  skills: string[];
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
}

export interface UpdateProfileInput {
  displayName?: string;
  contactNumber?: string;
  skills?: string[];
}

export interface CustomClaims {
  role?: UserRole;
  approvalStatus?: UserApprovalStatus;
}
