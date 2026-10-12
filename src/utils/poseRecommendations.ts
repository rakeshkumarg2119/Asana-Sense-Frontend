/**
 * Personalized Yoga Pose Recommendation & Sequence Ordering Engine
 * 
 * Tailors pose arrangement and personalized guidance based on:
 * 1. Experience Level (Beginner, Intermediate, Advanced)
 *    - Beginner: arranged by beginner level difficulty with foundational recommendations
 *    - Intermediate: arranged by intermediate core & balance progression
 *    - Advanced: "let it no follow no order" — unconstrained free-flow exploration
 * 2. Age Category ('18-25', '26-40', '41-60', '60+')
 *    - Joint safety, spinal decompression, fall prevention, and age-adapted advice
 */

import type { YogaPose, UserProfile } from '../types';
import { ALL_POSES } from '../data/yogaPoses';

export interface PersonalizedPoseInfo {
  pose: YogaPose;
  originalIndex: number;
  recommendationTag: string;
  recommendationReason: string;
  ageAdvice: string;
  suitabilityScore: number;
  ageScore: number;
  isTopPick: boolean;
  cautionNote?: string;
  levelBadge: string;
}

export type PoseSortPreference = 'smart' | 'age' | 'level' | 'free-flow';

/**
 * Calculates personalized pose sequence and recommendations
 */
export function getPersonalizedPoseList(
  userProfile: UserProfile | null,
  basePoses: YogaPose[] = ALL_POSES,
  sortPreference: PoseSortPreference = 'smart'
): PersonalizedPoseInfo[] {
  const experience = (userProfile?.experienceLevel || (userProfile as any)?.experience_level || 'Beginner').trim();
  const ageCategory = (userProfile?.ageCategory || (userProfile as any)?.age_category || '26-40').trim();

  const isBeginnerLevel = experience.toLowerCase() === 'beginner';
  const isIntermediateLevel = experience.toLowerCase() === 'intermediate';
  const isAdvancedLevel = experience.toLowerCase() === 'advanced';

  // Score each pose based on experience & age suitability
  const scoredList: PersonalizedPoseInfo[] = basePoses.map((pose, originalIndex) => {
    let score = 50;
    let ageScore = 50;
    let recommendationTag = 'Foundational Posture';
    let recommendationReason = 'Supports comprehensive mind-body balance and alignment.';
    let ageAdvice = 'Safe and effective for daily yoga practice.';
    let cautionNote: string | undefined = undefined;
    let levelBadge = pose.difficulty;

    const id = pose.id.toLowerCase();

    // ── 1. Experience Level Progression Scoring ────────────────────────────
    if (isBeginnerLevel) {
      // Beginners: grounded, safe backbends & foundational standing balances first
      if (id === 'cobra') {
        score += 50;
        recommendationTag = '★ #1 Beginner Pick • Grounded Spine Opener';
        recommendationReason = 'Gentle prone backbend that safely strengthens back muscles without joint compression.';
      } else if (id === 'tree') {
        score += 44;
        recommendationTag = '★ Essential Beginner Balance';
        recommendationReason = 'Develops single-leg stability, ankle strength, and proprioception safely.';
      } else if (id === 'dog') {
        score += 38;
        recommendationTag = 'Cornerstone Spinal Decompression';
        recommendationReason = 'Classic decompression pose to build shoulder stability and posterior flexibility.';
      } else if (id === 'chair') {
        score += 32;
        recommendationTag = 'Lower Body Strength & Alignment';
        recommendationReason = 'Builds quad endurance and core engagement with both feet grounded.';
      } else if (id === 'triangle') {
        score += 24;
        recommendationTag = 'Lateral Opening & Hamstring Stretch';
        recommendationReason = 'Improves hamstring flexibility and pelvic alignment with micro-bent knee.';
      } else if (id === 'warrior') {
        score += 12;
        recommendationTag = 'Intermediate Progression Balance';
        recommendationReason = 'Dynamic horizontal hold requiring disciplined hip squaring and ankle poise.';
      } else if (id === 'shoulder_stand') {
        score -= 30;
        recommendationTag = 'Advanced Inversion • Caution';
        recommendationReason = 'Deep inversion requiring cervical spine protection and core strength.';
        cautionNote = 'Beginner Safety: Practice with caution; keep head still to protect neck vertebrae.';
      }
    } else if (isIntermediateLevel) {
      // Intermediates: precision geometry, core horizontal holds, dynamic balance
      if (id === 'triangle') {
        score += 50;
        recommendationTag = '★ #1 Intermediate Focus • Spatial Alignment';
        recommendationReason = 'Hones geometric precision, oblique strength, and lateral spine lengthening.';
      } else if (id === 'warrior') {
        score += 46;
        recommendationTag = '★ Core & Horizontal T-Balance Mastery';
        recommendationReason = 'Challenges single-leg stability, horizontal T-frame control, and posterior engagement.';
      } else if (id === 'chair') {
        score += 38;
        recommendationTag = 'Isometric Endurance & Heat Generation';
        recommendationReason = 'Develops isometric quad strength and deep pelvic floor activation.';
      } else if (id === 'dog') {
        score += 32;
        recommendationTag = 'Spinal Decompression & Transition';
        recommendationReason = 'Lengthens posterior chain and anchors intermediate breath cycles.';
      } else if (id === 'tree') {
        score += 26;
        recommendationTag = 'Poise & Single-Leg Grounding';
        recommendationReason = 'Refines center of gravity, still gaze (drishti), and mental focus.';
      } else if (id === 'cobra') {
        score += 22;
        recommendationTag = 'Thoracic Extension';
        recommendationReason = 'Expands chest and counteracts forward thoracic curvature.';
      } else if (id === 'shoulder_stand') {
        score += 16;
        recommendationTag = 'Inversion Progression';
        recommendationReason = 'Invigorating inversion promoting venous blood return and endocrine balance.';
      }
    } else if (isAdvancedLevel) {
      // Advanced: "let it no follow no order" -> Unrestricted free-flow mastery
      // All poses are respected equally as expressions of mastery
      recommendationTag = 'Advanced Free Flow • Unrestricted Mastery';
      if (id === 'shoulder_stand') {
        recommendationTag = 'Mastery Inversion • Queen of Asanas';
        recommendationReason = 'Stimulates thyroid metabolism, calms nervous system, and demands vertical core stability.';
      } else if (id === 'warrior') {
        recommendationTag = 'Dynamic T-Balance Precision';
        recommendationReason = 'Deep proprioceptive hold testing ankle stabilization and hip neutral rotation.';
      } else if (id === 'triangle') {
        recommendationTag = 'Geometric Precision Mastery';
        recommendationReason = 'Fine-tune micro-adjustments and expansive ribcage breathing.';
      } else if (id === 'chair') {
        recommendationTag = 'Isometric Stamina & Agni Fire';
        recommendationReason = 'Deep squat hold to test mental resilience and deep gluteal activation.';
      } else if (id === 'dog') {
        recommendationTag = 'Decompression & Posterior Length';
        recommendationReason = 'Full body alignment and deep posterior chain opening.';
      } else if (id === 'cobra') {
        recommendationTag = 'Full Thoracic Arch';
        recommendationReason = 'Maximum thoracic lift with relaxed glutes and grounded pubic bone.';
      } else if (id === 'tree') {
        recommendationTag = 'Meditative Poise & Stillness';
        recommendationReason = 'Quiet holding posture to test stillness and drishti gaze.';
      }
    }

    // ── 2. Age-Based Recommendation Ordering & Guidance ───────────────────
    if (ageCategory === '60+') {
      // 60+: Priority on joint protection, spinal gentleness, fall prevention, zero neck strain
      if (id === 'cobra') {
        ageScore += 45;
        score += 25;
        ageAdvice = 'Top pick for age 60+: Gentle prone backbend keeps spine supple without joint load.';
      } else if (id === 'tree') {
        ageScore += 40;
        score += 22;
        ageAdvice = 'Essential for age 60+: Preserves balance and neuromuscular agility safely (use wall if needed).';
      } else if (id === 'chair') {
        ageScore += 32;
        score += 16;
        ageAdvice = 'Functional for age 60+: Maintains sit-to-stand knee and hip mobility.';
      } else if (id === 'dog') {
        ageScore += 26;
        score += 12;
        ageAdvice = 'Safe spinal stretch for age 60+: Keep knees softly bent to ease lower back.';
      } else if (id === 'triangle') {
        ageScore += 18;
        score += 8;
        ageAdvice = 'Hip longevity for age 60+: Promotes pelvic flexibility without locking the knee.';
      } else if (id === 'warrior') {
        ageScore += 10;
        score += 4;
        ageAdvice = 'Advanced balance for age 60+: Practice with chair or wall support.';
      } else if (id === 'shoulder_stand') {
        ageScore -= 45;
        score -= 40;
        ageAdvice = 'Caution for age 60+: Avoid or consult teacher due to cervical neck pressure and blood pressure variations.';
        cautionNote = 'Caution for Age 60+: High cervical spine pressure. Skip or substitute with legs-up-the-wall.';
      }
    } else if (ageCategory === '41-60') {
      // 41-60: Lumbar decompression, reversing sedentary forward hunch, joint synovial fluid
      if (id === 'dog') {
        ageScore += 45;
        score += 22;
        ageAdvice = 'Top pick for age 41-60: Counters sedentary desk posture and decompresses lumbar discs.';
      } else if (id === 'cobra') {
        ageScore += 40;
        score += 20;
        ageAdvice = 'Essential for age 41-60: Reverses slouching and strengthens thoracic support muscles.';
      } else if (id === 'triangle') {
        ageScore += 34;
        score += 16;
        ageAdvice = 'Hip mobility for age 41-60: Promotes hip joint longevity and lateral abdominal elasticity.';
      } else if (id === 'chair') {
        ageScore += 28;
        score += 14;
        ageAdvice = 'Knee longevity for age 41-60: Stimulates synovial fluid and quad tone.';
      } else if (id === 'tree') {
        ageScore += 22;
        score += 10;
        ageAdvice = 'Proprioception for age 41-60: Sharpens nervous system responsiveness.';
      } else if (id === 'warrior') {
        ageScore += 18;
        score += 8;
        ageAdvice = 'Posterior tone for age 41-60: Builds strong gluteal and erector spinae support.';
      } else if (id === 'shoulder_stand') {
        ageScore += 10;
        score += 4;
        ageAdvice = 'Circulation for age 41-60: Venous blood return and lymphatic drainage.';
      }
    } else if (ageCategory === '26-40') {
      // 26-40: Athletic endurance, core power, stress reduction, hip girdle flexibility
      if (id === 'warrior') {
        ageScore += 45;
        score += 20;
        ageAdvice = 'Top pick for age 26-40: Builds high-performance horizontal balance, stamina, and spinal tone.';
      } else if (id === 'triangle') {
        ageScore += 40;
        score += 18;
        ageAdvice = 'Optimal for age 26-40: Sharpens functional hamstring flexibility and pelvic range.';
      } else if (id === 'chair') {
        ageScore += 34;
        score += 15;
        ageAdvice = 'Metabolic burn for age 26-40: High caloric expenditure and isometric power.';
      } else if (id === 'dog') {
        ageScore += 28;
        score += 12;
        ageAdvice = 'Active recovery for age 26-40: Relieves stress and decompresses the spine.';
      } else if (id === 'tree') {
        ageScore += 22;
        score += 10;
        ageAdvice = 'Mental focus for age 26-40: Centers attention and calms mental fatigue.';
      } else if (id === 'cobra') {
        ageScore += 18;
        score += 8;
        ageAdvice = 'Chest opening for age 26-40: Counteracts workstation thoracic tightness.';
      } else if (id === 'shoulder_stand') {
        ageScore += 15;
        score += 6;
        ageAdvice = 'Inversion reset for age 26-40: Stimulates thyroid metabolism and deep relaxation.';
      }
    } else if (ageCategory === '18-25') {
      // 18-25: High agility, neuromuscular responsiveness, inversions, athletic range
      if (id === 'warrior') {
        ageScore += 45;
        score += 20;
        ageAdvice = 'Top pick for age 18-25: Maximizes balance control, neuromuscular agility, and core drive.';
      } else if (id === 'shoulder_stand') {
        ageScore += 42;
        score += 18;
        ageAdvice = 'Dynamic for age 18-25: Inversion agility and full endocrine balance.';
      } else if (id === 'triangle') {
        ageScore += 35;
        score += 14;
        ageAdvice = 'Clean geometric lines and deep hamstring flexibility.';
      } else if (id === 'chair') {
        ageScore += 30;
        score += 12;
        ageAdvice = 'Athletic quad power and explosive lower body endurance.';
      } else if (id === 'dog') {
        ageScore += 24;
        score += 10;
        ageAdvice = 'Foundational athletic stretch and shoulder stabilizer tone.';
      } else if (id === 'cobra') {
        ageScore += 20;
        score += 8;
        ageAdvice = 'Spinal flexibility and chest mobility.';
      } else if (id === 'tree') {
        ageScore += 18;
        score += 6;
        ageAdvice = 'Neurological grounding and ankle stability.';
      }
    }

    return {
      pose,
      originalIndex,
      recommendationTag,
      recommendationReason,
      ageAdvice,
      suitabilityScore: score,
      ageScore,
      isTopPick: false,
      cautionNote,
      levelBadge,
    };
  });

  // ── 3. Ordering Execution Based on User Request ──────────────────────────
  // User Prompt:
  // "if the user is begineer arrange the pose based on begineer level with recommendation
  //  intermediate means like that pose drawer arrangement based and recommendation
  //  and advanced mean let it no follow no order
  //  and also give poses recommendation order based on their age also that is also important"

  let sorted: PersonalizedPoseInfo[];

  if (sortPreference === 'age') {
    // Pure age-based recommendation ordering
    sorted = [...scoredList].sort((a, b) => b.ageScore - a.ageScore);
  } else if (sortPreference === 'level') {
    // Pure level ordering: Beginner -> Intermediate -> Advanced
    const levelOrder: Record<string, number> = { Beginner: 1, Intermediate: 2, Advanced: 3 };
    sorted = [...scoredList].sort((a, b) => {
      const orderA = levelOrder[a.pose.difficulty] || 2;
      const orderB = levelOrder[b.pose.difficulty] || 2;
      if (orderA !== orderB) return orderA - orderB;
      return b.suitabilityScore - a.suitabilityScore;
    });
  } else if (sortPreference === 'free-flow' || (sortPreference === 'smart' && isAdvancedLevel)) {
    // Advanced Level or Free Flow: "let it no follow no order"
    // Preserves open flow without forced beginner hierarchy or artificial gating
    sorted = [...scoredList];
  } else {
    // Beginner or Intermediate ('smart'): sorted strictly by level progression + age suitability score
    sorted = [...scoredList].sort((a, b) => b.suitabilityScore - a.suitabilityScore);
  }

  // Mark top picks
  if (sorted.length > 0) {
    sorted[0].isTopPick = true;
  }
  if (sorted.length > 1 && sorted[1].suitabilityScore > 65) {
    sorted[1].isTopPick = true;
  }

  return sorted;
}

/**
 * Storage key for session exit rotation count
 */
const POSE_ROTATION_STORAGE_KEY = 'asana_pose_rotation_offset';

/**
 * Reads the current pose rotation offset from localStorage / window
 */
export function getSessionRotationOffset(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const val = localStorage.getItem(POSE_ROTATION_STORAGE_KEY);
    return val ? parseInt(val, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

/**
 * Increments the pose rotation offset upon exiting a session
 * Shifts poses forward so different poses appear at the top.
 */
export function incrementSessionRotationOffset(step: number = 1): number {
  if (typeof window === 'undefined') return 0;
  try {
    const current = getSessionRotationOffset();
    const next = current + step;
    localStorage.setItem(POSE_ROTATION_STORAGE_KEY, String(next));
    window.dispatchEvent(new CustomEvent('asana_pose_rotation_changed', { detail: { offset: next } }));
    return next;
  } catch {
    return 0;
  }
}

/**
 * Rotates an array forward by an offset, so items at (offset % length) appear first.
 */
export function rotatePoseList<T>(items: T[], offset: number): T[] {
  if (!items || items.length <= 1) return items;
  const count = items.length;
  const shift = ((offset % count) + count) % count;
  if (shift === 0) return [...items];
  return [...items.slice(shift), ...items.slice(0, shift)];
}

/**
 * Guest mode pose arrangement:
 * Places the 3 unlocked poses ('dog', 'warrior', 'tree') first in the grid/shelf,
 * followed immediately by the locked poses ('chair', 'cobra', 'shoulder_stand', 'triangle').
 *
 * Can also apply rotation within the unlocked group and locked group or preserve consistent unlocked leading.
 */
export function getGuestDrawerPoses<T extends { id: string }>(
  allPoses: T[],
  unlockedIds: string[] = ['dog', 'warrior', 'tree'],
  rotationOffset: number = 0
): { pose: T; isLocked: boolean; originalIndex: number }[] {
  // First, map each pose with its original index in allPoses
  const indexed = allPoses.map((pose, originalIndex) => {
    const isLocked = !unlockedIds.includes(pose.id);
    return { pose, isLocked, originalIndex };
  });

  const unlocked = indexed.filter((item) => !item.isLocked);
  const locked = indexed.filter((item) => item.isLocked);

  // Apply rotation within unlocked and locked subgroups if offset > 0
  const rotatedUnlocked = rotatePoseList(unlocked, rotationOffset);
  const rotatedLocked = rotatePoseList(locked, rotationOffset);

  return [...rotatedUnlocked, ...rotatedLocked];
}
