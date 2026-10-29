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
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseAuth, getClientFirestore } from '@/lib/firebase/client';
import type { AuthUserProfile } from '@/types/auth';
import type { UserDocument } from '@/types/database';
import { USER_ROLES, USER_APPROVAL_STATUS, type UserRole, type UserApprovalStatus } from '@/lib/constants';
import { syncUserAction } from '@/server/actions/auth.actions';
import { getUserProfileAction } from '@/server/actions/user.actions';

export interface GoogleAuthResult {
  success: boolean;
  notRegistered?: boolean;
  email?: string | null;
  displayName?: string | null;
}

export interface AuthContextType {
  user: AuthUserProfile | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  error: string | null;
  emailVerificationSent: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<boolean>;
  signUpWithEmail: (email: string, pass: string) => Promise<boolean>;
  signInWithGoogle: (mode?: 'login' | 'register') => Promise<GoogleAuthResult>;
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

function buildDefaultUserDoc(uid: string, email: string, displayName?: string | null): UserDocument {
  const now = new Date().toISOString();
  return {
    id: uid,
    email: email || '',
    displayName: displayName || (email ? email.split('@')[0] : '') || 'Member SAKODE',
    contactNumber: '',
    skills: [],
    role: USER_ROLES.MEMBER,
    approvalStatus: USER_APPROVAL_STATUS.PENDING,
    paymentAccountEncrypted: '',
    paymentAccountMasked: '',
    activeTaskId: null,
    pendingApplicationCount: 0,
    stats: {
      completedTasks: 0,
      onTimeTasks: 0,
      failedTasks: 0,
      provenReports: 0,
    },
    createdAt: now,
    updatedAt: now,
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

  // Muat profil dari Firestore (dengan server action & client-side fallback)
  const loadProfile = useCallback(
    async (uid: string, fallbackEmail?: string | null, fallbackDisplayName?: string | null) => {
      // 1. Coba via Server Actions terlebih dahulu
      try {
        const timeoutPromise = new Promise<{ success: false; error: string }>((_, reject) =>
          setTimeout(() => reject(new Error('Waktu muat profil habis (timeout)')), 5000)
        );

        const fetchPromise = getUserProfileAction(uid);
        const res = await Promise.race([fetchPromise, timeoutPromise]);

        if (res.success && res.user) {
          setUser(enrichUserProfile(res.user));
          return;
        }

        const syncRes = await syncUserAction({
          uid,
          email: fallbackEmail || 'user@sakode.id',
          displayName: fallbackDisplayName || '',
        });
        if (syncRes.success && syncRes.user) {
          setUser(enrichUserProfile(syncRes.user));
          return;
        }
      } catch (err: unknown) {
        console.warn('Server action muat profil user gagal, mencoba client fallback:', err);
      }

      // 2. Client-Side Firestore Fallback (Mencegah user mental di login jika Server Action di Vercel bermasalah)
      try {
        const db = getClientFirestore();
        const userDocRef = doc(db, 'users', uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          const docData = docSnap.data() as UserDocument;
          setUser(enrichUserProfile({ ...docData, id: uid }));
        } else {
          const defaultDoc = buildDefaultUserDoc(uid, fallbackEmail || '', fallbackDisplayName);
          await setDoc(
            userDocRef,
            {
              ...defaultDoc,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
          setUser(enrichUserProfile(defaultDoc));
        }
      } catch (clientErr: unknown) {
        console.error('Client fallback Firestore error:', clientErr);
        if (fallbackEmail) {
          const memDoc = buildDefaultUserDoc(uid, fallbackEmail, fallbackDisplayName);
          setUser(enrichUserProfile(memDoc));
        }
      }
    },
    []
  );

  // Pantau status login Firebase Auth
  useEffect(() => {
    // Jika mock session aktif, jangan override dengan listener firebase
    if (isMockSession) {
      return;
    }

    let isMounted = true;
    let unsubscribe: () => void = () => {};

    // Safety timeout agar isLoading tidak pernah macet permanen
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    }, 1500);

    try {
      unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
        if (!isMounted) return;
        setFirebaseUser(fbUser);
        if (fbUser) {
          await loadProfile(fbUser.uid, fbUser.email, fbUser.displayName);
        } else {
          setUser(null);
        }
        if (isMounted) {
          setIsLoading(false);
        }
      });
    } catch (err: unknown) {
      console.warn('Firebase Client Auth belum dikonfigurasi aktif:', err);
      queueMicrotask(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });
    }

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, [loadProfile, isMockSession]);

  // Masuk dengan Email & Password
  const signInWithEmail = async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const cred = await signInWithEmailAndPassword(firebaseAuth, email, pass);
      await loadProfile(cred.user.uid, cred.user.email || email, cred.user.displayName);
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

      // 1. Buat / sinkronkan dokumen user di Firestore TERLEBIH DAHULU
      let userProfileSet = false;
      try {
        const res = await syncUserAction({
          uid: cred.user.uid,
          email: cred.user.email || email,
        });

        if (res.success && res.user) {
          setUser(enrichUserProfile(res.user));
          userProfileSet = true;
        }
      } catch (syncErr: unknown) {
        console.warn('Server syncUserAction gagal, mencoba client fallback:', syncErr);
      }

      // Client-side Firestore fallback jika server action gagal
      if (!userProfileSet) {
        try {
          const db = getClientFirestore();
          const userDocRef = doc(db, 'users', cred.user.uid);
          const defaultDoc = buildDefaultUserDoc(cred.user.uid, cred.user.email || email, cred.user.displayName);
          await setDoc(
            userDocRef,
            {
              ...defaultDoc,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
          setUser(enrichUserProfile(defaultDoc));
        } catch (clientFallbackErr: unknown) {
          console.error('Client setDoc fallback gagal:', clientFallbackErr);
          const memDoc = buildDefaultUserDoc(cred.user.uid, cred.user.email || email, cred.user.displayName);
          setUser(enrichUserProfile(memDoc));
        }
      }

      // 2. Kirim email verifikasi dalam blok terlindung (JANGAN biarkan kegagalan email menggagalkan pendaftaran)
      try {
        await sendEmailVerification(cred.user);
        setEmailVerificationSent(true);
      } catch (emailErr: unknown) {
        console.warn('Kirim email verifikasi gagal (domain belum terverifikasi di Firebase Auth):', emailErr);
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

  // Masuk / Daftar dengan Google OAuth
  const signInWithGoogle = async (
    mode: 'login' | 'register' = 'login'
  ): Promise<GoogleAuthResult> => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(firebaseAuth, provider);
      const uid = cred.user.uid;
      const email = cred.user.email || '';
      const displayName = cred.user.displayName || '';

      // Periksa apakah profil user sudah terdaftar di Firestore
      let exists = false;
      try {
        const res = await getUserProfileAction(uid);
        if (res.success && res.user) {
          exists = true;
        } else {
          const db = getClientFirestore();
          const snap = await getDoc(doc(db, 'users', uid));
          if (snap.exists()) {
            exists = true;
          }
        }
      } catch {
        const db = getClientFirestore();
        const snap = await getDoc(doc(db, 'users', uid));
        exists = snap.exists();
      }

      // Skenario 1: User mencoba LOGIN dengan Google tetapi belum terdaftar
      if (mode === 'login' && !exists) {
        // Sign out segera agar tidak menggantung sebagai akun tak lengkap
        await signOut(firebaseAuth);
        setUser(null);
        setFirebaseUser(null);
        setIsLoading(false);
        return {
          success: false,
          notRegistered: true,
          email,
          displayName,
        };
      }

      // Skenario 2: User REGISTRASI dengan Google dan dokumen belum ada di Firestore
      if (!exists) {
        try {
          await syncUserAction({
            uid,
            email: email || 'user@sakode.id',
            displayName: displayName || '',
            photoURL: cred.user.photoURL || '',
          });
        } catch (syncErr) {
          console.warn('Sync user action error, creating client doc fallback:', syncErr);
          const db = getClientFirestore();
          const defaultDoc = buildDefaultUserDoc(uid, email, displayName);
          await setDoc(doc(db, 'users', uid), {
            ...defaultDoc,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }

      await loadProfile(uid, email, displayName);
      return { success: true };
    } catch (err: unknown) {
      console.error('Google Sign-in Error:', err);
      const code = (err as { code?: string })?.code;
      if (code === 'auth/unauthorized-domain') {
        setError(
          'Domain ini belum didaftarkan di Firebase Console. Silakan tambahkan domain ini ke Firebase Authentication -> Settings -> Authorized Domains.'
        );
      } else if (code === 'auth/popup-blocked') {
        setError(
          'Jendela popup diblokir oleh browser. Harap izinkan popup untuk masuk dengan Google.'
        );
      } else if (code !== 'auth/popup-closed-by-user') {
        setError('Gagal masuk dengan Google. Silakan coba lagi.');
      }
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  // Keluar Akun
  const logout = async () => {
    setIsLoading(true);
    try {
      localStorage.removeItem(LOCAL_STORAGE_MOCK_KEY);
      setIsMockSession(false);
      setUser(null);
      setFirebaseUser(null);
      try {
        await signOut(firebaseAuth);
      } catch (fbErr: unknown) {
        console.warn('Firebase signOut error:', fbErr);
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
    setIsLoading(false);
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
