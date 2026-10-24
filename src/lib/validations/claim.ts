import { z } from 'zod';

/**
 * Skema validasi pengajuan batch klaim reward oleh member
 */
export const createClaimSchema = z.object({
  rewardLedgerIds: z
    .array(z.string().min(1, 'ID ledger tidak boleh kosong.'))
    .min(1, 'Pilih minimal 1 reward untuk dicairkan.'),
  idempotencyKey: z
    .string()
    .min(5, 'Kunci idempotensi tidak valid (minimal 5 karakter).'),
});

export type CreateClaimInput = z.infer<typeof createClaimSchema>;

/**
 * Skema validasi evaluasi / pemrosesan pencairan klaim oleh Admin
 */
export const processClaimSchema = z
  .object({
    claimId: z.string().min(1, 'ID claim tidak boleh kosong.'),
    action: z.enum(['PROCESS', 'PAY']),
    transferProofUrl: z.string().url('URL bukti transfer harus valid.').optional(),
    transferProofPublicId: z.string().optional(),
    adminNotes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.action === 'PAY') {
        return Boolean(data.transferProofUrl && data.transferProofUrl.trim().length > 0);
      }
      return true;
    },
    {
      message: 'Bukti transfer pembayaran (URL) wajib disertakan saat menyelesaikan pembayaran klaim.',
      path: ['transferProofUrl'],
    }
  );

export type ProcessClaimInput = z.infer<typeof processClaimSchema>;

/**
 * Skema validasi proposal pembagian reward tim oleh Team Lead
 */
export const proposeTeamSplitSchema = z.object({
  teamId: z.string().min(1, 'ID tim tidak boleh kosong.'),
  taskId: z.string().min(1, 'ID task tidak boleh kosong.'),
  allocations: z
    .array(
      z.object({
        userId: z.string().min(1, 'ID user penerima harus valid.'),
        amount: z
          .number()
          .int('Nominal alokasi harus berupa bilangan bulat (Integer Rupiah).')
          .positive('Nominal alokasi harus lebih dari 0.'),
      })
    )
    .min(1, 'Alokasi harus mencakup anggota tim.'),
});

export type ProposeTeamSplitInput = z.infer<typeof proposeTeamSplitSchema>;

/**
 * Skema validasi persetujuan / penolakan pembagian reward tim oleh Anggota Tim (100% Konsensus)
 */
export const voteTeamSplitSchema = z
  .object({
    teamId: z.string().min(1, 'ID tim tidak boleh kosong.'),
    agreed: z.boolean(),
    rejectionReason: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.agreed) {
        return Boolean(data.rejectionReason && data.rejectionReason.trim().length >= 10);
      }
      return true;
    },
    {
      message: 'Catatan alasan penolakan wajib diisi minimal 10 karakter jika menolak proposal pembagian.',
      path: ['rejectionReason'],
    }
  );

export type VoteTeamSplitInput = z.infer<typeof voteTeamSplitSchema>;

/**
 * Skema validasi unggah bukti transfer per anggota oleh Team Lead
 */
export const uploadLeadTransferProofSchema = z.object({
  teamId: z.string().min(1, 'ID tim tidak boleh kosong.'),
  memberUserId: z.string().min(1, 'ID anggota penerima wajib diisi.'),
  transferProofUrl: z.string().url('URL berkas bukti transfer harus berupa URL valid.'),
});

export type UploadLeadTransferProofInput = z.infer<typeof uploadLeadTransferProofSchema>;

/**
 * Skema validasi konfirmasi penerimaan dana
 */
export const confirmMemberReceiptSchema = z
  .object({
    claimId: z.string().optional(),
    teamDistributionId: z.string().optional(),
  })
  .refine((data) => Boolean(data.claimId || data.teamDistributionId), {
    message: 'Harus menyertakan ID Klaim atau ID Distribusi Tim.',
    path: ['claimId'],
  });

export type ConfirmMemberReceiptInput = z.infer<typeof confirmMemberReceiptSchema>;
