import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  FileText, Eye, Upload, CheckCircle, XCircle, Clock, Loader2, Search,
  RotateCcw, Download, ChevronDown, ChevronUp, Trash2
} from 'lucide-react';
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

const DOCUMENT_TYPES = [
  'Passport',
  'Medical Certificate',
  'Bank Details',
  'Academic Marksheet',
  'Aadhaar Card',
  'PAN Card',
  'INDOS Certificate',
  'CDC (Continuous Discharge Certificate)',
  'Agreement / Contract',
  'Other',
];

const DocumentsTab = ({ drive }) => {
  const { id: driveId } = useParams();
  const [cadetsWithDocs, setCadetsWithDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCadets, setExpandedCadets] = useState({});
  const [uploadingFor, setUploadingFor] = useState(null);
  const [uploadForm, setUploadForm] = useState({ document_name: '', document_type: '', file: null });
  const [reviewingDoc, setReviewingDoc] = useState(null);
  const [reviewRemarks, setReviewRemarks] = useState('');

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/documents/drive?institute_id=${drive.institute_id}&course_type=${drive.course_type}`);
      if (response.data?.success) {
        setCadetsWithDocs(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [drive.institute_id, drive.course_type]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const toggleCadet = (cadetId) => {
    setExpandedCadets(prev => ({ ...prev, [cadetId]: !prev[cadetId] }));
  };

  const handleUpload = async (cadetId) => {
    if (!uploadForm.file || !uploadForm.document_name || !uploadForm.document_type) {
      toast.error('Please fill all fields and select a file');
      return;
    }

    try {
      const data = new FormData();
      data.append('document', uploadForm.file);
      data.append('document_name', uploadForm.document_name);
      data.append('document_type', uploadForm.document_type);

      await api.post(`/documents/cadet/${cadetId}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Document uploaded successfully');
      setUploadingFor(null);
      setUploadForm({ document_name: '', document_type: '', file: null });
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    }
  };

  const handleReview = async (documentId, status) => {
    try {
      await api.put(`/documents/${documentId}/review`, {
        status,
        admin_remarks: reviewRemarks,
      });

      toast.success(`Document ${status === 'accepted' ? 'accepted' : status === 'rejected' ? 'rejected' : 'reupload requested'} successfully`);
      setReviewingDoc(null);
      setReviewRemarks('');
      fetchDocuments();
    } catch (error) {
      console.error('Error reviewing document:', error);
      toast.error('Failed to review document');
    }
  };

  const handleDownload = (documentId) => {
    const userStr = localStorage.getItem('user');
    let token = '';
    try {
      if (userStr) {
        const user = JSON.parse(userStr);
        token = user.token || '';
      }
      if (!token) {
        token = localStorage.getItem('token') || '';
      }
    } catch (e) {
      token = localStorage.getItem('token') || '';
    }

    window.open(`${api.defaults.baseURL}/documents/${documentId}/download?token=${token}`, '_blank');
  };

  const handleDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      await api.delete(`/documents/${documentId}`);
      toast.success('Document deleted');
      fetchDocuments();
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return <span className='inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800'><CheckCircle size={12} /> Accepted</span>;
      case 'rejected':
        return <span className='inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800'><XCircle size={12} /> Rejected</span>;
      case 'reupload_requested':
        return <span className='inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800'><RotateCcw size={12} /> Re-upload</span>;
      default:
        return <span className='inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800'><Clock size={12} /> Pending</span>;
    }
  };

  const getDocSummary = (documents) => {
    const total = documents.length;
    const accepted = documents.filter(d => d.status === 'accepted').length;
    const pending = documents.filter(d => d.status === 'pending').length;
    const rejected = documents.filter(d => d.status === 'rejected' || d.status === 'reupload_requested').length;
    return { total, accepted, pending, rejected };
  };

  const filteredCadets = cadetsWithDocs.filter(cadet => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return true;
    return (
      cadet.name_as_in_indos_cert?.toLowerCase().includes(search) ||
      cadet.cadet_unique_id?.toLowerCase().includes(search) ||
      cadet.email_id?.toLowerCase().includes(search)
    );
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
          <h2 className='text-xl font-semibold text-gray-900'>Document Management</h2>
          <p className='text-sm text-gray-600'>Review and manage cadet documents for this recruitment drive</p>
        </div>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
          <Input
            placeholder='Search cadets...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-64 pl-10'
          />
        </div>
      </div>

      {filteredCadets.length === 0 ? (
        <div className='text-center py-12 bg-white rounded-lg border'>
          <FileText className='mx-auto h-12 w-12 text-gray-400' />
          <h3 className='mt-2 text-sm font-medium text-gray-900'>No cadets eligible for document collection</h3>
          <p className='mt-1 text-sm text-gray-500'>Only cadets who have completed medical will appear here.</p>
        </div>
      ) : (
        <div className='space-y-3'>
          {filteredCadets.map((cadet) => {
            const isExpanded = expandedCadets[cadet.cadet_id];
            const summary = getDocSummary(cadet.documents);

            return (
              <div key={cadet.cadet_id} className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
                {/* Cadet Row Header */}
                <button
                  onClick={() => toggleCadet(cadet.cadet_id)}
                  className='w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left'
                >
                  <div className='flex items-center gap-4'>
                    <span className='px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded border border-indigo-100 uppercase'>
                      {cadet.cadet_unique_id}
                    </span>
                    <div>
                      <p className='font-medium text-gray-900'>{cadet.name_as_in_indos_cert}</p>
                      <p className='text-xs text-gray-500'>{cadet.email_id}</p>
                    </div>
                    <span className='px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800'>
                      {cadet.status}
                    </span>
                  </div>

                  <div className='flex items-center gap-4'>
                    <div className='flex items-center gap-2 text-xs text-gray-500'>
                      <span className='font-medium'>{summary.total} docs</span>
                      {summary.accepted > 0 && <span className='text-green-600'>✓ {summary.accepted}</span>}
                      {summary.pending > 0 && <span className='text-yellow-600'>⏳ {summary.pending}</span>}
                      {summary.rejected > 0 && <span className='text-red-600'>✗ {summary.rejected}</span>}
                    </div>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {/* Expanded Documents Section */}
                {isExpanded && (
                  <div className='border-t border-gray-200 p-4 bg-gray-50/50'>
                    {/* Upload Button */}
                    {uploadingFor !== cadet.cadet_id ? (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setUploadingFor(cadet.cadet_id)}
                        className='mb-4 flex items-center gap-2'
                      >
                        <Upload size={14} />
                        Upload Document
                      </Button>
                    ) : (
                      <div className='mb-4 p-4 bg-white rounded-lg border border-blue-200 space-y-3'>
                        <h4 className='text-sm font-medium text-gray-700'>Upload New Document</h4>
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                          <Input
                            placeholder='Document name'
                            value={uploadForm.document_name}
                            onChange={(e) => setUploadForm(p => ({ ...p, document_name: e.target.value }))}
                          />
                          <select
                            value={uploadForm.document_type}
                            onChange={(e) => setUploadForm(p => ({ ...p, document_type: e.target.value }))}
                            className='px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                          >
                            <option value=''>Select type...</option>
                            {DOCUMENT_TYPES.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                          <Input
                            type='file'
                            onChange={(e) => setUploadForm(p => ({ ...p, file: e.target.files?.[0] || null }))}
                            accept='.pdf,.doc,.docx,.jpg,.jpeg,.png'
                          />
                        </div>
                        <div className='flex items-center gap-2'>
                          <Button size='sm' onClick={() => handleUpload(cadet.cadet_id)}>Upload</Button>
                          <Button size='sm' variant='ghost' onClick={() => { setUploadingFor(null); setUploadForm({ document_name: '', document_type: '', file: null }); }}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Documents Table */}
                    {cadet.documents.length === 0 ? (
                      <p className='text-sm text-gray-500 italic'>No documents uploaded yet.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Document Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>File</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Remarks</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cadet.documents.map((doc) => (
                            <TableRow key={doc.id}>
                              <TableCell className='font-medium'>{doc.document_name}</TableCell>
                              <TableCell className='text-sm text-gray-600'>{doc.document_type}</TableCell>
                              <TableCell className='text-sm text-gray-500'>{doc.original_filename}</TableCell>
                              <TableCell>{getStatusBadge(doc.status)}</TableCell>
                              <TableCell className='max-w-xs truncate text-sm text-gray-600'>
                                {doc.admin_remarks || '-'}
                              </TableCell>
                              <TableCell>
                                <div className='flex items-center gap-1'>
                                  <Button variant='ghost' size='sm' className='h-8 w-8 p-0 text-blue-600' onClick={() => handleDownload(doc.id)} title='Download'>
                                    <Download size={14} />
                                  </Button>

                                  {reviewingDoc === doc.id ? (
                                    <div className='flex items-center gap-2 ml-2'>
                                      <Input
                                        placeholder='Remarks...'
                                        value={reviewRemarks}
                                        onChange={(e) => setReviewRemarks(e.target.value)}
                                        className='w-40 h-8 text-xs'
                                      />
                                      <Button size='sm' className='h-8 px-2 bg-green-600 hover:bg-green-700 text-white text-xs' onClick={() => handleReview(doc.id, 'accepted')}>
                                        Accept
                                      </Button>
                                      <Button size='sm' className='h-8 px-2 bg-red-600 hover:bg-red-700 text-white text-xs' onClick={() => handleReview(doc.id, 'rejected')}>
                                        Reject
                                      </Button>
                                      <Button size='sm' className='h-8 px-2 bg-yellow-500 hover:bg-yellow-600 text-white text-xs' onClick={() => handleReview(doc.id, 'reupload_requested')}>
                                        Re-upload
                                      </Button>
                                      <Button size='sm' variant='ghost' className='h-8 px-2 text-xs' onClick={() => { setReviewingDoc(null); setReviewRemarks(''); }}>
                                        ✕
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button variant='ghost' size='sm' className='h-8 w-8 p-0 text-purple-600' onClick={() => setReviewingDoc(doc.id)} title='Review'>
                                      <Eye size={14} />
                                    </Button>
                                  )}

                                  <Button variant='ghost' size='sm' className='h-8 w-8 p-0 text-red-600' onClick={() => handleDelete(doc.id)} title='Delete'>
                                    <Trash2 size={14} />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className='text-sm text-gray-600'>
        Total Cadets: {filteredCadets.length}
      </div>
    </div>
  );
};

export default DocumentsTab;