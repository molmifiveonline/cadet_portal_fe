import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../../lib/utils/apiConfig';

const CVFormPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cadetData, setCadetData] = useState(null);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchCVFormData();
  }, [token]);

  const fetchCVFormData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/cv/form/${token}`);

      setCadetData(response.data.data.cadet);
      setTokenInfo(response.data.data.token_info);
      setFormData(response.data.data.cadet);
    } catch (error) {
      console.error('Error fetching CV form:', error);
      const message =
        error.response?.data?.message ||
        error.message ||
        'Invalid or expired link';
      toast.error(message);
      setTimeout(() => navigate('/'), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post(`/cv/form/${token}`, formData);

      toast.success('CV details submitted successfully!');
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      console.error('Error submitting CV form:', error);
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to submit CV form';
      toast.error(message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading CV form...</p>
        </div>
      </div>
    );
  }

  if (!cadetData) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-gray-800 mb-2'>
            Invalid or Expired Link
          </h2>
          <p className='text-gray-600'>This CV form link is no longer valid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-4xl mx-auto px-4'>
        {/* Header */}
        <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
          <h1 className='text-3xl font-bold text-blue-600 mb-2'>
            MOLMI Cadet CV Form
          </h1>
          <p className='text-gray-600'>
            Complete your CV details for <strong>{cadetData.name}</strong>
          </p>
          <p className='text-sm text-gray-500 mt-2'>
            Institute: {tokenInfo?.institute_name} | Expires:{' '}
            {new Date(tokenInfo?.expires_at).toLocaleDateString()}
          </p>
        </div>

        {/* CV Form */}
        <form
          onSubmit={handleSubmit}
          className='bg-white rounded-lg shadow-md p-6'
        >
          <div className='space-y-6'>
            {/* Personal Information */}
            <div>
              <h2 className='text-xl font-semibold text-gray-800 mb-4 border-b pb-2'>
                Personal Information
              </h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Nationality
                  </label>
                  <input
                    type='text'
                    name='nationality'
                    value={formData.nationality || ''}
                    onChange={handleChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Languages Known
                  </label>
                  <input
                    type='text'
                    name='language_known'
                    value={formData.language_known || ''}
                    onChange={handleChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Eye Color
                  </label>
                  <input
                    type='text'
                    name='eye_color'
                    value={formData.eye_color || ''}
                    onChange={handleChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Eye Vision
                  </label>
                  <input
                    type='text'
                    name='eye_vision'
                    value={formData.eye_vision || ''}
                    onChange={handleChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className='flex justify-end gap-4 pt-6 border-t'>
              <button
                type='submit'
                className='px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              >
                Submit CV Details
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CVFormPage;
