import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sparkles, 
  Scale, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Flame, 
  Activity, 
  ShieldCheck, 
  Droplets, 
  Utensils 
} from 'lucide-react';
import { UserProfile } from '../types';
import { saveUserProfile } from '../utils/profileStorage';

interface PreSessionOnboardingModalProps {
  isOpen: boolean;
  userProfile: UserProfile;
  onClose: () => void;
  onComplete: (updatedProfile: UserProfile) => void;
}

export const PreSessionOnboardingModal: React.FC<PreSessionOnboardingModalProps> = ({
  isOpen,
  userProfile,
  onClose,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Question 1: Age Category
  const [ageCategory, setAgeCategory] = useState<'18-25' | '26-40' | '41-60' | '60+'>(
    userProfile.ageCategory || '26-40'
  );

  // Question 2: Yoga Experience
  const [experienceLevel, setExperienceLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>(
    userProfile.experienceLevel || 'Beginner'
  );

  // Question 3: Biometrics for in-page BMI calculation
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [weightKg, setWeightKg] = useState<number>(userProfile.bmiData?.weightKg || 65);
  const [heightCm, setHeightCm] = useState<number>(userProfile.bmiData?.heightCm || 170);
  const [dietaryPreference, setDietaryPreference] = useState<string>(
    userProfile.bmiData?.dietaryPreference || 'Sattvic (Ayurvedic Plant-Based)'
  );

  // Escape key close listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Real-time BMI calculation in the question page
  const heightM = heightCm / 100;
  const bmiValue = Number((weightKg / (heightM * heightM)).toFixed(1));
  const weightLbs = Math.round(weightKg * 2.20462);
  const heightFeet = Math.floor(heightCm / 30.48);
  const heightInches = Math.round((heightCm % 30.48) / 2.54);

  let bmiCategory = 'Normal (Optimal)';
  let bmiEmoji = '🌟';
  let bmiColor = 'text-emerald-700 bg-emerald-50 border-emerald-300';
  let bmiAdvice = 'Ideal joint mobility & spine alignment.';
  let estCalories = 2000;

  if (bmiValue < 18.5) {
    bmiCategory = 'Underweight (Lean)';
    bmiEmoji = '🥗';
    bmiColor = 'text-blue-700 bg-blue-50 border-blue-300';
    bmiAdvice = 'Nourishing Sattvic diet & restorative poses.';
    estCalories = 2150;
  } else if (bmiValue < 24.9) {
    bmiCategory = 'Normal (Optimal)';
    bmiEmoji = '🌟';
    bmiColor = 'text-emerald-700 bg-emerald-50 border-emerald-300';
    bmiAdvice = 'Ideal joint mobility & spine balance.';
    estCalories = 2000;
  } else if (bmiValue < 29.9) {
    bmiCategory = 'Overweight (Stamina)';
    bmiEmoji = '🥑';
    bmiColor = 'text-amber-800 bg-amber-50 border-amber-300';
    bmiAdvice = 'Active standing poses to boost metabolism.';
    estCalories = 1850;
  } else {
    bmiCategory = 'Obesity (Restorative)';
    bmiEmoji = '🌿';
    bmiColor = 'text-rose-800 bg-rose-50 border-rose-300';
    bmiAdvice = 'Low-impact alignment & cooling breaths.';
    estCalories = 1750;
  }

  const handleFinish = () => {
    const updatedProfile: UserProfile = {
      ...userProfile,
      hasCompletedOnboarding: true,
      has_completed_onboarding: true,
      ageCategory,
      age_category: ageCategory,
      experienceLevel,
      experience_level: experienceLevel,
      bmiData: {
        weightKg,
        weight_kg: weightKg,
        heightCm,
        height_cm: heightCm,
        age: ageCategory === '18-25' ? 22 : ageCategory === '26-40' ? 32 : ageCategory === '41-60' ? 50 : 65,
        gender: 'Not specified',
        bmiValue,
        bmi_value: bmiValue,
        bmiCategory,
        bmi_category: bmiCategory,
        dietaryPreference,
        dietary_preference: dietaryPreference,
        calculatedAt: new Date().toLocaleDateString(),
        calculated_at: new Date().toLocaleDateString(),
      },
    };

    saveUserProfile(updatedProfile);
    onComplete(updatedProfile);
  };

  return (
    <div 
      id="onboarding-modal-overlay" 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-sm overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.16 }}
        className="bg-white rounded-2xl max-w-sm sm:max-w-md w-full p-4 sm:p-5 shadow-xl border border-stone-200 relative my-auto max-h-[92vh] flex flex-col justify-between overflow-y-auto"
      >
        {/* Close Button */}
        <button
          id="close-onboarding-btn"
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 transition flex items-center justify-center cursor-pointer border border-stone-200 shadow-2xs z-10"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Modal Header & Progress Indicator */}
        <div className="text-center mb-3 pr-4">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>AI Personalization</span>
          </div>
          <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900 leading-tight">
            Tailor Your Practice & Biometrics
          </h3>

          {/* Stepper Dots */}
          <div className="flex items-center justify-center gap-1.5 mt-2">
            {[1, 2, 3].map((step) => (
              <button
                key={step}
                type="button"
                onClick={() => setCurrentStep(step as 1 | 2 | 3)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  currentStep === step
                    ? 'w-6 bg-emerald-600'
                    : currentStep > step
                    ? 'w-3 bg-emerald-300'
                    : 'w-3 bg-stone-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Dynamic Questionnaire Steps */}
        <div className="min-h-[220px] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {/* Step 1: Age Category */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.15 }}
                className="space-y-2.5"
              >
                <div className="text-center mb-1">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Step 1 of 3</span>
                  <h4 className="text-sm font-bold text-stone-900 mt-0.5">
                    What is your age category?
                  </h4>
                  <p className="text-[10px] text-stone-500">
                    Calibrates spinal rotation limits & joint safety thresholds.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Option 1: 18-25 */}
                  <button
                    type="button"
                    onClick={() => setAgeCategory('18-25')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 relative ${
                      ageCategory === '18-25'
                        ? 'border-emerald-600 bg-emerald-50/80 shadow-2xs ring-1 ring-emerald-500'
                        : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/60'
                    }`}
                  >
                    <div className="text-xl w-8 h-8 rounded-lg bg-white shadow-2xs border border-stone-200 flex items-center justify-center shrink-0">
                      🌱
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-stone-900 text-[11px] truncate">18–25 Yrs</div>
                      <p className="text-[9px] text-stone-500 truncate">Agile & dynamic</p>
                    </div>
                  </button>

                  {/* Option 2: 26-40 */}
                  <button
                    type="button"
                    onClick={() => setAgeCategory('26-40')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 relative ${
                      ageCategory === '26-40'
                        ? 'border-emerald-600 bg-emerald-50/80 shadow-2xs ring-1 ring-emerald-500'
                        : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/60'
                    }`}
                  >
                    <div className="text-xl w-8 h-8 rounded-lg bg-white shadow-2xs border border-stone-200 flex items-center justify-center shrink-0">
                      ⚡
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-stone-900 text-[11px] truncate">26–40 Yrs</div>
                      <p className="text-[9px] text-stone-500 truncate">Peak stamina</p>
                    </div>
                  </button>

                  {/* Option 3: 41-60 */}
                  <button
                    type="button"
                    onClick={() => setAgeCategory('41-60')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 relative ${
                      ageCategory === '41-60'
                        ? 'border-emerald-600 bg-emerald-50/80 shadow-2xs ring-1 ring-emerald-500'
                        : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/60'
                    }`}
                  >
                    <div className="text-xl w-8 h-8 rounded-lg bg-white shadow-2xs border border-stone-200 flex items-center justify-center shrink-0">
                      🌿
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-stone-900 text-[11px] truncate">41–60 Yrs</div>
                      <p className="text-[9px] text-stone-500 truncate">Spine harmony</p>
                    </div>
                  </button>

                  {/* Option 4: 60+ */}
                  <button
                    type="button"
                    onClick={() => setAgeCategory('60+')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 relative ${
                      ageCategory === '60+'
                        ? 'border-emerald-600 bg-emerald-50/80 shadow-2xs ring-1 ring-emerald-500'
                        : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/60'
                    }`}
                  >
                    <div className="text-xl w-8 h-8 rounded-lg bg-white shadow-2xs border border-stone-200 flex items-center justify-center shrink-0">
                      🕊️
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-stone-900 text-[11px] truncate">60+ Yrs</div>
                      <p className="text-[9px] text-stone-500 truncate">Joint mobility</p>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Yoga Experience Level */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.15 }}
                className="space-y-2"
              >
                <div className="text-center mb-1">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Step 2 of 3</span>
                  <h4 className="text-sm font-bold text-stone-900 mt-0.5">
                    How much experience do you have?
                  </h4>
                  <p className="text-[10px] text-stone-500">
                    Sets real-time audio guidance speed and verbosity.
                  </p>
                </div>

                <div className="space-y-1.5">
                  {/* Beginner */}
                  <button
                    type="button"
                    onClick={() => setExperienceLevel('Beginner')}
                    className={`w-full p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2.5 relative ${
                      experienceLevel === 'Beginner'
                        ? 'border-emerald-600 bg-emerald-50/80 shadow-2xs ring-1 ring-emerald-500'
                        : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/60'
                    }`}
                  >
                    <div className="text-xl w-8 h-8 rounded-lg bg-white shadow-2xs border border-stone-200 flex items-center justify-center shrink-0">
                      🐣
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-stone-900 text-xs flex items-center justify-between">
                        <span>Beginner</span>
                        <span className="text-[9px] text-emerald-700 font-semibold">Foundational</span>
                      </div>
                      <p className="text-[10px] text-stone-500 truncate">
                        Detailed cues, gentle tolerances, step-by-step guidance.
                      </p>
                    </div>
                  </button>

                  {/* Intermediate */}
                  <button
                    type="button"
                    onClick={() => setExperienceLevel('Intermediate')}
                    className={`w-full p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2.5 relative ${
                      experienceLevel === 'Intermediate'
                        ? 'border-emerald-600 bg-emerald-50/80 shadow-2xs ring-1 ring-emerald-500'
                        : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/60'
                    }`}
                  >
                    <div className="text-xl w-8 h-8 rounded-lg bg-white shadow-2xs border border-stone-200 flex items-center justify-center shrink-0">
                      🥋
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-stone-900 text-xs flex items-center justify-between">
                        <span>Intermediate</span>
                        <span className="text-[9px] text-teal-700 font-semibold">Refining Form</span>
                      </div>
                      <p className="text-[10px] text-stone-500 truncate">
                        Steady flows, focus on pelvic level and hold endurance.
                      </p>
                    </div>
                  </button>

                  {/* Advanced */}
                  <button
                    type="button"
                    onClick={() => setExperienceLevel('Advanced')}
                    className={`w-full p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2.5 relative ${
                      experienceLevel === 'Advanced'
                        ? 'border-emerald-600 bg-emerald-50/80 shadow-2xs ring-1 ring-emerald-500'
                        : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/60'
                    }`}
                  >
                    <div className="text-xl w-8 h-8 rounded-lg bg-white shadow-2xs border border-stone-200 flex items-center justify-center shrink-0">
                      🧘
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-stone-900 text-xs flex items-center justify-between">
                        <span>Advanced</span>
                        <span className="text-[9px] text-purple-700 font-semibold">Precision Flow</span>
                      </div>
                      <p className="text-[10px] text-stone-500 truncate">
                        Strict biomechanical grading & pranayama pacing.
                      </p>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Biometrics & In-Page BMI Calculation */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.15 }}
                className="space-y-2"
              >
                <div className="text-center mb-0.5">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Step 3 of 3</span>
                  <h4 className="text-sm font-bold text-stone-900 mt-0.5">
                    Height & Weight (Calculated BMI)
                  </h4>
                </div>

                {/* Unit Switcher */}
                <div className="flex justify-center">
                  <div className="flex bg-stone-100 p-0.5 rounded-lg text-[10px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setUnitSystem('metric')}
                      className={`px-2.5 py-0.5 rounded-md transition cursor-pointer ${
                        unitSystem === 'metric' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-500'
                      }`}
                    >
                      Metric (kg / cm)
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnitSystem('imperial')}
                      className={`px-2.5 py-0.5 rounded-md transition cursor-pointer ${
                        unitSystem === 'imperial' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-500'
                      }`}
                    >
                      Imperial (lbs / ft)
                    </button>
                  </div>
                </div>

                {/* Controls Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Weight */}
                  <div className="bg-stone-50 p-2 rounded-xl border border-stone-200">
                    <div className="flex justify-between items-center text-[10px] mb-0.5">
                      <span className="font-semibold text-stone-600">Weight</span>
                      <span className="font-bold text-emerald-700">
                        {unitSystem === 'metric' ? `${weightKg} kg` : `${weightLbs} lbs`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="35"
                      max="140"
                      value={weightKg}
                      onChange={(e) => setWeightKg(Number(e.target.value))}
                      className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                  </div>

                  {/* Height */}
                  <div className="bg-stone-50 p-2 rounded-xl border border-stone-200">
                    <div className="flex justify-between items-center text-[10px] mb-0.5">
                      <span className="font-semibold text-stone-600">Height</span>
                      <span className="font-bold text-emerald-700">
                        {unitSystem === 'metric' ? `${heightCm} cm` : `${heightFeet}' ${heightInches}"`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="135"
                      max="210"
                      value={heightCm}
                      onChange={(e) => setHeightCm(Number(e.target.value))}
                      className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                  </div>
                </div>

                {/* Live BMI Calculation Box In Question Page */}
                <div className="bg-white rounded-xl p-2.5 border border-stone-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl">{bmiEmoji}</span>
                      <div>
                        <span className="text-[9px] text-stone-400 uppercase font-bold tracking-wider">BMI</span>
                        <div className="text-base font-black text-stone-900 leading-none">{bmiValue}</div>
                      </div>
                    </div>

                    <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${bmiColor}`}>
                      {bmiCategory}
                    </div>
                  </div>

                  {/* Visual gauge */}
                  <div className="w-full h-1.5 rounded-full bg-gradient-to-r from-blue-400 via-emerald-400 via-amber-400 to-rose-400 relative overflow-hidden">
                    <div 
                      className="absolute top-0 bottom-0 w-1.5 bg-stone-900 shadow transform -translate-x-1/2"
                      style={{
                        left: `${Math.min(100, Math.max(0, ((bmiValue - 15) / 25) * 100))}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-stone-500 pt-0.5 border-t border-stone-100">
                    <span>Est. Target: <strong>~{estCalories} kcal/day</strong></span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                      <Droplets className="w-2.5 h-2.5" /> 2.5L Water
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="pt-3 mt-1 border-t border-stone-100 flex items-center justify-between gap-2">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3)}
                className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-2.5 py-1.5 rounded-lg text-stone-400 hover:text-stone-600 text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3)}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer ml-auto"
              >
                Next
                <ArrowRight className="w-3 h-3" />
              </button>
            ) : (
              <button
                id="finish-onboarding-btn"
                type="button"
                onClick={handleFinish}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer ml-auto"
              >
                <Sparkles className="w-3 h-3 text-emerald-300" />
                Save & Enter
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
