import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  FileText, 
  X, 
  Sparkles, 
  Camera, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Scale,
  Award,
  Download
} from 'lucide-react';
import { AsanaSenseLogo } from './AsanaSenseLogo';

interface PrivacyTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'privacy' | 'terms' | 'disclaimer';
}

export const PrivacyTermsModal: React.FC<PrivacyTermsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'privacy',
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'disclaimer'>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-6 max-h-[90vh] flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white flex items-center justify-between shrink-0 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg leading-tight">Privacy Policy & Terms</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Academic Compliance
                </span>
              </div>
              <p className="text-xs text-stone-300">AsanaSense AI Vision & Biomechanics Governance</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-6 pt-3 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`pb-3 px-4 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'privacy'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Privacy & Zero-Storage</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`pb-3 px-4 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'terms'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms of Service</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('disclaimer')}
            className={`pb-3 px-4 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'disclaimer'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Biomechanics & Health Notice</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-stone-700 text-xs leading-relaxed">
          {activeTab === 'privacy' && (
            <div className="space-y-5">
              {/* Highlight Card: Zero-Storage Vision */}
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <span>1. Zero-Video Storage Guarantee (Core Privacy Pillar)</span>
                </div>
                <p className="text-stone-600">
                  AsanaSense processes all live video feeds strictly inside ephemeral, volatile browser RAM and client-side MediaPipe runtime memory. <strong>No camera frames, raw video streams, or facial likenesses are ever written to disk, stored in databases, or transmitted to third-party tracking services.</strong>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <div className="bg-white p-2 rounded-xl border border-emerald-100 flex items-center gap-2 text-[11px] font-medium text-emerald-950">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>In-Memory Only</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-emerald-100 flex items-center gap-2 text-[11px] font-medium text-emerald-950">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>No Cloud Video Uploads</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-emerald-100 flex items-center gap-2 text-[11px] font-medium text-emerald-950">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Zero Facial Recognition</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Account Data & Encryption */}
              <div className="space-y-2">
                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-stone-700" />
                  <span>2. Practitioner Account & Telemetry Data</span>
                </h4>
                <p>
                  We store only minimal essential account data required for session history and authentication:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-stone-600">
                  <li><strong>Account Credentials:</strong> Full name/handle, email address, and cryptographically hashed passwords using industry-standard <code className="font-mono bg-stone-100 px-1 py-0.5 rounded text-emerald-700">bcrypt</code> hashing.</li>
                  <li><strong>Posture Session History:</strong> Joint angle accuracy scores, practice duration, timestamps, and BMI preferences to calculate personalized diet recommendations.</li>
                  <li><strong>Telemetry Privacy:</strong> Telemetry records are encrypted and accessible only through authorized JSON Web Token (JWT) credentials.</li>
                </ul>
              </div>

              {/* Section 3: Voice Recognition Processing */}
              <div className="space-y-2">
                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>3. Voice Command Audio Processing</span>
                </h4>
                <p>
                  Voice control commands (such as <em>&quot;Next Pose&quot;</em> or <em>&quot;Pause Session&quot;</em>) are processed via the browser&apos;s Web Speech API in real-time. No audio recordings are retained after command classification.
                </p>
              </div>

              {/* Section 4: Data Retention & Account Deletion */}
              <div className="space-y-2">
                <h4 className="font-bold text-stone-900 text-sm">4. Right to Deletion & Data Ownership</h4>
                <p>
                  Practitioners maintain complete ownership of their data. You may request password resets, export your session logs, or delete your entire account and associated posture telemetry directly from the Profile Settings tab.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-700" />
                  <span>Academic Engineering Project Disclosure</span>
                </h4>
                <p className="text-stone-600">
                  AsanaSense is engineered as an undergraduate/postgraduate Computer Science & Engineering capstone project demonstrating real-time computer vision, MediaPipe joint angle trigonometry, and FastAPI Python backend integration.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-stone-900 text-sm">1. Acceptable Usage</h4>
                <p className="text-stone-600">
                  Users agree to utilize this system for educational, personal wellness, and demonstration purposes in a safe physical environment free of obstructions.
                </p>

                <h4 className="font-bold text-stone-900 text-sm">2. Account Responsibility</h4>
                <p className="text-stone-600">
                  Users are responsible for maintaining the confidentiality of their login credentials and passkeys. OTP email verification is required during signup to safeguard account authenticity.
                </p>

                <h4 className="font-bold text-stone-900 text-sm">3. Intellectual Property</h4>
                <p className="text-stone-600">
                  The software algorithms, anatomical landmark classification logic, and user interface designs are open for academic evaluation under the Apache-2.0 open-source license.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'disclaimer' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Important Medical & Physical Safety Disclaimer</span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed">
                  AsanaSense provides computer-vision posture estimations and alignment scores for <strong>guidance, training, and educational wellness purposes only</strong>. It does not constitute medical diagnostics, clinical orthopedic evaluation, or physical therapy treatment.
                </p>
              </div>

              <div className="space-y-3 text-stone-600">
                <h4 className="font-bold text-stone-900 text-sm">1. Physical Fitness & Personal Judgment</h4>
                <p>
                  Always exercise caution and listen to your body while practicing yoga asanas. If you feel pain, dizziness, or strain, stop the exercise immediately. Consult a licensed physician before starting any intense physical regimen.
                </p>

                <h4 className="font-bold text-stone-900 text-sm">2. Sensor & Lighting Limitations</h4>
                <p>
                  AI posture accuracy can vary based on ambient lighting, camera angle, clothing contrast, and distance from the lens. Ensure full-body visibility in the camera frame for optimal biomechanical feedback.
                </p>

                <h4 className="font-bold text-stone-900 text-sm">3. BMI & Nutritional Recommendations</h4>
                <p>
                  Dietary tips, calorie estimates, and yogic food classifications are general recommendations based on standard Body Mass Index formulas and should not replace clinical dietary prescriptions.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-stone-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Last Updated: Academic Year {new Date().getFullYear()} • Verified Zero-Data Leakage Architecture</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition shadow-sm cursor-pointer"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
