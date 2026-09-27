/**
 * Yoga poses data — 7 poses matching the TFLite model classes.
 * Cloudinary URLs uploaded by user are mapped directly.
 * Primary data comes from MongoDB via API; this serves as fallback + types.
 */
import type { YogaPose } from '../types';
import { apiFetchPoses } from '../utils/apiClient';

// ── Fallback static data (used when API is unavailable) ─────────────────────

export const YOGA_POSES: YogaPose[] = [
  {
    id: 'chair',
    name: 'Chair Pose',
    sanskritName: 'Utkatasana',
    sanskrit_name: 'Utkatasana',
    difficulty: 'Beginner',
    category: 'Standing & Strength',
    isCoreInteractive: true,
    description: 'A powerful standing squat that builds leg endurance, core strength, and heat throughout the body.',
    targetMuscles: ['Quadriceps', 'Glutes', 'Core', 'Calves', 'Shoulders'],
    target_muscles: ['Quadriceps', 'Glutes', 'Core', 'Calves', 'Shoulders'],
    benefits: [
      'Strengthens ankles, thighs, calves, and spine',
      'Stretches shoulders and chest',
      'Stimulates the heart, diaphragm, and abdominal organs',
      'Builds stamina and endurance in lower body',
    ],
    wrongPostureImpacts: [
      { mistake: 'Knees extending past the toes', impact: 'Excessive pressure on knee joints.', correction: 'Shift weight back into heels.' },
      { mistake: 'Arching the lower back excessively', impact: 'Compresses lumbar vertebrae.', correction: 'Tuck tailbone and engage core.' },
      { mistake: 'Shoulders hunching up', impact: 'Tension in trapezius.', correction: 'Roll shoulders down and back.' },
    ],
    wrong_posture_impacts: [
      { mistake: 'Knees extending past the toes', impact: 'Excessive pressure on knee joints.', correction: 'Shift weight back into heels.' },
      { mistake: 'Arching the lower back excessively', impact: 'Compresses lumbar vertebrae.', correction: 'Tuck tailbone and engage core.' },
      { mistake: 'Shoulders hunching up', impact: 'Tension in trapezius.', correction: 'Roll shoulders down and back.' },
    ],
    idealHoldDurationSeconds: 30,
    ideal_hold_duration_seconds: 30,
    voiceKeywords: ['chair', 'chair pose', 'utkatasana', 'sitting pose'],
    voice_keywords: ['chair', 'chair pose', 'utkatasana', 'sitting pose'],
    imageUrl: 'https://res.cloudinary.com/yhj7u0bn/image/upload/v1789033782/Chair_pose.png',
    image_url: 'https://res.cloudinary.com/yhj7u0bn/image/upload/v1789033782/Chair_pose.png',
    keyAlignmentCheckpoints: ['Feet hip-width apart', 'Knees bent deeply over toes', 'Weight in heels', 'Arms overhead', 'Core engaged'],
    key_alignment_checkpoints: ['Feet hip-width apart', 'Knees bent deeply over toes', 'Weight in heels', 'Arms overhead', 'Core engaged'],
    model_class_name: 'chair',
    model_class_index: 0,
  },
  {
    id: 'cobra',
    name: 'Cobra Pose',
    sanskritName: 'Bhujangasana',
    sanskrit_name: 'Bhujangasana',
    difficulty: 'Beginner',
    category: 'Backbend & Spine',
    isCoreInteractive: true,
    description: 'An invigorating prone backbend that opens the heart center and strengthens back musculature.',
    targetMuscles: ['Erector Spinae', 'Glutes', 'Trapezius', 'Pectorals', 'Abdominals'],
    target_muscles: ['Erector Spinae', 'Glutes', 'Trapezius', 'Pectorals', 'Abdominals'],
    benefits: ['Expands thoracic extension', 'Strengthens posterior spine', 'Stimulates digestive organs', 'Elevates mood'],
    wrongPostureImpacts: [
      { mistake: 'Cranking neck backwards', impact: 'Compresses cervical vertebrae.', correction: 'Keep neck elongated, lift from heart.' },
      { mistake: 'Flaring elbows outward', impact: 'Pinches shoulder impingement zones.', correction: 'Keep elbows tucked alongside ribs.' },
      { mistake: 'Lifting hips off floor', impact: 'Crunches lumbar vertebrae.', correction: 'Keep pubic bone anchored to ground.' },
    ],
    wrong_posture_impacts: [
      { mistake: 'Cranking neck backwards', impact: 'Compresses cervical vertebrae.', correction: 'Keep neck elongated, lift from heart.' },
      { mistake: 'Flaring elbows outward', impact: 'Pinches shoulder impingement zones.', correction: 'Keep elbows tucked alongside ribs.' },
      { mistake: 'Lifting hips off floor', impact: 'Crunches lumbar vertebrae.', correction: 'Keep pubic bone anchored to ground.' },
    ],
    idealHoldDurationSeconds: 30,
    ideal_hold_duration_seconds: 30,
    voiceKeywords: ['cobra', 'cobra pose', 'bhujangasana', 'snake pose'],
    voice_keywords: ['cobra', 'cobra pose', 'bhujangasana', 'snake pose'],
    imageUrl: 'https://res.cloudinary.com/yhj7u0bn/image/upload/v1789019345/cobro.avif',
    image_url: 'https://res.cloudinary.com/yhj7u0bn/image/upload/v1789019345/cobro.avif',
    keyAlignmentCheckpoints: ['Feet pressed into mat', 'Hands under shoulders', 'Lift with back muscles', 'Pelvis on floor', 'Neutral neck'],
    key_alignment_checkpoints: ['Feet pressed into mat', 'Hands under shoulders', 'Lift with back muscles', 'Pelvis on floor', 'Neutral neck'],
    model_class_name: 'cobra',
    model_class_index: 1,
  },
  {
    id: 'dog',
    name: 'Downward-Facing Dog',
    sanskritName: 'Adho Mukha Svanasana',
    sanskrit_name: 'Adho Mukha Svanasana',
    difficulty: 'Beginner',
    category: 'Inversion & Core',
    isCoreInteractive: true,
    description: 'The cornerstone inversion of yoga that lengthens the posterior chain while building upper body strength.',
    targetMuscles: ['Latissimus Dorsi', 'Hamstrings', 'Calves', 'Triceps', 'Serratus Anterior'],
    target_muscles: ['Latissimus Dorsi', 'Hamstrings', 'Calves', 'Triceps', 'Serratus Anterior'],
    benefits: ['Decompresses spine', 'Strengthens shoulders and core', 'Calms the brain', 'Enhances blood flow'],
    wrongPostureImpacts: [
      { mistake: 'Rounding the back', impact: 'Compressive pressure on lumbar discs.', correction: 'Bend knees, send tailbone up.' },
      { mistake: 'Weight on wrists', impact: 'Carpal tunnel strain.', correction: 'Press into knuckle pads and fingertips.' },
      { mistake: 'Scrunching shoulders', impact: 'Impairs rotator cuff mechanics.', correction: 'Broaden upper back, rotate arms outward.' },
    ],
    wrong_posture_impacts: [
      { mistake: 'Rounding the back', impact: 'Compressive pressure on lumbar discs.', correction: 'Bend knees, send tailbone up.' },
      { mistake: 'Weight on wrists', impact: 'Carpal tunnel strain.', correction: 'Press into knuckle pads and fingertips.' },
      { mistake: 'Scrunching shoulders', impact: 'Impairs rotator cuff mechanics.', correction: 'Broaden upper back, rotate arms outward.' },
    ],
    idealHoldDurationSeconds: 60,
    ideal_hold_duration_seconds: 60,
    voiceKeywords: ['downward dog', 'down dog', 'adho mukha', 'dog pose', 'dog'],
    voice_keywords: ['downward dog', 'down dog', 'adho mukha', 'dog pose', 'dog'],
    imageUrl: 'https://res.cloudinary.com/yhj7u0bn/image/upload/v1789019346/downdog.jpg',
    image_url: 'https://res.cloudinary.com/yhj7u0bn/image/upload/v1789019346/downdog.jpg',
    keyAlignmentCheckpoints: ['Hands shoulder-width', 'Press through index finger', 'Sit bones high', 'Ears with biceps', 'Heels toward floor'],
    key_alignment_checkpoints: ['Hands shoulder-width', 'Press through index finger', 'Sit bones high', 'Ears with biceps', 'Heels toward floor'],
    model_class_name: 'dog',
    model_class_index: 2,
  },
  {
    id: 'shoulder_stand',
    name: 'Shoulder Stand',
    sanskritName: 'Sarvangasana',
    sanskrit_name: 'Sarvangasana',
    difficulty: 'Advanced',
    category: 'Inversion & Core',
    isCoreInteractive: true,
    description: 'The queen of asanas — a full body inversion that stimulates the thyroid and calms the nervous system.',
    targetMuscles: ['Core', 'Trapezius', 'Deltoids', 'Glutes', 'Neck Extensors'],
    target_muscles: ['Core', 'Trapezius', 'Deltoids', 'Glutes', 'Neck Extensors'],
    benefits: ['Stimulates thyroid', 'Improves venous return', 'Strengthens shoulders and core', 'Calms nervous system'],
    wrongPostureImpacts: [
      { mistake: 'Turning head while inverted', impact: 'Severe cervical spine injury risk.', correction: 'Keep head absolutely still and centered.' },
      { mistake: 'Elbows splaying outward', impact: 'Weight transfers to cervical spine.', correction: 'Keep elbows shoulder-width apart.' },
      { mistake: 'Hips sagging behind shoulders', impact: 'Strains lower back.', correction: 'Engage core, walk hands higher up back.' },
    ],
    wrong_posture_impacts: [
      { mistake: 'Turning head while inverted', impact: 'Severe cervical spine injury risk.', correction: 'Keep head absolutely still and centered.' },
      { mistake: 'Elbows splaying outward', impact: 'Weight transfers to cervical spine.', correction: 'Keep elbows shoulder-width apart.' },
      { mistake: 'Hips sagging behind shoulders', impact: 'Strains lower back.', correction: 'Engage core, walk hands higher up back.' },
    ],
    idealHoldDurationSeconds: 60,
    ideal_hold_duration_seconds: 60,
    voiceKeywords: ['shoulder stand', 'shoulderstand', 'sarvangasana', 'inversion'],
    voice_keywords: ['shoulder stand', 'shoulderstand', 'sarvangasana', 'inversion'],
    imageUrl: 'https://res.cloudinary.com/yhj7u0bn/image/upload/v1789019345/sholders_stand.jpg',
    image_url: 'https://res.cloudinary.com/yhj7u0bn/image/upload/v1789019345/sholders_stand.jpg',
    keyAlignmentCheckpoints: ['Weight on shoulders not neck', 'Body vertically aligned', 'Elbows shoulder-width', 'Chin tucked', 'Legs active'],
    key_alignment_checkpoints: ['Weight on shoulders not neck', 'Body vertically aligned', 'Elbows shoulder-width', 'Chin tucked', 'Legs active'],
    model_class_name: 'shoudler_stand',
    model_class_index: 4,
  },
  {
    id: 'triangle',
    name: 'Triangle Pose',
    sanskritName: 'Trikonasana',
    sanskrit_name: 'Trikonasana',
    difficulty: 'Intermediate',
    category: 'Standing & Strength',
    isCoreInteractive: true,
    description: 'A lateral standing pose cultivating geometric alignment and deep hamstring extension.',
    targetMuscles: ['Hamstrings', 'Obliques', 'Groin', 'Latissimus Dorsi', 'Quadriceps'],
    target_muscles: ['Hamstrings', 'Obliques', 'Groin', 'Latissimus Dorsi', 'Quadriceps'],
    benefits: ['Stretches hamstrings and inner thighs', 'Strengthens thighs and ankles', 'Relieves backache', 'Develops spatial awareness'],
    wrongPostureImpacts: [
      { mistake: 'Top hip collapsing forward', impact: 'Rotational strain on lumbar spine.', correction: 'Stack hips, roll chest open.' },
      { mistake: 'Locking front knee', impact: 'Damages posterior knee ligaments.', correction: 'Maintain subtle micro-bend.' },
      { mistake: 'Resting weight on shin', impact: 'Disengages core stabilizers.', correction: 'Hover with oblique strength or use block.' },
    ],
    wrong_posture_impacts: [
      { mistake: 'Top hip collapsing forward', impact: 'Rotational strain on lumbar spine.', correction: 'Stack hips, roll chest open.' },
      { mistake: 'Locking front knee', impact: 'Damages posterior knee ligaments.', correction: 'Maintain subtle micro-bend.' },
      { mistake: 'Resting weight on shin', impact: 'Disengages core stabilizers.', correction: 'Hover with oblique strength or use block.' },
    ],
    idealHoldDurationSeconds: 45,
    ideal_hold_duration_seconds: 45,
    voiceKeywords: ['triangle', 'triangle pose', 'trikonasana'],
    voice_keywords: ['triangle', 'triangle pose', 'trikonasana'],
    imageUrl: 'https://res.cloudinary.com/yhj7u0bn/image/upload/v1789034482/1lFCiwdr0bqa_JDFaYD84M_TfvJ3RYy5mWpV0UfRTU7xWcEtRjbrG8vNowmL9pK1tWUVWng9jDML5TQJzC3i10hKS3JXMACiD_tV8sScPBGBF-Bhybv1Vw55Hvul60Z9pL09cCrP.jpg',
    image_url: 'https://res.cloudinary.com/yhj7u0bn/image/upload/v1789034482/1lFCiwdr0bqa_JDFaYD84M_TfvJ3RYy5mWpV0UfRTU7xWcEtRjbrG8vNowmL9pK1tWUVWng9jDML5TQJzC3i10hKS3JXMACiD_tV8sScPBGBF-Bhybv1Vw55Hvul60Z9pL09cCrP.jpg',
    keyAlignmentCheckpoints: ['Front foot forward, back foot angled', 'Legs straight', 'Hinge from hip', 'Arms in vertical line', 'Spine parallel to floor'],
    key_alignment_checkpoints: ['Front foot forward, back foot angled', 'Legs straight', 'Hinge from hip', 'Arms in vertical line', 'Spine parallel to floor'],
    model_class_name: 'traingle',
    model_class_index: 5,
  },
  {
    id: 'tree',
    name: 'Tree Pose',
    sanskritName: 'Vrikshasana',
    sanskrit_name: 'Vrikshasana',
    difficulty: 'Beginner',
    category: 'Standing & Balance',
    isCoreInteractive: true,
    description: 'A classic balancing posture establishing grounding and neuro-muscular poise.',
    targetMuscles: ['Calves', 'Quadriceps', 'Ankles', 'Gluteus Medius', 'Core'],
    target_muscles: ['Calves', 'Quadriceps', 'Ankles', 'Gluteus Medius', 'Core'],
    benefits: ['Strengthens ankles and spine', 'Improves balance and focus', 'Alleviates mild sciatica', 'Opens hips and groin'],
    wrongPostureImpacts: [
      { mistake: 'Foot on knee joint', impact: 'Harmful lateral shear on MCL.', correction: 'Place foot on thigh or calf, never knee.' },
      { mistake: 'Hip pushing out', impact: 'Compresses SI joint.', correction: 'Hug outer hip inward to midline.' },
      { mistake: 'Arching lower back', impact: 'Pinches lumbar vertebrae.', correction: 'Tuck tailbone, engage core.' },
    ],
    wrong_posture_impacts: [
      { mistake: 'Foot on knee joint', impact: 'Harmful lateral shear on MCL.', correction: 'Place foot on thigh or calf, never knee.' },
      { mistake: 'Hip pushing out', impact: 'Compresses SI joint.', correction: 'Hug outer hip inward to midline.' },
      { mistake: 'Arching lower back', impact: 'Pinches lumbar vertebrae.', correction: 'Tuck tailbone, engage core.' },
    ],
    idealHoldDurationSeconds: 45,
    ideal_hold_duration_seconds: 45,
    voiceKeywords: ['tree', 'tree pose', 'vrikshasana', 'balance pose'],
    voice_keywords: ['tree', 'tree pose', 'vrikshasana', 'balance pose'],
    imageUrl: 'https://res.cloudinary.com/yhj7u0bn/image/upload/v1789019346/tree.avif',
    image_url: 'https://res.cloudinary.com/yhj7u0bn/image/upload/v1789019346/tree.avif',
    keyAlignmentCheckpoints: ['Standing leg rooted', 'Foot on thigh or calf', 'Hips squared', 'Spine elongated', 'Drishti fixed'],
    key_alignment_checkpoints: ['Standing leg rooted', 'Foot on thigh or calf', 'Hips squared', 'Spine elongated', 'Drishti fixed'],
    model_class_name: 'tree',
    model_class_index: 6,
  },
  {
    id: 'warrior',
    name: 'Warrior III',
    sanskritName: 'Virabhadrasana III',
    sanskrit_name: 'Virabhadrasana III',
    difficulty: 'Intermediate',
    category: 'Balance & Core Strength',
    isCoreInteractive: true,
    description: 'A balancing horizontal T-shape posture that strengthens the posterior chain, stabilizes the standing leg, and demands deep core integration.',
    targetMuscles: ['Hamstrings', 'Glutes', 'Spinal Erectors', 'Core', 'Ankles', 'Shoulders'],
    target_muscles: ['Hamstrings', 'Glutes', 'Spinal Erectors', 'Core', 'Ankles', 'Shoulders'],
    benefits: [
      'Strengthens the entire back body including spine, hamstrings, and glutes',
      'Sharpens full-body balance, proprioception, and spatial awareness',
      'Firms abdominal core muscles and stabilizing pelvic muscles',
      'Develops stabilizing strength and arch endurance in standing ankle and foot',
    ],
    wrongPostureImpacts: [
      { mistake: 'Opening the hip of the lifted leg', impact: 'Twists the sacroiliac (SI) joint and destabilizes balance.', correction: 'Internally rotate lifted thigh so both hip points face the mat.' },
      { mistake: 'Arching or sagging the lumbar spine', impact: 'Compresses lumbar vertebrae under leverage.', correction: 'Draw navel toward spine and reach actively through back heel.' },
      { mistake: 'Locking or hyperextending standing knee', impact: 'Places strain on knee capsule and reduces stabilizing control.', correction: 'Maintain a soft microbend in the standing knee.' },
    ],
    wrong_posture_impacts: [
      { mistake: 'Opening the hip of the lifted leg', impact: 'Twists the sacroiliac (SI) joint and destabilizes balance.', correction: 'Internally rotate lifted thigh so both hip points face the mat.' },
      { mistake: 'Arching or sagging the lumbar spine', impact: 'Compresses lumbar vertebrae under leverage.', correction: 'Draw navel toward spine and reach actively through back heel.' },
      { mistake: 'Locking or hyperextending standing knee', impact: 'Places strain on knee capsule and reduces stabilizing control.', correction: 'Maintain a soft microbend in the standing knee.' },
    ],
    idealHoldDurationSeconds: 45,
    ideal_hold_duration_seconds: 45,
    voiceKeywords: ['warrior', 'warrior three', 'warrior 3', 'virabhadrasana', 'virabhadrasana 3', 'warrior two', 'warrior 2'],
    voice_keywords: ['warrior', 'warrior three', 'warrior 3', 'virabhadrasana', 'virabhadrasana 3', 'warrior two', 'warrior 2'],
    imageUrl: 'https://res.cloudinary.com/yhj7u0bn/image/upload/v1789033718/Warrior-3-Arms-Forward-1200x800.jpg',
    image_url: 'https://res.cloudinary.com/yhj7u0bn/image/upload/v1789033718/Warrior-3-Arms-Forward-1200x800.jpg',
    keyAlignmentCheckpoints: ['Standing leg grounded with microbend', 'Torso and lifted leg horizontal in T-shape', 'Pelvis squared level to floor', 'Arms extended forward alongside ears', 'Active drive through back heel'],
    key_alignment_checkpoints: ['Standing leg grounded with microbend', 'Torso and lifted leg horizontal in T-shape', 'Pelvis squared level to floor', 'Arms extended forward alongside ears', 'Active drive through back heel'],
    model_class_name: 'warrior',
    model_class_index: 7,
  },
];

export const ALL_POSES = YOGA_POSES;
export const ALL_EIGHT_POSES = YOGA_POSES;

// ── API-based fetch (primary data source) ────────────────────────────────────

let _cachedPoses: YogaPose[] | null = null;

export async function fetchPosesFromAPI(): Promise<YogaPose[]> {
  if (_cachedPoses) return _cachedPoses;
  try {
    const poses = await apiFetchPoses();
    if (poses.length > 0) {
      _cachedPoses = poses;
      return poses;
    }
  } catch (e) {
    console.warn('[Poses] API fetch failed, using fallback data:', e);
  }
  return YOGA_POSES;
}

export function clearPoseCache() {
  _cachedPoses = null;
}
