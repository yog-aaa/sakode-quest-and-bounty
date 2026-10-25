'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  type User as FirebaseUser,
} from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase/client';
import type { AuthUserProfile } from '@/types/auth';
import type { UserDocument } from '@/types/database';
import { USER_ROLES, USER_APPROVAL_STATUS, type UserRole, type UserApprovalStatus } from '@/lib/constants';
import { syncUserAction } from '@/server/actions/auth.actions';
import { getUserProfileAction } from '@/server/actions/user.actions';

export interface AuthContextType {
  user: AuthUserProfile | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  error: string | null;
  emailVerificationSent: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<boolean>;
  signUpWithEmail: (email: string, pass: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  sendVerificationEmailAgain: () => Promise<boolean>;
  setMockSession: (role: UserRole, status: UserApprovalStatus) => void;
  clearMockSession: () => void;
  isMockSession: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_MOCK_KEY = 'sakode_mock_auth_session';

function enrichUserProfile(doc: UserDocument): AuthUserProfile {
  const role = (doc.role ? String(doc.role).toUpperCase() : '') as UserRole;
  const approvalStatus = (doc.approvalStatus ? String(doc.approvalStatus).toUpperCase() : '') as UserApprovalStatus;

  return {
    ...doc,
    role: role || doc.role,
    approvalStatus: approvalStatus || doc.approvalStatus,
    isSuperAdmin: role === USER_ROLES.SUPER_ADMIN,
    isAdmin: role === USER_ROLES.ADMIN || role === USER_ROLES.SUPER_ADMIN,
    isApprovedMember: approvalStatus === USER_APPROVAL_STATUS.APPROVED,
  };
}

function getInitialMockUser(): AuthUserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_MOCK_KEY);
    if (saved) {
      return enrichUserProfile(JSON.parse(saved) as UserDocument);
    }
  } catch {
    // Ignore storage errors
  }
  return null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUserProfile | null>(getInitialMockUser);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => !getInitialMockUser());
  const [error, setError] = useState<string | null>(null);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [isMockSession, setIsMockSession] = useState<boolean>(() => !!getInitialMockUser());

  // Muat profil dari Firestore
  const loadProfile = useCallback(async (uid: string) => {
    try {
      const res = await getUserProfileAction(uid);
      if (res.success && res.user) {
        setUser(enrichUserProfile(res.user));
      } else {
        const syncRes = await syncUserAction({
          uid,
          email: firebaseUser?.email || 'user@sakode.id',
          displayName: firebaseUser?.displayName || '',
        });
        if (syncRes.success && syncRes.user) {
          setUser(enrichUserProfile(syncRes.user));
        }
      }
    } catch (err: unknown) {
      console.error('Error memuat profil user:', err);
    }
  }, [firebaseUser]);

  // Pantau status login Firebase Auth
  useEffect(() => {
    // Jika mock session aktif, jangan override dengan listener firebase
    if (isMockSession) {
      return;
    }

    let unsubscribe: () => void = () => {};
    try {
      unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
        setFirebaseUser(fbUser);
        if (fbUser) {
          await loadProfile(fbUser.uid);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      });
    } catch (err: unknown) {
      console.warn('Firebase Client Auth belum dikonfigurasi aktif:', err);
      setTimeout(() => {
        setIsLoading(false);
      }, 0);
    }

    return () => unsubscribe();
  }, [loadProfile, isMockSession]);

  // Masuk dengan Email & Password
  const signInWithEmail = async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const cred = await signInWithEmailAndPassword(firebaseAuth, email, pass);
      await loadProfile(cred.user.uid);
      return true;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      let msg = 'Gagal masuk akun. Periksa kembali email dan password Anda.';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        msg = 'Email atau password yang Anda masukkan salah.';
      } else if (code === 'auth/user-not-found') {
        msg = 'Akun dengan alamat email ini belum terdaftar.';
      } else if (code === 'auth/too-many-requests') {
        msg = 'Terlalu banyak percobaan masuk yang gagal. Silakan tunggu sejenak.';
      }
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Mendaftar dengan Email & Password
  const signUpWithEmail = async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(firebaseAuth, email, pass);
      await sendEmailVerification(cred.user);
      setEmailVerificationSent(true);

      const res = await syncUserAction({
        uid: cred.user.uid,
        email: cred.user.email || email,
      });

      if (res.success && res.user) {
        setUser(enrichUserProfile(res.user));
      }
      return true;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      let msg = 'Pendaftaran gagal. Silakan coba kembali.';
      if (code === 'auth/email-already-in-use') {
        msg = 'Alamat email ini sudah terdaftar. Silakan masuk atau gunakan email lain.';
      } else if (code === 'auth/weak-password') {
        msg = 'Password terlalu lemah. Gunakan minimal 8 karakter kombinasi huruf dan angka.';
      }
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Masuk dengan Google OAuth
  const signInWithGoogle = async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(firebaseAuth, provider);

      const res = await syncUserAction({
        uid: cred.user.uid,
        email: cred.user.email || '',
        displayName: cred.user.displayName,
      });

      if (res.success && res.user) {
        setUser(enrichUserProfile(res.user));
      }
      return true;
    } catch (err: unknown) {
      console.error('Google Sign-in Error:', err);
      const code = (err as { code?: string })?.code;
      if (code !== 'auth/popup-closed-by-user') {
        setError('Gagal masuk dengan Google. Silakan coba lagi.');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Keluar Akun
  const logout = async () => {
    setIsLoading(true);
    try {
      if (isMockSession) {
        clearMockSession();
      } else {
        await signOut(firebaseAuth);
        setUser(null);
        setFirebaseUser(null);
      }
    } catch (err: unknown) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Muat ulang profil dari server
  const refreshProfile = async () => {
    if (user?.id) {
      await loadProfile(user.id);
    }
  };

  // Kirim ulang email verifikasi
  const sendVerificationEmailAgain = async (): Promise<boolean> => {
    if (firebaseUser) {
      try {
        await sendEmailVerification(firebaseUser);
        setEmailVerificationSent(true);
        return true;
      } catch (err: unknown) {
        console.error('Kirim email verifikasi gagal:', err);
        return false;
      }
    }
    return false;
  };

  // Fitur Evaluasi / Switcher Mock Session
  const setMockSession = (role: UserRole, status: UserApprovalStatus) => {
    const mockUid =
      role === USER_ROLES.ADMIN || role === USER_ROLES.SUPER_ADMIN
        ? 'admin-sakode-01'
        : 'member-sakode-01';
    const mockDoc: UserDocument = {
      id: mockUid,
      email: role === USER_ROLES.ADMIN ? 'admin@sakode.id' : 'member@sakode.id',
      displayName: role === USER_ROLES.ADMIN ? 'Admin SAKODE' : 'Yoga Pradana',
      contactNumber: '081234567890',
      skills: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Cloud Firestore'],
      role,
      approvalStatus: status,
      paymentAccountEncrypted: 'mock_encrypted_data',
      paymentAccountMasked: 'BCA •••• 5678 a.n Y*** P******',
      activeTaskId: null,
      pendingApplicationCount: 0,
      stats: { completedTasks: 3, onTimeTasks: 3, failedTasks: 0, provenReports: 0 },
      rejectionReason:
        status === USER_APPROVAL_STATUS.REJECTED
          ? 'Nomor rekening dan nama pemegang tidak cocok dengan data KTP. Mohon perbaiki data rekening.'
          : null,
      revisionNotes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(LOCAL_STORAGE_MOCK_KEY, JSON.stringify(mockDoc));
    setUser(enrichUserProfile(mockDoc));
    setIsMockSession(true);
    setIsLoading(false);
  };

  const clearMockSession = () => {
    localStorage.removeItem(LOCAL_STORAGE_MOCK_KEY);
    setIsMockSession(false);
    setUser(null);
    setFirebaseUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isLoading,
        error,
        emailVerificationSent,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        logout,
        refreshProfile,
        sendVerificationEmailAgain,
        setMockSession,
        clearMockSession,
        isMockSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam <AuthProvider>');
  }
  return context;
};
