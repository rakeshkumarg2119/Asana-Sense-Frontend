// ── Yoga Pose (from MongoDB via API & UI) ──────────────────────────────────

export interface WrongPostureImpact {
  mistake: string;
  impact: string;
  correction: string;
}

export interface YogaPose {
  id: string;
  name: string;
  sanskritName?: string;
  sanskrit_name?: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  description: string;
  targetMuscles?: string[];
  target_muscles?: string[];
  benefits: string[];
  wrongPostureImpacts?: WrongPostureImpact[];
  wrong_posture_impacts?: WrongPostureImpact[];
  idealHoldDurationSeconds?: number;
  ideal_hold_duration_seconds?: number;
  voiceKeywords?: string[];
  voice_keywords?: string[];
  imageUrl?: string;
  image_url?: string;
  keyAlignmentCheckpoints?: string[];
  key_alignment_checkpoints?: string[];
  isCoreInteractive?: boolean;
  model_class_name?: string;
  model_class_index?: number;
}

// ── Joint-Level Pose Detection (from WebSocket) ─────────────────────────────

export interface JointStatus {
  index: number;
  name: string;
  status: 'correct' | 'warning' | 'misaligned' | 'critical';
  deviation: number;
}

export interface PoseDetectionResult {
  type: 'pose_result';
  predicted_pose: string;
  confidence: number;
  target_pose: string;
  is_correct: boolean;
  has_red?: boolean;
  has_yellow?: boolean;
  joints: JointStatus[];
  timer_action: 'start' | 'stop' | 'continue' | 'idle';
  correction_message: string;
}

// ── Posture Analysis (AI feedback) ──────────────────────────────────────────

export interface PostureAnalysisResult {
  score: number;
  alignmentStatus: string;
  keyCues: string[];
  wrongPostureImpacts: string[];
  benefitsTargeted: string[];
  encouragingFeedback: string;
  timestamp?: string;
}

// ── Session Records ─────────────────────────────────────────────────────────

export interface SessionPoseRecord {
  poseId?: string;
  pose_id?: string;
  poseName?: string;
  pose_name?: string;
  sanskritName?: string;
  sanskrit_name?: string;
  durationSeconds?: number;
  duration_seconds?: number;
  bestHoldSeconds?: number;
  best_hold_seconds?: number;
  attemptsCount?: number;
  attempts_count?: number;
  accuracyScore?: number;
  accuracy_score?: number;
  cuesReceived?: string[];
  cues_received?: string[];
  status: 'completed' | 'skipped' | 'practicing';
}

export interface PracticeSession {
  id: string;
  userId?: string;
  user_id?: string;
  startTime?: number;
  start_time?: number;
  endTime?: number;
  end_time?: number;
  totalDurationSeconds?: number;
  total_duration_seconds?: number;
  posesRecorded?: SessionPoseRecord[];
  poses_recorded?: SessionPoseRecord[];
  overallAccuracy?: number;
  overall_accuracy?: number;
  caloriesBurnedEst?: number;
  calories_burned_est?: number;
  aiReport?: any;
  ai_report?: any;
}

// ── User Profile (from MongoDB via API) ─────────────────────────────────────

export interface UserStats {
  totalSessions?: number;
  total_sessions?: number;
  totalMinutesPracticed?: number;
  total_minutes_practiced?: number;
  averageScore?: number;
  average_score?: number;
  favoritePose?: string;
  favorite_pose?: string;
}

export interface BmiData {
  weightKg?: number;
  weight_kg?: number;
  heightCm?: number;
  height_cm?: number;
  age: number;
  gender: string;
  bmiValue?: number;
  bmi_value?: number;
  bmiCategory?: string;
  bmi_category?: string;
  dietaryPreference?: string;
  dietary_preference?: string;
  calculatedAt?: string;
  calculated_at?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  isAccountActive?: boolean;
  is_account_active?: boolean;
  avatarSeed?: string;
  avatar_seed?: string;
  memberSince?: string;
  member_since?: string;
  hasCompletedOnboarding?: boolean;
  has_completed_onboarding?: boolean;
  ageCategory?: string;
  age_category?: string;
  experienceLevel?: string;
  experience_level?: string;
  stats: UserStats;
  bmiData?: BmiData | null;
  bmi_data?: BmiData | null;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  token: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: UserProfile;
}

// ── Diet Plan (compat) ───────────────────────────────────────────────────────

export interface DietPlanResult {
  bmiSummary: {
    value: number;
    category: string;
    healthyWeightRange: string;
    idealCaloricIntake: number;
  };
  macroTargets: {
    proteinPercent: number;
    carbsPercent: number;
    fatsPercent: number;
    waterLiters: number;
  };
  mealPlan: {
    mealName: string;
    description: string;
    keyNutrients: string;
    calorieEst: number;
  }[];
  ayurvedicTips: string[];
  foodsToEmphasize: string[];
  foodsToLimit: string[];
}
