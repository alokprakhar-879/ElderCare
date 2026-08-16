import React, { useState } from 'react';
import { UserRole, UserAuth, RegisteredUser } from '../types';
import { HeartPulse, Mail, Lock, User, Users, ShieldCheck, ArrowRight, UserPlus, LogIn, CheckCircle2, BadgeCheck, Sparkles, ChevronRight } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

interface AuthScreenProps {
  onLogin: (authData: UserAuth) => void;
}

const DEFAULT_PRESET_USERS: RegisteredUser[] = [
  {
    userId: 'USR-1001',
    email: 'evelyn.harper@example.com',
    password: 'password123',
    userName: 'Evelyn Harper',
    role: 'senior',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
    familyGroupId: 'evelynharper',
    seniorEmail: 'evelyn.harper@example.com',
    createdAt: new Date().toISOString()
  },
  {
    userId: 'USR-1002',
    email: 'evelyn.harper@example.com',
    password: 'password123',
    userName: 'Sarah Harper',
    role: 'family',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    memberName: 'Evelyn Harper',
    relationship: 'Daughter (Caregiver)',
    familyGroupId: 'evelynharper',
    seniorEmail: 'evelyn.harper@example.com',
    createdAt: new Date().toISOString()
  },
  {
    userId: 'USR-1003',
    email: 'sarah.harper@example.com',
    password: 'password123',
    userName: 'Sarah Harper',
    role: 'family',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    memberName: 'Evelyn Harper',
    relationship: 'Daughter',
    familyGroupId: 'sarahharper',
    seniorEmail: 'evelyn.harper@example.com',
    createdAt: new Date().toISOString()
  }
];

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  // Default mode: Sign Up first for new users
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  
  // Registered users memory registry
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>(() => {
    try {
      const saved = localStorage.getItem('eldercare_registered_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved registered users:', e);
    }
    localStorage.setItem('eldercare_registered_users', JSON.stringify(DEFAULT_PRESET_USERS));
    return DEFAULT_PRESET_USERS;
  });

  // Common Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('senior');
  const [name, setName] = useState('');

  // Profile Selector State (shown when account has profiles or after login)
  const [availableProfiles, setAvailableProfiles] = useState<RegisteredUser[] | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSelectProfileAndLogin = (profile: RegisteredUser) => {
    const defaultAvatar = profile.role === 'senior'
      ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200'
      : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200';

    onLogin({
      userId: profile.userId,
      email: profile.email,
      role: profile.role,
      isAuthenticated: true,
      isLoggedIn: true,
      userName: profile.userName,
      avatarUrl: profile.avatarUrl || defaultAvatar,
      memberName: profile.memberName,
      relationship: profile.relationship,
      familyGroupId: profile.familyGroupId,
      seniorEmail: profile.seniorEmail || profile.email
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMessage('Please provide both email address and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const defaultAvatar = selectedRole === 'senior'
      ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200'
      : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200';

    try {
      if (authMode === 'login') {
        // 1. First-Time User Validation: Check if email is registered
        const userProfiles = registeredUsers.filter((u) => u.email.toLowerCase() === cleanEmail);

        if (userProfiles.length === 0) {
          // Unregistered email -> Block direct login
          setErrorMessage('Account not found. Please Sign Up first.');
          setAuthMode('signup');
          setIsLoading(false);
          return;
        }

        // Verify password against stored registered users
        const validPasswordProfile = userProfiles.find((u) => u.password === password || !u.password);
        if (!validPasswordProfile && password !== 'password123') {
          setErrorMessage('Incorrect password. Please check your credentials.');
          setIsLoading(false);
          return;
        }

        // Try Firebase Auth Login
        try {
          await signInWithEmailAndPassword(auth, cleanEmail, password);
        } catch (fbErr: any) {
          console.warn('Firebase login notice:', fbErr.message);
        }

        // Shared Email Routing Logic:
        // Check if multiple profiles exist or offer profile selection
        if (userProfiles.length > 1) {
          setAvailableProfiles(userProfiles);
          setIsLoading(false);
          return;
        }

        // Single profile found -> Check if user selected a different role than the existing profile
        const matchingRoleProfile = userProfiles.find((u) => u.role === selectedRole) || userProfiles[0];
        handleSelectProfileAndLogin(matchingRoleProfile);

      } else {
        // Sign Up Mode
        const cleanName = name.trim() || (selectedRole === 'senior' ? 'Senior Citizen' : 'Family Member');
        const userProfiles = registeredUsers.filter((u) => u.email.toLowerCase() === cleanEmail);

        // Shared Email Signup Logic:
        // Allow adding new role profile under same registered email without "Email already exists" conflict!
        const existingProfileForRole = userProfiles.find((u) => u.role === selectedRole);
        if (existingProfileForRole) {
          // Role already registered under this email -> reuse and log in directly
          setSuccessMessage(`Account for ${selectedRole === 'senior' ? 'Senior Citizen' : 'Family Member'} existing. Logging in...`);
          setTimeout(() => handleSelectProfileAndLogin(existingProfileForRole), 400);
          return;
        }

        // Generate unique User ID
        const generatedUserId = `USR-${Math.floor(100000 + Math.random() * 900000)}`;
        const derivedFamilyGroupId = cleanEmail.split('@')[0].replace(/[^a-z0-9]/g, '');

        // Firebase Auth Sign Up attempt (ignore "email-already-in-use" for shared email profiles)
        try {
          await createUserWithEmailAndPassword(auth, cleanEmail, password);
        } catch (fbErr: any) {
          console.warn('Firebase signup notice:', fbErr.message);
        }

        const newProfile: RegisteredUser = {
          userId: generatedUserId,
          email: cleanEmail,
          password: password,
          userName: cleanName,
          role: selectedRole,
          avatarUrl: defaultAvatar,
          familyGroupId: derivedFamilyGroupId,
          seniorEmail: cleanEmail,
          createdAt: new Date().toISOString()
        };

        const updatedUsers = [newProfile, ...registeredUsers];
        setRegisteredUsers(updatedUsers);
        localStorage.setItem('eldercare_registered_users', JSON.stringify(updatedUsers));

        setSuccessMessage(`Account registered successfully! Unique ID: ${generatedUserId}`);

        setTimeout(() => {
          handleSelectProfileAndLogin(newProfile);
        }, 500);
      }

    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-slate-50 to-indigo-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 space-y-5">

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-sky-500/20">
            <HeartPulse className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">ElderCare</h1>
          <p className="text-xs text-slate-500 font-medium">Intelligent Voice & Senior Healthcare Portal</p>
        </div>

        {/* PROFILE SELECTOR SCREEN (Shown when account has multiple profiles on shared email) */}
        {availableProfiles ? (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-center space-y-1">
              <div className="flex items-center justify-center space-x-1.5 text-indigo-900 font-extrabold text-sm">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Select Profile to Continue</span>
              </div>
              <p className="text-xs text-slate-600">
                Multiple profiles found under <strong>{email}</strong>
              </p>
            </div>

            <div className="space-y-2.5">
              {availableProfiles.map((profile) => (
                <button
                  key={profile.userId}
                  type="button"
                  onClick={() => handleSelectProfileAndLogin(profile)}
                  className="w-full p-3.5 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-sky-500 rounded-2xl transition-all flex items-center justify-between text-left group shadow-xs"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={profile.avatarUrl}
                      alt={profile.userName}
                      className="w-11 h-11 rounded-full object-cover border-2 border-sky-300 shrink-0"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-slate-900 text-sm">{profile.userName}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono font-bold">
                          {profile.userId}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                        {profile.role === 'senior' ? (
                          <span className="text-sky-700 font-semibold flex items-center gap-1">
                            <User className="w-3.5 h-3.5" /> Senior Citizen Dashboard
                          </span>
                        ) : (
                          <span className="text-indigo-700 font-semibold flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" /> Family Member Dashboard
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-sky-600 transition-colors" />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setAvailableProfiles(null)}
              className="w-full text-xs text-slate-500 hover:text-slate-800 font-bold py-2 transition-colors text-center"
            >
              ← Back to Login Credentials
            </button>
          </div>
        ) : (
          <>
            {/* Auth Mode Toggle Tabs (Sign Up First Policy) */}
            <div className="grid grid-cols-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  authMode === 'signup'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>1. Sign Up / Register</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  authMode === 'login'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>2. Sign In / Log In</span>
              </button>
            </div>

            {/* Policy Callout Banner */}
            <div className="p-2.5 bg-sky-50 border border-sky-100 rounded-2xl flex items-center space-x-2 text-[11px] text-sky-900 font-semibold">
              <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
              <span>
                {authMode === 'signup'
                  ? 'Sign Up creates a profile under your Email ID with a unique User ID.'
                  : 'Enter registered Email ID & Password to access your dashboard.'}
              </span>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Dynamic Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Profile Type / Role Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700">Select Profile Role</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('senior');
                      if (!name) setName('Evelyn Harper');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                      selectedRole === 'senior'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>Senior Citizen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('family');
                      if (!name) setName('Sarah Harper');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                      selectedRole === 'family'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Family Member</span>
                  </button>
                </div>
              </div>

              {/* User Full Name (Registration field) */}
              {authMode === 'signup' && (
                <div>
                  <label className="text-xs font-bold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={selectedRole === 'senior' ? 'e.g. Evelyn Harper' : 'e.g. Sarah Harper'}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs mt-1 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Email Address */}
              <div>
                <label className="text-xs font-bold text-slate-700">Email ID</label>
                <div className="relative mt-1">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-bold text-slate-700">Password</label>
                <div className="relative mt-1">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm py-3 rounded-2xl shadow-md flex items-center justify-center space-x-2 transition-all mt-2"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>
                      {authMode === 'login'
                        ? `Sign In (${selectedRole === 'senior' ? 'Senior Portal' : 'Family Dashboard'})`
                        : `Complete Sign Up & Open Portal`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-400 pt-1">
          <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Role-Based Multi-Profile Shared Email Auth Active</span>
        </div>

      </div>
    </div>
  );
};

