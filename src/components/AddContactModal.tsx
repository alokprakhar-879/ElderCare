import React, { useState, useEffect, useRef } from 'react';
import { X, UserPlus, Phone, User, Heart, Shield, Edit3, Upload, Camera, Image } from 'lucide-react';
import { EmergencyContact } from '../types';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  editContact?: EmergencyContact | null;
  onSaveContact: (contact: Omit<EmergencyContact, 'id'>, contactId?: string) => void;
}

const RELATION_PRESETS = [
  'Daughter (Primary Caregiver)',
  'Son',
  'Spouse / Partner',
  'Primary Physician (Doctor)',
  'Geriatric Care Nurse',
  'Neighbor / Local Friend',
  'Emergency Dispatch (911)',
  'Other Relative'
];

export const AddContactModal: React.FC<AddContactModalProps> = ({
  isOpen,
  onClose,
  editContact,
  onSaveContact
}) => {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState(RELATION_PRESETS[0]);
  const [customRelation, setCustomRelation] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [avatar, setAvatar] = useState('');

  const contactFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editContact) {
      setName(editContact.name);
      setPhone(editContact.phone);
      setEmail(editContact.email || '');
      setIsPrimary(!!editContact.isPrimary);
      setAvatar(editContact.avatar || '');

      if (RELATION_PRESETS.includes(editContact.relationship)) {
        setRelationship(editContact.relationship);
        setCustomRelation('');
      } else {
        setRelationship('Other Relative');
        setCustomRelation(editContact.relationship);
      }
    } else {
      setName('');
      setRelationship(RELATION_PRESETS[0]);
      setCustomRelation('');
      setPhone('');
      setEmail('');
      setIsPrimary(false);
      setAvatar('');
    }
  }, [editContact, isOpen]);

  if (!isOpen) return null;

  const handleContactPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 7 * 1024 * 1024) {
        alert('Please select an image file under 7MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatar(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const finalRelation = relationship === 'Other Relative' && customRelation.trim()
      ? customRelation.trim()
      : relationship;

    onSaveContact(
      {
        name: name.trim(),
        relationship: finalRelation,
        phone: phone.trim(),
        email: email.trim(),
        isPrimary,
        avatar: avatar || undefined
      },
      editContact?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-sky-100 text-sky-700">
            {editContact ? <Edit3 className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">
              {editContact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {editContact ? 'Update phone number, name or relationship details' : 'Add family member or doctor details with photo'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={contactFileInputRef}
            onChange={handleContactPhotoUpload}
            accept="image/*"
            className="hidden"
          />

          {/* Contact Photo & Device Upload */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
            <div className="relative inline-block">
              <img
                src={avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                alt="Contact Avatar"
                className="w-16 h-16 rounded-full object-cover border-2 border-sky-300 mx-auto shadow-xs"
              />
              <button
                type="button"
                onClick={() => contactFileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-1 bg-sky-600 hover:bg-sky-700 text-white rounded-full shadow-xs"
                title="Upload photo from device"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => contactFileInputRef.current?.click()}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-sky-700 border border-sky-200 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 mx-auto transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-sky-600" />
              <span>Upload Contact Picture from Device</span>
            </button>
          </div>

          {/* Full Name */}
          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Contact Full Name *</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sarah Harper, Dr. Evans"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm mt-1 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Relationship Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
              <Heart className="w-3.5 h-3.5 text-slate-400" />
              <span>Relationship / Role *</span>
            </label>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm mt-1 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
            >
              {RELATION_PRESETS.map((preset, idx) => (
                <option key={idx} value={preset}>
                  {preset}
                </option>
              ))}
            </select>
            {relationship === 'Other Relative' && (
              <input
                type="text"
                placeholder="Specify relationship..."
                value={customRelation}
                onChange={(e) => setCustomRelation(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs mt-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>Phone Number *</span>
            </label>
            <input
              type="tel"
              required
              placeholder="e.g. (555) 890-1234 or +1 555 0192"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm mt-1 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Email (Optional) */}
          <div>
            <label className="text-xs font-bold text-slate-700">Email Address (Optional)</label>
            <input
              type="email"
              placeholder="e.g. contact@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm mt-1 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Is Primary Checkbox */}
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="isPrimaryCheck"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
            />
            <label htmlFor="isPrimaryCheck" className="text-xs font-semibold text-slate-700 flex items-center space-x-1 cursor-pointer">
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span>Set as Primary Emergency Contact</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-colors flex items-center space-x-1.5"
            >
              {editContact ? <Edit3 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              <span>{editContact ? 'Update Contact' : 'Save Contact'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
