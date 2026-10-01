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
            <div className="overflow-x-auto">
              <Table className="min-w-max">
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-bold text-slate-700">Full Name</TableHead>
                    <TableHead className="font-bold text-slate-700">Email Address</TableHead>
                    <TableHead className="font-bold text-slate-700">Contact Number</TableHead>
                    <TableHead className="font-bold text-slate-700">Gender</TableHead>
                    <TableHead className="font-bold text-slate-700">DOB</TableHead>
                    <TableHead className="font-bold text-slate-700">Roll No</TableHead>
                    <TableHead className="font-bold text-slate-700">Course</TableHead>
                    <TableHead className="font-bold text-slate-700">Home Town / Airport</TableHead>
                    <TableHead className="font-bold text-slate-700">Passing Out Year</TableHead>
                    <TableHead className="font-bold text-slate-700">Age When Passing Out</TableHead>
                    <TableHead className="font-bold text-slate-700">Batch Rank</TableHead>
                    <TableHead className="font-bold text-slate-700">No. of Arrears</TableHead>
                    
                    {/* 10th Std */}
                    <TableHead className="font-bold text-slate-700">10th Board</TableHead>
                    <TableHead className="font-bold text-slate-700">10th Pass Year</TableHead>
                    <TableHead className="font-bold text-slate-700">10th Avg %</TableHead>
                    <TableHead className="font-bold text-slate-700">10th Maths</TableHead>
                    <TableHead className="font-bold text-slate-700">10th Science</TableHead>
                    <TableHead className="font-bold text-slate-700">10th English</TableHead>
                    
                    {/* 12th Std */}
                    <TableHead className="font-bold text-slate-700">12th Board</TableHead>
                    <TableHead className="font-bold text-slate-700">12th Pass Year</TableHead>
                    <TableHead className="font-bold text-slate-700">12th PCM Avg %</TableHead>
                    <TableHead className="font-bold text-slate-700">12th English</TableHead>
                    <TableHead className="font-bold text-slate-700">12th Physics</TableHead>
                    <TableHead className="font-bold text-slate-700">12th Chemistry</TableHead>
                    <TableHead className="font-bold text-slate-700">12th Maths</TableHead>
                    
                    {/* IMU */}
                    <TableHead className="font-bold text-slate-700">IMU Rank</TableHead>
                    <TableHead className="font-bold text-slate-700">IMU Sem Avg %</TableHead>
                    <TableHead className="font-bold text-slate-700">IMU Sem 1 %</TableHead>
                    <TableHead className="font-bold text-slate-700">IMU Sem 2 %</TableHead>
                    <TableHead className="font-bold text-slate-700">IMU Sem 3 %</TableHead>
                    <TableHead className="font-bold text-slate-700">IMU Sem 4 %</TableHead>
                    <TableHead className="font-bold text-slate-700">IMU Sem 5 %</TableHead>
                    <TableHead className="font-bold text-slate-700">IMU Sem 6 %</TableHead>
                    <TableHead className="font-bold text-slate-700">IMU Sem 7 %</TableHead>
                    <TableHead className="font-bold text-slate-700">IMU Sem 8 %</TableHead>
                    
                    {/* Physical / Other */}
                    <TableHead className="font-bold text-slate-700">Weight (kg)</TableHead>
                    <TableHead className="font-bold text-slate-700">Height (cm)</TableHead>
                    <TableHead className="font-bold text-slate-700">BMI</TableHead>
                    <TableHead className="font-bold text-slate-700">Achievements</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cadets.map((cadet, i) => (
                    <TableRow key={i} className="hover:bg-slate-50/50">
                      <TableCell className="font-semibold text-slate-800 whitespace-nowrap">
                        {cadet.name_as_in_indos_cert || 'N/A'}
                      </TableCell>
                      <TableCell className="text-slate-600">{cadet.email_id || 'N/A'}</TableCell>
                      <TableCell className="text-slate-600 font-mono text-xs">{cadet.contact_number || 'N/A'}</TableCell>
                      <TableCell className="text-slate-600 capitalize">{cadet.gender || 'N/A'}</TableCell>
                      <TableCell className="text-slate-500 text-xs">
                        {cadet.date_of_birth ? formatDateForDisplay(cadet.date_of_birth) : 'N/A'}
                      </TableCell>
                      <TableCell className="text-slate-600 font-mono text-xs">{cadet.roll_no || 'N/A'}</TableCell>
                      <TableCell className="text-slate-600">{cadet.course || 'N/A'}</TableCell>
                      <TableCell className="text-slate-600">{cadet.home_town_or_nearby_airport || 'N/A'}</TableCell>
                      <TableCell className="text-slate-600">{cadet.passing_out_date || 'N/A'}</TableCell>
                      <TableCell className="text-slate-600">{cadet.age_when_passing_out || 'N/A'}</TableCell>
                      <TableCell className="text-slate-600">{cadet.batch_rank_out_of_72_cadets || 'N/A'}</TableCell>
                      <TableCell className="text-slate-600">{cadet.no_of_arrears !== undefined && cadet.no_of_arrears !== null ? cadet.no_of_arrears : 'N/A'}</TableCell>
                      
                      {/* 10th Std */}
                      <TableCell className="text-slate-600">{cadet.tenth_std_board || 'N/A'}</TableCell>
                      <TableCell className="text-slate-600">{cadet.tenth_std_pass_out_year || 'N/A'}</TableCell>
                      <TableCell className="text-slate-600">{cadet.tenth_avg_percentage || 'N/A'}</TableCell>
                      <TableCell className="text-slate-600">{cadet.tenth_std_maths || 'N/A'}</TableCell>
                      <TableCell className="text-slate-600">{cadet.tenth_std_science || 'N/A'}</TableCell>
                      <TableCell className="text-slate-600">{cadet.tenth_std_english || 'N/A'}</TableCell>
                      
                      {/* 12th Std */}
                      <TableCell className="text-slate-600">{cadet.twelfth_std_board || 'N/A'}</TableCell>
                      <TableCell className="text-slate-600">{cadet.twelfth_std_pass_out_year || 'N/A'}</TableCell>
                      <TableCell className="text-slate-600 font-semibold text-slate-700">{cadet.twelfth_pcm_avg_percentage || 'N/A'}</TableCell>
                      <TableCell className="text-slate-600">{cadet.twelfth_std_english || 'N/A'}</TableCell>
                      <TableCell className="text-slate-600">{cadet.twelfth_std_physics || 'N/A'}</TableCell>
                      <TableCell className="text-slate-600">{cadet.twelfth_std_chemistry || 'N/A'}</TableCell>
                      <TableCell className="text-slate-600">{cadet.twelfth_std_maths || 'N/A'}</TableCell>
                      
                      {/* IMU */}
                      <TableCell className="text-slate-600">{cadet.imu_rank || 'N/A'}</TableCell>
                      <TableCell className="text-slate-600 font-semibold text-slate-700">{cadet.imu_avg_all_semester_percentage || 'N/A'}</TableCell>
                      <TableCell className="text-slate-600">{cadet.imu_sem_1_percentage || 'N/A'}</TableCell>
                      <TableCell className="text-slate-600">{cadet.imu_sem_2_percentage || 'N/A'}</TableCell>
                      <TableCell className="text-slate-600">{cadet.imu_sem_3_percentage || 'N/A'}</TableCell>
                      <TableCell className="text-slate-600">{cadet.imu_sem_4_percentage || 'N/A'}</TableCell>
                      <TableCell className="text-slate-600">{cadet.imu_sem_5_percentage || 'N/A'}</TableCell>
                      <TableCell className="text-slate-600">{cadet.imu_sem_6_percentage || 'N/A'}</TableCell>
                      <TableCell className="text-slate-600">{cadet.imu_sem_7_percentage || 'N/A'}</TableCell>
                      <TableCell className="text-slate-600">{cadet.imu_sem_8_percentage || 'N/A'}</TableCell>
                      
                      {/* Physical / Other */}
                      <TableCell className="text-slate-600">{cadet.weight_in_kgs || 'N/A'}</TableCell>
                      <TableCell className="text-slate-600">{cadet.height_in_cms || 'N/A'}</TableCell>
                      <TableCell className="text-slate-600">{cadet.bmi || 'N/A'}</TableCell>
                      <TableCell className="text-slate-600 max-w-[200px] truncate" title={cadet.any_extra_curricular_achievement}>
                        {cadet.any_extra_curricular_achievement || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
