import React, { useState } from 'react';
import { SeniorProfile, Medicine, Appointment, ConversationLog, EmotionData, AlertItem, WeeklyReport, EmergencyContact } from '../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Heart, AlertTriangle, Pill, Calendar, FileText, CheckCircle2, Clock, Sparkles, Plus, PhoneCall, RefreshCw, ChevronRight, ShieldCheck, Trash2, UserPlus, Phone, Shield, Edit3 } from 'lucide-react';

interface FamilyDashboardProps {
  senior: SeniorProfile;
  medicines: Medicine[];
  appointments: Appointment[];
  conversationLogs: ConversationLog[];
  emotionHistory: EmotionData[];
  alerts: AlertItem[];
  emergencyContacts: EmergencyContact[];
  weeklyReport: WeeklyReport | null;
  onAcknowledgeAlert: (alertId: string) => void;
  onAddMedicine: (newMed: Omit<Medicine, 'id' | 'status'>) => void;
  onRemoveMedicine: (medicineId: string) => void;
  onAddAppointment: (newApt: Omit<Appointment, 'id' | 'status'>) => void;
  onGenerateWeeklyReport: () => Promise<void>;
  onOpenAddContact: () => void;
  onEditContact: (contact: EmergencyContact) => void;
  onRemoveContact: (contactId: string) => void;
  isGeneratingReport: boolean;
}

const EMOTION_COLORS: Record<string, string> = {
  Happy: '#10B981',
  Normal: '#3B82F6',
  Lonely: '#F59E0B',
  Anxious: '#EF4444',
  Sad: '#6366F1',
  Confused: '#8B5CF6'
};

export const FamilyDashboard: React.FC<FamilyDashboardProps> = ({
  senior,
  medicines,
  appointments,
  conversationLogs,
  emotionHistory,
  alerts,
  emergencyContacts,
  weeklyReport,
  onAcknowledgeAlert,
  onAddMedicine,
  onRemoveMedicine,
  onAddAppointment,
  onGenerateWeeklyReport,
  onOpenAddContact,
  onEditContact,
  onRemoveContact,
  isGeneratingReport
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'mood' | 'meds' | 'alerts' | 'report'>('overview');
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [showAddAptModal, setShowAddAptModal] = useState(false);

  // New Medicine Form State
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medTime, setMedTime] = useState('09:00');
  const [medInstructions, setMedInstructions] = useState('');

  // New Appointment Form State
  const [docName, setDocName] = useState('');
  const [docSpecialty, setDocSpecialty] = useState('');
  const [aptHospital, setAptHospital] = useState('');
  const [aptDate, setAptDate] = useState('');
  const [aptTime, setAptTime] = useState('10:00 AM');

  // Adherence Calculation
  const totalMeds = medicines.length;
  const takenMeds = medicines.filter(m => m.status === 'taken').length;
  const adherencePercent = totalMeds > 0 ? Math.round((takenMeds / totalMeds) * 100) : 100;

  // Active Alerts
  const activeAlerts = alerts.filter(a => !a.resolved);

  const handleCreateMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName || !medDosage) return;
    onAddMedicine({
      name: medName,
      dosage: medDosage,
      time: medTime,
      timeLabel: `${medTime} Scheduled`,
      instructions: medInstructions || 'Take with water',
      category: 'Prescription',
      color: 'bg-indigo-500'
    });
    setMedName('');
    setMedDosage('');
    setShowAddMedModal(false);
  };

  const handleCreateApt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName || !aptDate) return;
    onAddAppointment({
      doctorName: docName,
      specialty: docSpecialty || 'General Care',
      hospital: aptHospital || 'City Medical Center',
      date: aptDate,
      time: aptTime,
      locationAddress: 'Medical Center',
      notes: 'Scheduled by Family'
    });
    setDocName('');
    setDocSpecialty('');
    setShowAddAptModal(false);
  };

  // Emotion pie chart data calculation
  const emotionCounts: Record<string, number> = {};
  emotionHistory.forEach(e => {
    emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1;
  });
  const pieData = Object.keys(emotionCounts).map(emo => ({
    name: emo,
    value: emotionCounts[emo]
  }));

  return (
    <div id="family-dashboard-root" className="space-y-6 sm:space-y-8 pb-12">

      {/* Top Profile Header */}
      <div id="senior-profile-header" className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            <img
              src={senior.avatar}
              alt={senior.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm"
            />
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{senior.name}</h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  Age {senior.age}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Location: {senior.location} • Doctor: {senior.primaryDoctor.name}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {senior.conditions.map((c, idx) => (
                  <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Mood</p>
              <p className="text-lg font-extrabold text-emerald-600 mt-0.5">80/100 (Good)</p>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Med Adherence</p>
              <p className="text-lg font-extrabold text-indigo-600 mt-0.5">{adherencePercent}% Today</p>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-center col-span-2 sm:col-span-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Alerts</p>
              <p className={`text-lg font-extrabold mt-0.5 ${activeAlerts.length > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                {activeAlerts.length} Active
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Nav Tabs */}
      <div id="family-nav-tabs" className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Care Overview
        </button>
        <button
          onClick={() => setActiveTab('mood')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'mood'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Emotion & Mood Trends
        </button>
        <button
          onClick={() => setActiveTab('meds')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'meds'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Medicines & Schedule
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 ${
            activeTab === 'alerts'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Safety & Alerts</span>
          {activeAlerts.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {activeAlerts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 ${
            activeTab === 'report'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Weekly AI Report</span>
        </button>
      </div>

      {/* TAB CONTENT: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column: Recent Activity & Mood Stream */}
          <div className="lg:col-span-8 space-y-6">

            {/* AI Voice Companion Interaction Summary */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2.5 rounded-xl bg-sky-100 text-sky-700">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-base text-slate-900">Recent AI Conversation Logs</h2>
                    <p className="text-xs text-slate-500">Real-time transcripts with detected emotion and health risk scan</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                  Live Monitoring Active
                </span>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {[...conversationLogs].reverse().slice(0, 10).map((log) => (
                  <div key={log.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span className={log.sender === 'senior' ? 'text-sky-700 font-extrabold' : 'text-indigo-700 font-extrabold'}>
                        {log.sender === 'senior' ? senior.name : 'Grace (AI Companion)'}
                      </span>
                      <span className="text-slate-500 text-[11px] font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200">{log.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed font-semibold">{log.text}</p>
                    {log.detectedEmotion && (
                      <div className="flex items-center space-x-2 text-[10px] font-bold">
                        <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                          Emotion: {log.detectedEmotion}
                        </span>
                        {log.moodScore && (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            Mood Score: {log.moodScore}/100
                          </span>
                        )}
                        {log.riskLevel && log.riskLevel !== 'LOW' && (
                          <span className="px-2 py-0.5 rounded bg-red-100 text-red-800">
                            Risk: {log.riskLevel}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick 7-Day Mood Overview Chart */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <h2 className="font-bold text-base text-slate-900">7-Day Emotional Wellness Score</h2>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={emotionHistory}>
                    <XAxis dataKey="dayLabel" stroke="#94a3b8" fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                    <Tooltip />
                    <Line type="monotone" dataKey="moodScore" stroke="#0284c7" strokeWidth={3} dot={{ r: 5, fill: '#0284c7' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Right Column: Active Alerts & Contacts */}
          <div className="lg:col-span-4 space-y-6">

            {/* Active Safety Alerts */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                <h2 className="font-bold text-base text-slate-900">Safety & Risk Alerts</h2>
                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                  {activeAlerts.length} Unresolved
                </span>
              </div>

              {activeAlerts.length === 0 ? (
                <div className="text-center py-6 text-slate-500 space-y-2">
                  <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-semibold">No critical alerts right now. Senior is safe!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeAlerts.map((alert) => (
                    <div key={alert.id} className="p-4 rounded-2xl bg-red-50/80 border border-red-200 space-y-2">
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-red-600 text-white">
                          {alert.severity}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">{alert.timestamp}</span>
                      </div>
                      <h3 className="font-bold text-xs text-red-900">{alert.title}</h3>
                      <p className="text-xs text-red-800">{alert.description}</p>
                      <button
                        onClick={() => onAcknowledgeAlert(alert.id)}
                        className="w-full mt-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1.5 rounded-xl transition-colors"
                      >
                        Acknowledge & Mark Resolved
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Emergency Contacts Panel */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
                    <Phone className="w-4 h-4" />
                  </div>
                  <h2 className="font-bold text-base text-slate-900">Registered Emergency Contacts</h2>
                </div>
                <button
                  type="button"
                  onClick={onOpenAddContact}
                  className="px-2.5 py-1 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-[11px] shadow-xs transition-colors flex items-center space-x-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Add Contact</span>
                </button>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {emergencyContacts.map((contact) => (
                  <div key={contact.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div className="min-w-0 pr-2 space-y-0.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-xs text-slate-900 truncate">{contact.name}</span>
                        {contact.isPrimary && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-semibold text-sky-700">{contact.relationship}</p>
                      <a
                        href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`}
                        className="text-[10px] font-mono text-slate-600 hover:text-sky-600 flex items-center space-x-1 font-medium transition-colors"
                      >
                        <Phone className="w-3 h-3 text-sky-600 inline" />
                        <span>{contact.phone}</span>
                      </a>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onEditContact(contact)}
                        className="p-2 text-slate-400 hover:text-sky-600 rounded-xl hover:bg-sky-50 transition-colors"
                        title="Edit contact details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveContact(contact.id)}
                        className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                        title="Delete contact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Family Actions */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-3">
              <h2 className="font-bold text-base text-slate-900">Family Care Actions</h2>
              <button
                onClick={onOpenAddContact}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs py-3 rounded-2xl shadow-xs flex items-center justify-center space-x-2 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Add Emergency Contact</span>
              </button>
              <button
                onClick={() => setShowAddMedModal(true)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-3 rounded-2xl flex items-center justify-center space-x-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Medication Schedule</span>
              </button>
              <button
                onClick={() => setShowAddAptModal(true)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-3 rounded-2xl flex items-center justify-center space-x-2 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                <span>Add Doctor Appointment</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* TAB CONTENT: Emotion & Mood Trends */}
      {activeTab === 'mood' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
            <h2 className="font-bold text-lg text-slate-900">7-Day Emotion Analysis & Sentiment History</h2>
            <p className="text-xs text-slate-500">Monitored continuously during voice companion check-ins.</p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={emotionHistory}>
                  <XAxis dataKey="dayLabel" stroke="#94a3b8" fontSize={11} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Line type="monotone" dataKey="moodScore" stroke="#0284c7" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 pt-4">
              <h3 className="font-bold text-sm text-slate-800">Daily Emotion Records</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {emotionHistory.map((item) => (
                  <div key={item.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs text-slate-900">{item.dayLabel} ({item.date})</p>
                      <p className="text-xs text-slate-500">{item.notes || 'Normal daily check-in'}</p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sky-100 text-sky-800">
                      {item.emotion} ({item.moodScore})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
            <h2 className="font-bold text-base text-slate-900">Emotion Breakdown</h2>
            <div className="h-52 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={EMOTION_COLORS[entry.name] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-bold text-slate-800">Sentiment Comparison:</p>
              <p className="text-slate-600">• Week 1: <span className="font-bold text-emerald-600">88% Positive</span></p>
              <p className="text-slate-600">• Week 2: <span className="font-bold text-emerald-600">82% Positive</span></p>
              <p className="text-slate-600">• Week 3 (Current): <span className="font-bold text-indigo-600">80% Positive</span></p>
              <p className="text-[11px] text-slate-500 pt-1">
                Sentiment decline detection engine automatically alerts family if positive sentiment drops below 60%.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Medicines & Schedule */}
      {activeTab === 'meds' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b pb-4 border-slate-100">
            <div>
              <h2 className="font-bold text-lg text-slate-900">Medication Adherence & Schedule</h2>
              <p className="text-xs text-slate-500">Manage prescriptions, timing, and confirm taken doses</p>
            </div>
            <button
              onClick={() => setShowAddMedModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center space-x-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Medicine</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {medicines.map((med) => (
              <div key={med.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 relative group">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {med.category}
                    </span>
                    <h3 className="font-bold text-base text-slate-900">{med.name} ({med.dosage})</h3>
                    <p className="text-xs text-slate-500">{med.timeLabel}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      med.status === 'taken'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {med.status === 'taken' ? '✓ Taken' : 'Pending'}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveMedicine(med.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                      title="Remove Medicine"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/60">
                  {med.instructions}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Safety & Alerts */}
      {activeTab === 'alerts' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <h2 className="font-bold text-lg text-slate-900">All Alert History</h2>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-5 rounded-2xl border space-y-2 ${
                  alert.resolved
                    ? 'bg-slate-50 border-slate-200 text-slate-700'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded text-white ${
                      alert.severity === 'CRITICAL' ? 'bg-red-600' : 'bg-amber-600'
                    }`}>
                      {alert.severity}
                    </span>
                    <h3 className="font-bold text-sm">{alert.title}</h3>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{alert.timestamp}</span>
                </div>
                <p className="text-xs">{alert.description}</p>
                {!alert.resolved && (
                  <button
                    onClick={() => onAcknowledgeAlert(alert.id)}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-4 rounded-xl transition-colors"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Weekly AI Report */}
      {activeTab === 'report' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b pb-4 border-slate-100">
            <div>
              <h2 className="font-bold text-lg text-slate-900">Weekly AI Health & Care Summary</h2>
              <p className="text-xs text-slate-500">Automated LLM report analyzing conversation memory & risk factors</p>
            </div>
            <button
              onClick={onGenerateWeeklyReport}
              disabled={isGeneratingReport}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center space-x-2 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isGeneratingReport ? 'animate-spin' : ''}`} />
              <span>{isGeneratingReport ? 'Generating Report...' : 'Re-Generate AI Report'}</span>
            </button>
          </div>

          {weeklyReport && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-center">
                  <p className="text-xs font-bold text-indigo-700 uppercase">Overall Wellness</p>
                  <p className="text-2xl font-black text-indigo-900 mt-1">{weeklyReport.overallWellnessScore}/100</p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
                  <p className="text-xs font-bold text-emerald-700 uppercase">Medication Compliance</p>
                  <p className="text-2xl font-black text-emerald-900 mt-1">{weeklyReport.medicationAdherenceRate}</p>
                </div>
                <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100 text-center">
                  <p className="text-xs font-bold text-sky-700 uppercase">Risk Level</p>
                  <p className="text-2xl font-black text-sky-900 mt-1">{weeklyReport.riskAssessment}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Key Highlights this Week:</h3>
                  <ul className="list-disc list-inside text-xs text-slate-700 space-y-1 mt-2">
                    {weeklyReport.keyHighlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900">Emotional Analysis Summary:</h3>
                  <p className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 mt-1">
                    {weeklyReport.emotionalAnalysisSummary}
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-indigo-900">Recommended Actions for Family:</h3>
                  <ul className="list-disc list-inside text-xs text-indigo-900 space-y-1 mt-2 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                    {weeklyReport.familyActionRecommendations.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Add Medicine */}
      {showAddMedModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-slate-900">Add New Medication</h3>
            <form onSubmit={handleCreateMed} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Medicine Name</label>
                <input
                  type="text"
                  required
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  placeholder="e.g. Calcium + Vitamin D"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Dosage</label>
                <input
                  type="text"
                  required
                  value={medDosage}
                  onChange={(e) => setMedDosage(e.target.value)}
                  placeholder="e.g. 500 mg"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Time</label>
                <input
                  type="time"
                  required
                  value={medTime}
                  onChange={(e) => setMedTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Instructions</label>
                <textarea
                  value={medInstructions}
                  onChange={(e) => setMedInstructions(e.target.value)}
                  placeholder="e.g. Take 1 tablet with warm water after dinner."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm mt-1"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMedModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Appointment */}
      {showAddAptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-slate-900">Add Doctor Visit</h3>
            <form onSubmit={handleCreateApt} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Doctor Name</label>
                <input
                  type="text"
                  required
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="e.g. Dr. Robert Evans"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Specialty</label>
                <input
                  type="text"
                  value={docSpecialty}
                  onChange={(e) => setDocSpecialty(e.target.value)}
                  placeholder="e.g. Cardiology"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Clinic / Hospital</label>
                <input
                  type="text"
                  value={aptHospital}
                  onChange={(e) => setAptHospital(e.target.value)}
                  placeholder="e.g. Swedish Medical Center"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700">Date</label>
                  <input
                    type="date"
                    required
                    value={aptDate}
                    onChange={(e) => setAptDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Time</label>
                  <input
                    type="text"
                    value={aptTime}
                    onChange={(e) => setAptTime(e.target.value)}
                    placeholder="10:30 AM"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAptModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                >
                  Save Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
