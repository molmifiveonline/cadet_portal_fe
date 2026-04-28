import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Button } from '../ui/button';
import { X, Check, Loader2, AlertCircle } from 'lucide-react';
import { formatDateForDisplay } from '../../lib/utils/dateUtils';

const CadetPreviewModal = ({ isOpen, onClose, cadets, onConfirm, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in fade-in duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Review Cadets for Submission</h2>
            <p className="text-sm text-slate-500">Previewing {cadets.length} cadets from the uploaded Excel file.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {cadets.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center gap-3">
              <AlertCircle className="w-12 h-12 text-slate-300" />
              <p className="text-slate-500 font-medium">No valid cadet data found in the submission.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Full Name</TableHead>
                  <TableHead>Email Address</TableHead>
                  <TableHead>Mobile Number</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Indos Number</TableHead>
                  <TableHead>DOB</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cadets.map((cadet, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-semibold text-slate-800">
                      {cadet.name_as_in_indos_cert || 'N/A'}
                    </TableCell>
                    <TableCell className="text-slate-600">{cadet.email_id || 'N/A'}</TableCell>
                    <TableCell className="text-slate-600 font-mono text-xs">{cadet.mobile_number || 'N/A'}</TableCell>
                    <TableCell className="text-slate-600">{cadet.gender || 'N/A'}</TableCell>
                    <TableCell className="text-blue-600 font-bold text-xs">{cadet.indos_number || 'N/A'}</TableCell>
                    <TableCell className="text-slate-500 text-xs">
                      {cadet.dob ? formatDateForDisplay(cadet.dob) : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-slate-50/50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-amber-600 text-sm font-semibold bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
            <AlertCircle className="w-4 h-4" />
            Once submitted, these cadets will be added to the recruitment drive.
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onClose} disabled={loading} className="rounded-xl">
              Cancel
            </Button>
            <Button 
              onClick={onConfirm} 
              disabled={loading || cadets.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-6 rounded-xl shadow-lg shadow-blue-200"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Finalize Submission
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CadetPreviewModal;
