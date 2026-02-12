import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
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

const UserForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: '',
  });

  useEffect(() => {
    if (isEdit) {
      fetchUser();
    }
  }, [id]);

  const fetchUser = async () => {
    setFetching(true);
    try {
      const response = await api.get(`/users/${id}`);
      const user = response.data.data || response.data;

      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        password: '', // Leave blank for edit
        role: user.role || '',
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error('Failed to fetch user details');
      navigate('/users');
    } finally {
      setFetching(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (val) => {
    setFormData((prev) => ({ ...prev, role: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.first_name ||
      !formData.last_name ||
      !formData.email ||
      !formData.role ||
      (!isEdit && !formData.password)
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        const updateData = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          role: formData.role,
        };

        if (formData.password && formData.password.trim() !== '') {
          updateData.password = formData.password;
        }

        await api.put(`/users/${id}`, updateData);
        toast.success('User updated successfully');
      } else {
        await api.post('/users', formData);
        toast.success('User created successfully');
      }
      navigate('/users');
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          `Failed to ${isEdit ? 'update' : 'create'} user`,
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className='flex items-center justify-center p-20'>
        <Loader2 className='animate-spin text-blue-600' size={40} />
      </div>
    );
  }

  return (
    <div className='py-6'>
      <div className='flex items-center gap-4 mb-6'>
        <button
          onClick={() => navigate('/users')}
          className='p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors'
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className='text-2xl font-bold text-gray-800'>
            {isEdit ? 'Edit User' : 'Add New User'}
          </h1>
          <p className='text-gray-500 text-sm mt-1'>
            {isEdit
              ? 'Update user details and permissions'
              : 'Create a new user account in the system'}
          </p>
        </div>
      </div>

      <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-8'>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                First Name <span className='text-red-500'>*</span>
              </label>
              <Input
                name='first_name'
                type='text'
                placeholder='John'
                value={formData.first_name}
                onChange={handleInputChange}
                className='h-11'
                required
              />
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Last Name <span className='text-red-500'>*</span>
              </label>
              <Input
                name='last_name'
                type='text'
                placeholder='Doe'
                value={formData.last_name}
                onChange={handleInputChange}
                className='h-11'
                required
              />
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Email Address <span className='text-red-500'>*</span>
              </label>
              <Input
                name='email'
                type='email'
                placeholder='user@example.com'
                value={formData.email}
                onChange={handleInputChange}
                className='h-11'
                required
              />
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Role <span className='text-red-500'>*</span>
              </label>
              <Select onValueChange={handleRoleChange} value={formData.role}>
                <SelectTrigger className='h-11'>
                  <SelectValue placeholder='Select a role' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='SuperAdmin'>SuperAdmin</SelectItem>
                  <SelectItem value='Trainer'>Trainer</SelectItem>
                  <SelectItem value='Candidate'>Candidate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                {isEdit ? 'Password (leave blank to keep current)' : 'Password'}
                {!isEdit && <span className='text-red-500'> *</span>}
              </label>
              <Input
                name='password'
                type='password'
                placeholder='••••••••'
                value={formData.password}
                onChange={handleInputChange}
                className='h-11'
                required={!isEdit}
              />
              {isEdit && (
                <p className='text-xs text-slate-500'>
                  Only enter a password if you want to change it.
                </p>
              )}
            </div>
          </div>

          <div className='pt-6 flex justify-end gap-3 border-t border-gray-100 mt-8'>
            <Button
              type='button'
              variant='outline'
              onClick={() => navigate('/users')}
              className='h-11 px-6'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              className='bg-[#3a5f9e] hover:bg-[#325186] text-white h-11 px-8'
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Processing...
                </>
              ) : isEdit ? (
                'Update User'
              ) : (
                'Create User'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;
