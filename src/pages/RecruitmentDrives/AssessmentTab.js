import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Eye, Edit, CheckCircle, XCircle, Loader2 } from 'lucide-react';
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

const AssessmentTab = ({ drive }) => {
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
      // Fetch cadets eligible for assessment in this drive
      const response = await api.get(`/cadets?course_type=${drive.course_type}&instituteId=${drive.institute_id}&status=Eligible for Assessment&limit=1000`);
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
          <h2 className='text-xl font-semibold text-gray-900'>Assessment Management</h2>
          <p className='text-sm text-gray-600'>Manage cadet assessments for this recruitment drive</p>
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

      <div className='bg-white rounded-lg border border-gray-200'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cadet ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>CES1</TableHead>
              <TableHead>QA</TableHead>
              <TableHead>CES2</TableHead>
              <TableHead>English</TableHead>
              <TableHead>Essay</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead>Mark for Interview</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCadets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className='text-center py-8 text-gray-500'>
                  No cadets eligible for assessment
                </TableCell>
              </TableRow>
            ) : (
              filteredCadets.map((cadet) => (
                <TableRow key={cadet.id}>
                  <TableCell className='font-medium'>{cadet.cadet_unique_id}</TableCell>
                  <TableCell>{cadet.name_as_in_indos_cert}</TableCell>
                  <TableCell>{cadet.assessment?.ces_test || '-'}</TableCell>
                  <TableCell>{cadet.assessment?.qa_test || '-'}</TableCell>
                  <TableCell>{cadet.assessment?.ces_test_2 || '-'}</TableCell>
                  <TableCell>{cadet.assessment?.english_test || '-'}</TableCell>
                  <TableCell>{cadet.assessment?.essay_writing_mark || '-'}</TableCell>
                  <TableCell className='font-semibold'>
                    {cadet.assessment?.calculated_score ? parseFloat(cadet.assessment.calculated_score).toFixed(2) : '-'}
                  </TableCell>
                  <TableCell className='max-w-xs truncate'>{cadet.assessment?.remarks || '-'}</TableCell>
                  <TableCell>
                    {cadet.assessment?.mark_for_interview ? (
                      <CheckCircle className='text-green-600' size={20} />
                    ) : (
                      <XCircle className='text-red-600' size={20} />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => window.open(`/assessments/${cadet.id}`, '_blank')}
                        className='h-8 w-8 p-0'
                      >
                        {cadet.assessment ? <Edit size={16} /> : <Plus size={16} />}
                      </Button>
                      {cadet.assessment && (
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => window.open(`/assessments/${cadet.id}`, '_blank')}
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

export default AssessmentTab;