import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import api from '../../lib/utils/apiConfig';
import { Button } from '../../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';

const InstituteSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importingId, setImportingId] = useState(null);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/institutes/submissions');
      setSubmissions(response.data.data);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleImport = async (id) => {
    if (
      !window.confirm(
        'Are you sure you want to import this submission? It will add cadets to the database.',
      )
    ) {
      return;
    }

    setImportingId(id);
    try {
      const response = await api.post(`/institutes/submissions/${id}/import`);
      toast.success(response.data.message);
      fetchSubmissions(); // Refresh list to update status
    } catch (error) {
      console.error('Error importing submission:', error);
      toast.error(
        error.response?.data?.message || 'Failed to import submission',
      );
    } finally {
      setImportingId(null);
    }
  };



  return (
    <div className='p-6'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-800'>
          Institute Submissions
        </h1>
        <p className='text-gray-500 text-sm mt-1'>
          Review and import Excel submissions from institutes
        </p>
      </div>

      <div className='bg-white rounded-lg shadow border border-gray-100 overflow-hidden'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Institute</TableHead>
              <TableHead>File Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className='text-center py-8'>
                  <div className='flex items-center justify-center text-gray-500'>
                    <Loader2 className='w-5 h-5 mr-2 animate-spin' />
                    Loading submissions...
                  </div>
                </TableCell>
              </TableRow>
            ) : submissions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className='text-center py-8 text-gray-500'
                >
                  No submissions found
                </TableCell>
              </TableRow>
            ) : (
              submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className='font-medium'>
                    {submission.institute_name ||
                      `Institute ID: ${submission.institute_id}`}
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <FileSpreadsheet className='w-4 h-4 text-green-600' />
                      <span
                        className='truncate max-w-[200px]'
                        title={submission.original_name}
                      >
                        {submission.original_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(submission.created_at).toLocaleDateString()}
                    <span className='text-xs text-gray-400 ml-1'>
                      {new Date(submission.created_at).toLocaleTimeString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        submission.status === 'imported'
                          ? 'bg-green-100 text-green-700'
                          : submission.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {submission.status.charAt(0).toUpperCase() +
                        submission.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex items-center justify-end gap-2'>
                      <a
                        href={`${api.defaults.baseURL}/institutes/submissions/${submission.id}/download?token=${localStorage.getItem('token')}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 w-9'
                        title='Download File'
                      >
                        <Download className='w-4 h-4' />
                      </a>

                      {submission.status !== 'imported' && (
                        <Button
                          size='sm'
                          onClick={() => handleImport(submission.id)}
                          disabled={importingId === submission.id}
                        >
                          {importingId === submission.id ? (
                            <Loader2 className='w-4 h-4 animate-spin' />
                          ) : (
                            'Import'
                          )}
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

export default InstituteSubmissions;
