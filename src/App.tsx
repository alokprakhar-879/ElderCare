/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserRole, SeniorProfile, Medicine, Appointment, ConversationLog, EmotionData, AlertItem, WeeklyReport, AppLanguage, UserAuth, EmergencyContact } from './types';
import {
  initialSeniorProfile,
  initialMedicines,
  initialAppointments,
  initialConversationLogs,
  initialEmotionHistory,
  initialAlerts,
  initialWeeklyReport,
  initialEmergencyContacts
} from './data/mockData';

import { Navbar } from './components/Navbar';
import { SeniorDashboard } from './components/SeniorDashboard';
import { FamilyDashboard } from './components/FamilyDashboard';
import { AuthScreen } from './components/AuthScreen';
import { ProfileModal } from './components/ProfileModal';
import { SosModal } from './components/SosModal';
import { AddContactModal } from './components/AddContactModal';

export default function App() {
  // Authentication & Role State (Email auth requirement)
  const [userAuth, setUserAuth] = useState<UserAuth | null>(null);
  
  // App Language Toggle State (English / Hindi requirement)
  const [language, setLanguage] = useState<AppLanguage>('en');

  // Senior Accessibility Settings
  const [largeFont, setLargeFont] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  // Core App Domain Data
  const [senior, setSenior] = useState<SeniorProfile>(initialSeniorProfile);
  const [medicines, setMedicines] = useState<Medicine[]>(initialMedicines);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [conversationLogs, setConversationLogs] = useState<ConversationLog[]>(initialConversationLogs);
  const [emotionHistory, setEmotionHistory] = useState<EmotionData[]>(initialEmotionHistory);
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(initialEmergencyContacts);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(initialWeeklyReport);

  // UI Modals & Calling States
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);

  // Handle Login & Sign Up
  const handleLogin = (authData: UserAuth) => {
    setUserAuth(authData);

    // If family member signed up, update family contact details
    if (authData.role === 'family' && authData.relationship) {
      setSenior((prev) => ({
        ...prev,
        familyContact: {
          ...prev.familyContact,
          name: authData.userName,
          relationship: authData.relationship || prev.familyContact.relationship,
          email: authData.email
        }
      }));
    }

    // If senior signed up with custom name
    if (authData.role === 'senior' && authData.userName) {
      setSenior((prev) => ({
        ...prev,
        name: authData.userName
      }));
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setUserAuth(null);
  };

  // Handle Profile Update (Avatar & Name customization)
  const handleUpdateProfile = (userName: string, avatarUrl: string) => {
    setUserAuth((prev) => (prev ? { ...prev, userName, avatarUrl } : null));

    // Update persistent registered users registry in localStorage
    if (userAuth?.email) {
      try {
        const saved = localStorage.getItem('eldercare_registered_users');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const updated = parsed.map((u: any) =>
              u.email.toLowerCase() === userAuth.email.toLowerCase()
                ? { ...u, userName, avatarUrl }
                : u
            );
            localStorage.setItem('eldercare_registered_users', JSON.stringify(updated));
          }
        }
      } catch (e) {
        console.warn('Failed updating registered user memory:', e);
      }
    }

    setSenior((prev) => {
      if (userAuth?.role === 'senior') {
        return {
          ...prev,
          name: userName,
          avatar: avatarUrl
        };
      } else {
        return {
          ...prev,
          familyContact: {
            ...prev.familyContact,
            name: userName
          }
        };
      }
    });
  };

  // Toggle Language
  const handleToggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'hi' : 'en'));
  };

  // Send Senior Voice or Typed Message to AI Voice Companion Backend
  const handleSendSeniorMessage = async (messageText: string) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Add user message to log
    const userLog: ConversationLog = {
      id: `chat_usr_${Date.now()}`,
      timestamp: timeNow,
      sender: 'senior',
      text: messageText
    };

    setConversationLogs((prev) => [...prev, userLog]);
    setIsAiThinking(true);

    try {
      const response = await fetch('/api/ai/voice-companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: messageText,
          seniorName: senior.name,
          medicines: medicines,
          previousLogs: conversationLogs,
          language: language
        })
      });

      const data = await response.json();

      const aiLog: ConversationLog = {
        id: `chat_ai_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sender: 'ai',
        text: data.replyText || (language === 'hi' ? `नमस्ते ${senior.name.split(' ')[0]}, मैं हमेशा आपके साथ हूँ।` : `I am always here with you, ${senior.name.split(' ')[0]}.`),
        detectedEmotion: data.detectedEmotion || "Normal",
        moodScore: data.moodScore || 80,
        riskLevel: data.healthRiskLevel || "LOW",
        audioPrompt: data.speechPrompt,
        suggestedQuickReplies: Array.isArray(data.suggestedQuickReplies) ? data.suggestedQuickReplies : []
      };

      setConversationLogs((prev) => [...prev, aiLog]);

      // Record emotion history point
      if (data.detectedEmotion && data.moodScore) {
        const todayStr = new Date().toISOString().split('T')[0];
        setEmotionHistory((prev) => [
          ...prev,
          {
            id: `emo_${Date.now()}`,
            date: todayStr,
            dayLabel: 'Today',
            moodScore: data.moodScore,
            emotion: data.detectedEmotion,
            sentiment: data.sentiment || 'Positive',
            notes: messageText
          }
        ]);
      }

      // Check if medicine action was reported
      if (data.medicineMentioned && data.medicineMentioned.action === 'taken') {
        setMedicines((prev) =>
          prev.map((med) => {
            if (med.status === 'pending') {
              return { ...med, status: 'taken' };
            }
            return med;
          })
        );
      }

      // Check for Emergency Alert Intent / Voice command trigger
      const lowerMsg = messageText.toLowerCase();
      const isEmergencyAlertRequest =
        data.emergencyAlertGenerated ||
        data.healthRiskLevel === 'CRITICAL' ||
        lowerMsg.includes('send alert') ||
        lowerMsg.includes('alert family') ||
        lowerMsg.includes('alert to family') ||
        lowerMsg.includes('alert my family') ||
        lowerMsg.includes('family alert') ||
        lowerMsg.includes('sos') ||
        lowerMsg.includes('emergency alert') ||
        lowerMsg.includes('आपातकालीन') ||
        lowerMsg.includes('अलर्ट');

      if (isEmergencyAlertRequest) {
        handleConfirmSos();
        setIsSosOpen(true);
      }

      // Check for Health Risk Trigger / Emergency Alert
      if (data.emergencyAlertGenerated || data.healthRiskLevel === 'CRITICAL' || data.healthRiskLevel === 'HIGH') {
        const timeFormatted = `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (Today)`;
        const newAlert: AlertItem = {
          id: `alert_${Date.now()}`,
          timestamp: timeFormatted,
          severity: data.healthRiskLevel || 'CRITICAL',
          title: language === 'hi' ? 'वॉयस चैट के दौरान स्वास्थ्य जोखिम अलर्ट' : 'Health Risk Triggered during Voice Chat',
          description: data.alertMessage || `Senior expressed concern: "${messageText}"`,
          seniorName: senior.name,
          seniorEmail: userAuth?.email || 'evelyn.harper@example.com',
          familyGroupId: userAuth?.familyGroupId || 'family_default',
          acknowledged: false,
          resolved: false,
          type: 'HEALTH_PAIN'
        };

        setAlerts((prev) => [newAlert, ...prev]);
        setIsSosOpen(true);
      }
    } catch (err) {
      console.error('Error communicating with AI Companion:', err);
      // Fallback response
      const fallbackLog: ConversationLog = {
        id: `chat_ai_fallback_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sender: 'ai',
        text: language === 'hi'
          ? `धन्यवाद बताने के लिए, ${senior.name.split(' ')[0]}। मैंने आपकी बात दर्ज कर ली है!`
          : `Thank you for sharing that with me, ${senior.name.split(' ')[0]}. I am logging your details for your family records!`,
        detectedEmotion: 'Normal',
        moodScore: 80,
        riskLevel: 'LOW'
      };
      setConversationLogs((prev) => [...prev, fallbackLog]);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Handle SOS Confirmation Dispatch
  const handleConfirmSos = () => {
    const timeFormatted = `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (Today)`;

    const sosAlert: AlertItem = {
      id: `sos_${Date.now()}`,
      timestamp: timeFormatted,
      severity: 'CRITICAL',
      title: language === 'hi' ? '🚨 आपातकालीन SOS बटन दबाया गया!' : '🚨 CRITICAL EMERGENCY SOS DISPATCHED',
      description: language === 'hi'
        ? `${senior.name} ने आपातकालीन SOS बटन दबाया है। परिवार और चिकित्सा दल को तुरंत सतर्क कर दिया गया है।`
        : `${senior.name} pressed the Emergency SOS button. Family caregivers and medical dispatch alerted.`,
      seniorName: senior.name,
      seniorEmail: userAuth?.email || 'evelyn.harper@example.com',
      familyGroupId: userAuth?.familyGroupId || 'family_default',
      acknowledged: false,
      resolved: false,
      type: 'SOS_BUTTON'
    };

    setAlerts((prev) => [sosAlert, ...prev]);

    const sosUserLog: ConversationLog = {
      id: `chat_sos_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sender: 'senior',
      text: language === 'hi' ? '🚨 आपातकालीन SOS बटन दबाया गया!' : '🚨 CRITICAL EMERGENCY SOS BUTTON PRESSED!',
      detectedEmotion: 'Anxious',
      moodScore: 20,
      riskLevel: 'CRITICAL'
    };

    const sosAiLog: ConversationLog = {
      id: `chat_ai_sos_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sender: 'ai',
      text: language === 'hi'
        ? `नमस्ते ${senior.name.split(' ')[0]} जी! आपके परिवार को तुरंत सुरक्षा अलर्ट भेज दिया गया है। कृपया आराम से सुरक्षित बैठ जाएं।`
        : `Dear ${senior.name.split(' ')[0]}, an urgent emergency alert has been sent to your family caregiver. Please sit down safely and stay calm.`,
      detectedEmotion: 'Anxious',
      moodScore: 20,
      riskLevel: 'CRITICAL'
    };

    setConversationLogs((prev) => [...prev, sosUserLog, sosAiLog]);
  };

  // Senior takes medicine
  const handleTakeMedicine = (medicineId: string) => {
    setMedicines((prev) =>
      prev.map((m) => (m.id === medicineId ? { ...m, status: 'taken' } : m))
    );

    const targetMed = medicines.find((m) => m.id === medicineId);

    // AI praise log
    const praiseLog: ConversationLog = {
      id: `chat_praise_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sender: 'ai',
      text: language === 'hi'
        ? `बहुत बढ़िया, ${senior.name.split(' ')[0]}! मैंने दर्ज कर लिया है कि आपने अपनी ${targetMed?.name || 'दवा'} ले ली है।`
        : `Wonderful job, ${senior.name.split(' ')[0]}! I have logged that you took your ${targetMed?.name || 'medication'}.`,
      detectedEmotion: 'Happy',
      moodScore: 90
    };
    setConversationLogs((prev) => [...prev, praiseLog]);
  };

  // Acknowledge Alert
  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true, resolved: true } : a))
    );
  };

  // Add Medicine
  const handleAddMedicine = (newMed: Omit<Medicine, 'id' | 'status'>) => {
    const created: Medicine = {
      ...newMed,
      id: `med_${Date.now()}`,
      status: 'pending'
    };
    setMedicines((prev) => [...prev, created]);
  };

  // Remove Medicine (Requirement 2)
  const handleRemoveMedicine = (medicineId: string) => {
    setMedicines((prev) => prev.filter((m) => m.id !== medicineId));
  };

  // Add Appointment
  const handleAddAppointment = (newApt: Omit<Appointment, 'id' | 'status'>) => {
    const created: Appointment = {
      ...newApt,
      id: `apt_${Date.now()}`,
      status: 'upcoming'
    };
    setAppointments((prev) => [...prev, created]);
  };

  // Add or Edit Emergency Contact
  const handleSaveEmergencyContact = (contactData: Omit<EmergencyContact, 'id'>, contactId?: string) => {
    if (contactId) {
      // Editing existing contact
      setEmergencyContacts((prev) =>
        prev.map((c) => {
          if (c.id === contactId) {
            return { ...contactData, id: contactId };
          }
          if (contactData.isPrimary) {
            return { ...c, isPrimary: false };
          }
          return c;
        })
      );
    } else {
      // Adding new contact
      const newContact: EmergencyContact = {
        ...contactData,
        id: `c_${Date.now()}`
      };
      setEmergencyContacts((prev) => {
        const updated = newContact.isPrimary
          ? prev.map((c) => ({ ...c, isPrimary: false }))
          : prev;
        return [newContact, ...updated];
      });
    }
  };

  const handleOpenEditContact = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setIsAddContactOpen(true);
  };

  // Remove Emergency Contact
  const handleRemoveEmergencyContact = (contactId: string) => {
    setEmergencyContacts((prev) => prev.filter((c) => c.id !== contactId));
  };

  // Generate Weekly Report via Backend AI
  const handleGenerateWeeklyReport = async () => {
    setIsGeneratingReport(true);
    try {
      const response = await fetch('/api/ai/weekly-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seniorName: senior.name,
          emotionLogs: emotionHistory,
          medicineCompliance: `${Math.round(
            (medicines.filter((m) => m.status === 'taken').length / Math.max(medicines.length, 1)) * 100
          )}%`,
          alerts: alerts
        })
      });
      const data = await response.json();
      setWeeklyReport(data);
    } catch (e) {
      console.error('Failed to generate weekly report:', e);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Filter alerts for family dashboard (linking senior and family members)
  const familySpecificAlerts = alerts.filter((a) => {
    if (userAuth?.role === 'family') {
      if (a.familyGroupId && userAuth.familyGroupId && a.familyGroupId === userAuth.familyGroupId) {
        return true;
      }
      if (a.seniorEmail && userAuth.seniorEmail && a.seniorEmail === userAuth.seniorEmail) {
        return true;
      }
      if (
        a.seniorName &&
        userAuth.memberName &&
        (a.seniorName.toLowerCase().includes(userAuth.memberName.toLowerCase()) ||
          userAuth.memberName.toLowerCase().includes(a.seniorName.toLowerCase()))
      ) {
        return true;
      }
      return true; // Ensure alerts always flow to family dashboard
    }
    return true;
  });

  const activeAlertCount = familySpecificAlerts.filter((a) => !a.resolved).length;

  // 1. Gated Access: Show Authentication Screen if user is not logged in
  if (!userAuth || !userAuth.isAuthenticated) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div
      id="app-container"
      className={`min-h-screen transition-colors ${
        highContrast ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
      }`}
    >
      {/* Top Navbar */}
      <Navbar
        userAuth={userAuth}
        currentRole={userAuth.role}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        onOpenProfile={() => setIsProfileOpen(true)}
        onLogout={handleLogout}
        largeFont={largeFont}
        onToggleLargeFont={() => setLargeFont(!largeFont)}
        highContrast={highContrast}
        onToggleHighContrast={() => setHighContrast(!highContrast)}
        onTriggerSos={() => setIsSosOpen(true)}
        activeAlertCount={activeAlertCount}
      />

      {/* Main Role-Based Dashboard View */}
      <main id="app-main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Senior Citizen Mode: Strictly displayed when logged in as senior */}
        {userAuth.role === 'senior' && (
          <SeniorDashboard
            senior={senior}
            medicines={medicines}
            appointments={appointments}
            conversationLogs={conversationLogs}
            emergencyContacts={emergencyContacts}
            language={language}
            onToggleLanguage={handleToggleLanguage}
            largeFont={largeFont}
            highContrast={highContrast}
            onTakeMedicine={handleTakeMedicine}
            onSendSeniorMessage={handleSendSeniorMessage}
            onTriggerSos={() => setIsSosOpen(true)}
            onOpenAddContact={() => { setEditingContact(null); setIsAddContactOpen(true); }}
            onEditContact={handleOpenEditContact}
            onRemoveContact={handleRemoveEmergencyContact}
            isAiThinking={isAiThinking}
          />
        )}

        {/* Family Member Mode: Strictly displayed when logged in as family member */}
        {userAuth.role === 'family' && (
          <FamilyDashboard
            senior={senior}
            medicines={medicines}
            appointments={appointments}
            conversationLogs={conversationLogs}
            emotionHistory={emotionHistory}
            alerts={familySpecificAlerts}
            emergencyContacts={emergencyContacts}
            weeklyReport={weeklyReport}
            onAcknowledgeAlert={handleAcknowledgeAlert}
            onAddMedicine={handleAddMedicine}
            onRemoveMedicine={handleRemoveMedicine}
            onAddAppointment={handleAddAppointment}
            onGenerateWeeklyReport={handleGenerateWeeklyReport}
            onOpenAddContact={() => { setEditingContact(null); setIsAddContactOpen(true); }}
            onEditContact={handleOpenEditContact}
            onRemoveContact={handleRemoveEmergencyContact}
            isGeneratingReport={isGeneratingReport}
          />
        )}
      </main>

      {/* Profile Customization Modal */}
      {isProfileOpen && (
        <ProfileModal
          userAuth={userAuth}
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          onSave={handleUpdateProfile}
        />
      )}

      {/* Add / Edit Emergency Contact Modal */}
      <AddContactModal
        isOpen={isAddContactOpen}
        onClose={() => { setIsAddContactOpen(false); setEditingContact(null); }}
        editContact={editingContact}
        onSaveContact={handleSaveEmergencyContact}
      />

      {/* Emergency SOS Modal (Auto closes after 3s dispatch) */}
      <SosModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        seniorName={senior.name}
        onConfirmSos={handleConfirmSos}
      />
    </div>
  );
}
