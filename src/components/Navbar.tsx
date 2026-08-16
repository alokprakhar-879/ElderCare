import React from 'react';
import { UserRole, AppLanguage, UserAuth } from '../types';
import { HeartPulse, User, Users, Sun, Moon, Type, AlertTriangle, Globe, LogOut, Settings } from 'lucide-react';

interface NavbarProps {
  userAuth: UserAuth;
  currentRole: UserRole;
  language: AppLanguage;
  onToggleLanguage: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  largeFont: boolean;
  onToggleLargeFont: () => void;
  highContrast: boolean;
  onToggleHighContrast: () => void;
  onTriggerSos: () => void;
  activeAlertCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  userAuth,
  currentRole,
  language,
  onToggleLanguage,
  onOpenProfile,
  onLogout,
  largeFont,
  onToggleLargeFont,
  highContrast,
  onToggleHighContrast,
  onTriggerSos,
  activeAlertCount
}) => {
  return (
    <header id="main-header" className={`border-b sticky top-0 z-40 transition-colors ${
      highContrast ? 'bg-slate-950 text-white border-slate-800' : 'bg-white text-slate-800 border-slate-200/80 shadow-xs'
    }`}>
      {/* Top Banner for Weather, Language, & Accessibility Status */}
      <div id="top-status-bar" className={`px-4 py-1.5 text-xs border-b flex flex-wrap items-center justify-between gap-2 ${
        highContrast ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-sky-50/80 border-sky-100 text-slate-600'
      }`}>
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center font-medium text-sky-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5"></span>
            {language === 'hi' ? 'AI वॉयस साथी "ग्रेस" सक्रिय (Hindi Mode)' : 'AI Companion "Grace" Active (English Mode)'}
          </span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span className="hidden sm:inline">Seattle, WA • 68°F Partly Sunny</span>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Language Switcher */}
          <button
            id="toggle-language-btn"
            onClick={onToggleLanguage}
            className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 flex items-center space-x-1 transition-colors shadow-2xs"
            title="Toggle Language (English / Hindi)"
          >
            <Globe className="w-3.5 h-3.5 text-sky-600" />
            <span>{language === 'hi' ? '🇮🇳 हिंदी (Hindi)' : '🇬🇧 English'}</span>
          </button>

          {/* Senior Accessibility Quick Toggles */}
          <button
            id="toggle-large-font-btn"
            onClick={onToggleLargeFont}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold border flex items-center space-x-1 transition-colors ${
              largeFont
                ? 'bg-sky-600 text-white border-sky-600'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
            title="Toggle Large Text Mode"
          >
            <Type className="w-3 h-3" />
            <span>{largeFont ? 'Text: Large' : 'Text: Normal'}</span>
          </button>

          <button
            id="toggle-contrast-btn"
            onClick={onToggleHighContrast}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold border flex items-center space-x-1 transition-colors ${
              highContrast
                ? 'bg-amber-400 text-slate-950 border-amber-400'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
            title="Toggle High Contrast Mode"
          >
            {highContrast ? <Sun className="w-3 h-3 text-slate-950" /> : <Moon className="w-3 h-3" />}
            <span>{highContrast ? 'Contrast: High' : 'Contrast: Soft'}</span>
          </button>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div id="nav-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div id="brand-logo" className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight leading-tight">
                ElderCare
              </h1>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {language === 'hi' ? 'इंटेलिजेंट वॉयस साथी एवं केयर नेटवर्क' : 'Intelligent Voice Companion & Care Network'}
            </p>
          </div>
        </div>

        {/* Current Role Badge (Strict Role Rendering - No tab switching allowed) */}
        <div className="hidden md:flex items-center space-x-2">
          <div className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-2 border ${
            currentRole === 'senior'
              ? 'bg-sky-50 text-sky-800 border-sky-200'
              : 'bg-indigo-50 text-indigo-800 border-indigo-200'
          }`}>
            {currentRole === 'senior' ? (
              <>
                <User className="w-4 h-4 text-sky-600" />
                <span>Senior Citizen Portal Mode</span>
              </>
            ) : (
              <>
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Family Members Care Dashboard</span>
                {activeAlertCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1">
                    {activeAlertCount}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Action Controls: Profile Settings, Logout & SOS */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* User Profile Button */}
          <button
            onClick={onOpenProfile}
            className="flex items-center space-x-2 p-1 sm:px-2.5 sm:py-1 rounded-2xl hover:bg-slate-100 border border-slate-200/80 transition-all text-left"
            title="Edit Profile Picture & Name"
          >
            <img
              src={userAuth.avatarUrl}
              alt={userAuth.userName}
              className="w-8 h-8 rounded-full object-cover border border-sky-300"
            />
            <div className="hidden sm:block">
              <div className="flex items-center space-x-1.5">
                <p className="text-xs font-bold text-slate-800 leading-none">{userAuth.userName}</p>
                {userAuth.userId && (
                  <span className="text-[9px] bg-sky-100 text-sky-800 font-mono font-extrabold px-1.5 py-0.2 rounded">
                    {userAuth.userId}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 capitalize mt-0.5">{currentRole} Mode</p>
            </div>
            <Settings className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-red-700 hover:bg-red-50 border border-slate-200 transition-colors flex items-center space-x-1"
            title="Switch Account / Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>

          {/* Big SOS Emergency Trigger (Senior Citizen Mode Only) */}
          {currentRole === 'senior' && (
            <button
              id="global-sos-btn"
              onClick={onTriggerSos}
              className="bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs sm:text-sm font-bold px-3.5 py-2 rounded-xl shadow-md shadow-red-500/20 flex items-center space-x-1.5 transition-all animate-pulse"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>SOS</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
