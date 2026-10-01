import React, { useEffect } from 'react';
import {
  X,
  Building2,
  MapPin,
  Mail,
  User,
  Shield,
  Clock,
  Calendar,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { formatDateForDisplay } from '../../lib/utils/dateUtils';

const InstituteDetailModal = ({ isOpen, onClose, institute }) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !institute) return null;

  // Normalizing contacts
  let contacts = [];
  try {
    contacts = typeof institute.contact_emails === 'string'
      ? JSON.parse(institute.contact_emails)
      : institute.contact_emails || [];
  } catch (e) {
    contacts = [];
  }

  const primaryContact = contacts.find((c) => c.isDefault) || contacts[0];
  const secondaryContacts = contacts.filter((c) => c !== primaryContact);

  const isExpired = (dateStr) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  const isActive = institute.status !== 'inactive';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in fade-in duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {institute.institute_name}
              </h2>
              <p className="text-xs text-slate-500">Institute ID: {institute.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status */}
            <div className="flex items-center gap-3.5 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-100 hover:shadow-sm transition-all duration-200">
              <div className={`p-2.5 rounded-xl ${isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Status
                </p>
                <span className={`inline-flex items-center gap-1.5 mt-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Token Expiry */}
            <div className="flex items-center gap-3.5 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-100 hover:shadow-sm transition-all duration-200">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Token Expiry
                </p>
                <div className="mt-0.5 text-sm font-semibold">
                  {!institute.temp_expiry ? (
                    <span className="text-slate-500">Not Sent</span>
                  ) : isExpired(institute.temp_expiry) ? (
                    <span className="text-red-600">
                      Expired ({formatDateForDisplay(institute.temp_expiry)})
                    </span>
                  ) : (
                    <span className="text-blue-600">
                      {formatDateForDisplay(institute.temp_expiry)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Institute Type */}
            <div className="flex items-center gap-3.5 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-100 hover:shadow-sm transition-all duration-200">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Course Type Support
                </p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">
                  {institute.institute_type || 'None'}
                </p>
              </div>
            </div>

            {/* Upload Format */}
            <div className="flex items-center gap-3.5 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-100 hover:shadow-sm transition-all duration-200">
              <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Upload Format
                </p>
                <span className="inline-flex items-center mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                  {institute.institute_upload_type || 'Other'}
                </span>
              </div>
            </div>
          </div>

          {/* Location & Address */}
          <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/30 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" /> Address Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 font-medium">City/Region</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">
                  {institute.location || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Full Address</p>
                <p className="text-sm font-medium text-slate-700 mt-0.5 whitespace-pre-line leading-relaxed">
                  {institute.address || '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Contacts Section */}
          <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/30 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" /> Contact Persons
            </h3>

            <div className="space-y-3">
              {/* Primary Contact */}
              {primaryContact ? (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-blue-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-blue-600" />
                  <div className="flex items-center gap-3 pl-1">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-800 text-sm">
                          {primaryContact.name || '—'}
                        </p>
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded">
                          PRIMARY
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">Primary contact representative</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 font-medium text-sm md:ml-auto">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="select-all">{primaryContact.email || '—'}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">No contacts registered.</p>
              )}

              {/* Secondary Contacts */}
              {secondaryContacts.map((contact, index) => {
                if (!contact.name && !contact.email) return null;
                return (
                  <div
                    key={index}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 text-slate-500 rounded-lg">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-700 text-sm">
                          {contact.name || '—'}
                        </p>
                        <p className="text-xs text-slate-400 font-medium">Alternate contact representative</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 font-medium text-sm md:ml-auto">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="select-all">{contact.email || '—'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timestamps */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs text-slate-400/90 font-medium px-1">
            {institute.created_at && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Created: {formatDateForDisplay(institute.created_at)}
              </span>
            )}
            {institute.updated_at && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Last Updated: {formatDateForDisplay(institute.updated_at)}
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-slate-50/50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstituteDetailModal;
