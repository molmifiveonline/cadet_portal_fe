import React, { useState } from 'react';
import { X, Loader2, Upload, FileText } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import api from '../../lib/utils/apiConfig';

const SendEmailModal = ({ isOpen, onClose, selectedInstitutes, onSuccess }) => {
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    file: null,
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (
        !file.name.endsWith('.xlsx') &&
        !file.name.endsWith('.xls') &&
        !file.name.endsWith('.csv')
      ) {
        toast.error('Please upload a valid Excel or CSV file');
        return;
      }
      setFormData((prev) => ({ ...prev, file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.subject || !formData.description || !formData.file) {
      toast.error('Please fill in all fields and upload a file');
      return;
    }

    if (selectedInstitutes.length === 0) {
      toast.error('No institutes selected');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('instituteIds', JSON.stringify(selectedInstitutes));
      data.append('subject', formData.subject);
      data.append('description', formData.description);
      data.append('file', formData.file);

      await api.post('/institutes/send-email', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Emails sent successfully');
      setFormData({ subject: '', description: '', file: null });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error sending emails:', error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          'Failed to send emails',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex justify-between items-center mb-6'>
          <div>
            <h2 className='text-xl font-semibold text-gray-800'>
              Send Email to Institutes
            </h2>
            <p className='text-sm text-gray-500 mt-1'>
              Sending to {selectedInstitutes.length} selected institute
              {selectedInstitutes.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 transition-colors'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-700'>
              Subject <span className='text-red-500'>*</span>
            </label>
            <Input
              name='subject'
              value={formData.subject}
              onChange={handleInputChange}
              placeholder='Email Subject'
              required
            />
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-700'>
              Description <span className='text-red-500'>*</span>
            </label>
            <textarea
              name='description'
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className='w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
              placeholder='Enter email body...'
              required
            />
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-700'>
              Attach File (Excel) <span className='text-red-500'>*</span>
            </label>
            <div className='border-2 border-dashed border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors text-center cursor-pointer relative'>
              <input
                type='file'
                accept='.xlsx,.xls,.csv'
                onChange={handleFileChange}
                className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
              />
              <div className='flex flex-col items-center gap-2'>
                {formData.file ? (
                  <>
                    <FileText className='w-8 h-8 text-green-500' />
                    <span className='text-sm font-medium text-gray-700 truncate max-w-[200px]'>
                      {formData.file.name}
                    </span>
                    <span className='text-xs text-gray-500'>
                      Click to change
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className='w-8 h-8 text-gray-400' />
                    <span className='text-sm text-gray-500'>
                      Click to upload or drag and drop
                    </span>
                    <span className='text-xs text-gray-400'>
                      XLSX, XLS, CSV up to 10MB
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className='pt-4 flex justify-end gap-3'>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              className='bg-[#3a5f9e] hover:bg-[#325186] text-white'
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Sending...
                </>
              ) : (
                'Send Email'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendEmailModal;
