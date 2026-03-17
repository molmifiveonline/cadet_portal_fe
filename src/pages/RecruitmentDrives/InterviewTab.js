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

const InterviewTab = ({ drive }) => {
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
      // Fetch cadets marked for interview in this drive
      const response = await api.get(`/cadets?course_type=${drive.course_type}&instituteId=${drive.institute_id}&status=Eligible for Interview&limit=1000`);
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
          <h2 className='text-xl font-semibold text-gray-900'>Interview Management</h2>
          <p className='text-sm text-gray-600'>Manage cadet interviews for this recruitment drive</p>
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
              <TableHead>Interview Date</TableHead>
              <TableHead>Panel Members</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Total Score</TableHead>
              <TableHead>Decision</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCadets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className='text-center py-8 text-gray-500'>
                  No cadets eligible for interview
                </TableCell>
              </TableRow>
            ) : (
              filteredCadets.map((cadet) => (
                <TableRow key={cadet.id}>
                  <TableCell className='font-medium'>{cadet.cadet_unique_id}</TableCell>
                  <TableCell>{cadet.name_as_in_indos_cert}</TableCell>
                  <TableCell>{cadet.interview?.interview_date ? new Date(cadet.interview.interview_date).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>{cadet.interview?.panel_members || '-'}</TableCell>
                  <TableCell>{cadet.interview?.evaluation_score || '-'}</TableCell>
                  <TableCell className='font-semibold'>
                    {cadet.interview?.total_score ? parseFloat(cadet.interview.total_score).toFixed(2) : '-'}
                  </TableCell>
                  <TableCell>
                    {cadet.interview?.final_decision === 'selected' ? (
                      <span className='text-green-600 font-medium'>Selected</span>
                    ) : cadet.interview?.final_decision === 'rejected' ? (
                      <span className='text-red-600 font-medium'>Rejected</span>
                    ) : (
                      <span className='text-gray-500'>-</span>
                    )}
                  </TableCell>
                  <TableCell className='max-w-xs truncate'>{cadet.interview?.remarks || '-'}</TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => window.open(`/interviews/${cadet.id}`, '_blank')}
                        className='h-8 w-8 p-0'
                      >
                        {cadet.interview ? <Edit size={16} /> : <Plus size={16} />}
                      </Button>
                      {cadet.interview && (
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => window.open(`/interviews/${cadet.id}`, '_blank')}
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

export default InterviewTab;