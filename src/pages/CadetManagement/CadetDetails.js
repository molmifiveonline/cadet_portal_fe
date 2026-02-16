import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  User,
  BookOpen,
  Hash,
  Percent,
  School,
  Ruler,
  Weight,
  Activity,
  Award,
  Book,
  FileText,
} from 'lucide-react';
import api from '../../lib/utils/apiConfig';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { toast } from 'sonner';

const CadetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cadet, setCadet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCadetDetails = async () => {
      try {
        setLoading(true);
        // Assuming the API endpoint is /cadets/:id
        const response = await api.get(`/cadets/${id}`);
        setCadet(response.data.data || response.data);
      } catch (error) {
        console.error('Error fetching cadet details:', error);
        toast.error('Failed to load cadet details');
        navigate('/cadets'); // Redirect back on error
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCadetDetails();
    }
  }, [id, navigate]);

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[500px]'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    );
  }

  if (!cadet) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[500px] gap-4'>
        <h2 className='text-xl font-semibold text-gray-700'>Cadet not found</h2>
        <Button onClick={() => navigate('/cadets')}>Back to List</Button>
      </div>
    );
  }

  const DetailItem = ({ icon: Icon, label, value }) => (
    <div className='flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100'>
      <div className='p-2 bg-white rounded-md shadow-sm text-blue-600'>
        <Icon size={18} />
      </div>
      <div>
        <p className='text-xs text-gray-500 font-medium uppercase tracking-wide'>
          {label}
        </p>
        <p className='text-gray-900 font-medium mt-0.5'>{value || '-'}</p>
      </div>
    </div>
  );

  return (
    <div className='py-6 space-y-6 animate-in fade-in slide-in-from-bottom-4'>
      {/* Header */}
      <div className='flex items-center gap-4 mb-6'>
        <Button
          variant='outline'
          size='icon'
          onClick={() => navigate('/cadets')}
          className='rounded-full hover:bg-gray-100'
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Cadet Details</h1>
          <p className='text-gray-500 text-sm'>
            View full information about {cadet.name}
          </p>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {/* Main Info Card */}
        <Card className='md:col-span-1 shadow-sm border-gray-200'>
          <CardHeader className='bg-gray-50/50 border-b border-gray-100 pb-4'>
            <div className='flex justify-center mb-4'>
              <div className='h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-bold border-4 border-white shadow-md'>
                {cadet.name?.charAt(0).toUpperCase()}
              </div>
            </div>
            <CardTitle className='text-center text-xl'>{cadet.name}</CardTitle>
            <p className='text-center text-gray-500 text-sm'>{cadet.email}</p>
            <div className='mt-4 flex justify-center'>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  cadet.current_stage === 'selected'
                    ? 'bg-green-100 text-green-800'
                    : cadet.current_stage === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                }`}
              >
                {cadet.current_stage?.replace(/_/g, ' ').toUpperCase() ||
                  'UNKNOWN'}
              </span>
            </div>
          </CardHeader>
          <CardContent className='pt-6 space-y-4'>
            <div className='space-y-3'>
              <div className='flex items-center gap-3 text-sm text-gray-600'>
                <Mail size={16} />
                <span className='truncate'>{cadet.email}</span>
              </div>
              <div className='flex items-center gap-3 text-sm text-gray-600'>
                <Phone size={16} />
                <span>{cadet.phone || '-'}</span>
              </div>
              <div className='flex items-center gap-3 text-sm text-gray-600'>
                <User size={16} />
                <span>{cadet.gender || '-'}</span>
              </div>
              <div className='flex items-center gap-3 text-sm text-gray-600'>
                <Calendar size={16} />
                <span>
                  {cadet.dob ? new Date(cadet.dob).toLocaleDateString() : '-'}
                </span>
              </div>
              <div className='flex items-center gap-3 text-sm text-gray-600'>
                <User size={16} />
                <span>Hometown: {cadet.hometown || '-'}</span>
              </div>
              <div className='flex items-center gap-3 text-sm text-gray-600'>
                <Activity size={16} />
                <span>Blood Group: {cadet.blood_group || '-'}</span>
              </div>
              <div className='flex items-center gap-3 text-sm text-gray-600'>
                <Ruler size={16} />
                <span>Height: {cadet.height ? `${cadet.height} cm` : '-'}</span>
              </div>
              <div className='flex items-center gap-3 text-sm text-gray-600'>
                <Weight size={16} />
                <span>Weight: {cadet.weight ? `${cadet.weight} kg` : '-'}</span>
              </div>
              <div className='flex items-center gap-3 text-sm text-gray-600'>
                <Activity size={16} />
                <span>BMI: {cadet.bmi || '-'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Info Grid */}
        <div className='md:col-span-2 space-y-6'>
          {/* Official Documents */}
          <Card className='shadow-sm border-gray-200'>
            <CardHeader className='pb-3 border-b border-gray-100'>
              <CardTitle className='text-lg flex items-center gap-2'>
                <FileText size={20} className='text-blue-600' />
                Official Documents
              </CardTitle>
            </CardHeader>
            <CardContent className='pt-6'>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                <DetailItem
                  icon={Hash}
                  label='INDoS Number'
                  value={cadet.indos_number}
                />
                <DetailItem
                  icon={Hash}
                  label='CDC Number'
                  value={cadet.cdc_number}
                />
                <DetailItem
                  icon={Hash}
                  label='Passport Number'
                  value={cadet.passport_number}
                />
              </div>
            </CardContent>
          </Card>

          {/* Academic & Course Info */}
          <Card className='shadow-sm border-gray-200'>
            <CardHeader className='pb-3 border-b border-gray-100'>
              <CardTitle className='text-lg flex items-center gap-2'>
                <School size={20} className='text-blue-600' />
                Academic & Course Info
              </CardTitle>
            </CardHeader>
            <CardContent className='pt-6'>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                <DetailItem
                  icon={School}
                  label='Institute'
                  value={cadet.institute_name}
                />
                <DetailItem
                  icon={BookOpen}
                  label='Course'
                  value={cadet.course}
                />
                <DetailItem icon={Hash} label='Batch' value={cadet.batch} />
                <DetailItem
                  icon={Award}
                  label='Batch Rank'
                  value={cadet.batch_rank}
                />
                <DetailItem
                  icon={Calendar}
                  label='Passing Out Date'
                  value={
                    cadet.passing_out_date
                      ? new Date(cadet.passing_out_date).toLocaleDateString()
                      : '-'
                  }
                />
                <DetailItem
                  icon={User}
                  label='Age at Passing Out'
                  value={cadet.age_at_passing_out}
                />
              </div>
            </CardContent>
          </Card>

          {/* Educational Qualifications */}
          <Card className='shadow-sm border-gray-200'>
            <CardHeader className='pb-3 border-b border-gray-100'>
              <CardTitle className='text-lg flex items-center gap-2'>
                <Percent size={20} className='text-blue-600' />
                Educational Qualifications
              </CardTitle>
            </CardHeader>
            <CardContent className='pt-6'>
              <div className='space-y-6'>
                {/* 10th Standard */}
                <div>
                  <h4 className='text-sm font-semibold text-gray-700 mb-3'>
                    10th Standard
                  </h4>
                  <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                    <DetailItem
                      icon={School}
                      label='Board'
                      value={cadet.tenth_board}
                    />
                    <DetailItem
                      icon={Calendar}
                      label='Year'
                      value={cadet.tenth_year}
                    />
                    <DetailItem
                      icon={Percent}
                      label='Percentage'
                      value={
                        cadet.tenth_percentage
                          ? `${cadet.tenth_percentage}%`
                          : '-'
                      }
                    />
                    <DetailItem
                      icon={Percent}
                      label='Maths'
                      value={cadet.tenth_maths ? `${cadet.tenth_maths}%` : '-'}
                    />
                    <DetailItem
                      icon={Percent}
                      label='Science'
                      value={
                        cadet.tenth_science ? `${cadet.tenth_science}%` : '-'
                      }
                    />
                    <DetailItem
                      icon={Percent}
                      label='English'
                      value={
                        cadet.tenth_english ? `${cadet.tenth_english}%` : '-'
                      }
                    />
                  </div>
                </div>

                {/* 12th Standard */}
                <div>
                  <h4 className='text-sm font-semibold text-gray-700 mb-3 border-t pt-4'>
                    12th Standard
                  </h4>
                  <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                    <DetailItem
                      icon={School}
                      label='Board'
                      value={cadet.twelfth_board}
                    />
                    <DetailItem
                      icon={Calendar}
                      label='Year'
                      value={cadet.twelfth_year}
                    />
                    <DetailItem
                      icon={Percent}
                      label='Percentage'
                      value={
                        cadet.twelfth_percentage
                          ? `${cadet.twelfth_percentage}%`
                          : '-'
                      }
                    />
                    <DetailItem
                      icon={Percent}
                      label='English'
                      value={
                        cadet.twelfth_english
                          ? `${cadet.twelfth_english}%`
                          : '-'
                      }
                    />
                    <DetailItem
                      icon={Percent}
                      label='Physics'
                      value={
                        cadet.twelfth_physics
                          ? `${cadet.twelfth_physics}%`
                          : '-'
                      }
                    />
                    <DetailItem
                      icon={Percent}
                      label='Chemistry'
                      value={
                        cadet.twelfth_chemistry
                          ? `${cadet.twelfth_chemistry}%`
                          : '-'
                      }
                    />
                    <DetailItem
                      icon={Percent}
                      label='Maths'
                      value={
                        cadet.twelfth_maths ? `${cadet.twelfth_maths}%` : '-'
                      }
                    />
                    <DetailItem
                      icon={Percent}
                      label='PCM Percentage'
                      value={
                        cadet.pcm_percentage ? `${cadet.pcm_percentage}%` : '-'
                      }
                    />
                  </div>
                </div>

                {/* Degree & Others */}
                <div>
                  <h4 className='text-sm font-semibold text-gray-700 mb-3 border-t pt-4'>
                    Degree & Others
                  </h4>
                  <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                    <DetailItem
                      icon={Percent}
                      label='Degree Percentage'
                      value={
                        cadet.degree_percentage
                          ? `${cadet.degree_percentage}%`
                          : '-'
                      }
                    />
                    <DetailItem
                      icon={Book}
                      label='No. of Arrears'
                      value={cadet.no_of_arrears}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* IMU Info */}
          <Card className='shadow-sm border-gray-200'>
            <CardHeader className='pb-3 border-b border-gray-100'>
              <CardTitle className='text-lg flex items-center gap-2'>
                <School size={20} className='text-blue-600' />
                IMU Performance
              </CardTitle>
            </CardHeader>
            <CardContent className='pt-6'>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                <DetailItem
                  icon={Award}
                  label='IMU Rank'
                  value={cadet.imu_rank}
                />
                <DetailItem
                  icon={Percent}
                  label='IMU Avg %'
                  value={
                    cadet.imu_avg_percentage
                      ? `${cadet.imu_avg_percentage}%`
                      : '-'
                  }
                />
                <DetailItem
                  icon={Percent}
                  label='Sem 1'
                  value={cadet.imu_sem1}
                />
                <DetailItem
                  icon={Percent}
                  label='Sem 2'
                  value={cadet.imu_sem2}
                />
                <DetailItem
                  icon={Percent}
                  label='Sem 3'
                  value={cadet.imu_sem3}
                />
                <DetailItem
                  icon={Percent}
                  label='Sem 4'
                  value={cadet.imu_sem4}
                />
                <DetailItem
                  icon={Percent}
                  label='Sem 5'
                  value={cadet.imu_sem5}
                />
                <DetailItem
                  icon={Percent}
                  label='Sem 6'
                  value={cadet.imu_sem6}
                />
                <DetailItem
                  icon={Percent}
                  label='Sem 7'
                  value={cadet.imu_sem7}
                />
                <DetailItem
                  icon={Percent}
                  label='Sem 8'
                  value={cadet.imu_sem8}
                />
              </div>
            </CardContent>
          </Card>

          {/* Extra Curricular */}
          <Card className='shadow-sm border-gray-200'>
            <CardHeader className='pb-3 border-b border-gray-100'>
              <CardTitle className='text-lg flex items-center gap-2'>
                <Activity size={20} className='text-blue-600' />
                Extra Curricular
              </CardTitle>
            </CardHeader>
            <CardContent className='pt-6'>
              <p className='text-gray-700 whitespace-pre-wrap'>
                {cadet.extra_curricular ||
                  'No extra curricular details provided.'}
              </p>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card className='shadow-sm border-gray-200'>
            <CardHeader className='pb-3 border-b border-gray-100'>
              <CardTitle className='text-lg flex items-center gap-2'>
                <Activity size={20} className='text-blue-600' />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent className='pt-6'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <DetailItem
                  icon={Calendar}
                  label='Created At'
                  value={
                    cadet.created_at
                      ? new Date(cadet.created_at).toLocaleDateString()
                      : '-'
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CadetDetails;
