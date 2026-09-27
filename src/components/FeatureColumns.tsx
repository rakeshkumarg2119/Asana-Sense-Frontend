import React from 'react';
import { 
  Eye, 
  Mic, 
  ShieldCheck, 
  Utensils, 
  Timer, 
  Lock, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface FeatureColumnsProps {
  onOpenLivePractice: () => void;
  onOpenAuth: () => void;
  onOpenVoiceGuide: () => void;
}

export const FeatureColumns: React.FC<FeatureColumnsProps> = ({
  onOpenLivePractice,
  onOpenAuth,
  onOpenVoiceGuide,
}) => {
  return (
    <section id="features-section" className="py-16 px-6 sm:px-10 lg:px-14 max-w-[1720px] w-full mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          Core Pillars of ASANA - SENSE
        </div>
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 tracking-tight">
          Next-Generation Yoga Intelligence & Biomechanics
        </h2>
        <p className="mt-3 text-stone-600 text-base sm:text-lg leading-relaxed">
          Real-time posture prediction, voice-guided asana execution, privacy-first camera processing, and holistic Ayurvedic nutrition tailored to your Body Mass Index.
        </p>
      </div>

      {/* Primary Privacy & Security Promise Banner */}
      <div id="privacy-assurance-promise-banner" className="mb-12 bg-gradient-to-r from-emerald-900 via-teal-900 to-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-700/40 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 text-emerald-300">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Zero-Storage Privacy Promise</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-400/20 text-emerald-200">100% In-Memory</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mt-1 text-stone-50">
                Your Camera Video and Voice Are Never Recorded or Stored
              </h3>
              <p className="text-stone-300 text-sm mt-1 max-w-3xl leading-relaxed">
                ASANA - SENSE is built upon strict privacy architecture. All video frames and audio inputs are processed instantaneously in volatile browser memory strictly for real-time skeletal joint prediction and voice commands. No recordings, images, or audio snippets ever touch persistent storage or external trackers.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-stretch md:self-auto">
            <div className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-emerald-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-300" />
              AES-256 Profile Encryption
            </div>
          </div>
        </div>
      </div>

      {/* Feature Grid Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Feature 1: Yoga Posture Correction (Manual + Voice Control) */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
          <div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <Eye className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Dual Control Mode</span>
              <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-600 text-[10px] font-medium flex items-center gap-1">
                <Mic className="w-3 h-3 text-emerald-600" /> Voice + Touch
              </span>
            </div>
            <h3 className="text-lg font-bold text-stone-900">
              Posture Correction & Voice Control
            </h3>
            <p className="text-stone-600 text-sm mt-2 leading-relaxed">
              Seamlessly select postures manually or speak naturally (e.g. <em>"Select Tree Pose"</em>, <em>"Next Pose"</em>, <em>"Analyze Posture"</em>). The AI checks joint alignment and speaks real-time corrective cues.
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between">
            <button
              onClick={onOpenLivePractice}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              Launch Live Vision Session <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Feature 2: Wrong Posture Impact & Detailed Anatomy */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
          <div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Injury Prevention</span>
              <span className="px-2 py-0.5 rounded bg-amber-100/60 text-amber-800 text-[10px] font-medium">Contraindications</span>
            </div>
            <h3 className="text-lg font-bold text-stone-900">
              Benefits & Wrong Posture Impacts
            </h3>
            <p className="text-stone-600 text-sm mt-2 leading-relaxed">
              Every pose provides anatomical benefits paired with explicit warnings on wrong posture impact—such as pelvic twist in Warrior III, lumbar strain in Cobra, or neck compression during inversions.
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs text-stone-500">Includes 5 Core + 3 Restorative asanas</span>
          </div>
        </div>

        {/* Feature 3: BMI & Custom Yogic Diet Plan */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
          <div>
            <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <Utensils className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Ayurvedic Nutrition</span>
              <span className="px-2 py-0.5 rounded bg-teal-100/60 text-teal-800 text-[10px] font-medium">BMI Integration</span>
            </div>
            <h3 className="text-lg font-bold text-stone-900">
              Yogic Diet Plan & BMI Analysis
            </h3>
            <p className="text-stone-600 text-sm mt-2 leading-relaxed">
              Calculates your precise Body Mass Index during your pre-session setup and automatically generates an individualized Sattvic nutrition plan—complete with optimal caloric intake, hydration targets, and meal timing (Breakfast, Lunch, Pre/Post-Practice Fuel, and Dinner) to support muscle recovery and spinal flexibility.
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-teal-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              Calculated in Pre-Session Setup
            </span>
          </div>
        </div>

        {/* Feature 4: Live Timed Sessions & Post-Session Comprehensive Reports */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
          <div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <Timer className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Session Intelligence</span>
              <span className="px-2 py-0.5 rounded bg-blue-100/60 text-blue-800 text-[10px] font-medium">Hold Timers</span>
            </div>
            <h3 className="text-lg font-bold text-stone-900">
              Pose Timing & Session Reports
            </h3>
            <p className="text-stone-600 text-sm mt-2 leading-relaxed">
              Entire practice happens in a live structured session. Each pose hold duration is recorded down to the second, generating a comprehensive master report with stability scores and next recommended asanas.
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs text-stone-500">Auto-evaluates stability & holds</span>
          </div>
        </div>

        {/* Feature 5: Account-Activated Sessions */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
          <div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Session Activation</span>
              <span className="px-2 py-0.5 rounded bg-indigo-100/60 text-indigo-800 text-[10px] font-medium">Instant Onboarding</span>
            </div>
            <h3 className="text-lg font-bold text-stone-900">
              Account-Linked Session Engine
            </h3>
            <p className="text-stone-600 text-sm mt-2 leading-relaxed">
              Sessions are activated when an account is created or signed in. Seamlessly track personal progress, compare flexibility indices across weeks, and maintain practice continuity.
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between">
            <button
              onClick={onOpenAuth}
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              Sign In / Sign Up to Activate <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Feature 6: Encrypted Private Cloud Profile */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
          <div>
            <div className="w-11 h-11 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <Lock className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-600">Client-Side Vault</span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-medium">End-to-End Encrypted</span>
            </div>
            <h3 className="text-lg font-bold text-stone-900">
              Encrypted Private Cloud Profile
            </h3>
            <p className="text-stone-600 text-sm mt-2 leading-relaxed">
              All personal metrics, BMI logs, and posture session histories are protected with client-side cryptographic hashing. Your wellness records belong solely to you.
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs text-stone-500">Zero data monetisation</span>
          </div>
        </div>
      </div>
    </section>
  );
};
