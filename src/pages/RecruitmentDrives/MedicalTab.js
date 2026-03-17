import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Eye, Edit, CheckCircle, XCircle, Loader2, Users, FileText, Send } from 'lucide-react';
import api from '../../lib/utils/apiConfig';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

const MedicalTab = ({ drive }) => {
  const { id: driveId } = useParams();
  const [cadets, setCadets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCadets();
  }, [driveId]);

  const fetchCadets = async () => {
    try {
      setLoading(true);
      // Fetch cadets eligible for medical in this drive
      const response = await api.get(`/cadets?course_type=${drive.course_type}&instituteId=${drive.institute_id}&status=Eligible for Medical&limit=1000`);
      if (response.data && response.data.data) {
        setCadets(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching cadets:', error);
      toast.error('Failed to load cadets');
    } finally {
      setLoading(false);
    }
  };
  const filteredCadets = cadets.filter(cadet => {
    const search = searchTerm.toLowerCase().trim();
    const matchesSearch = !search || (
      cadet.name_as_in_indos_cert?.toLowerCase().includes(search) ||
      cadet.cadet_unique_id?.toLowerCase().includes(search)
    );
    
    return matchesSearch;
  });

  const handleConfirmCandidates = async () => {
    try {
      // Bulk action: Confirm candidates
      await api.post(`/medical-results/bulk/confirm`, { drive_id: driveId });
      toast.success('Candidates confirmed successfully');
      fetchCadets();
    } catch (error) {
      toast.error('Failed to confirm candidates');
    }
  };

  const handleCollectAcademicData = async () => {
    try {
      // Bulk action: Collect academic data
      await api.post(`/medical-results/bulk/collect-academic`, { drive_id: driveId });
      toast.success('Academic data collection initiated');
    } catch (error) {
      toast.error('Failed to initiate academic data collection');
    }
  };

  const handleCollectDocuments = async () => {
    try {
      // Bulk action: Collect documents
      await api.post(`/medical-results/bulk/collect-documents`, { drive_id: driveId });
      toast.success('Document collection initiated');
    } catch (error) {
      toast.error('Failed to initiate document collection');
    }
  };


  if (loading) {
    return (
      <div className='flex items-center justify-center p-20'>
        <Loader2 className='animate-spin text-[#3a5f9e]' size={40} />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-xl font-semibold text-gray-900'>Medical Management</h2>
          <p className='text-sm text-gray-600'>Manage cadet medical examinations for this recruitment drive</p>
        </div>
        <div className='flex items-center gap-4'>
          <Input
            placeholder='Search cadets...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-64'
          />
        </div>
      </div>

      {/* Bulk Action Buttons */}
      <div className='bg-white rounded-lg border border-gray-200 p-4'>
        <div className='flex items-center gap-4'>
          <Button
            onClick={handleConfirmCandidates}
            className='flex items-center gap-2 bg-green-600 hover:bg-green-700'
          >
            <Users size={16} />
            Confirm Candidates
          </Button>
          <Button
            onClick={handleCollectAcademicData}
            variant='outline'
            className='flex items-center gap-2'
          >
            <FileText size={16} />
            Collect Academic Data
          </Button>
          <Button
            onClick={handleCollectDocuments}
            variant='outline'
            className='flex items-center gap-2'
          >
            <Send size={16} />
            Collect Documents
          </Button>
        </div>
      </div>

      <div className='bg-white rounded-lg border border-gray-200'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cadet ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Medical Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Medical Center</TableHead>
              <TableHead>Fitness Status</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCadets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className='text-center py-8 text-gray-500'>
                  No cadets eligible for medical examination
                </TableCell>
              </TableRow>
            ) : (
              filteredCadets.map((cadet) => (
                <TableRow key={cadet.id}>
                  <TableCell className='font-medium'>{cadet.cadet_unique_id}</TableCell>
                  <TableCell>{cadet.name_as_in_indos_cert}</TableCell>
                  <TableCell>{cadet.medical_result?.medical_date ? new Date(cadet.medical_result.medical_date).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>{cadet.medical_result?.medical_time || '-'}</TableCell>
                  <TableCell>{cadet.medical_result?.medical_center_name || '-'}</TableCell>
                  <TableCell>
                    {cadet.medical_result?.fit_status === 'fit' ? (
                      <span className='text-green-600 font-medium'>Fit</span>
                    ) : cadet.medical_result?.fit_status === 'unfit' ? (
                      <span className='text-red-600 font-medium'>Unfit</span>
                    ) : (
                      <span className='text-gray-500'>-</span>
                    )}
                  </TableCell>
                  <TableCell className='max-w-xs truncate'>{cadet.medical_result?.remarks || '-'}</TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => window.open(`/medical-results/${cadet.id}`, '_blank')}
                        className='h-8 w-8 p-0'
                      >
                        {cadet.medical_result ? <Edit size={16} /> : <Plus size={16} />}
                      </Button>
                      {cadet.medical_result && (
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => window.open(`/medical-results/${cadet.id}`, '_blank')}
                          className='h-8 w-8 p-0'
                        >
                          <Eye size={16} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default MedicalTab;