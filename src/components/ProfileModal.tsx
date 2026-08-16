import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Check, Upload, Image, RotateCcw } from 'lucide-react';
import { UserAuth } from '../types';

interface ProfileModalProps {
  userAuth: UserAuth | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newName: string, newAvatar: string) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250'
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  userAuth,
  isOpen,
  onClose,
  onSave
}) => {
  const [name, setName] = useState(userAuth?.userName || '');
  const [avatarUrl, setAvatarUrl] = useState(userAuth?.avatarUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize state when modal opens or userAuth updates
  useEffect(() => {
    if (userAuth) {
      setName(userAuth.userName || '');
      setAvatarUrl(userAuth.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250');
    }
  }, [userAuth, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 7 * 1024 * 1024) {
        alert('Please select an image file under 7MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), avatarUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 relative">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <h3 className="text-xl font-extrabold text-slate-900">Customize Profile</h3>
          <p className="text-xs text-slate-500 font-medium">Update profile picture and account display name</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />

          {/* Avatar Preview & Device Upload Selection */}
          <div className="text-center space-y-3">
            <div className="relative inline-block group">
              <img
                src={avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250'}
                alt="Profile Preview"
                className="w-24 h-24 rounded-full object-cover border-4 border-sky-100 shadow-md mx-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250';
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-sky-600 hover:bg-sky-700 text-white rounded-full shadow-md transition-transform active:scale-95"
                title="Upload picture from device"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Direct Device Upload Button */}
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs rounded-xl border border-sky-200 transition-colors flex items-center justify-center space-x-2 mx-auto"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Picture from Device</span>
              </button>
            </div>

            <div className="pt-1">
              <p className="text-xs font-bold text-slate-700 mb-2">Or Choose Preset Avatar:</p>
              <div className="flex items-center justify-center space-x-2">
                {PRESET_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarUrl(url)}
                    className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all ${
                      avatarUrl === url ? 'border-sky-600 scale-110 shadow-sm' : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt="Preset" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-1">
              <label className="text-[11px] font-bold text-slate-500">Or Custom Image URL:</label>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs mt-1 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Account Details & Permanent ID */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Permanent Account User ID:</span>
              <span className="font-mono font-extrabold bg-sky-100 text-sky-800 px-2 py-0.5 rounded text-[11px]">
                {userAuth?.userId || 'USR-1001'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Registered Email:</span>
              <span className="font-bold text-slate-800">{userAuth?.email || 'evelyn.harper@example.com'}</span>
            </div>
          </div>

          {/* User Name Input */}
          <div>
            <label className="text-xs font-bold text-slate-700">Display Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm mt-1 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
