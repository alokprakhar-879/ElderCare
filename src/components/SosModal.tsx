import React, { useState, useEffect } from 'react';
import { AlertTriangle, PhoneCall, ShieldAlert, X, CheckCircle2, Siren } from 'lucide-react';

interface SosModalProps {
  isOpen: boolean;
  onClose: () => void;
  seniorName: string;
  onConfirmSos: () => void;
}

export const SosModal: React.FC<SosModalProps> = ({ isOpen, onClose, seniorName, onConfirmSos }) => {
  const [countdown, setCountdown] = useState(3);
  const [dispatched, setDispatched] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(3);
      setDispatched(false);
      return;
    }

    // Audio alarm simulation using Web Audio API
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      // Audio fallback
    }

    let closeTimeout: any;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setDispatched(true);
          onConfirmSos();
          // Auto close modal after brief dispatch feedback
          closeTimeout = setTimeout(() => {
            onClose();
          }, 1500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      if (closeTimeout) clearTimeout(closeTimeout);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-red-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border-4 border-red-500 text-center space-y-6 relative overflow-hidden animate-in fade-in zoom-in-95">

        {/* Top Siren Animation */}
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600 animate-pulse">
          <Siren className="w-10 h-10 animate-spin-slow" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-100 text-red-800 font-extrabold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>CRITICAL EMERGENCY SOS TRIGGERED</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            {dispatched ? 'Emergency Contacts Dispatched!' : `Alerting Family for ${seniorName}`}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            {dispatched
              ? 'Urgent notifications sent via SMS, WhatsApp, and family dashboard.'
              : `Dispatched automatically in ${countdown} seconds unless cancelled.`}
          </p>
        </div>

        {!dispatched && (
          <div className="text-5xl font-black text-red-600 font-mono">
            00:0{countdown}
          </div>
        )}

        {/* Contact List Status */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2 text-xs">
          <p className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">Dispatch Status:</p>

          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
            <div className="flex items-center space-x-2">
              <PhoneCall className="w-4 h-4 text-sky-600" />
              <span className="font-bold text-slate-800">Sarah Harper (Daughter)</span>
            </div>
            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
              {dispatched ? 'Alert Sent ✓' : 'Queued'}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-indigo-600" />
              <span className="font-bold text-slate-800">Dr. Robert Evans (Physician)</span>
            </div>
            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
              {dispatched ? 'Notified ✓' : 'Queued'}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="font-bold text-slate-800">Local EMS Dispatch (911)</span>
            </div>
            <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
              {dispatched ? 'Ready for Standby' : 'Queued'}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-3.5 px-4 rounded-2xl text-xs sm:text-sm transition-colors"
          >
            FALSE ALARM (CANCEL)
          </button>
          {!dispatched && (
            <button
              onClick={() => {
                setDispatched(true);
                onConfirmSos();
              }}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-extrabold py-3.5 px-4 rounded-2xl text-xs sm:text-sm shadow-md transition-colors"
            >
              DISPATCH NOW
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
