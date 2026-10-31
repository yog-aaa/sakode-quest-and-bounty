'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
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
  Shield,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  Check,
} from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Informasi Pokok', subtitle: 'Judul, deskripsi, & ruang lingkup' },
  { id: 2, title: 'Kriteria Penerimaan', subtitle: 'Syarat lolos review deliverable' },
  { id: 3, title: 'Mode & Kualifikasi', subtitle: 'Solo/tim & kebutuhan skill' },
  { id: 4, title: 'Bounty & Waktu', subtitle: 'Alokasi Rupiah & batas deadline' },
  { id: 5, title: 'Syarat & Pratinjau', subtitle: 'Review kartu & persetujuan terms' },
];

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
  const [acceptanceCriteria, setAcceptanceCriteria] = useState<string[]>([]);
  const [newCriterion, setNewCriterion] = useState('');
  const [mode, setMode] = useState<'SOLO' | 'TEAM'>('SOLO');
  const [minTeamSize, setMinTeamSize] = useState(2);
  const [maxTeamSize, setMaxTeamSize] = useState(4);
  const [assignmentType, setAssignmentType] = useState<'INSTANT_TAKE' | 'APPLICATION'>('INSTANT_TAKE');
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [totalReward, setTotalReward] = useState<number | ''>('');
  const [deadlineType, setDeadlineType] = useState<'FIXED' | 'DURATION'>('DURATION');
  const [durationMinutes, setDurationMinutes] = useState<number | ''>('');
  const [fixedDeadline, setFixedDeadline] = useState<string>('');
  const [termsContent, setTermsContent] = useState<string>(DEFAULT_TERMS);
  const [isTermsExpanded, setIsTermsExpanded] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  // Helper hapus inline error saat user mengetik
  const clearFieldError = (field: string) => {
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  // Real Validation Checks for Stepper Completion
  const isStep1Complete = () => {
    return (
      title.trim().length >= 5 &&
      title.trim().length <= 120 &&
      description.trim().length >= 20 &&
      scope.trim().length >= 10 &&
      deliverableGuidelines.trim().length >= 10
    );
  };

  const isStep2Complete = () => {
    return (
      acceptanceCriteria.length >= 1 &&
      acceptanceCriteria.every((c) => c.trim().length >= 3)
    );
  };

  const isStep3Complete = () => {
    if (mode === 'TEAM') {
      if (!minTeamSize || !maxTeamSize || minTeamSize < 2 || maxTeamSize < minTeamSize) {
        return false;
      }
    }
    return requiredSkills.length >= 1;
  };

  const isStep4Complete = () => {
    const rewardVal = Number(totalReward);
    const rewardValid =
      typeof rewardVal === 'number' &&
      !isNaN(rewardVal) &&
      rewardVal >= 10000 &&
      rewardVal % 1000 === 0;
    if (!rewardValid) return false;

    if (deadlineType === 'DURATION') {
      const durVal = Number(durationMinutes);
      return typeof durVal === 'number' && !isNaN(durVal) && durVal > 0;
    }
    if (deadlineType === 'FIXED') {
      return !!fixedDeadline && !isNaN(new Date(fixedDeadline).getTime());
    }
    return false;
  };

  const isStep5Complete = () => {
    return (
      isStep1Complete() &&
      isStep2Complete() &&
      isStep3Complete() &&
      isStep4Complete() &&
      termsContent.trim().length >= 10
    );
  };

  const isStepCompleted = (stepId: number) => {
    switch (stepId) {
      case 1:
        return isStep1Complete();
      case 2:
        return isStep2Complete();
      case 3:
        return isStep3Complete();
      case 4:
        return isStep4Complete();
      case 5:
        return isStep5Complete();
      default:
        return false;
    }
  };

  // Stepper Navigation Helpers (Fleksibel & Bebas Navigasi)
  const handleNextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Criteria Management
  const handleAddCriterion = () => {
    if (!newCriterion.trim()) return;
    setAcceptanceCriteria((prev) => [...prev, newCriterion.trim()]);
    setNewCriterion('');
    clearFieldError('acceptanceCriteria');
  };

  const handleRemoveCriterion = (index: number) => {
    setAcceptanceCriteria((prev) => prev.filter((_, i) => i !== index));
  };

  // Skill Management
  const toggleSkill = (skill: string) => {
    setRequiredSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
    clearFieldError('requiredSkills');
  };

  const handleAddCustomSkill = () => {
    if (!customSkillInput.trim()) return;
    const trimmed = customSkillInput.trim();
    if (!requiredSkills.includes(trimmed)) {
      setRequiredSkills((prev) => [...prev, trimmed]);
      clearFieldError('requiredSkills');
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

      // Arahkan stepper ke tab dengan error pertama
      if (fieldErrors.title || fieldErrors.description || fieldErrors.scope || fieldErrors.deliverableGuidelines) {
        setCurrentStep(1);
      } else if (fieldErrors.acceptanceCriteria) {
        setCurrentStep(2);
      } else if (fieldErrors.mode || fieldErrors.minTeamSize || fieldErrors.maxTeamSize || fieldErrors.requiredSkills) {
        setCurrentStep(3);
      } else if (fieldErrors.totalReward || fieldErrors.durationMinutes || fieldErrors.fixedDeadline) {
        setCurrentStep(4);
      } else if (fieldErrors.termsContent) {
        setCurrentStep(5);
      }

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
      <div className="min-h-screen bg-slate-50/50 dark:bg-[#0B0F19] py-8 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Top Bar Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Link href="/admin/tasks">
                <button
                  type="button"
                  className="h-10 w-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
                  title="Kembali ke Katalog Task"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Terbitkan Task & Bounty Baru
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Lengkapi spesifikasi task secara bertahap melalui panduan formulir di bawah ini.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit('DRAFT')}
                className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                <span>Simpan Draf</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting || !isStep5Complete()}
                onClick={() => handleSubmit('OPEN')}
                className={`h-10 px-5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                  !isStep5Complete()
                    ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed opacity-60'
                    : 'bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-white shadow-md shadow-cyan-500/20 active:scale-[0.98]'
                }`}
                title={!isStep5Complete() ? 'Lengkapi semua langkah formulir terlebih dahulu' : 'Terbitkan Sekarang'}
              >
                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5 fill-current" />}
                <span>Terbitkan Sekarang</span>
              </button>
            </div>
          </div>

          {/* Server Error Alert */}
          {serverError && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-xs sm:text-sm flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Grid Layout: Left Stepper Side (4 cols) & Right Form Body Panel (8 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 4 cols: Side Stepper Navigation (Wireframe Aligned) */}
            <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3">
                <div className="px-2 pt-1 pb-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Tahapan Formulir
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
                    {currentStep} / {STEPS.length}
                  </span>
                </div>

                <nav className="space-y-2">
                  {STEPS.map((step) => {
                    const isActive = currentStep === step.id;
                    const isCompleted = isStepCompleted(step.id);

                    return (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => setCurrentStep(step.id)}
                        className={`w-full text-left p-3.5 rounded-2xl transition-all flex items-center gap-3.5 border ${
                          isActive
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm dark:bg-slate-800 dark:border-slate-700 dark:ring-2 dark:ring-cyan-500/20'
                            : isCompleted
                            ? 'bg-emerald-50/70 text-slate-900 border-emerald-200/80 hover:bg-emerald-100/50 dark:bg-emerald-950/20 dark:text-slate-100 dark:border-emerald-900/50 dark:hover:bg-emerald-950/30'
                            : 'bg-slate-50/80 text-slate-700 border-slate-200/70 hover:bg-slate-100 dark:bg-slate-950/40 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        {/* Number / Status Circle */}
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                            isActive
                              ? 'bg-cyan-500 text-white shadow-xs'
                              : isCompleted
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                          }`}
                        >
                          {isCompleted ? <Check className="h-4 w-4" /> : step.id}
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs font-bold truncate ${
                              isActive
                                ? 'text-white'
                                : isCompleted
                                ? 'text-slate-900 dark:text-slate-100'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {step.title}
                          </p>
                          <p
                            className={`text-[11px] truncate mt-0.5 ${
                              isActive ? 'text-slate-300' : 'text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            {step.subtitle}
                          </p>
                        </div>

                        {isActive && <ChevronRight className="h-4 w-4 text-cyan-400 shrink-0" />}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Mini Quick Summary Card */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs shadow-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                  <span>Total Bounty:</span>
                  <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                    {formatCurrencyIDR(Number(totalReward) || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                  <span>Mode Pengerjaan:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {mode === 'SOLO' ? 'Solo' : `Team (${minTeamSize}-${maxTeamSize})`} • {assignmentType === 'INSTANT_TAKE' ? 'Instant' : 'Seleksi'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                  <span>Kriteria Syarat:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {acceptanceCriteria.length} butir
                  </span>
                </div>
              </div>
            </div>

            {/* Right 8 cols: Single Focus Form Body Panel */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col min-h-[560px]">
              {/* Header Panel (Sesuai Wireframe: Header Bar Bagian Aktif) */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-900 text-white flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-cyan-400">
                    Langkah {currentStep} dari {STEPS.length}
                  </span>
                  <h2 className="text-lg font-bold text-white mt-0.5">
                    {STEPS[currentStep - 1].title}
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {STEPS[currentStep - 1].subtitle}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 bg-slate-800 px-3 py-1 rounded-full text-xs font-mono font-semibold text-cyan-300 border border-slate-700">
                  {Math.round((currentStep / STEPS.length) * 100)}% Selesai
                </div>
              </div>

              {/* Progress Line */}
              <div className="h-1 w-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-sky-500 transition-all duration-300"
                  style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                />
              </div>

              {/* Body Content - Form A, B, C untuk Step Aktif Saja */}
              <div className="p-6 sm:p-8 space-y-6 flex-1">
                {/* STEP 1: INFORMASI POKOK */}
                {currentStep === 1 && (
                  <div className="space-y-5 animate-in fade-in-50 duration-200">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        Judul Task <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Implementasi Komponen Responsive Navbar SAKODE"
                        value={title}
                        onChange={(e) => {
                          setTitle(e.target.value);
                          clearFieldError('title');
                        }}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                      {validationErrors.title && (
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1.5 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> {validationErrors.title}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        Deskripsi Ringkas <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Jelaskan gambaran umum kebutuhan dan tujuan dari task ini..."
                        value={description}
                        onChange={(e) => {
                          setDescription(e.target.value);
                          clearFieldError('description');
                        }}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 leading-relaxed"
                      />
                      {validationErrors.description && (
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1.5 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> {validationErrors.description}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                          Ruang Lingkup (Scope) <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          rows={4}
                          placeholder="Batasan dan cakupan kode..."
                          value={scope}
                          onChange={(e) => {
                            setScope(e.target.value);
                            clearFieldError('scope');
                          }}
                          className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 leading-relaxed"
                        />
                        {validationErrors.scope && (
                          <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1.5 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> {validationErrors.scope}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                          Panduan Deliverable <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          rows={4}
                          placeholder="Format branch, pull request, file output..."
                          value={deliverableGuidelines}
                          onChange={(e) => {
                            setDeliverableGuidelines(e.target.value);
                            clearFieldError('deliverableGuidelines');
                          }}
                          className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 leading-relaxed"
                        />
                        {validationErrors.deliverableGuidelines && (
                          <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1.5 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> {validationErrors.deliverableGuidelines}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: KRITERIA PENERIMAAN */}
                {currentStep === 2 && (
                  <div className="space-y-4 animate-in fade-in-50 duration-200">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        Daftar kriteria konkret yang harus dipenuhi oleh pendaftar task untuk dinyatakan lolos penilaian.
                      </p>
                      {acceptanceCriteria.length === 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setAcceptanceCriteria([
                              'Mengimplementasikan fitur sesuai panduan teknis',
                              'Memastikan kode bersih, teruji, dan bebas error',
                            ]);
                            clearFieldError('acceptanceCriteria');
                          }}
                          className="text-[11px] text-cyan-600 dark:text-cyan-400 font-bold hover:underline shrink-0"
                        >
                          + Pakai Kriteria Standar
                        </button>
                      )}
                    </div>

                    {acceptanceCriteria.length === 0 ? (
                      <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2.5 bg-slate-50/50 dark:bg-slate-950/20">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Belum ada kriteria penerimaan yang ditambahkan.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setAcceptanceCriteria([
                              'Mengimplementasikan fitur sesuai panduan teknis',
                              'Memastikan kode bersih, teruji, dan bebas error',
                            ]);
                            clearFieldError('acceptanceCriteria');
                          }}
                          className="text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 px-3 py-1.5 rounded-xl border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 transition-colors inline-block"
                        >
                          + Muat 2 Kriteria Rekomendasi SAKODE
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {acceptanceCriteria.map((criterion, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 px-3.5 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60"
                          >
                            <span className="w-5 h-5 rounded-full bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 text-[11px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-xs text-slate-800 dark:text-slate-200 flex-1 font-medium leading-relaxed">
                              {criterion}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCriterion(idx)}
                              className="text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                              title="Hapus kriteria"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Tulis butir kriteria pengujian baru..."
                        value={newCriterion}
                        onChange={(e) => setNewCriterion(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCriterion();
                          }
                        }}
                        className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddCriterion}
                        className="h-10 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Tambah</span>
                      </button>
                    </div>
                    {validationErrors.acceptanceCriteria && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {validationErrors.acceptanceCriteria}
                      </p>
                    )}
                  </div>
                )}

                {/* STEP 3: MODE & KUALIFIKASI */}
                {currentStep === 3 && (
                  <div className="space-y-6 animate-in fade-in-50 duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Mode Partisipasi */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                          Mode Partisipasi
                        </label>
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => setMode('SOLO')}
                            className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                              mode === 'SOLO'
                                ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-300 ring-2 ring-cyan-500/20 shadow-xs'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                            }`}
                          >
                            <User className="h-3.5 w-3.5" />
                            <span>Solo (Individu)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setMode('TEAM')}
                            className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                              mode === 'TEAM'
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-300 ring-2 ring-purple-500/20 shadow-xs'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                            }`}
                          >
                            <Users className="h-3.5 w-3.5" />
                            <span>Team (Grup)</span>
                          </button>
                        </div>

                        {mode === 'TEAM' && (
                          <div className="grid grid-cols-2 gap-3 mt-3 p-3.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40">
                            <div>
                              <label className="block text-[10px] font-bold text-purple-800 dark:text-purple-300 uppercase">Min Member</label>
                              <input
                                type="number"
                                min={2}
                                value={minTeamSize}
                                onChange={(e) => setMinTeamSize(Number(e.target.value))}
                                className="w-full mt-1 px-2.5 py-1 text-xs rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 font-mono text-slate-900 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-purple-800 dark:text-purple-300 uppercase">Max Member</label>
                              <input
                                type="number"
                                min={2}
                                value={maxTeamSize}
                                onChange={(e) => setMaxTeamSize(Number(e.target.value))}
                                className="w-full mt-1 px-2.5 py-1 text-xs rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 font-mono text-slate-900 dark:text-white"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Assignment Type */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                          Metode Penugasan
                        </label>
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => setAssignmentType('INSTANT_TAKE')}
                            className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                              assignmentType === 'INSTANT_TAKE'
                                ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 ring-2 ring-amber-500/20 shadow-xs'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                            }`}
                          >
                            <Zap className="h-3.5 w-3.5 text-amber-500 fill-current" />
                            <span>Instant Take</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setAssignmentType('APPLICATION')}
                            className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                              assignmentType === 'APPLICATION'
                                ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-300 ring-2 ring-sky-500/20 shadow-xs'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                            }`}
                          >
                            <Send className="h-3.5 w-3.5 text-sky-500" />
                            <span>Seleksi Pelamar</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Skill Tags */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                        Skill yang Dibutuhkan
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {PRESET_SKILLS.map((skill) => {
                          const isSelected = requiredSkills.includes(skill);
                          return (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => toggleSkill(skill)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                isSelected
                                  ? 'bg-cyan-600 dark:bg-cyan-500 text-white shadow-xs font-semibold'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60'
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
                          className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomSkill}
                          className="h-9 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors"
                        >
                          Tambah
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: ALOKASI BOUNTY & BATAS WAKTU */}
                {currentStep === 4 && (
                  <div className="space-y-6 animate-in fade-in-50 duration-200">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Total Reward Bounty (IDR) <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-base font-black text-cyan-600 dark:text-cyan-400 font-mono">
                          {formatCurrencyIDR(Number(totalReward) || 0)}
                        </span>
                      </div>
                      <input
                        type="number"
                        step={10000}
                        min={10000}
                        placeholder="Contoh: 500000"
                        value={totalReward}
                        onChange={(e) => {
                          setTotalReward(e.target.value === '' ? '' : Number(e.target.value));
                          clearFieldError('totalReward');
                        }}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 focus:bg-white dark:focus:bg-slate-900 font-mono"
                      />
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                        Harus berupa nominal Rupiah positif bulat (minimal Rp 10.000).
                      </p>
                      {validationErrors.totalReward && (
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> {validationErrors.totalReward}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Tipe Batas Waktu (Deadline)
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setDeadlineType('DURATION')}
                          className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                            deadlineType === 'DURATION'
                              ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-300 ring-2 ring-cyan-500/20 shadow-xs'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                          }`}
                        >
                          <Clock className="h-3.5 w-3.5" />
                          <span>Durasi (Mulai saat diambil)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeadlineType('FIXED')}
                          className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                            deadlineType === 'FIXED'
                              ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-300 ring-2 ring-cyan-500/20 shadow-xs'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                          }`}
                        >
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Tanggal Tetap (Fixed Date)</span>
                        </button>
                      </div>

                      {deadlineType === 'DURATION' ? (
                        <div className="pt-2 space-y-3">
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                            Preset Durasi Pengerjaan:
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            {[
                              { label: '24 Jam', minutes: 1440 },
                              { label: '48 Jam (2 Hari)', minutes: 2880 },
                              { label: '3 Hari', minutes: 4320 },
                              { label: '7 Hari', minutes: 10080 },
                            ].map((d) => (
                              <button
                                key={d.label}
                                type="button"
                                onClick={() => {
                                  setDurationMinutes(d.minutes);
                                  clearFieldError('durationMinutes');
                                }}
                                className={`py-2 px-2 text-center rounded-xl border text-xs font-semibold transition-all ${
                                  durationMinutes === d.minutes
                                    ? 'bg-cyan-600 dark:bg-cyan-500 text-white border-transparent shadow-xs'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                              >
                                {d.label}
                              </button>
                            ))}
                          </div>
                          <div className="flex items-center gap-3 pt-1">
                            <span className="text-xs text-slate-500 dark:text-slate-400">Atau kustom (menit):</span>
                            <input
                              type="number"
                              min={60}
                              step={60}
                              placeholder="1440"
                              value={durationMinutes}
                              onChange={(e) => {
                                setDurationMinutes(e.target.value === '' ? '' : Number(e.target.value));
                                clearFieldError('durationMinutes');
                              }}
                              className="w-32 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-slate-900 dark:text-white"
                            />
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              ({durationMinutes ? Math.round(Number(durationMinutes) / 60) : 0} Jam pengerjaan)
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-2">
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                            Tentukan Batas Tanggal & Waktu (WIB):
                          </label>
                          <input
                            type="datetime-local"
                            value={fixedDeadline}
                            onChange={(e) => {
                              setFixedDeadline(e.target.value);
                              clearFieldError('fixedDeadline');
                            }}
                            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-slate-900 dark:text-white"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 5: SYARAT & PRATINJAU TERAKHIR */}
                {currentStep === 5 && (
                  <div className="space-y-6 animate-in fade-in-50 duration-200">
                    <div>
                      <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-cyan-500" />
                        <span>Pratinjau Kartu Bounty (Live Sync)</span>
                      </h3>
                      <div className="max-w-md">
                        <BountyCard task={previewTask} userIsApproved={true} />
                      </div>
                    </div>

                    {/* Status Kelengkapan Form Sebelum Terbit */}
                    {!isStep5Complete() ? (
                      <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs space-y-2.5">
                        <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>Formulir Belum Lengkap</span>
                        </div>
                        <p className="text-[11px] text-amber-800 dark:text-amber-300">
                          Task belum dapat diterbitkan. Mohon lengkapi bagian-bagian berikut terlebih dahulu:
                        </p>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {!isStep1Complete() && (
                            <button
                              type="button"
                              onClick={() => setCurrentStep(1)}
                              className="px-3 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-bold text-[11px] hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors flex items-center gap-1"
                            >
                              <span>Langkah 1: Informasi Pokok</span>
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          )}
                          {!isStep2Complete() && (
                            <button
                              type="button"
                              onClick={() => setCurrentStep(2)}
                              className="px-3 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-bold text-[11px] hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors flex items-center gap-1"
                            >
                              <span>Langkah 2: Kriteria Penerimaan</span>
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          )}
                          {!isStep3Complete() && (
                            <button
                              type="button"
                              onClick={() => setCurrentStep(3)}
                              className="px-3 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-bold text-[11px] hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors flex items-center gap-1"
                            >
                              <span>Langkah 3: Mode & Skill</span>
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          )}
                          {!isStep4Complete() && (
                            <button
                              type="button"
                              onClick={() => setCurrentStep(4)}
                              className="px-3 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-bold text-[11px] hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors flex items-center gap-1"
                            >
                              <span>Langkah 4: Bounty & Waktu</span>
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-xs flex items-center gap-2.5 text-emerald-900 dark:text-emerald-200">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="font-semibold">Seluruh tahapan formulir telah terisi lengkap. Task siap diterbitkan!</span>
                      </div>
                    )}

                    {/* Collapsible Terms */}
                    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-950/30">
                      <button
                        type="button"
                        onClick={() => setIsTermsExpanded(!isTermsExpanded)}
                        className="w-full p-4 text-left flex items-center justify-between gap-3 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Shield className="h-4 w-4 text-sky-500" />
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              Syarat & Ketentuan Task (Snapshot v1)
                            </span>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {isTermsExpanded ? 'Tutup rincian klausa' : 'Klik untuk melihat atau mengubah klausa syarat baku'}
                            </p>
                          </div>
                        </div>
                        {isTermsExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                      </button>

                      {isTermsExpanded && (
                        <div className="p-4 pt-0 border-t border-slate-200/60 dark:border-slate-800">
                          <textarea
                            rows={5}
                            value={termsContent}
                            onChange={(e) => setTermsContent(e.target.value)}
                            className="w-full mt-2 p-3 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 leading-relaxed"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Navigation Bar (Persis seperti wireframe: Tombol Kembali di kiri & Lanjut/Submit di kanan) */}
              <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-4 mt-auto">
                <button
                  type="button"
                  disabled={currentStep === 1}
                  onClick={handlePrevStep}
                  className={`h-11 px-5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center gap-2 transition-all ${
                    currentStep === 1
                      ? 'opacity-30 cursor-not-allowed bg-transparent text-slate-400'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs active:scale-[0.98]'
                  }`}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Sebelumnya</span>
                </button>

                {currentStep < STEPS.length ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="h-11 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white font-bold text-xs shadow-md shadow-slate-900/10 active:scale-[0.98] transition-all flex items-center gap-2"
                  >
                    <span>Lanjut: {STEPS[currentStep].title}</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleSubmit('DRAFT')}
                      className="h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5"
                    >
                      {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      <span>Simpan Draf</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting || !isStep5Complete()}
                      onClick={() => handleSubmit('OPEN')}
                      className={`h-11 px-6 rounded-xl font-bold text-xs shadow-md active:scale-[0.98] transition-all flex items-center gap-2 ${
                        !isStep5Complete()
                          ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed opacity-60 shadow-none'
                          : 'bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-white shadow-cyan-500/20'
                      }`}
                      title={!isStep5Complete() ? 'Lengkapi semua langkah formulir terlebih dahulu' : 'Terbitkan Task Sekarang'}
                    >
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 fill-current" />}
                      <span>Terbitkan Task Sekarang</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
