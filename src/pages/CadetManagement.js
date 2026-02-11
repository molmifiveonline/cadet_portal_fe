import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReusableDataTable from '../components/common/ReusableDataTable';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const CadetManagement = () => {
  const [institutes, setInstitutes] = useState([]);
  const [batches, setBatches] = useState([]);
  const [cadets, setCadets] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importProgress, setImportProgress] = useState(null);
  const [pagination, setPagination] = useState(null);

  const fileInputRef = useRef(null);

  // Import Form State
  const [importForm, setImportForm] = useState({
    instituteId: '',
    batchName: '',
    department: 'ENGINE',
    passingOutDate: '',
  });

  useEffect(() => {
    fetchInstitutes();
    fetchBatches();
    fetchCadets();
  }, []);

  const fetchInstitutes = async () => {
    try {
      const response = await axios.get(`${API_URL}/institutes`);
      setInstitutes(response.data.data);
    } catch (error) {
      console.error('Error fetching institutes:', error);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await axios.get(`${API_URL}/batches`);
      setBatches(response.data.data);
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const fetchCadets = async (batchId, page = 1) => {
    try {
      setLoading(true);
      let url = `${API_URL}/cadets?page=${page}&limit=10`;
      if (batchId) {
        url += `&batchId=${batchId}`;
      }

      const response = await axios.get(url);
      setCadets(response.data.data);
      setPagination({
        current_page: response.data.pagination.page,
        per_page: response.data.pagination.limit,
        total: response.data.pagination.total,
        last_page: response.data.pagination.pages,
      });
    } catch (error) {
      console.error('Error fetching cadets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchSelect = (batch) => {
    setSelectedBatch(batch);
    fetchCadets(batch?.id, 1);
  };

  const handlePageChange = (newPage) => {
    fetchCadets(selectedBatch?.id, newPage);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImportFile(file);
      setShowImportModal(true);
      e.target.value = null; // Reset input
    }
  };

  const handleCloseModal = () => {
    setShowImportModal(false);
    setImportFile(null);
    setImportForm({
      instituteId: '',
      batchName: '',
      department: 'ENGINE',
      passingOutDate: '',
    });
    setImportProgress(null);
  };

  const handleImportExcel = async (e) => {
    e.preventDefault();

    if (!importFile) {
      alert('Please select an Excel file');
      return;
    }

    const formData = new FormData();
    formData.append('excelFile', importFile);
    formData.append('instituteId', importForm.instituteId);
    formData.append('batchName', importForm.batchName);
    formData.append('department', importForm.department);
    formData.append('passingOutDate', importForm.passingOutDate);

    try {
      setLoading(true);
      setImportProgress({ message: 'Uploading file...', percent: 30 });

      const response = await axios.post(`${API_URL}/cadets/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setImportProgress({ message: 'Import successful!', percent: 100 });
      alert(`Successfully imported ${response.data.imported} cadets!`);

      // Refresh batches
      fetchBatches();
      // Switch to All Cadets view to show new data
      setSelectedBatch(null);
      fetchCadets(undefined, 1);

      // Reset form
      handleCloseModal();
    } catch (error) {
      console.error('Import error:', error);
      alert(error.response?.data?.message || 'Error importing cadets');
      setImportProgress(null);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStageLabel = (stage) => {
    const stageLabels = {
      imported: 'Imported',
      cv_pending: 'CV Pending',
      cv_submitted: 'CV Submitted',
      initial_screening: 'Initial Screening',
      test_scheduled: 'Test Scheduled',
      test_completed: 'Test Completed',
      interview_scheduled: 'Interview Scheduled',
      interview_completed: 'Interview Completed',
      final_evaluation: 'Final Evaluation',
      medical_scheduled: 'Medical Scheduled',
      medical_completed: 'Medical Completed',
      selected: 'Selected',
      standby: 'Standby',
      rejected: 'Rejected',
      joined: 'Joined',
    };
    return stageLabels[stage] || stage;
  };

  const getStageBadgeClass = (stage) => {
    const baseClass =
      'px-3 py-1 rounded-full text-xs font-semibold inline-block';
    if (stage === 'selected' || stage === 'joined')
      return `${baseClass} bg-green-100 text-green-800`;
    if (stage === 'rejected') return `${baseClass} bg-red-100 text-red-800`;
    if (stage.includes('completed'))
      return `${baseClass} bg-cyan-100 text-cyan-800`;
    if (stage.includes('scheduled'))
      return `${baseClass} bg-yellow-100 text-yellow-800`;
    return `${baseClass} bg-gray-200 text-gray-700`;
  };

  const columns = [
    {
      field: 'id',
      headerName: 'S.No',
      width: '70px',
      renderCell: ({ index }) => index + 1,
    },
    {
      field: 'full_name',
      headerName: 'Name',
      width: '200px',
      cellClassName: 'font-medium text-gray-900',
    },
    {
      field: 'department',
      headerName: 'Department',
      width: '120px',
      renderCell: ({ value }) => (
        <span
          className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold uppercase ${
            value?.toLowerCase() === 'engine'
              ? 'bg-blue-50 text-blue-700'
              : 'bg-purple-50 text-purple-800'
          }`}
        >
          {value}
        </span>
      ),
    },
    { field: 'email', headerName: 'Email', width: '200px' },
    { field: 'contact_number', headerName: 'Contact', width: '150px' },
    {
      field: 'batch_rank',
      headerName: 'Batch Rank',
      width: '100px',
      renderCell: ({ value }) => value || '-',
    },
    {
      field: 'imu_avg_percentage',
      headerName: 'IMU Avg %',
      width: '100px',
      valueGetter: (value) => (value ? `${value}%` : '-'),
    },
    {
      field: 'current_stage',
      headerName: 'Current Stage',
      width: '180px',
      renderCell: ({ value }) => (
        <span className={getStageBadgeClass(value)}>
          {getCurrentStageLabel(value)}
        </span>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: '100px',
      renderCell: () => (
        <Button variant='outline' size='sm' className='h-8 text-xs'>
          View
        </Button>
      ),
    },
  ];

  return (
    <div className='p-8 bg-gray-50 min-h-screen'>
      <div className='flex justify-between items-center mb-8'>
        <h1 className='text-2xl font-semibold text-gray-900'>
          Cadet Management
        </h1>
        <input
          type='file'
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept='.xlsx,.xls,.csv'
          onChange={handleFileChange}
        />
        <Button onClick={() => fileInputRef.current.click()}>
          + Import Cadets from Excel
        </Button>
      </div>

      <div className='h-[calc(100vh-150px)]'>

        {/* Cadets Table */}
        <div className='bg-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full'>
          <div className='p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white'>
            <h2 className='m-0 mb-1.5 text-2xl font-semibold'>
              {selectedBatch ? selectedBatch.batch_name : 'All Cadets'}
            </h2>
            <p className='m-0 text-sm opacity-90'>
              {selectedBatch
                ? `${selectedBatch.institute_name} • ${selectedBatch.department}`
                : 'Showing all cadets across all batches'}
            </p>
          </div>

          <div className='flex-1 overflow-hidden p-0'>
            <ReusableDataTable
              columns={columns}
              rows={cadets}
              loading={loading}
              title='Cadets List'
              pageSize={10}
              checkboxSelection={true}
              emptyMessage='No cadets found'
              pagination={pagination}
              handlePageChange={handlePageChange}
              className='h-full border-none'
            />
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-50'>
          <div className='bg-white rounded-2xl w-[90%] max-w-xl max-h-[90vh] overflow-auto shadow-2xl animate-in fade-in zoom-in duration-200'>
            <div className='p-6 border-b border-gray-200 flex justify-between items-center'>
              <h2 className='text-xl font-semibold text-gray-900'>
                Import Cadets from Excel
              </h2>
              <button
                className='text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none'
                onClick={handleCloseModal}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleImportExcel}>
              <div className='p-6 space-y-5'>
                <div className='space-y-2'>
                  <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                    Institute *
                  </label>
                  <Select
                    value={importForm.instituteId}
                    onValueChange={(value) =>
                      setImportForm({ ...importForm, instituteId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select Institute' />
                    </SelectTrigger>
                    <SelectContent>
                      {institutes.map((institute) => (
                        <SelectItem
                          key={institute.id}
                          value={institute.id.toString()}
                        >
                          {institute.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                    Batch Name *
                  </label>
                  <Input
                    type='text'
                    value={importForm.batchName}
                    onChange={(e) =>
                      setImportForm({
                        ...importForm,
                        batchName: e.target.value,
                      })
                    }
                    placeholder='e.g., TME-B.Tech(ME)-IMU Chennai-2026'
                    required
                  />
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                      Department *
                    </label>
                    <Select
                      value={importForm.department}
                      onValueChange={(value) =>
                        setImportForm({ ...importForm, department: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select Department' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='ENGINE'>Engine</SelectItem>
                        <SelectItem value='DECK'>Deck</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                      Passing Out Date
                    </label>
                    <Input
                      type='date'
                      value={importForm.passingOutDate}
                      onChange={(e) =>
                        setImportForm({
                          ...importForm,
                          passingOutDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                    Excel File *
                  </label>
                  <div className='flex items-center gap-2.5'>
                    <div className='flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600'>
                      {importFile ? importFile.name : 'No file selected'}
                    </div>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => fileInputRef.current.click()}
                    >
                      Change
                    </Button>
                  </div>
                  <p className='text-xs text-gray-500'>
                    Upload Excel file with cadet information (Format: .xlsx,
                    .xls, or .csv)
                  </p>
                </div>

                {importProgress && (
                  <div className='mt-5 p-4 bg-gray-50 rounded-lg'>
                    <div className='h-2 bg-gray-200 rounded-full overflow-hidden mb-2.5'>
                      <div
                        className='h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300'
                        style={{ width: `${importProgress.percent}%` }}
                      ></div>
                    </div>
                    <p className='text-sm text-center text-gray-500'>
                      {importProgress.message}
                    </p>
                  </div>
                )}
              </div>

              <div className='p-4 border-t border-gray-200 flex justify-end gap-3'>
                <Button
                  type='button'
                  variant='secondary'
                  onClick={handleCloseModal}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type='submit' disabled={loading}>
                  {loading ? 'Importing...' : 'Import Cadets'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CadetManagement;
