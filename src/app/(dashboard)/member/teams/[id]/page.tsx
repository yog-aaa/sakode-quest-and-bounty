'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { TeamRosterCard } from '@/components/team/TeamRosterCard';
import { TeamDistributionModal } from '@/components/team/TeamDistributionModal';
import { CreateReportModal } from '@/components/report/CreateReportModal';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusPill } from '@/components/ui/StatusPill';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { formatCurrencyIDR } from '@/lib/utils';
import {
  getTeamDetailAction,
  getTeamMembersAction,
  requestJoinTeamAction,
  approveJoinRequestAction,
  rejectJoinRequestAction,
  submitMemberConsentAction,
  startTeamTaskAction,
} from '@/server/actions/team.actions';
import { getTaskDetailAction } from '@/server/actions/task.actions';
import type { TeamDocument, TeamMembershipDocument, TaskDocument } from '@/types/database';
import {
  TEAM_STATUS,
  INITIAL_SPLIT_PRINCIPLES,
  type InitialSplitPrinciple,
} from '@/lib/constants';
import {
  ArrowLeft,
  Users,
  Compass,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  Send,
  Loader2,
  X,
  FileText,
  UserPlus,
} from 'lucide-react';

function TeamDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const teamId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [team, setTeam] = useState<TeamDocument | null>(null);
  const [task, setTask] = useState<TaskDocument | null>(null);
  const [members, setMembers] = useState<TeamMembershipDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Join Team Request Form State
  const [joinInviteCode, setJoinInviteCode] = useState('');
  const [joinMessage, setJoinMessage] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  // Consent Modal State
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [selectedSplit, setSelectedSplit] = useState<InitialSplitPrinciple>(
    INITIAL_SPLIT_PRINCIPLES.EQUAL
  );
  const [isSubmittingConsent, setIsSubmittingConsent] = useState(false);

  // Load team & members data
  const loadData = useCallback(async () => {
    if (!teamId) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const resTeam = await getTeamDetailAction(teamId);
      if (resTeam.success && resTeam.team) {
        setTeam(resTeam.team);
        // Load task detail
        const resTask = await getTaskDetailAction(resTeam.team.taskId);
        if (resTask.success && resTask.task) {
          setTask(resTask.task);
        }
      } else {
        setErrorMsg(resTeam.error || 'Tim tidak ditemukan.');
      }

      const resMembers = await getTeamMembersAction(teamId);
      if (resMembers.success && resMembers.members) {
        setMembers(resMembers.members);
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Gagal memuat data ruang tim.');
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  // Handle Approve Member
  const handleApproveMember = async (targetUserId: string) => {
    if (!user || !team) return;
    setActionLoadingId(targetUserId);
    setErrorMsg(null);
    try {
      const res = await approveJoinRequestAction(user.id, {
        teamId: team.id,
        memberUserId: targetUserId,
      });
      if (res.success) {
        setSuccessMsg('Calon anggota berhasil disetujui bergabung ke dalam tim!');
        loadData();
      } else {
        setErrorMsg(res.error || 'Gagal menyetujui anggota.');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Terjadi kesalahan.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reject Member
  const handleRejectMember = async (targetUserId: string) => {
    if (!user || !team) return;
    const confirmReject = window.confirm('Apakah Anda yakin ingin menolak permohonan bergabung ini?');
    if (!confirmReject) return;

    setActionLoadingId(targetUserId);
    setErrorMsg(null);
    try {
      const res = await rejectJoinRequestAction(user.id, {
        teamId: team.id,
        memberUserId: targetUserId,
      });
      if (res.success) {
        setSuccessMsg('Permohonan bergabung telah ditolak.');
        loadData();
      } else {
        setErrorMsg(res.error || 'Gagal memproses penolakan.');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Terjadi kesalahan.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Join Team
  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !team) return;
    setIsJoining(true);
    setErrorMsg(null);
    try {
      const res = await requestJoinTeamAction(user.id, {
        teamId: team.id,
        inviteCode: joinInviteCode.trim().toUpperCase(),
        message: joinMessage.trim(),
      });
      if (res.success) {
        setSuccessMsg('Permintaan bergabung berhasil dikirim! Menunggu persetujuan Team Lead.');
        setJoinInviteCode('');
        setJoinMessage('');
        loadData();
      } else {
        setErrorMsg(res.error || 'Gagal bergabung ke tim.');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Gagal mengirim permohonan bergabung.');
    } finally {
      setIsJoining(false);
    }
  };

  // Handle Submit Consent
  const handleConfirmConsent = async () => {
    if (!user || !team) return;
    if (!agreedTerms) {
      setErrorMsg('Anda wajib menyetujui seluruh syarat & ketentuan.');
      return;
    }

    setIsSubmittingConsent(true);
    setErrorMsg(null);
    try {
      const res = await submitMemberConsentAction(user.id, {
        teamId: team.id,
        agreedTermsVersion: task?.termsSnapshot?.version || 1,
        agreedSplitPrinciple: selectedSplit,
      });

      if (res.success) {
        setShowConsentModal(false);
        setSuccessMsg('Persetujuan Terms dan voting pembagian reward berhasil disimpan!');
        loadData();
      } else {
        setErrorMsg(res.error || 'Gagal menyimpan persetujuan.');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Gagal mengirim persetujuan.');
    } finally {
      setIsSubmittingConsent(false);
    }
  };

  // Handle Start Team Task
  const handleStartTeamTask = async () => {
    if (!user || !team) return;
    const confirmStart = window.confirm(
      'Apakah Anda yakin ingin memulai pengerjaan task bersama tim sekarang? Roster anggota akan DIKUNCI secara permanen, SELURUH anggota tim akan terhitung memegang 1 Active Task, dan timer batas waktu akan langsung dimulai.'
    );
    if (!confirmStart) return;

    setActionLoadingId('start-team');
    setErrorMsg(null);
    try {
      const res = await startTeamTaskAction(user.id, team.id);
      if (res.success) {
        setSuccessMsg('Task tim berhasil dimulai! Roster telah dikunci dan seluruh anggota berstatus ACTIVE.');
        loadData();
        router.push('/member');
      } else {
        setErrorMsg(res.error || 'Gagal memulai pengerjaan task tim.');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Gagal memulai task tim.');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sakode-bg py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-sakode-purple" />
        <p className="text-xs text-sakode-text-muted mt-2 font-medium">Memuat ruang tim...</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-sakode-bg py-16 px-4">
        <div className="max-w-xl mx-auto text-center space-y-4">
          <Users className="h-12 w-12 text-slate-300 mx-auto" />
          <h2 className="text-xl font-bold text-sakode-text">Tim Tidak Ditemukan</h2>
          <p className="text-xs text-sakode-text-muted">
            {errorMsg || 'Data tim yang Anda tuju mungkin tidak ada atau telah dibubarkan.'}
          </p>
          <Link href="/member/tasks">
            <Button variant="primary" size="sm" className="font-bold">
              Kembali ke Eksplor Task
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isTeamLead = team.teamLeadUserId === user?.id;
  const userMembership = members.find((m) => m.userId === user?.id);
  const isMember = Boolean(userMembership);

  return (
    <AuthGuard requireApproved>
      <div className="min-h-screen bg-sakode-bg py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Back Navigation */}
          <div className="flex items-center justify-between">
            <Link
              href={team.taskId ? `/member/tasks/${team.taskId}` : '/member/tasks'}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-sakode-text-muted hover:text-sakode-text transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali ke Detail Task</span>
            </Link>

            <div className="flex items-center gap-2">
              <CreateReportModal
                targetType="TEAM_DISTRIBUTION"
                targetId={team.id}
                targetTitle={`Tim: ${team.taskTitle || team.id}`}
                onReportSubmitted={loadData}
              />

              {team.taskId && (
                <Link href={`/member/tasks/${team.taskId}`}>
                  <Button variant="outline" size="sm" className="text-xs font-bold gap-1">
                    <Compass className="h-3.5 w-3.5" />
                    <span>Lihat Spesifikasi Task</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Alert Messages */}
          {errorMsg && (
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={() => setErrorMsg(null)} className="text-rose-600 hover:text-rose-900">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
              <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Task Info Summary Strip */}
          {task && (
            <Card className="p-4 bg-white border-sakode-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="purple">Team Task</Badge>
                  <StatusPill status={task.status} size="sm" />
                  <span className="text-xs text-sakode-text-muted">
                    Bounty: <strong className="text-sakode-text">{formatCurrencyIDR(task.totalReward)}</strong>
                  </span>
                </div>
                <h3 className="text-base font-bold text-sakode-text">{task.title}</h3>
              </div>

              {task.deadlineAt ? (
                <div className="flex items-center gap-2 text-xs">
                  <Clock className="h-4 w-4 text-sakode-orange" />
                  <CountdownTimer deadline={task.deadlineAt} />
                </div>
              ) : (
                <span className="text-xs text-sakode-text-muted font-medium">
                  Durasi akan dihitung saat tim resmi ACTIVE
                </span>
              )}
            </Card>
          )}

          {/* Main Roster Card */}
          <TeamRosterCard
            team={team}
            members={members}
            currentUserId={user?.id}
            isTeamLead={isTeamLead}
            onApproveMember={handleApproveMember}
            onRejectMember={handleRejectMember}
            onOpenConsentModal={() => {
              setShowConsentModal(true);
              setAgreedTerms(false);
              setSelectedSplit(team.initialSplitPrinciple || INITIAL_SPLIT_PRINCIPLES.EQUAL);
            }}
            onStartTeamTask={handleStartTeamTask}
            actionLoadingId={actionLoadingId}
          />

          {/* Team Distribution & 100% Consensus Module */}
          {task && (
            <TeamDistributionModal
              teamId={team.id}
              taskId={task.id}
              taskTitle={task.title}
              totalReward={task.totalReward}
              members={members}
              currentUserId={user?.id || ''}
              isTeamLead={isTeamLead}
              onRefresh={loadData}
            />
          )}

          {/* Join Form for Non-Members */}
          {!isMember && !team.rosterLocked && team.status === TEAM_STATUS.RECRUITING && (
            <Card className="p-5 border-dashed bg-white">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-sakode-purple" />
                  <span>Tertarik Bergabung ke Tim Ini?</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Masukkan kode undangan yang dibagikan oleh Team Lead untuk mengajukan permintaan bergabung.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0 pt-2">
                <form onSubmit={handleJoinTeam} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-sakode-text uppercase tracking-wider mb-1">
                        Kode Undangan Tim (Invite Code) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: SKD8XA"
                        value={joinInviteCode}
                        onChange={(e) => setJoinInviteCode(e.target.value.toUpperCase())}
                        required
                        className="w-full px-3 py-2 text-xs font-mono font-bold tracking-wider rounded-lg border border-sakode-border focus:outline-none focus:ring-2 focus:ring-sakode-purple"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-sakode-text uppercase tracking-wider mb-1">
                        Catatan Singkat / Perkenalan
                      </label>
                      <input
                        type="text"
                        placeholder="Keahlian yang bisa Anda kontribusikan..."
                        value={joinMessage}
                        onChange={(e) => setJoinMessage(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-sakode-border focus:outline-none focus:ring-2 focus:ring-sakode-purple"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button
                      type="submit"
                      variant="team"
                      size="sm"
                      disabled={isJoining || !joinInviteCode.trim()}
                      className="font-bold text-xs gap-1.5 h-10 px-5"
                    >
                      {isJoining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      <span>Kirim Permintaan Bergabung</span>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Non-member applied notice */}
          {userMembership && userMembership.status === 'APPLIED' && (
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-sakode-purple shrink-0" />
              <div>
                <strong className="block font-bold">Permintaan Bergabung Anda Sedang Ditinjau</strong>
                <span>
                  Team Lead sedang meninjau profil Anda. Begitu disetujui, Anda dapat memberikan persetujuan Terms dan prinsip pembagian reward.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal: Member Consent & Split Voting */}
        {showConsentModal && task && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-sakode-border w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-sakode-border bg-sakode-bg flex items-start justify-between">
                <div>
                  <Badge variant="purple" leftIcon={<Shield className="h-3 w-3" />}>
                    Konsensus Anggota Tim
                  </Badge>
                  <h2 className="text-base sm:text-lg font-black text-sakode-text mt-1">
                    Persetujuan Terms & Voting Pembagian Bounty
                  </h2>
                </div>
                <button onClick={() => setShowConsentModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
                {/* Terms Box */}
                <div>
                  <h4 className="text-xs font-bold text-sakode-text uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-sakode-purple" />
                    <span>Syarat & Ketentuan Task (Snapshot v{task.termsSnapshot?.version || 1}):</span>
                  </h4>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto">
                    {task.termsSnapshot?.content}
                  </div>
                </div>

                {/* Split Principle Voting */}
                <div>
                  <label className="block text-xs font-bold text-sakode-text uppercase tracking-wider mb-2">
                    Prinsip Pembagian Reward Awal yang Disetujui:
                  </label>
                  <div className="space-y-2">
                    <label
                      onClick={() => setSelectedSplit(INITIAL_SPLIT_PRINCIPLES.EQUAL)}
                      className={`p-3 rounded-lg border block cursor-pointer transition-all ${
                        selectedSplit === INITIAL_SPLIT_PRINCIPLES.EQUAL
                          ? 'border-sakode-purple bg-purple-50/50 ring-1 ring-sakode-purple'
                          : 'border-sakode-border bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="splitPrinciple"
                          checked={selectedSplit === INITIAL_SPLIT_PRINCIPLES.EQUAL}
                          onChange={() => setSelectedSplit(INITIAL_SPLIT_PRINCIPLES.EQUAL)}
                          className="h-4 w-4 text-sakode-purple focus:ring-sakode-purple"
                        />
                        <span className="text-xs font-bold text-sakode-text">
                          Sama Rata (Equal Distribution)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 pl-6 leading-relaxed">
                        Seluruh anggota tim yang menyelesaikan task memperoleh bagian nominal Rupiah yang sama secara merata.
                      </p>
                    </label>

                    <label
                      onClick={() => setSelectedSplit(INITIAL_SPLIT_PRINCIPLES.CONTRIBUTION_BASED)}
                      className={`p-3 rounded-lg border block cursor-pointer transition-all ${
                        selectedSplit === INITIAL_SPLIT_PRINCIPLES.CONTRIBUTION_BASED
                          ? 'border-sakode-purple bg-purple-50/50 ring-1 ring-sakode-purple'
                          : 'border-sakode-border bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="splitPrinciple"
                          checked={selectedSplit === INITIAL_SPLIT_PRINCIPLES.CONTRIBUTION_BASED}
                          onChange={() => setSelectedSplit(INITIAL_SPLIT_PRINCIPLES.CONTRIBUTION_BASED)}
                          className="h-4 w-4 text-sakode-purple focus:ring-sakode-purple"
                        />
                        <span className="text-xs font-bold text-sakode-text">
                          Berbasis Kontribusi (Contribution-Based)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 pl-6 leading-relaxed">
                        Pembagian akhir akan disepakati berdasarkan porsi kontribusi kode, arsitektur, dan deliverable masing-masing anggota.
                      </p>
                    </label>
                  </div>
                </div>

                {/* Consent Checkbox */}
                <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-sakode-border text-sakode-purple focus:ring-sakode-purple"
                  />
                  <span className="text-xs text-sakode-text leading-snug">
                    Saya menyetujui seluruh syarat & ketentuan task di atas dan berkomitmen berkolaborasi menyelesaikan kriteria penerimaan bersama tim.
                  </span>
                </label>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-sakode-border bg-sakode-bg flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={() => setShowConsentModal(false)} className="text-xs">
                  Batal
                </Button>
                <Button
                  variant="team"
                  size="sm"
                  disabled={!agreedTerms || isSubmittingConsent}
                  onClick={handleConfirmConsent}
                  className="font-bold text-xs gap-1.5 h-10 px-4"
                >
                  {isSubmittingConsent ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  <span>Kirim Persetujuan & Voting</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}

export default function TeamDetailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-sakode-bg py-20 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-sakode-purple" />
          <p className="text-xs text-sakode-text-muted mt-2 font-medium">Memuat ruang tim...</p>
        </div>
      }
    >
      <TeamDetailPageContent />
    </React.Suspense>
  );
}
