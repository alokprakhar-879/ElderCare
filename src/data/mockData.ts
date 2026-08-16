import { SeniorProfile, Medicine, Appointment, ConversationLog, EmotionData, AlertItem, EmergencyContact, WeeklyReport } from '../types';

export const initialSeniorProfile: SeniorProfile = {
  id: 'senior_01',
  name: 'Evelyn Harper',
  age: 78,
  location: 'Seattle, WA',
  avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
  conditions: ['Hypertension', 'Type 2 Diabetes', 'Mild Osteoarthritis'],
  bloodType: 'O+',
  allergies: ['Penicillin', 'Sulfa drugs'],
  primaryDoctor: {
    name: 'Dr. Robert Evans',
    specialty: 'Geriatric Medicine',
    phone: '(555) 234-5678',
    clinic: 'Swedish Medical Center, Seattle'
  },
  familyContact: {
    name: 'Sarah Harper',
    relationship: 'Daughter (Primary Caregiver)',
    phone: '(555) 890-1234',
    email: 'sarah.harper@example.com'
  }
};

export const initialMedicines: Medicine[] = [
  {
    id: 'med_01',
    name: 'Lisinopril',
    dosage: '10 mg',
    time: '09:00',
    timeLabel: '9:00 AM (Morning)',
    status: 'taken',
    instructions: 'Take 1 pill after breakfast for blood pressure.',
    category: 'Cardiovascular',
    color: 'bg-blue-500'
  },
  {
    id: 'med_02',
    name: 'Metformin',
    dosage: '500 mg',
    time: '13:00',
    timeLabel: '1:00 PM (Lunch)',
    status: 'pending',
    instructions: 'Take 1 pill with meal for blood sugar control.',
    category: 'Diabetes',
    color: 'bg-emerald-500'
  },
  {
    id: 'med_03',
    name: 'Glucosamine Sulfate',
    dosage: '750 mg',
    time: '08:00',
    timeLabel: '8:00 AM (Morning)',
    status: 'taken',
    instructions: 'Take 1 capsule for joint support.',
    category: 'Supplements',
    color: 'bg-amber-500'
  },
  {
    id: 'med_04',
    name: 'Atorvastatin',
    dosage: '20 mg',
    time: '21:00',
    timeLabel: '9:00 PM (Night)',
    status: 'pending',
    instructions: 'Take 1 pill before bedtime for cholesterol control.',
    category: 'Cardiovascular',
    color: 'bg-purple-500'
  }
];

export const initialAppointments: Appointment[] = [
  {
    id: 'apt_01',
    doctorName: 'Dr. Robert Evans',
    specialty: 'Geriatric Cardiology Follow-up',
    hospital: 'Swedish Medical Center - Suite 402',
    date: '2026-08-05',
    time: '10:30 AM',
    status: 'upcoming',
    locationAddress: '747 Broadway, Seattle, WA',
    notes: 'Bring current blood pressure chart and medicine list.'
  },
  {
    id: 'apt_02',
    doctorName: 'Dr. Ananya Sharma',
    specialty: 'Ophthalmology & Cataract Screening',
    hospital: 'Northwest Eye Clinic',
    date: '2026-08-12',
    time: '2:15 PM',
    status: 'upcoming',
    locationAddress: '1200 Columbia St, Seattle, WA',
    notes: 'Dilated eye exam. Arrange transport back.'
  },
  {
    id: 'apt_03',
    doctorName: 'Quest Diagnostics',
    specialty: 'Quarterly HbA1c & Lipid Panel',
    hospital: 'First Hill Lab Center',
    date: '2026-07-28',
    time: '8:00 AM',
    status: 'completed',
    locationAddress: '1101 Madison St, Seattle, WA',
    notes: 'Fast 8 hours prior.'
  }
];

export const initialEmotionHistory: EmotionData[] = [
  { id: 'e1', date: '2026-07-28', dayLabel: 'Mon', moodScore: 82, emotion: 'Happy', sentiment: 'Positive' },
  { id: 'e2', date: '2026-07-29', dayLabel: 'Tue', moodScore: 78, emotion: 'Normal', sentiment: 'Positive' },
  { id: 'e3', date: '2026-07-30', dayLabel: 'Wed', moodScore: 65, emotion: 'Lonely', sentiment: 'Neutral', notes: 'Mentioned missing grandchildren' },
  { id: 'e4', date: '2026-07-31', dayLabel: 'Thu', moodScore: 88, emotion: 'Happy', sentiment: 'Positive', notes: 'Enjoyed morning walk & phone call' },
  { id: 'e5', date: '2026-08-01', dayLabel: 'Fri', moodScore: 55, emotion: 'Anxious', sentiment: 'Negative', notes: 'Mild knee stiffness' },
  { id: 'e6', date: '2026-08-02', dayLabel: 'Sat', moodScore: 85, emotion: 'Happy', sentiment: 'Positive' },
  { id: 'e7', date: '2026-08-03', dayLabel: 'Sun (Today)', moodScore: 80, emotion: 'Normal', sentiment: 'Positive' }
];

export const initialConversationLogs: ConversationLog[] = [
  {
    id: 'chat_01',
    timestamp: '8:30 AM',
    sender: 'ai',
    text: 'Good morning, Evelyn! I hope you slept well. How are you feeling today?',
    detectedEmotion: 'Normal',
    moodScore: 80
  },
  {
    id: 'chat_02',
    timestamp: '8:31 AM',
    sender: 'senior',
    text: 'Good morning, Grace. I slept quite well, thank you. My joints feel a little stiff today.'
  },
  {
    id: 'chat_03',
    timestamp: '8:31 AM',
    sender: 'ai',
    text: 'I hear you, Evelyn. A gentle morning stretch might help. Please remember to take your morning Lisinopril and Glucosamine pills when you have your breakfast!',
    detectedEmotion: 'Normal',
    moodScore: 80,
    riskLevel: 'LOW'
  },
  {
    id: 'chat_04',
    timestamp: '9:05 AM',
    sender: 'senior',
    text: 'I just finished my oatmeal and took my morning pills.'
  },
  {
    id: 'chat_05',
    timestamp: '9:05 AM',
    sender: 'ai',
    text: 'Wonderful job, Evelyn! I have logged your morning medicines as completed. Have a peaceful day!',
    detectedEmotion: 'Happy',
    moodScore: 90,
    riskLevel: 'LOW',
    medicineMentioned: { action: 'taken', medicineName: 'Lisinopril & Glucosamine' }
  }
];

export const initialAlerts: AlertItem[] = [
  {
    id: 'alert_01',
    timestamp: 'Yesterday 8:45 PM',
    severity: 'MODERATE',
    title: 'Missed Evening Medication',
    description: 'Atorvastatin (20mg) was pending past scheduled 9:00 PM check-in.',
    seniorName: 'Evelyn Harper',
    acknowledged: true,
    resolved: true,
    type: 'MISSED_MEDICINE'
  },
  {
    id: 'alert_02',
    timestamp: '3 Days Ago 2:15 PM',
    severity: 'LOW',
    title: 'Emotional Dip Detected',
    description: 'Senior expressed feeling lonely during afternoon voice chat.',
    seniorName: 'Evelyn Harper',
    acknowledged: true,
    resolved: true,
    type: 'EMOTIONAL_DECLINE'
  }
];

export const initialEmergencyContacts: EmergencyContact[] = [
  {
    id: 'c1',
    name: 'Sarah Harper',
    relationship: 'Daughter (Primary)',
    phone: '(555) 890-1234',
    email: 'sarah.harper@example.com',
    isPrimary: true
  },
  {
    id: 'c2',
    name: 'David Harper',
    relationship: 'Son',
    phone: '(555) 890-5678',
    email: 'david.harper@example.com',
    isPrimary: false
  },
  {
    id: 'c3',
    name: 'Dr. Robert Evans',
    relationship: 'Primary Physician',
    phone: '(555) 234-5678',
    email: 'drevans@swedishmedical.org',
    isPrimary: false
  },
  {
    id: 'c4',
    name: 'Seattle EMS / 911',
    relationship: 'Emergency Dispatch',
    phone: '911',
    email: 'dispatch@seattle.gov',
    isPrimary: false
  }
];

export const initialWeeklyReport: WeeklyReport = {
  reportTitle: 'Weekly AI Care Summary for Evelyn Harper',
  period: 'July 28 - August 3, 2026',
  overallWellnessScore: 86,
  moodTrend: 'Positive & Steady. 5 of 7 days rated Happy or Normal.',
  medicationAdherenceRate: '92% (13 of 14 doses taken on time)',
  keyHighlights: [
    'Maintained excellent morning medicine consistency (100%).',
    'Participated in 18 voice companion conversations.',
    'No critical health risk triggers or falls reported.'
  ],
  emotionalAnalysisSummary: 'Evelyn remained predominantly positive. Mild loneliness observed on Wednesday evening when talking about family history. Responded very warmly to voice check-ins.',
  familyActionRecommendations: [
    'Check in via video call around 7 PM on Wednesday evenings.',
    'Remind Evelyn about the upcoming Cardiology appointment on August 5.',
    'Ensure Metformin refill is ordered before the weekend.'
  ],
  riskAssessment: 'LOW RISK - Stable Condition'
};
