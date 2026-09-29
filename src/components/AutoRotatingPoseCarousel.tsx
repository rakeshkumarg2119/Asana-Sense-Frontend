import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';

export interface AutoPoseItem {
  id: string;
  name: string;
  sanskritName: string;
  imageUrl: string;
  accuracyScore: number;
  accuracyCategory: string;
  accuracyBarWidth: string;
  coachingTip: string;
  topTag: string;
  bottomTag: string;
  // Solid white MediaPipe skeleton lines connecting key landmarks
  jointLines: Array<{ x1: string; y1: string; x2: string; y2: string }>;
  // MediaPipe Landmark keypoints (Nose, Shoulders, Elbows, Wrists, Hips, Knees, Ankles)
  jointPoints: Array<{ cx: string; cy: string; label?: string }>;
}

export const AUTO_POSES: AutoPoseItem[] = [
  {
    id: 'chair-pose',
    name: 'Chair Pose',
    sanskritName: 'Utkatasana',
    imageUrl: 'https://res.cloudinary.com/yhj7u0bn/image/upload/v1789033782/Chair_pose.png',
    accuracyScore: 93.4,
    accuracyCategory: 'Optimal',
    accuracyBarWidth: '93.4%',
    coachingTip: 'Sink weight into heels; keep spine elongated with arms reaching overhead alongside ears.',
    topTag: 'Spine: Neutral & Long',
    bottomTag: 'Knees: Behind Toes',
    jointLines: [
      // MediaPipe Upper Body / Arms Overhead alongside ears
      { x1: '40%', y1: '14%', x2: '47%', y2: '24%' }, // L Fingertips to L Elbow
      { x1: '47%', y1: '24%', x2: '54%', y2: '34%' }, // L Elbow to L Shoulder
      { x1: '44%', y1: '14%', x2: '51%', y2: '24%' }, // R Fingertips to R Elbow
      { x1: '51%', y1: '24%', x2: '58%', y2: '34%' }, // R Elbow to R Shoulder
      { x1: '54%', y1: '34%', x2: '58%', y2: '34%' }, // Shoulder Line
      // MediaPipe Torso (Shoulders to Hips)
      { x1: '54%', y1: '34%', x2: '60%', y2: '56%' }, // L Spine/Torso
      { x1: '58%', y1: '34%', x2: '64%', y2: '56%' }, // R Spine/Torso
      { x1: '60%', y1: '56%', x2: '64%', y2: '56%' }, // Hip Line
      // MediaPipe Thighs (Hips to Knees)
      { x1: '60%', y1: '56%', x2: '44%', y2: '67%' }, // L Hip to L Knee
      { x1: '64%', y1: '56%', x2: '48%', y2: '67%' }, // R Hip to R Knee
      // MediaPipe Shins (Knees to Ankles)
      { x1: '44%', y1: '67%', x2: '47%', y2: '90%' }, // L Knee to L Ankle
      { x1: '48%', y1: '67%', x2: '51%', y2: '90%' }, // R Knee to R Ankle
    ],
    jointPoints: [
      { cx: '42%', cy: '14%', label: 'Overhead Reach' },
      { cx: '50%', cy: '26%', label: 'Drishti / Gaze' },
      { cx: '56%', cy: '34%', label: 'Shoulders Down' },
      { cx: '62%', cy: '56%', label: 'Pelvis Tucked' },
      { cx: '46%', cy: '67%', label: 'Knee Depth' },
      { cx: '49%', cy: '90%', label: 'Weight in Heels' },
    ],
  },
  {
    id: 'warrior-3',
    name: 'Warrior III',
    sanskritName: 'Virabhadrasana III',
    imageUrl: 'https://res.cloudinary.com/yhj7u0bn/image/upload/v1789033718/Warrior-3-Arms-Forward-1200x800.jpg',
    accuracyScore: 91.2,
    accuracyCategory: 'Optimal',
    accuracyBarWidth: '91.2%',
    coachingTip: 'Form a continuous horizontal line from fingertips to flexed back heel; keep pelvis squared to the floor.',
    topTag: 'Body: 180° T-Shape',
    bottomTag: 'Hips: Squared to Mat',
    jointLines: [
      // MediaPipe Arms Forward alongside ears
      { x1: '12%', y1: '48%', x2: '24%', y2: '48%' }, // Fingertips to Wrists
      { x1: '24%', y1: '48%', x2: '35%', y2: '48%' }, // Wrists to Elbows
      { x1: '35%', y1: '48%', x2: '45%', y2: '48%' }, // Elbows to Shoulders
      // MediaPipe Torso (Shoulders to Pelvis/Hips)
      { x1: '45%', y1: '48%', x2: '58%', y2: '49%' }, // Spine / Torso horizontal
      // MediaPipe Standing Leg (Vertical Column with Microbend)
      { x1: '58%', y1: '49%', x2: '57%', y2: '70%' }, // Pelvis to Knee
      { x1: '57%', y1: '70%', x2: '56%', y2: '92%' }, // Knee to Ankle
      // MediaPipe Lifted Back Leg (Horizontal line to heel)
      { x1: '58%', y1: '49%', x2: '74%', y2: '48%' }, // Pelvis to Lifted Knee
      { x1: '74%', y1: '48%', x2: '90%', y2: '47%' }, // Lifted Knee to Flexed Heel
    ],
    jointPoints: [
      { cx: '12%', cy: '48%', label: 'Fingertips Reach' },
      { cx: '40%', cy: '45%', label: 'Neutral Gaze' },
      { cx: '45%', cy: '48%', label: 'Shoulders Flat' },
      { cx: '58%', cy: '49%', label: 'Pelvis Squared' },
      { cx: '57%', cy: '70%', label: 'Microbend Knee' },
      { cx: '56%', cy: '92%', label: 'Rooted Base' },
      { cx: '90%', cy: '47%', label: 'Back Heel Drive' },
    ],
  },
  {
    id: 'downward-dog',
    name: 'Downward Dog',
    sanskritName: 'Adho Mukha Svanasana',
    imageUrl: 'https://res.cloudinary.com/yhj7u0bn/image/upload/v1789019346/downdog.jpg',
    accuracyScore: 96.1,
    accuracyCategory: 'Optimal',
    accuracyBarWidth: '96.1%',
    coachingTip: 'Press palms flat into mat; lift sit bones skyward to lengthen spine.',
    topTag: 'Hips: Peak Inverted V',
    bottomTag: 'Wrists: Flat Pressed',
    jointLines: [
      // MediaPipe Arms & Spine (Wrists -> Shoulders -> Hips)
      { x1: '18%', y1: '84%', x2: '26%', y2: '70%' }, // Palms to Elbows
      { x1: '26%', y1: '70%', x2: '34%', y2: '58%' }, // Elbows to Shoulders
      { x1: '34%', y1: '58%', x2: '52%', y2: '26%' }, // Shoulders to Hips (Spine)
      // MediaPipe Legs (Hips -> Knees -> Ankles)
      { x1: '52%', y1: '26%', x2: '68%', y2: '56%' }, // Hips to Knees
      { x1: '68%', y1: '56%', x2: '82%', y2: '84%' }, // Knees to Heels
    ],
    jointPoints: [
      { cx: '52%', cy: '26%', label: 'Pelvis Apex' },
      { cx: '34%', cy: '58%', label: 'Shoulders' },
      { cx: '18%', cy: '84%', label: 'Palms Flat' },
      { cx: '82%', cy: '84%', label: 'Heels Rooted' },
    ],
  },
  {
    id: 'cobra-pose',
    name: 'Cobra Pose',
    sanskritName: 'Bhujangasana',
    imageUrl: 'https://res.cloudinary.com/yhj7u0bn/image/upload/v1789019345/cobro.avif',
    accuracyScore: 91.5,
    accuracyCategory: 'Optimal',
    accuracyBarWidth: '91.5%',
    coachingTip: 'Roll shoulders back away from ears; draw chest forward with soft elbows.',
    topTag: 'Chest: Lifted & Open',
    bottomTag: 'Elbows: Softly Tucked',
    jointLines: [
      // MediaPipe Head & Upper Spine
      { x1: '24%', y1: '26%', x2: '36%', y2: '42%' }, // Neck to Shoulders
      { x1: '36%', y1: '42%', x2: '62%', y2: '72%' }, // Shoulders to Pelvis/Hips
      // MediaPipe Arms Support
      { x1: '36%', y1: '42%', x2: '44%', y2: '60%' }, // Shoulder to Elbow
      { x1: '44%', y1: '60%', x2: '42%', y2: '76%' }, // Elbow to Hand Grounded
      // MediaPipe Lower Body Extended
      { x1: '62%', y1: '72%', x2: '78%', y2: '76%' }, // Hips to Knees
      { x1: '78%', y1: '76%', x2: '92%', y2: '80%' }, // Knees to Toes
    ],
    jointPoints: [
      { cx: '24%', cy: '26%', label: 'Cervical Curve' },
      { cx: '36%', cy: '42%', label: 'Shoulders Back' },
      { cx: '44%', cy: '60%', label: 'Soft Elbow' },
      { cx: '62%', cy: '72%', label: 'Pelvis Grounded' },
    ],
  },
  {
    id: 'triangle-pose',
    name: 'Triangle Pose',
    sanskritName: 'Trikonasana',
    imageUrl: 'https://res.cloudinary.com/yhj7u0bn/image/upload/v1789034482/1lFCiwdr0bqa_JDFaYD84M_TfvJ3RYy5mWpV0UfRTU7xWcEtRjbrG8vNowmL9pK1tWUVWng9jDML5TQJzC3i10hKS3JXMACiD_tV8sScPBGBF-Bhybv1Vw55Hvul60Z9pL09cCrP.jpg',
    accuracyScore: 87.6,
    accuracyCategory: 'Good Alignment',
    accuracyBarWidth: '87.6%',
    coachingTip: 'Spiral ribcage toward sky; maintain microbend in front knee to prevent hyperextension.',
    topTag: 'Chest: Rotated Skyward',
    bottomTag: 'Knees: Microbend Active',
    jointLines: [
      // MediaPipe Vertical Arm Line
      { x1: '48%', y1: '12%', x2: '40%', y2: '32%' }, // Top Wrist to Shoulder
      { x1: '40%', y1: '32%', x2: '32%', y2: '76%' }, // Shoulder to Lower Wrist
      // MediaPipe Torso & Spine
      { x1: '40%', y1: '32%', x2: '56%', y2: '46%' }, // Shoulders to Hips
      // MediaPipe Legs
      { x1: '56%', y1: '46%', x2: '38%', y2: '62%' }, // Front Hip to Knee
      { x1: '38%', y1: '62%', x2: '32%', y2: '86%' }, // Front Knee to Ankle
      { x1: '56%', y1: '46%', x2: '72%', y2: '66%' }, // Back Hip to Knee
      { x1: '72%', y1: '66%', x2: '84%', y2: '86%' }, // Back Knee to Ankle
    ],
    jointPoints: [
      { cx: '48%', cy: '12%', label: 'Sky Reach' },
      { cx: '40%', cy: '32%', label: 'Open Chest' },
      { cx: '38%', cy: '62%', label: 'Microbend Knee' },
      { cx: '32%', cy: '76%', label: 'Shin Anchor' },
    ],
  },
];

export const AutoRotatingPoseCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Automatic slide rotation slowed down to 7.0 seconds per pose for comfortable observation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % AUTO_POSES.length);
    }, 7000);

    return () => clearInterval(timer);
  }, []);

  const activePose = AUTO_POSES[currentIndex];

  return (
    <div className="relative bg-gradient-to-br from-stone-900 via-stone-950 to-emerald-950 rounded-3xl p-5 sm:p-6 text-white shadow-2xl border border-stone-800 flex flex-col justify-between overflow-hidden">
      
      {/* Top Header Badge */}
      <div className="flex items-center justify-between mb-3 z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-mono font-semibold text-emerald-300 uppercase tracking-wide">
            MEDIAPIPE POSE LANDMARKER • HUD
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-stone-800/90 text-stone-300 text-[10px] font-mono border border-stone-700">
          <Activity className="w-3 h-3 text-emerald-400 animate-spin" />
          <span>7s Auto Scan ({currentIndex + 1}/5)</span>
        </div>
      </div>

      {/* Main Full-Cover Stage Area (Fills 100% width & height without top/bottom/side gaps) */}
      <div className="relative h-64 sm:h-72 w-full bg-stone-950 rounded-2xl border-2 border-emerald-500/60 flex items-center justify-center overflow-hidden my-1.5 shadow-2xl">
        
        {/* Full-Stage Sliding Image Container */}
        <div className="relative w-full h-full">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              key={activePose.id}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 w-full h-full overflow-hidden"
            >
              {/* High-Resolution Yoga Image Covering 100% of Stage Space */}
              <img
                src={activePose.imageUrl}
                alt={activePose.name}
                className="w-full h-full object-cover object-center"
              />

              {/* Gradient Vignette Overlay for Crisp HUD Tag Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/20 to-stone-950/60" />

              {/* Pose Title Overlay */}
              <div className="absolute bottom-3 left-3.5 right-3.5 text-white z-20 flex justify-between items-end pointer-events-none">
                <div>
                  <p className="text-base font-bold text-white tracking-wide shadow-sm">{activePose.name}</p>
                  <p className="text-xs text-emerald-300 italic font-mono">{activePose.sanskritName}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 1. DYNAMIC TOP ALIGNMENT TAG */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`top-tag-${activePose.id}`}
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3 }}
            className="absolute top-3 left-3 z-10 bg-stone-950/90 border border-emerald-500/60 text-emerald-300 text-[11px] font-mono px-3 py-1.5 rounded-lg shadow-xl backdrop-blur-md flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>{activePose.topTag}</span>
          </motion.div>
        </AnimatePresence>

        {/* 2. DYNAMIC BOTTOM SAFETY TAG */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`bottom-tag-${activePose.id}`}
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-3 right-3 z-10 bg-stone-950/90 border border-amber-500/60 text-amber-300 text-[11px] font-mono px-3 py-1.5 rounded-lg shadow-xl backdrop-blur-md flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>{activePose.bottomTag}</span>
          </motion.div>
        </AnimatePresence>

      </div>

      {/* Dynamic Predicted Posture Accuracy Bar & Info */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`accuracy-info-${activePose.id}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.4 }}
          className="mt-3 space-y-2 z-10 bg-stone-900/60 p-3.5 rounded-xl border border-stone-800/80"
        >
          <div className="flex justify-between items-center text-xs">
            <span className="text-stone-300 font-medium flex items-center gap-1.5">
              <span>Predicted Posture Accuracy</span>
              <span className="text-[10px] text-stone-400 font-mono">({activePose.name})</span>
            </span>
            <span className="font-mono font-bold text-emerald-400 text-sm">
              {activePose.accuracyScore}% <span className="text-stone-300 text-[10px]">({activePose.accuracyCategory})</span>
            </span>
          </div>

          {/* Animated Accuracy Progress Bar */}
          <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: activePose.accuracyBarWidth }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="bg-gradient-to-r from-teal-400 via-emerald-400 to-emerald-500 h-full rounded-full"
            />
          </div>

          <p className="text-[11px] text-stone-300 flex items-center gap-1.5 pt-0.5 leading-snug">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{activePose.coachingTip}</span>
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Continuous 7-Second Progress Indicator Dots */}
      <div className="flex items-center justify-center gap-2 mt-3 z-10">
        {AUTO_POSES.map((p, idx) => (
          <div
            key={p.id}
            className={`h-1.5 rounded-full transition-all duration-700 ${
              idx === currentIndex ? 'w-10 bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'w-2.5 bg-stone-800'
            }`}
          />
        ))}
      </div>

    </div>
  );
};

