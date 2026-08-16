export type UserRole = 'senior' | 'family';

export type AppLanguage = 'en' | 'hi';

export interface UserAuth {
  userId?: string;
  email: string;
  role: UserRole;
  isAuthenticated: boolean;
  isLoggedIn?: boolean;
  userName: string;
  avatarUrl: string;
  memberName?: string;
  relationship?: string;
  familyGroupId?: string;
  seniorEmail?: string;
}

export interface RegisteredUser {
  userId: string;
  email: string;
  password?: string;
  userName: string;
  role: UserRole;
  avatarUrl: string;
  memberName?: string;
  relationship?: string;
  familyGroupId?: string;
  seniorEmail?: string;
  createdAt: string;
}

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type EmotionType = 'Happy' | 'Sad' | 'Lonely' | 'Confused' | 'Depressed' | 'Normal' | 'Anxious' | 'Angry';

export type SentimentType = 'Positive' | 'Neutral' | 'Negative';

export interface SeniorProfile {
  id: string;
  name: string;
  age: number;
  location: string;
  avatar: string;
  conditions: string[];
  bloodType: string;
  allergies: string[];
  primaryDoctor: {
    name: string;
    specialty: string;
    phone: string;
    clinic: string;
  };
  familyContact: {
    name: string;
    relationship: string;
    phone: string;
    email: string;
  };
}

export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  time: string; // e.g. "09:00"
  timeLabel: string; // e.g. "9:00 AM (Morning)"
  status: 'taken' | 'pending' | 'missed';
  instructions: string;
  category: string;
  color: string;
}

export interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  hospital: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  locationAddress: string;
  notes?: string;
}

export interface ConversationLog {
  id: string;
  timestamp: string;
  sender: 'senior' | 'ai';
  text: string;
  detectedEmotion?: EmotionType;
  moodScore?: number;
  riskLevel?: RiskLevel;
  audioPrompt?: string;
  medicineMentioned?: {
    action: string;
    medicineName: string;
  };
  suggestedQuickReplies?: string[];
}

export interface EmotionData {
  id: string;
  date: string;
  dayLabel: string;
  moodScore: number; // 1-100
  emotion: EmotionType;
  sentiment: SentimentType;
  notes?: string;
}

export interface AlertItem {
  id: string;
  timestamp: string;
  severity: RiskLevel;
  title: string;
  description: string;
  seniorName: string;
  acknowledged: boolean;
  resolved: boolean;
  type: 'FALL_RISK' | 'MISSED_MEDICINE' | 'EMOTIONAL_DECLINE' | 'SOS_BUTTON' | 'HEALTH_PAIN';
  familyGroupId?: string;
  seniorEmail?: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  isPrimary: boolean;
}

export interface WeeklyReport {
  reportTitle: string;
  period: string;
  overallWellnessScore: number;
  moodTrend: string;
  medicationAdherenceRate: string;
  keyHighlights: string[];
  emotionalAnalysisSummary: string;
  familyActionRecommendations: string[];
  riskAssessment: string;
}
