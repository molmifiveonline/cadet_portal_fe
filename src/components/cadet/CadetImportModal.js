import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import api from '../../lib/utils/apiConfig';

const CadetImportModal = ({ isOpen, onClose, institutes, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importProgress, setImportProgress] = useState(null);
  const fileInputRef = useRef(null);

  const [importForm, setImportForm] = useState({
    instituteId: '',
    batchName: '',
    department: 'ENGINE',
    passingOutDate: '',
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setImportFile(null);
      setImportProgress(null);
      setImportForm({
        instituteId: '',
        batchName: '',
        department: 'ENGINE',
        passingOutDate: '',
      });
    }
  }, [isOpen]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImportFile(file);
    }
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

      const response = await api.post('/cadets/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setImportProgress({ message: 'Import successful!', percent: 100 });
      alert(`Successfully imported ${response.data.imported} cadets!`);

      onSuccess(); // Trigger refresh on success
      onClose(); // Close modal
    } catch (error) {
      console.error('Import error:', error);
      alert(error.response?.data?.message || 'Error importing cadets');
      setImportProgress(null);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-50'>
      <div className='bg-white rounded-2xl w-[90%] max-w-xl max-h-[90vh] overflow-auto shadow-2xl animate-in fade-in zoom-in duration-200'>
        <div className='p-6 border-b border-gray-200 flex justify-between items-center'>
          <h2 className='text-xl font-semibold text-gray-900'>
            Import Cadets from Excel
          </h2>
          <button
            className='text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none'
            onClick={onClose}
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
                      {institute.institute_name || institute.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                Excel File *
              </label>
              <input
                type='file'
                ref={fileInputRef}
                className='hidden'
                accept='.xlsx,.xls,.csv'
                onChange={handleFileChange}
              />
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
                  {importFile ? 'Change' : 'Select File'}
                </Button>
              </div>
              <p className='text-xs text-gray-500'>
                Upload Excel file with cadet information (Format: .xlsx, .xls,
                or .csv)
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
              onClick={onClose}
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
  );
};

export default CadetImportModal;
