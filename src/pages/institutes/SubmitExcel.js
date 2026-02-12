import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import api from '../../lib/utils/apiConfig';

const SubmitExcel = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [instituteName, setInstituteName] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setVerifying(false);
        return;
      }

      try {
        // Verify token endpoint - assuming backend has this or we just try to submit
        // For better UX, we should ideally verify the token on load
        // But if no verify endpoint exists, we can skip this or use a dummy check
        // Assuming we might want to check token validity and get institute details
        const response = await api.get(
          `/institutes/verify-token?token=${token}`,
        );
        setIsValidToken(true);
        setInstituteName(response.data.instituteName || 'Institute');
      } catch (error) {
        console.error('Token verification failed:', error);
        setIsValidToken(false);
        toast.error('Invalid or expired link');
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (
        !selectedFile.name.endsWith('.xlsx') &&
        !selectedFile.name.endsWith('.xls') &&
        !selectedFile.name.endsWith('.csv')
      ) {
        toast.error('Please upload a valid Excel or CSV file');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('token', token);

      await api.post('/institutes/submit-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSubmitted(true);
      toast.success('File submitted successfully');
    } catch (error) {
      console.error('Error submitting file:', error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          'Failed to submit file',
      );
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <Loader2 className='w-10 h-10 text-blue-600 animate-spin mx-auto mb-4' />
          <p className='text-gray-500'>Verifying link...</p>
        </div>
      </div>
    );
  }

  if (!token || !isValidToken) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 p-4'>
        <div className='bg-white max-w-md w-full rounded-2xl shadow-sm border border-gray-100 p-8 text-center'>
          <div className='w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6'>
            <AlertCircle className='w-8 h-8 text-red-500' />
          </div>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>
            Invalid or Expired Link
          </h1>
          <p className='text-gray-500 mb-6'>
            The link you are trying to access is either invalid or has expired.
            Please contact the administrator for a new link.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 p-4'>
        <div className='bg-white max-w-md w-full rounded-2xl shadow-sm border border-gray-100 p-8 text-center animate-in zoom-in duration-300'>
          <div className='w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6'>
            <CheckCircle className='w-8 h-8 text-green-500' />
          </div>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>
            Submission Successful!
          </h1>
          <p className='text-gray-500 mb-6'>
            Thank you, {instituteName}. Your Excel file has been successfully
            uploaded and sent for processing.
          </p>
          <p className='text-sm text-gray-400'>
            You can close this window now.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[url("https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80")] bg-cover bg-center bg-no-repeat relative'>
      <div className='absolute inset-0 bg-white/90 backdrop-blur-sm'></div>

      <div className='sm:mx-auto sm:w-full sm:max-w-md relative z-10'>
        <div className='text-center mb-8'>
          <h2 className='text-3xl font-extrabold text-slate-900'>
            Cadet Portal
          </h2>
          <p className='mt-2 text-sm text-slate-600'>
            Institute Data Submission
          </p>
        </div>

        <div className='bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-white/50'>
          <div className='mb-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-1'>
              Upload Cadet Data
            </h3>
            <p className='text-sm text-gray-500'>
              Welcome,{' '}
              <span className='font-medium text-blue-600'>{instituteName}</span>
              . Please upload the requested Excel sheet containing cadet
              details.
            </p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='w-full'>
              <div className='border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer relative group'>
                <input
                  type='file'
                  accept='.xlsx,.xls,.csv'
                  onChange={handleFileChange}
                  className='absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20'
                />
                <div className='flex flex-col items-center justify-center gap-3'>
                  {file ? (
                    <>
                      <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center'>
                        <FileText className='w-6 h-6 text-green-600' />
                      </div>
                      <div className='text-center'>
                        <p className='text-sm font-medium text-gray-900 truncate max-w-[200px]'>
                          {file.name}
                        </p>
                        <p className='text-xs text-gray-500 mt-1'>
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <p className='text-xs text-blue-600 font-medium group-hover:underline'>
                        Click to change file
                      </p>
                    </>
                  ) : (
                    <>
                      <div className='w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform'>
                        <Upload className='w-6 h-6 text-blue-600' />
                      </div>
                      <div className='text-center'>
                        <p className='text-sm font-medium text-gray-900'>
                          Click to upload or drag and drop
                        </p>
                        <p className='text-xs text-gray-500 mt-1'>
                          Excel files (XLSX, XLS, CSV) only
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <Button
              type='submit'
              className='w-full bg-[#3a5f9e] hover:bg-[#325186] text-white py-6 text-lg rounded-xl shadow-lg shadow-blue-900/10'
              disabled={loading || !file}
            >
              {loading ? (
                <>
                  <Loader2 className='w-5 h-5 mr-2 animate-spin' />
                  Uploading...
                </>
              ) : (
                'Submit Data'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SubmitExcel;
