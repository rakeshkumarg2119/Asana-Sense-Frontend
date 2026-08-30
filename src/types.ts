export interface YogaPose {
  id: string;
  name: string;
  sanskritName: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: 'Standing & Balance' | 'Standing & Strength' | 'Inversion & Core' | 'Backbend & Spine' | 'Restorative & Flexibility';
  description: string;
  targetMuscles: string[];
  benefits: string[];
  wrongPostureImpacts: {
    mistake: string;
    impact: string;
    correction: string;
  }[];
  idealHoldDurationSeconds: number;
  voiceKeywords: string[];
  imageUrl: string;
  keyAlignmentCheckpoints: string[];
  isCoreInteractive: boolean; // 5 poses are interactive in real-time session
}

export interface PostureAnalysisResult {
  score: number;
  alignmentStatus: string;
  keyCues: string[];
  wrongPostureImpacts: string[];
  benefitsTargeted: string[];
  encouragingFeedback: string;
  timestamp?: string;
}

export interface SessionPoseRecord {
  poseId: string;
  poseName: string;
  sanskritName: string;
  durationSeconds: number;
  bestHoldSeconds?: number;
  attemptsCount?: number;
  accuracyScore: number;
  cuesReceived: string[];
  status: 'completed' | 'skipped' | 'practicing';
}

export interface PracticeSession {
  id: string;
  startTime: number;
  endTime?: number;
  totalDurationSeconds: number;
  posesRecorded: SessionPoseRecord[];
  overallAccuracy: number;
  caloriesBurnedEst: number;
  aiReport?: {
    overallScore: number;
    flexibilityIndex: string;
    coreStabilityScore: number;
    keyStrengths: string[];
    priorityGrowthAreas: string[];
    masterTeacherNote: string;
    recommendedNextPoses: string[];
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  isAccountActive: boolean;
  avatarSeed: string;
  encryptionKeyHash: string;
  memberSince: string;
  hasCompletedOnboarding?: boolean;
  ageCategory?: '18-25' | '26-40' | '41-60' | '60+';
  experienceLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  stats: {
    totalSessions: number;
    totalMinutesPracticed: number;
    averageScore: number;
    favoritePose: string;
  };
  bmiData?: {
    weightKg: number;
    heightCm: number;
    age: number;
    gender: string;
    bmiValue: number;
    bmiCategory: string;
    dietaryPreference: string;
    calculatedAt: string;
  };
}

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
