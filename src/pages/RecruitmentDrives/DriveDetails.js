import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../../lib/utils/apiConfig';
import { ArrowLeft, Edit, Users, FileText, CheckCircle, Clock, Mail, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import Permission from '../../components/common/Permission';
import AssessmentTab from './AssessmentTab';
import InterviewTab from './InterviewTab';
import MedicalTab from './MedicalTab';
import CadetsTab from './CadetsTab';
import DocumentsTab from './DocumentsTab';

const DriveDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [drive, setDrive] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sendingShortlist, setSendingShortlist] = useState(false);

  useEffect(() => {
    const fetchDriveData = async () => {
      try {
        setLoading(true);
        const [driveResponse, statsResponse] = await Promise.all([
          api.get(`/recruitment-drives/${id}`),
          api.get(`/recruitment-drives/${id}/stats`)
        ]);

        setDrive(driveResponse.data.data);
        setStats(statsResponse.data.data);
      } catch (error) {
        console.error('Error fetching drive data:', error);
        toast.error('Failed to fetch drive details');
        navigate('/drives');
      } finally {
        setLoading(false);
      }
    };

    fetchDriveData();
  }, [id, navigate]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Draft': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-blue-100 text-blue-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCourseTypeColor = (courseType) => {
    return courseType === 'Deck' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800';
  };

  const handlePipelineClick = (status) => {
    setStatusFilter(status);
    setActiveTab('cadets');
  };
  
  const handleSendShortlistEmail = async () => {
    if (!drive || !drive.institute_id) {
      toast.error('Institute information missing');
      return;
    }

    try {
      setSendingShortlist(true);
      const response = await api.post('/institutes/send-shortlist-email', {
        instituteIds: [drive.institute_id],
      });

      const results = response.data.results || [];
      const success = results.filter((r) => r.status === 'success');
      const skipped = results.filter((r) => r.status === 'skipped');

      if (success.length > 0) {
        toast.success(
          `Shortlist email sent to ${success[0].email} (${success[0].cadetCount} cadets)`,
        );
      } else if (skipped.length > 0) {
        toast.warning(
          skipped[0].reason || 'No shortlisted cadets for this institute',
        );
      } else {
        toast.error('Failed to send shortlist email');
      }
    } catch (error) {
      console.error('Error sending shortlist email:', error);
      toast.error(
        error.response?.data?.message || 'Failed to send shortlist email',
      );
    } finally {
      setSendingShortlist(false);
    }
  };

  const tabs = [
    { id: 'info', label: 'Drive Info', icon: FileText },
    { id: 'cadets', label: 'Cadets', icon: Users },
    { id: 'assessment', label: 'Assessment', icon: CheckCircle },
    { id: 'interview', label: 'Interview', icon: Clock },
    { id: 'medical', label: 'Medical', icon: CheckCircle },
    { id: 'documents', label: 'Documents', icon: FileText }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!drive) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Drive not found</h3>
        <Button onClick={() => navigate('/drives')} className="mt-4">
          Back to Drives
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/drives')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Drives
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{drive.drive_name}</h1>
            <p className="text-gray-600">{drive.institute_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(drive.status)}`}>
            {drive.status}
          </span>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getCourseTypeColor(drive.course_type)}`}>
            {drive.course_type}
          </span>
          <Permission module="institutes" action="view">
            <Button
              variant="outline"
              onClick={handleSendShortlistEmail}
              disabled={sendingShortlist}
              className="flex items-center gap-2 border-green-300 text-green-600 hover:bg-green-50"
            >
              {sendingShortlist ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              Send Shortlist Email
            </Button>
          </Permission>
          <Permission module="recruitment_drives" action="edit">
            <Button
              variant="outline"
              onClick={() => navigate(`/drives/edit/${id}`)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </Permission>
        </div>
      </div>

      {/* Progress Overview */}
      {stats && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Progress</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <button 
              onClick={() => handlePipelineClick('all')}
              className={`text-center p-3 rounded-lg border transition-all ${statusFilter === 'all' && activeTab === 'cadets' ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-100' : 'border-transparent hover:bg-gray-50'}`}
            >
              <div className="text-2xl font-bold text-blue-600">{stats.total_cadets}</div>
              <div className="text-sm text-gray-600">Total Cadets</div>
            </button>
            <button 
              onClick={() => handlePipelineClick('Eligible for Assessment')}
              className={`text-center p-3 rounded-lg border transition-all ${statusFilter === 'Eligible for Assessment' ? 'bg-green-50 border-green-200 ring-2 ring-green-100' : 'border-transparent hover:bg-gray-50'}`}
            >
              <div className="text-2xl font-bold text-green-600">{stats.uploaded}</div>
              <div className="text-sm text-gray-600">Uploaded</div>
            </button>
            <button 
              onClick={() => handlePipelineClick('Eligible for Interview')}
              className={`text-center p-3 rounded-lg border transition-all ${statusFilter === 'Eligible for Interview' ? 'bg-yellow-50 border-yellow-200 ring-2 ring-yellow-100' : 'border-transparent hover:bg-gray-50'}`}
            >
              <div className="text-2xl font-bold text-yellow-600">{stats.interview_selected}</div>
              <div className="text-sm text-gray-600">Interview Ready</div>
            </button>
            <button 
              onClick={() => handlePipelineClick('Eligible for Medical')}
              className={`text-center p-3 rounded-lg border transition-all ${statusFilter === 'Eligible for Medical' ? 'bg-purple-50 border-purple-200 ring-2 ring-purple-100' : 'border-transparent hover:bg-gray-50'}`}
            >
              <div className="text-2xl font-bold text-purple-600">{stats.interview_selected}</div>
              <div className="text-sm text-gray-600">Medical Ready</div>
            </button>
            <button 
              onClick={() => handlePipelineClick('Medical Completed')}
              className={`text-center p-3 rounded-lg border transition-all ${statusFilter === 'Medical Completed' ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100' : 'border-transparent hover:bg-gray-50'}`}
            >
              <div className="text-2xl font-bold text-indigo-600">{stats.medical_completed}</div>
              <div className="text-sm text-gray-600">Medical Done</div>
            </button>
            <button 
              onClick={() => handlePipelineClick('CTV Assigned')}
              className={`text-center p-3 rounded-lg border transition-all ${statusFilter === 'CTV Assigned' ? 'bg-amber-50 border-amber-200 ring-2 ring-amber-100' : 'border-transparent hover:bg-gray-50'}`}
            >
              <div className="text-2xl font-bold text-amber-600">{stats.ctv_assigned}</div>
              <div className="text-sm text-gray-600">CTV Assigned</div>
            </button>
            <button 
              onClick={() => handlePipelineClick('Onboarded')}
              className={`text-center p-3 rounded-lg border transition-all ${statusFilter === 'Onboarded' ? 'bg-emerald-50 border-emerald-200 ring-2 ring-emerald-100' : 'border-transparent hover:bg-gray-50'}`}
            >
              <div className="text-2xl font-bold text-emerald-600">{stats.onboarded}</div>
              <div className="text-sm text-gray-600">Onboarded</div>
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Drive Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Drive Name</label>
                    <p className="mt-1 text-sm text-gray-900">{drive.drive_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Institute</label>
                    <p className="mt-1 text-sm text-gray-900">{drive.institute_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Course Type</label>
                    <p className="mt-1 text-sm text-gray-900">{drive.course_type}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Intake Capacity</label>
                    <p className="mt-1 text-sm text-gray-900">{drive.intake_capacity}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <p className="mt-1 text-sm text-gray-900">{drive.status}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(drive.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {drive.eligibility_criteria && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Eligibility Criteria</label>
                  <div className="bg-gray-50 rounded-md p-4">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{drive.eligibility_criteria}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'cadets' && <CadetsTab drive={drive} initialStatus={statusFilter} onStatusFilterChange={setStatusFilter} />}

          {activeTab === 'assessment' && <AssessmentTab drive={drive} />}

          {activeTab === 'interview' && <InterviewTab drive={drive} />}

          {activeTab === 'medical' && <MedicalTab drive={drive} />}

          {activeTab === 'documents' && <DocumentsTab drive={drive} />}
        </div>
      </div>
    </div>
  );
};

export default DriveDetails;