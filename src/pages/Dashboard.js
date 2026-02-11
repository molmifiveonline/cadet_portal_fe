import React, { useState } from 'react';
import {
  Users,
  GraduationCap,
  BookOpen,
  Search,
  Filter,
  MoreVertical,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';

const StatsCard = ({ title, value, icon: Icon, gradient }) => {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-white/40 shadow-lg',
        'bg-white/60 backdrop-blur-2xl',
      )}
    >
      <div
        className={`absolute right-0 top-0 w-32 h-32 opacity-20 rounded-bl-full bg-gradient-to-br ${gradient} -mr-8 -mt-8`}
      />

      <div className='flex justify-between items-start relative z-10'>
        <div
          className={cn(
            'p-3 rounded-2xl bg-gradient-to-br text-white shadow-lg shadow-black/5',
            gradient,
          )}
        >
          <Icon className='w-6 h-6' />
        </div>
      </div>

      <div className='mt-4 relative z-10'>
        <h3 className='text-4xl font-bold text-slate-800 tracking-tight'>
          {value}
        </h3>
        <p className='text-sm font-semibold text-slate-500 mt-1'>{title}</p>
      </div>
    </div>
  );
};

const FilterSection = () => {
  const handleSearch = () => {
    toast.info('Searching for records...');
    // Add your search logic here
  };

  return (
    <Card className='rounded-3xl border-white/40 bg-white/60 backdrop-blur-2xl shadow-lg mb-8 overflow-visible z-10'>
      <CardHeader className='pb-4 border-b border-slate-100/50'>
        <div className='flex items-center gap-2'>
          <div className='p-2 bg-blue-50/80 text-blue-600 rounded-lg backdrop-blur-sm'>
            <Filter className='w-4 h-4' />
          </div>
          <CardTitle className='text-lg font-bold text-slate-800'>
            Filters
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className='p-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end'>
          <div className='space-y-2'>
            <label className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>
              Trainer
            </label>
            <Select>
              <SelectTrigger className='bg-white/80 border-slate-200/60 focus:ring-blue-500/20'>
                <SelectValue placeholder='Select Trainer' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='t1'>Trainer A</SelectItem>
                <SelectItem value='t2'>Trainer B</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <label className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>
              Master Course
            </label>
            <Select>
              <SelectTrigger className='bg-white/80 border-slate-200/60 focus:ring-blue-500/20'>
                <SelectValue placeholder='Select Course' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='c1'>Course A</SelectItem>
                <SelectItem value='c2'>Course B</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <label className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>
              Start Month
            </label>
            <div className='relative'>
              <input
                type='date'
                className='w-full h-10 px-3 py-2 bg-white/80 border border-slate-200/60 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <label className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>
              End Month
            </label>
            <div className='relative'>
              <input
                type='date'
                className='w-full h-10 px-3 py-2 bg-white/80 border border-slate-200/60 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <label className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>
              Status
            </label>
            <Select>
              <SelectTrigger className='bg-white/80 border-slate-200/60 focus:ring-blue-500/20'>
                <SelectValue placeholder='All Status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='active'>Active</SelectItem>
                <SelectItem value='inactive'>Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className='mt-6 flex justify-end'>
          <button
            onClick={handleSearch}
            className='bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-8 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 active:scale-95 transform hover:-translate-y-0.5'
          >
            <Search className='w-4 h-4' />
            Search Records
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  return (
    <>
      {/* Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
        <StatsCard
          title='Total Candidates'
          value='3,519'
          icon={Users}
          gradient='from-blue-500 to-indigo-600'
        />
        <StatsCard
          title='Total Trainers'
          value='22'
          icon={GraduationCap}
          gradient='from-violet-500 to-purple-600'
        />
        <StatsCard
          title='Total Active Courses'
          value='211'
          icon={BookOpen}
          gradient='from-emerald-500 to-teal-600'
        />
      </div>

      <FilterSection />

      {/* Tables Section */}
      <div className='grid grid-cols-1 gap-8'>
        {/* Course List Table */}
        <div className='bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-sm overflow-hidden flex flex-col'>
          <div className='px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white/50'>
            <h3 className='font-bold text-slate-800 text-lg'>Course Details</h3>
            <button className='p-2 hover:bg-slate-100 rounded-lg transition-colors'>
              <MoreVertical className='w-4 h-4 text-slate-500' />
            </button>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full text-left border-collapse'>
              <thead>
                <tr className='bg-slate-50/50 border-b border-slate-200'>
                  <th className='px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider'>
                    Course Name
                  </th>
                  <th className='px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center'>
                    Man Days
                  </th>
                  <th className='px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider'>
                    Start Date
                  </th>
                  <th className='px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider'>
                    End Date
                  </th>
                  <th className='px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center'>
                    Candidates
                  </th>
                  <th className='px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center'>
                    Rating
                  </th>
                  <th className='px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center'>
                    Absent
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100'>
                <tr>
                  <td colSpan='8' className='px-6 py-12 text-center'>
                    <div className='flex flex-col items-center justify-center text-slate-400 gap-2'>
                      <div className='p-3 bg-slate-50 rounded-full'>
                        <Search className='w-6 h-6 text-slate-300' />
                      </div>
                      <p className='font-medium'>No course records found</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Candidate List Table */}
        <div className='bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-sm overflow-hidden flex flex-col'>
          <div className='px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white/50'>
            <div className='flex items-center gap-2'>
              <div className='p-1.5 bg-red-50 text-red-500 rounded-md'>
                <AlertCircle className='w-4 h-4' />
              </div>
              <h3 className='font-bold text-slate-800 text-lg'>
                Candidate Alerts
              </h3>
            </div>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full text-left border-collapse'>
              <thead>
                <tr className='bg-slate-50/50 border-b border-slate-200'>
                  <th className='px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider'>
                    Candidate ID
                  </th>
                  <th className='px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider'>
                    Name
                  </th>
                  <th className='px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider'>
                    Course Name
                  </th>
                  <th className='px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider'>
                    Emp ID
                  </th>
                  <th className='px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider'>
                    Expiry Date
                  </th>
                  <th className='px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center'>
                    Alert
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100'>
                <tr>
                  <td colSpan='6' className='px-6 py-12 text-center'>
                    <div className='flex flex-col items-center justify-center text-slate-400 gap-2'>
                      <div className='p-3 bg-slate-50 rounded-full'>
                        <CheckCircle className='w-6 h-6 text-slate-300' />
                      </div>
                      <p className='font-medium'>No candidate alerts found</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
