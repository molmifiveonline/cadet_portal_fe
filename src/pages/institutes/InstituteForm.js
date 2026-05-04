import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Loader2,
  ArrowLeft,
  Building2,
  MapPin,
  Mail,
  User,
} from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../lib/utils/apiConfig';
import { toast } from 'sonner';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'components/ui/select';
import PageHeader from '../../components/common/PageHeader';
import {
  EMAIL_VALIDATION_MESSAGE,
  getEmailValidationMessage,
} from '../../lib/utils/validationUtils';

const CONTACT_COUNT = 3;

const createEmptyContacts = () =>
  Array.from({ length: CONTACT_COUNT }, (_, index) => ({
    name: '',
    email: '',
    isDefault: index === 0,
  }));

const normalizeContacts = (contacts) => {
  const normalized = Array.isArray(contacts) ? contacts.slice(0, CONTACT_COUNT) : [];
  const paddedContacts = [...normalized, ...createEmptyContacts()].slice(
    0,
    CONTACT_COUNT,
  );

  return paddedContacts.map((contact, index) => ({
    name: contact?.name || '',
    email: contact?.email || '',
    isDefault: index === 0,
  }));
};

const prepareContactsForSubmit = (contacts) => {
  const filledContacts = normalizeContacts(contacts).filter(
    (contact) => contact.name.trim() || contact.email.trim(),
  );

  return filledContacts.map((contact, index) => ({
    name: contact.name.trim(),
    email: contact.email.trim(),
    isDefault: index === 0,
  }));
};

const InstituteForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      institute_name: '',
      location: '',
      address: '',
      institute_type: 'none',
      status: 'active',
      contact_emails: createEmptyContacts(),
    },
  });

  useEffect(() => {
    const processInstituteData = (data) => {
      let initialContacts = [];
      let contacts = data.contact_emails;
      if (typeof contacts === 'string') {
        try {
          contacts = JSON.parse(contacts);
        } catch (e) {
          contacts = [];
        }
      }

      if (contacts && Array.isArray(contacts) && contacts.length > 0) {
        initialContacts = normalizeContacts(contacts);
      } else {
        initialContacts = createEmptyContacts();
      }

      return {
        institute_name: data.institute_name || '',
        location: data.location || '',
        address: data.address || '',
        institute_type:
          data.institute_type === null || data.institute_type === ''
            ? 'none'
            : data.institute_type,
        status: data.status
          ? String(data.status).toLowerCase().trim()
          : 'active',
        contact_emails: initialContacts,
      };
    };

    if (location.state?.instituteData) {
      const cleanData = processInstituteData(location.state.instituteData);
      reset(cleanData);
    } else if (id) {
      const fetchInstitute = async () => {
        try {
          setFetching(true);
          const response = await api.get(`/institutes/${id}`);
          const data = response.data.data || response.data;
          const cleanData = processInstituteData(data);
          reset(cleanData);
        } catch (error) {
          console.error('Error fetching institute:', error);
          toast.error('Failed to fetch institute data');
          const returnState = location.state?.returnState;
          if (returnState) {
            navigate('/institutes', { state: { returnState } });
          } else {
            navigate('/institutes');
          }
        } finally {
          setFetching(false);
        }
      };
      fetchInstitute();
    } else {
      reset({
        institute_name: '',
        location: '',
        address: '',
        institute_type: '',
        status: 'active',
        contact_emails: createEmptyContacts(),
      });
    }
  }, [id, reset, navigate, location.state]);

  const onSubmit = async (data) => {
    const contactEmails = prepareContactsForSubmit(data.contact_emails);

    if (contactEmails.length === 0) {
      toast.error('Please enter at least one institute contact email');
      return;
    }

    const payload = {
      ...data,
      contact_emails: contactEmails,
    };

    try {
      setLoading(true);
      if (id) {
        await api.put(`/institutes/${id}`, payload);
        toast.success('Institute updated successfully');
      } else {
        await api.post('/institutes', payload);
        toast.success('Institute created successfully');
      }
      const returnState = location.state?.returnState;
      if (returnState) {
        navigate('/institutes', { state: { returnState } });
      } else {
        navigate('/institutes');
      }
    } catch (error) {
      console.error('Error saving institute:', error);
      toast.error(error.response?.data?.message || 'Failed to save institute');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    const returnState = location.state?.returnState;
    if (returnState) {
      navigate('/institutes', { state: { returnState } });
    } else {
      navigate('/institutes');
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
      <PageHeader
        title={id ? 'Edit Institute' : 'Add New Institute'}
        subtitle={id ? 'Update institute details and information' : 'Create a new institute record in the system'}
        icon={Building2}
        backButton={
          <button
            onClick={handleCancel}
            className='p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors'
          >
            <ArrowLeft size={24} />
          </button>
        }
      />

      <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500'>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700 ml-1'>
                Institute Name <span className='text-red-500'>*</span>
              </label>
              <div className='relative group'>
                <Building2 className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 transition-colors group-focus-within:text-[#3a5f9e]' />
                <Input
                  {...register('institute_name', {
                    required: 'Name is required',
                  })}
                  className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#3a5f9e]/10 focus:border-[#3a5f9e] transition-all duration-200 h-auto outline-none'
                  placeholder='Enter institute name'
                />
              </div>
              {errors.institute_name && (
                <span className='text-red-500 text-xs ml-1'>
                  {errors.institute_name.message}
                </span>
              )}
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700 ml-1'>
                Location <span className='text-red-500'>*</span>
              </label>
              <div className='relative group'>
                <MapPin className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 transition-colors group-focus-within:text-[#3a5f9e]' />
                <Input
                  {...register('location', {
                    required: 'Location is required',
                  })}
                  className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#3a5f9e]/10 focus:border-[#3a5f9e] transition-all duration-200 h-auto outline-none'
                  placeholder='e.g. Mumbai, Maharashtra'
                />
              </div>
              {errors.location && (
                <span className='text-red-500 text-xs ml-1'>
                  {errors.location.message}
                </span>
              )}
            </div>

            {/* Contacts Area */}
            <div className='col-span-1 md:col-span-2 space-y-4 rounded-xl border border-gray-200 p-5 bg-gray-50/30'>
              <div className='flex items-center justify-between'>
                <h3 className='text-[15px] font-semibold text-gray-800 flex items-center gap-2'>
                  <Mail className='w-4 h-4 text-[#3a5f9e]' />
                  Institute Contacts
                </h3>
              </div>

              <div className='space-y-3'>
                {Array.from({ length: CONTACT_COUNT }, (_, index) => (
                  <div key={`contact-${index}`} className='relative p-4 bg-white rounded-xl border border-gray-300 transition-all hover:border-gray-400'>
                    <div className='text-xs font-semibold text-gray-600 mb-3'>
                      {index === 0
                        ? 'Institute Contact 1 - Primary Contact'
                        : `Institute Contact ${index + 1}`}
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                      <div className='space-y-1.5'>
                        <label className='text-xs font-medium text-gray-500 ml-1'>Contact Person</label>
                        <div className='relative'>
                          <User className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5' />
                          <Input
                            {...register(`contact_emails.${index}.name`)}
                            className='w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 bg-gray-50/50 focus:bg-white h-9'
                            placeholder='e.g. John Doe'
                          />
                        </div>
                      </div>

                      <div className='space-y-1.5'>
                        <label className='text-xs font-medium text-gray-500 ml-1'>
                          Email Address
                          {index === 0 && <span className='text-red-500'> *</span>}
                        </label>
                        <div className='relative'>
                          <Mail className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5' />
                          <Input
                            {...register(`contact_emails.${index}.email`, {
                              required:
                                index === 0 ? 'Contact email is required' : false,
                              validate: (value, formValues) => {
                                const contactName =
                                  formValues.contact_emails?.[index]?.name || '';
                                const emailValue = value || '';

                                if (
                                  index > 0 &&
                                  contactName.trim() &&
                                  !emailValue.trim()
                                ) {
                                  return 'Email is required when contact person is provided';
                                }

                                const emailMessage =
                                  getEmailValidationMessage(emailValue);
                                if (emailMessage) {
                                  return EMAIL_VALIDATION_MESSAGE;
                                }

                                return true;
                              },
                            })}
                            className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-gray-50/50 focus:bg-white h-9 ${errors?.contact_emails?.[index]?.email ? 'border-red-400 ring-1 ring-red-400/30' : 'border-gray-300'}`}
                            placeholder='contact@institute.com'
                          />
                        </div>
                        {errors?.contact_emails?.[index]?.email && (
                          <span className='text-red-500 text-[10px] ml-1'>
                            {errors.contact_emails[index].email.message}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Institute Type and Status Row */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 lg:col-span-2'>
              <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-700 ml-1'>
                  Institute Type
                </label>
                <Controller
                  name='institute_type'
                  control={control}
                  defaultValue=''
                  render={({ field }) => (
                    <Select
                      value={field.value || ''}
                      onValueChange={(val) =>
                        field.onChange(val === 'none' ? '' : val)
                      }
                    >
                      <SelectTrigger className='w-full rounded-xl border border-gray-300 bg-gray-50/50 h-[42px]'>
                        <SelectValue placeholder='Select type...' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='none'>— None —</SelectItem>
                        <SelectItem value='IMU'>IMU</SelectItem>
                        <SelectItem value='B.Tech'>B.Tech</SelectItem>
                        <SelectItem value='Both'>Both</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-700 ml-1'>
                  Status <span className='text-red-500'>*</span>
                </label>
                <Controller
                  name='status'
                  control={control}
                  render={({ field }) => (
                    <Select
                      key={`status-${field.value}`}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className='w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#3a5f9e]/10 focus:border-[#3a5f9e] transition-all duration-200 h-auto outline-none'>
                        <SelectValue placeholder='Select status' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='active'>
                          <div className='flex items-center gap-2'>
                            <div className='w-2 h-2 rounded-full bg-green-500' />
                            Active
                          </div>
                        </SelectItem>
                        <SelectItem value='inactive'>
                          <div className='flex items-center gap-2'>
                            <div className='w-2 h-2 rounded-full bg-red-500' />
                            Inactive
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-700 ml-1'>
              Full Address <span className='text-red-500'>*</span>
            </label>
            <div className='relative group'>
              <MapPin className='absolute left-3 top-3 text-gray-400 h-4 w-4 transition-colors group-focus-within:text-[#3a5f9e]' />
              <textarea
                {...register('address', { required: 'Address is required' })}
                rows={3}
                className='w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-[#3a5f9e]/10 focus:border-[#3a5f9e] transition-all duration-200 h-auto outline-none resize-none'
                placeholder='Enter full address...'
              />
            </div>
            {errors.address && (
              <span className='text-red-500 text-xs ml-1'>
                {errors.address.message}
              </span>
            )}
          </div>

          <div className='flex justify-end gap-3 pt-4 border-t'>
            <button
              type='button'
              onClick={handleCancel}
              className='px-6 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors'
            >
              Cancel
            </button>
            <Button
              type='submit'
              className='bg-[#3a5f9e] hover:bg-[#325186] text-white px-6 py-2.5 h-auto'
              disabled={isSubmitting || loading}
            >
              {isSubmitting || loading ? (
                <>
                  <Loader2 className='animate-spin' size={18} />
                  Saving...
                </>
              ) : (
                'Save Institute'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InstituteForm;
