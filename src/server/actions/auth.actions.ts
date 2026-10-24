'use server';

import { syncUserRecord, type SyncUserInput } from '@/server/services/auth.service';
import type { UserDocument } from '@/types/database';
import { serializeUserDoc } from '@/server/serializers';

export async function syncUserAction(
  input: SyncUserInput
): Promise<{ success: boolean; user?: UserDocument; error?: string }> {
  try {
    const user = await syncUserRecord(input);
    return { success: true, user: serializeUserDoc(user) };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error on syncUserAction:', err);
    return {
      success: false,
      error: err.message || 'Gagal menyinkronkan profil pengguna.',
    };
  }
}
