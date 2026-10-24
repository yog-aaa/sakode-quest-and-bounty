'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BountyCard } from '@/components/task/BountyCard';
import { createTaskAction } from '@/server/actions/task.actions';
import { createTaskSchema, type CreateTaskInput } from '@/lib/validations/task';
import { TASK_STATUS } from '@/lib/constants';
import { formatCurrencyIDR } from '@/lib/utils';
import type { TaskDocument } from '@/types/database';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
  Zap,
  Send,
  Users,
  User,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileText,
  Shield,
} from 'lucide-react';

const PRESET_SKILLS = [
  'React',
  'Next.js',
  'TypeScript',
  'Tailwind CSS',
  'Firebase',
  'Node.js',
  'UI/UX Design',
  'PostgreSQL',
  'REST API',
  'Docker',
  'Testing',
];

const DEFAULT_TERMS = `1. Penerima task (Member) bertanggung jawab penuh atas penyelesaian seluruh kriteria penerimaan yang ditentukan.
2. Kode dan aset yang dikirimkan harus orisinal, bebas dari pelanggaran hak cipta, dan mematuhi standar clean code SAKODE.
3. Seluruh hasil pekerjaan wajib dikirimkan sebelum batas waktu (deadline) berakhir. Keterlambatan tanpa konfirmasi berakibat task dibatalkan (FAILED).
4. Penilaian hasil pekerjaan dilakukan oleh Admin/Reviewer SAKODE dengan keputusan mutlak berdasarkan Acceptance Criteria.
5. Dana reward akan disalurkan ke rekening terdaftar member setelah submission dinyatakan APPROVED.`;

export default function AdminCreateTaskPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState('');
  const [deliverableGuidelines, setDeliverableGuidelines] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState<string[]>([
    'Mengimplementasikan fitur sesuai panduan teknis',
    'Memastikan kode bersih, teruji, dan bebas error',
  ]);
  const [newCriterion, setNewCriterion] = useState('');
  const [mode, setMode] = useState<'SOLO' | 'TEAM'>('SOLO');
  const [minTeamSize, setMinTeamSize] = useState(2);
  const [maxTeamSize, setMaxTeamSize] = useState(4);
  const [assignmentType, setAssignmentType] = useState<'INSTANT_TAKE' | 'APPLICATION'>('INSTANT_TAKE');
  const [requiredSkills, setRequiredSkills] = useState<string[]>(['React', 'TypeScript']);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [totalReward, setTotalReward] = useState<number>(500000);
  const [deadlineType, setDeadlineType] = useState<'FIXED' | 'DURATION'>('DURATION');
  const [durationMinutes, setDurationMinutes] = useState<number>(2880); // 48 jam default
  const [fixedDeadline, setFixedDeadline] = useState<string>('');
  const [termsContent, setTermsContent] = useState<string>(DEFAULT_TERMS);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  // Criteria Management
  const handleAddCriterion = () => {
    if (!newCriterion.trim()) return;
    setAcceptanceCriteria((prev) => [...prev, newCriterion.trim()]);
    setNewCriterion('');
  };

  const handleRemoveCriterion = (index: number) => {
    setAcceptanceCriteria((prev) => prev.filter((_, i) => i !== index));
  };

  // Skill Management
  const toggleSkill = (skill: string) => {
    setRequiredSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleAddCustomSkill = () => {
    if (!customSkillInput.trim()) return;
    const trimmed = customSkillInput.trim();
    if (!requiredSkills.includes(trimmed)) {
      setRequiredSkills((prev) => [...prev, trimmed]);
    }
    setCustomSkillInput('');
  };

  // Submit Handler
  const handleSubmit = async (targetStatus: 'DRAFT' | 'OPEN') => {
    if (!user) return;
    setValidationErrors({});
    setServerError(null);

    const payload: CreateTaskInput = {
      title,
      description,
      scope,
      deliverableGuidelines,
      acceptanceCriteria: acceptanceCriteria.filter((c) => c.trim().length > 0),
      mode,
      minTeamSize: mode === 'TEAM' ? minTeamSize : undefined,
      maxTeamSize: mode === 'TEAM' ? maxTeamSize : undefined,
      assignmentType,
      requiredSkills,
      totalReward: Number(totalReward),
      deadlineType,
      durationMinutes: deadlineType === 'DURATION' ? Number(durationMinutes) : undefined,
      fixedDeadline: deadlineType === 'FIXED' ? new Date(fixedDeadline).toISOString() : undefined,
      termsContent,
      status: targetStatus,
    };

    // Client-side Zod validation
    const valResult = createTaskSchema.safeParse(payload);
    if (!valResult.success) {
      const fieldErrors: Record<string, string> = {};
      valResult.error.issues.forEach((err) => {
        const field = String(err.path[0]);
        fieldErrors[field] = err.message;
      });
      setValidationErrors(fieldErrors);
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createTaskAction(user.id, valResult.data);
      if (res.success && res.task) {
        router.push('/admin/tasks');
      } else {
        setServerError(res.error || 'Gagal membuat task baru.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: unknown) {
      console.error(err);
      setServerError('Terjadi kesalahan koneksi.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mock Task Object for Live Preview
  const previewTask: TaskDocument = {
    id: 'preview-task-id',
    title: title || 'Judul Task Akan Ditampilkan di Sini',
    description: description || 'Deskripsi singkat pekerjaan dan ekspektasi hasil deliverable yang diharapkan.',
    scope: scope || 'Ruang lingkup pekerjaan...',
    deliverableGuidelines: deliverableGuidelines || 'Panduan format output...',
    acceptanceCriteria: acceptanceCriteria.length > 0 ? acceptanceCriteria : ['Kriteria 1'],
    mode,
    assignmentType,
    status: TASK_STATUS.OPEN,
    requiredSkills: requiredSkills.length > 0 ? requiredSkills : ['Skill'],
    totalReward: Number(totalReward) || 0,
    deadlineType,
    durationMinutes: deadlineType === 'DURATION' ? Number(durationMinutes) : null,
    fixedDeadlineAt: deadlineType === 'FIXED' && fixedDeadline ? fixedDeadline : null,
    deadlineAt: null,
    assignedUserId: null,
    assignedTeamId: null,
    reviewLockedByAdminId: null,
    reviewLockedUntil: null,
    parentTaskId: null,
    continuationTaskId: null,
    termsSnapshot: {
      version: 1,
      content: termsContent,
      capturedAt: '2026-10-24T12:00:00.000Z',
    },
    createdByAdminId: user?.id || 'admin',
    createdAt: '2026-10-24T12:00:00.000Z',
    updatedAt: '2026-10-24T12:00:00.000Z',
  };

  return (
    <AuthGuard requireAdmin>
      <div className="min-h-screen bg-sakode-bg py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Top Bar */}
          <div className="flex items-center justify-between border-b border-sakode-border pb-4">
            <div className="flex items-center gap-3">
              <Link href="/admin/tasks">
                <Button variant="outline" size="sm" className="h-9 px-2.5">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-sakode-text tracking-tight">
                  Buat Task & Bounty Baru
                </h1>
                <p className="text-xs text-sakode-text-muted">
                  Konfigurasikan spesifikasi, mode penugasan, batas waktu, dan snapshot terms.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isSubmitting}
                onClick={() => handleSubmit('DRAFT')}
                className="font-bold text-xs h-10 px-4"
              >
                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                <span>Simpan Draf</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                disabled={isSubmitting}
                onClick={() => handleSubmit('OPEN')}
                className="font-bold text-xs h-10 px-4 shadow-sm"
              >
                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Zap className="h-3.5 w-3.5 mr-1" />}
                <span>Terbitkan Sekarang</span>
              </Button>
            </div>
          </div>

          {/* Server Error Alert */}
          {serverError && (
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Form + Live Preview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 cols: Form Wizard */}
            <div className="lg:col-span-7 space-y-6">
              {/* Section 1: Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-sakode-cyan" />
                    <span>1. Informasi Pokok Task</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Judul dan ringkasan task yang menarik, jelas, dan akurat.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-xs font-bold text-sakode-text uppercase tracking-wider mb-1">
                      Judul Task <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Implementasi Komponen Responsive Navbar SAKODE"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-sakode-border focus:outline-none focus:ring-2 focus:ring-sakode-cyan"
                    />
                    {validationErrors.title && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1">{validationErrors.title}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-bold text-sakode-text uppercase tracking-wider mb-1">
                      Deskripsi Ringkas <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Jelaskan gambaran umum kebutuhan dan tujuan dari task ini..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-sakode-border focus:outline-none focus:ring-2 focus:ring-sakode-cyan"
                    />
                    {validationErrors.description && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1">{validationErrors.description}</p>
                    )}
                  </div>

                  {/* Scope & Deliverable */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-sakode-text uppercase tracking-wider mb-1">
                        Ruang Lingkup (Scope) <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Batasan dan cakupan kode..."
                        value={scope}
                        onChange={(e) => setScope(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-sakode-border focus:outline-none focus:ring-2 focus:ring-sakode-cyan"
                      />
                      {validationErrors.scope && (
                        <p className="text-[11px] text-rose-600 font-semibold mt-1">{validationErrors.scope}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-sakode-text uppercase tracking-wider mb-1">
                        Panduan Deliverable <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Format branch, pull request, file..."
                        value={deliverableGuidelines}
                        onChange={(e) => setDeliverableGuidelines(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-sakode-border focus:outline-none focus:ring-2 focus:ring-sakode-cyan"
                      />
                      {validationErrors.deliverableGuidelines && (
                        <p className="text-[11px] text-rose-600 font-semibold mt-1">
                          {validationErrors.deliverableGuidelines}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section 2: Acceptance Criteria */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>2. Kriteria Penerimaan (Acceptance Criteria)</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Daftar syarat konkret yang harus dipenuhi oleh penerima task untuk lolos review.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    {acceptanceCriteria.map((criterion, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <span className="text-xs font-bold text-slate-400 w-5">{idx + 1}.</span>
                        <span className="text-xs text-sakode-text flex-1 font-medium">{criterion}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCriterion(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Tambah kriteria baru..."
                      value={newCriterion}
                      onChange={(e) => setNewCriterion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCriterion();
                        }
                      }}
                      className="flex-1 px-3 py-2 text-xs rounded-lg border border-sakode-border focus:outline-none focus:ring-2 focus:ring-sakode-cyan"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={handleAddCriterion} className="text-xs font-bold">
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      <span>Tambah</span>
                    </Button>
                  </div>
                  {validationErrors.acceptanceCriteria && (
                    <p className="text-[11px] text-rose-600 font-semibold">{validationErrors.acceptanceCriteria}</p>
                  )}
                </CardContent>
              </Card>

              {/* Section 3: Mode, Assignment & Skills */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4 text-sakode-purple" />
                    <span>3. Mode Penugasan & Kualifikasi</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Tentukan apakah task ini dikerjakan individu (Solo) atau tim, serta metode pengambilannya.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Mode & Assignment Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Mode */}
                    <div>
                      <label className="block text-xs font-bold text-sakode-text uppercase tracking-wider mb-2">
                        Mode Pengerjaan
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setMode('SOLO')}
                          className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            mode === 'SOLO'
                              ? 'border-sakode-cyan bg-sakode-cyan/15 text-sakode-text shadow-xs ring-1 ring-sakode-cyan'
                              : 'border-sakode-border bg-white text-sakode-text-muted hover:bg-slate-50'
                          }`}
                        >
                          <User className="h-3.5 w-3.5" />
                          <span>Solo (Individu)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setMode('TEAM')}
                          className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            mode === 'TEAM'
                              ? 'border-sakode-purple bg-purple-50 text-purple-900 shadow-xs ring-1 ring-sakode-purple'
                              : 'border-sakode-border bg-white text-sakode-text-muted hover:bg-slate-50'
                          }`}
                        >
                          <Users className="h-3.5 w-3.5" />
                          <span>Team (Grup)</span>
                        </button>
                      </div>

                      {mode === 'TEAM' && (
                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Min Member</label>
                            <input
                              type="number"
                              min={2}
                              value={minTeamSize}
                              onChange={(e) => setMinTeamSize(Number(e.target.value))}
                              className="w-full px-2 py-1 text-xs rounded border border-sakode-border font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Max Member</label>
                            <input
                              type="number"
                              min={2}
                              value={maxTeamSize}
                              onChange={(e) => setMaxTeamSize(Number(e.target.value))}
                              className="w-full px-2 py-1 text-xs rounded border border-sakode-border font-mono"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Assignment Type */}
                    <div>
                      <label className="block text-xs font-bold text-sakode-text uppercase tracking-wider mb-2">
                        Metode Penugasan
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setAssignmentType('INSTANT_TAKE')}
                          className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            assignmentType === 'INSTANT_TAKE'
                              ? 'border-amber-400 bg-amber-50 text-amber-900 shadow-xs ring-1 ring-amber-400'
                              : 'border-sakode-border bg-white text-sakode-text-muted hover:bg-slate-50'
                          }`}
                        >
                          <Zap className="h-3.5 w-3.5 text-amber-500" />
                          <span>Instant Take</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAssignmentType('APPLICATION')}
                          className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            assignmentType === 'APPLICATION'
                              ? 'border-sky-400 bg-sky-50 text-sky-900 shadow-xs ring-1 ring-sky-400'
                              : 'border-sakode-border bg-white text-sakode-text-muted hover:bg-slate-50'
                          }`}
                        >
                          <Send className="h-3.5 w-3.5 text-sky-500" />
                          <span>Application</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Skills Tag Selector */}
                  <div>
                    <label className="block text-xs font-bold text-sakode-text uppercase tracking-wider mb-1.5">
                      Skill yang Dibutuhkan
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {PRESET_SKILLS.map((skill) => {
                        const isSelected = requiredSkills.includes(skill);
                        return (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => toggleSkill(skill)}
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                              isSelected
                                ? 'bg-sakode-text text-white shadow-xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                            }`}
                          >
                            {skill} {isSelected ? '✓' : '+'}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Tambah skill kustom..."
                        value={customSkillInput}
                        onChange={(e) => setCustomSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomSkill();
                          }
                        }}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-sakode-border focus:outline-none focus:ring-1 focus:ring-sakode-cyan"
                      />
                      <Button type="button" variant="outline" size="sm" onClick={handleAddCustomSkill} className="text-xs">
                        Tambah
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section 4: Reward & Deadline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-sakode-orange" />
                    <span>4. Reward & Batas Waktu (Zero-Cron Invariant)</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Nominal bounty integer Rupiah dan aturan deadline (Fixed ISO atau Durasi jam).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Total Reward */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-sakode-text uppercase tracking-wider">
                        Total Reward Bounty (IDR) <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-sm font-black text-sakode-text">
                        {formatCurrencyIDR(Number(totalReward) || 0)}
                      </span>
                    </div>
                    <input
                      type="number"
                      step={10000}
                      min={10000}
                      value={totalReward}
                      onChange={(e) => setTotalReward(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-sakode-border focus:outline-none focus:ring-2 focus:ring-sakode-cyan font-mono"
                    />
                    <p className="text-[11px] text-sakode-text-muted mt-1">
                      Harus berupa bilangan bulat positif (min Rp 10.000, kelipatan 1.000).
                    </p>
                    {validationErrors.totalReward && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1">{validationErrors.totalReward}</p>
                    )}
                  </div>

                  {/* Deadline Type */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-sakode-text uppercase tracking-wider">
                      Tipe Batas Waktu (Deadline)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDeadlineType('DURATION')}
                        className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          deadlineType === 'DURATION'
                            ? 'border-sakode-cyan bg-sakode-cyan/15 text-sakode-text shadow-xs ring-1 ring-sakode-cyan'
                            : 'border-sakode-border bg-white text-sakode-text-muted hover:bg-slate-50'
                        }`}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        <span>Durasi (Mulai saat diambil)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeadlineType('FIXED')}
                        className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          deadlineType === 'FIXED'
                            ? 'border-sakode-cyan bg-sakode-cyan/15 text-sakode-text shadow-xs ring-1 ring-sakode-cyan'
                            : 'border-sakode-border bg-white text-sakode-text-muted hover:bg-slate-50'
                        }`}
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Tanggal Tetap (Fixed Date)</span>
                      </button>
                    </div>

                    {deadlineType === 'DURATION' ? (
                      <div className="pt-2">
                        <label className="block text-xs font-semibold text-sakode-text-muted mb-1">
                          Pilih Presets Durasi Pengerjaan:
                        </label>
                        <div className="grid grid-cols-4 gap-2 mb-2">
                          {[
                            { label: '24 Jam', minutes: 1440 },
                            { label: '48 Jam (2 Hari)', minutes: 2880 },
                            { label: '3 Hari', minutes: 4320 },
                            { label: '7 Hari', minutes: 10080 },
                          ].map((d) => (
                            <button
                              key={d.label}
                              type="button"
                              onClick={() => setDurationMinutes(d.minutes)}
                              className={`py-2 px-1 text-center rounded border text-xs font-semibold transition-all ${
                                durationMinutes === d.minutes
                                  ? 'bg-sakode-text text-white border-sakode-text'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {d.label}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-sakode-text-muted">Atau kustom (menit):</span>
                          <input
                            type="number"
                            min={60}
                            step={60}
                            value={durationMinutes}
                            onChange={(e) => setDurationMinutes(Number(e.target.value))}
                            className="w-32 px-2 py-1 text-xs rounded border border-sakode-border font-mono"
                          />
                          <span className="text-xs text-sakode-text-muted">
                            ({Math.round(durationMinutes / 60)} Jam)
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2">
                        <label className="block text-xs font-semibold text-sakode-text-muted mb-1">
                          Tentukan Batas Tanggal & Waktu (WIB):
                        </label>
                        <input
                          type="datetime-local"
                          value={fixedDeadline}
                          onChange={(e) => setFixedDeadline(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-sakode-border font-mono"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Section 5: Terms & Conditions Snapshot */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4 text-sky-600" />
                    <span>5. Syarat & Ketentuan Task (Terms Snapshot)</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Teks syarat ini akan dibekukan (snapshot version 1) saat task dibuat dan wajib disetujui pendaftar.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <textarea
                    rows={6}
                    value={termsContent}
                    onChange={(e) => setTermsContent(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-sakode-border focus:outline-none focus:ring-1 focus:ring-sakode-cyan leading-relaxed"
                  />
                  {validationErrors.termsContent && (
                    <p className="text-[11px] text-rose-600 font-semibold mt-1">{validationErrors.termsContent}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right 5 cols: Sticky Live Preview */}
            <div className="lg:col-span-5 sticky top-20 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-sakode-text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-sakode-cyan" />
                  <span>Pratinjau Kartu Bounty (Real-Time)</span>
                </h3>
                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                  Live Sync
                </span>
              </div>

              {/* Bounty Card Preview */}
              <BountyCard task={previewTask} userIsApproved={true} />

              <div className="p-4 rounded-lg bg-white border border-sakode-border space-y-2 text-xs text-sakode-text-muted">
                <div className="font-bold text-sakode-text flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-sakode-cyan" />
                  <span>Jaminan Invariant SAKODE</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-[11px] leading-relaxed">
                  <li>Reward tersimpan sebagai integer Rupiah (bebas floating point bug).</li>
                  <li>Batas waktu dihitung di server saat task diambil/dimulai (Zero-Cron).</li>
                  <li>Instant Take diisolasi dalam transaksi atomik Firestore.</li>
                  <li>Snapshot syarat dan ketentuan terkunci secara permanen.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
