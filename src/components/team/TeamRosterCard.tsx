'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusPill } from '@/components/ui/StatusPill';
import type { TeamDocument, TeamMembershipDocument } from '@/types/database';
import {
  TEAM_ROLES,
  TEAM_STATUS,
  TEAM_MEMBERSHIP_STATUS,
  INITIAL_SPLIT_PRINCIPLES,
} from '@/lib/constants';
import {
  Users,
  Crown,
  Shield,
  Copy,
  Check,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  UserPlus,
  Loader2,
  Trash2,
} from 'lucide-react';

interface TeamRosterCardProps {
  team: TeamDocument;
  members: TeamMembershipDocument[];
  currentUserId?: string;
  isTeamLead?: boolean;
  onApproveMember?: (targetUserId: string) => void;
  onRejectMember?: (targetUserId: string) => void;
  onOpenConsentModal?: () => void;
  onStartTeamTask?: () => void;
  actionLoadingId?: string | null;
}

export const TeamRosterCard: React.FC<TeamRosterCardProps> = ({
  team,
  members,
  currentUserId,
  isTeamLead = false,
  onApproveMember,
  onRejectMember,
  onOpenConsentModal,
  onStartTeamTask,
  actionLoadingId,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(team.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const approvedOrConsentedMembers = members.filter(
    (m) =>
      m.status === TEAM_MEMBERSHIP_STATUS.APPROVED ||
      m.status === TEAM_MEMBERSHIP_STATUS.TERMS_ACCEPTED
  );

  const pendingJoinRequests = members.filter(
    (m) => m.status === TEAM_MEMBERSHIP_STATUS.APPLIED
  );

  const currentUserMembership = members.find((m) => m.userId === currentUserId);
  const needsConsent =
    currentUserMembership &&
    currentUserMembership.status === TEAM_MEMBERSHIP_STATUS.APPROVED;

  // Syarat Mulai Pengerjaan:
  const hasMinMembers = approvedOrConsentedMembers.length >= team.minMembers;
  const allConsented =
    approvedOrConsentedMembers.length > 0 &&
    approvedOrConsentedMembers.every(
      (m) => m.status === TEAM_MEMBERSHIP_STATUS.TERMS_ACCEPTED
    );
  const canStartTask =
    isTeamLead &&
    team.status !== TEAM_STATUS.ACTIVE &&
    !team.rosterLocked &&
    hasMinMembers &&
    allConsented;

  // Empty slots calculation
  const totalSlots = Math.max(team.maxMembers, team.minMembers);
  const emptySlotsCount = Math.max(0, totalSlots - approvedOrConsentedMembers.length);

  return (
    <Card className="border-sakode-purple/40 shadow-sm overflow-hidden">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-50 via-white to-sky-50 px-5 py-4 border-b border-sakode-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="purple" leftIcon={<Users className="h-3 w-3" />}>
              Team Roster
            </Badge>
            <StatusPill status={team.status} size="sm" />
            {team.rosterLocked ? (
              <Badge variant="outline" className="text-slate-600 bg-slate-100" leftIcon={<Lock className="h-3 w-3" />}>
                Roster Terkunci
              </Badge>
            ) : (
              <Badge variant="outline" className="text-emerald-700 bg-emerald-50" leftIcon={<Unlock className="h-3 w-3" />}>
                Fase Rekrutmen
              </Badge>
            )}
          </div>
          <h2 className="text-base sm:text-lg font-black text-sakode-text">
            {team.taskTitle || 'Ruang Kolaborasi Tim SAKODE'}
          </h2>
          <p className="text-xs text-sakode-text-muted">
            Kuota Tim: <strong className="text-sakode-text">{approvedOrConsentedMembers.length} / {team.maxMembers}</strong> Anggota (Minimal: {team.minMembers})
          </p>
        </div>

        {/* Invite Code Box */}
        {!team.rosterLocked && (
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-sakode-purple/40 shadow-2xs">
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Kode Undangan:</span>
              <span className="font-mono text-sm font-black text-purple-900 tracking-wider">
                {team.inviteCode}
              </span>
            </div>
            <button
              onClick={handleCopyInviteCode}
              title="Salin Kode Undangan"
              className="p-1.5 rounded-md hover:bg-purple-50 text-purple-700 transition-colors"
            >
              {copiedCode ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>

      <CardContent className="p-5 space-y-6">
        {/* Approved Members Roster List */}
        <div>
          <h3 className="text-xs font-bold text-sakode-text uppercase tracking-wider mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-sakode-purple" />
              <span>Susunan Roster Tim (Squad Party)</span>
            </span>
            <span className="text-[11px] font-normal text-sakode-text-muted">
              {approvedOrConsentedMembers.length} Terisi
            </span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {approvedOrConsentedMembers.map((member) => {
              const isLead = member.roleInTeam === TEAM_ROLES.LEAD;
              const hasConsented = member.status === TEAM_MEMBERSHIP_STATUS.TERMS_ACCEPTED;

              return (
                <div
                  key={member.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isLead
                      ? 'bg-purple-50/50 border-purple-200 ring-1 ring-purple-100'
                      : 'bg-white border-sakode-border hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar with RPG border */}
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center font-black text-xs shadow-xs ${
                          isLead
                            ? 'bg-gradient-to-tr from-amber-400 to-purple-500 text-white ring-2 ring-amber-300'
                            : 'bg-sakode-cyan/30 text-sky-900'
                        }`}
                      >
                        {member.userDisplayName
                          ? member.userDisplayName.slice(0, 2).toUpperCase()
                          : 'MB'}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-bold text-sakode-text">
                            {member.userDisplayName || 'Anggota Tim'}
                          </span>
                          {isLead && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5">
                              <Crown className="h-2.5 w-2.5 text-amber-600" />
                              <span>LEAD</span>
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-sakode-text-muted block truncate max-w-[180px]">
                          {member.userEmail || '-'}
                        </span>
                      </div>
                    </div>

                    <StatusPill status={member.status} size="sm" />
                  </div>

                  {/* Consent & Voting Indicators */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center gap-1">
                      {hasConsented ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span className="text-emerald-800 font-semibold">Terms Disetujui</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="text-slate-500">Belum Persetujuan</span>
                        </>
                      )}
                    </div>

                    <div className="text-right truncate">
                      <span className="text-slate-500 font-medium">Split: </span>
                      <strong className="text-sakode-text">
                        {member.agreedSplitPrinciple === INITIAL_SPLIT_PRINCIPLES.EQUAL
                          ? 'Sama Rata'
                          : member.agreedSplitPrinciple === INITIAL_SPLIT_PRINCIPLES.CONTRIBUTION_BASED
                          ? 'Kontribusi'
                          : '-'}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Empty Slots */}
            {Array.from({ length: emptySlotsCount }).map((_, idx) => (
              <div
                key={`empty-slot-${idx}`}
                className="p-3.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 flex items-center gap-3 text-slate-400"
              >
                <div className="h-10 w-10 rounded-full border border-dashed border-slate-300 flex items-center justify-center">
                  <UserPlus className="h-4 w-4 text-slate-400" />
                </div>
                <div className="text-xs font-semibold">
                  <span>Slot Terbuka #{approvedOrConsentedMembers.length + idx + 1}</span>
                  <span className="block text-[10px] text-slate-400 font-normal">
                    Menunggu anggota bergabung
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Join Requests (Visible to Team Lead) */}
        {isTeamLead && !team.rosterLocked && pendingJoinRequests.length > 0 && (
          <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 space-y-3">
            <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center justify-between">
              <span>Permintaan Bergabung ({pendingJoinRequests.length} Menunggu Persetujuan)</span>
            </h4>

            <div className="space-y-2">
              {pendingJoinRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white p-3 rounded-lg border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-xs text-sakode-text">
                      {req.userDisplayName || req.userEmail}
                    </div>
                    <span className="text-[11px] text-sakode-text-muted block">
                      Kontak: {req.userContactNumber || '-'} • Skill: {req.userSkills?.join(', ') || '-'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={actionLoadingId === req.userId}
                      onClick={() => onRejectMember && onRejectMember(req.userId)}
                      className="text-xs font-bold text-rose-700 border-rose-200 hover:bg-rose-50 h-8"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      <span>Tolak</span>
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      disabled={actionLoadingId === req.userId}
                      onClick={() => onApproveMember && onApproveMember(req.userId)}
                      className="text-xs font-bold h-8 gap-1"
                    >
                      {actionLoadingId === req.userId ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                      <span>Terima Anggota</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Member Action: Needs Consent Notice */}
        {needsConsent && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900">
                  Persetujuan Syarat & Ketentuan Diperlukan
                </h4>
                <p className="text-[11px] text-amber-700">
                  Anda telah diterima di tim ini. Anda wajib menyetujui syarat & ketentuan dan memberikan voting prinsip pembagian reward sebelum tim dapat memulai task.
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={onOpenConsentModal}
              className="font-bold text-xs shrink-0"
            >
              <span>Beri Persetujuan & Voting</span>
            </Button>
          </div>
        )}

        {/* Team Lead Start Checklist & CTA */}
        {isTeamLead && !team.rosterLocked && (
          <div className="p-4 rounded-xl bg-white border border-sakode-border space-y-3">
            <h4 className="text-xs font-bold text-sakode-text uppercase tracking-wider">
              Syarat Memulai Task Bersama Tim (Fase Active):
            </h4>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                {hasMinMembers ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                )}
                <span>
                  Jumlah anggota memenuhi batas minimum ({approvedOrConsentedMembers.length} / {team.minMembers})
                </span>
              </div>

              <div className="flex items-center gap-2">
                {allConsented ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                )}
                <span>
                  Seluruh anggota telah menyetujui Terms & Prinsip Pembagian Awal
                </span>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  Seluruh anggota berstatus akun APPROVED dan bebas dari Active Task lain
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="team"
                size="lg"
                disabled={!canStartTask || actionLoadingId === 'start-team'}
                onClick={onStartTeamTask}
                className="w-full font-black text-sm h-12 shadow-sm gap-2"
              >
                {actionLoadingId === 'start-team' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4" />
                )}
                <span>Kunci Roster & Mulai Kerjakan Task Bersama Tim</span>
              </Button>
              {!canStartTask && (
                <span className="text-[10px] text-sakode-text-muted text-center block mt-1.5">
                  Tombol akan aktif otomatis saat seluruh syarat di atas terpenuhi 100%.
                </span>
              )}
            </div>
          </div>
        )}

        {/* Active Team Locked Banner */}
        {team.status === TEAM_STATUS.ACTIVE && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2.5">
            <Lock className="h-4 w-4 text-emerald-700 shrink-0" />
            <div>
              <strong className="block font-bold">Tim Sedang Aktif Mengerjakan Task</strong>
              <span>
                Roster anggota terkunci permanen. Seluruh anggota tim memegang 1 Active Task dan tidak dapat mengambil task lain hingga submission diselesaikan.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
