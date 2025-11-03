import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/api-config';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useLocation } from 'wouter';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Play, 
  Target, 
  TrendingUp,
  Calendar,
  Clock,
  Star,
  BarChart3,
  Plus,
  Eye,
  Edit,
  Trash2,
  Sparkles,
  Wrench,
  LogOut,
  Menu,
  Search
} from 'lucide-react';

interface TeacherStats {
  totalStudents: number;
  totalClasses: number;
  totalVideos: number;
  averagePerformance: number;
  recentActivity: any[];
}

interface Student {
  id: string;
  name: string;
  email: string;
  classNumber: string;
}

interface Video {
  id: string;
  title: string;
  subject: string;
  duration: string;
  views: number;
  createdAt: string;
}

interface Assessment {
  id: string;
  title: string;
  subject: string;
  questions: number;
  attempts: number;
  averageScore: number;
  createdAt: string;
  createdBy?: {
    name: string;
    email: string;
  };
}


const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<TeacherStats>({
    totalStudents: 0,
    totalClasses: 0,
    totalVideos: 0,
    totalAssessments: 0,
    averagePerformance: 0,
    recentActivity: []
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [videos, setVideos] = useState<Video[]>([]);
  const [assignedClasses, setAssignedClasses] = useState<any[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [teacherEmail, setTeacherEmail] = useState<string>(localStorage.getItem('userEmail') || '');
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();

  // Modal states
  const [isAddVideoModalOpen, setIsAddVideoModalOpen] = useState(false);
  const [isVideoViewerOpen, setIsVideoViewerOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [isCreatingVideo, setIsCreatingVideo] = useState(false);

  // Form states
  const [videoForm, setVideoForm] = useState({
    title: '',
    description: '',
    videoUrl: '',
    subject: '',
    duration: '',
    difficulty: 'beginner' // Changed from 'medium' to 'beginner'
  });


  // Lesson Plan form state
  const [lessonPlanForm, setLessonPlanForm] = useState({
    subject: '',
    topic: '',
    gradeLevel: '',
    duration: '90' // Default to 90 minutes for JEE coaching
  });

  const [isGeneratingLessonPlan, setIsGeneratingLessonPlan] = useState(false);
  const [generatedLessonPlan, setGeneratedLessonPlan] = useState('');

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    setLocation('/auth/login');
  };

  const handleViewVideo = (video: any) => {
    setSelectedVideo(video);
    setIsVideoViewerOpen(true);
  };

  const handleDeleteVideo = async (video: any) => {
    if (!confirm(`Are you sure you want to delete "${video.title}"?`)) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/videos/${video.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setVideos(prev => prev.filter(v => v.id !== video.id));
        alert('Video deleted successfully!');
      } else {
        const error = await response.json().catch(() => ({ message: 'Failed to delete video' }));
        alert(`Failed to delete video: ${error.message}`);
      }
    } catch (error) {
      console.error('Delete video error:', error);
      alert('Failed to delete video. Please try again.');
    }
  };


  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingVideo(true);

    try {
      const token = localStorage.getItem('authToken');
      console.log('Creating video with data:', videoForm);
      console.log('Using token:', token ? 'Token present' : 'No token');
      
      // Convert YouTube watch/short URL to embeddable URL
      const toEmbedUrl = (url: string) => {
        try {
          if (!url) return '';
          const u = new URL(url);
          // youtu.be/<id>
          if (u.hostname.includes('youtu.be')) {
            const id = u.pathname.split('/').filter(Boolean).pop();
            return id ? `https://www.youtube.com/embed/${id}` : url;
          }
          // www.youtube.com/watch?v=<id>
          const id = u.searchParams.get('v');
          if (id) return `https://www.youtube.com/embed/${id}`;
          return url;
        } catch {
          return url;
        }
      };

      const payload = {
        ...videoForm,
        videoUrl: toEmbedUrl(videoForm.videoUrl),
        difficulty: videoForm.difficulty === 'medium' ? 'intermediate' : videoForm.difficulty
      };

      // Use teacher endpoint with auth so createdBy/adminId are set to the teacher
      let response = await fetch(`${API_BASE_URL}/api/teacher/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      // If Railway API failed, try test endpoint
      if (!response.ok) {
        try {
          response = await fetch(`${API_BASE_URL}/api/test-video-simple`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } catch (e) {
          // continue to mock fallback below
        }
      }

      if (response && response.ok) {
        const result = await response.json();
        const created: any = result && (result.data || result);
        const normalized = {
          id: created._id || created.id || `tmp-${Date.now()}`,
          title: created.title || payload.title,
          subject: created.subject || created.subjectId || payload.subject,
          duration: created.duration || payload.duration,
          views: created.views || 0,
          createdAt: created.createdAt || new Date().toISOString(),
          videoUrl: created.videoUrl || payload.videoUrl,
          difficulty: created.difficulty || payload.difficulty
        };
        setVideos(prev => [normalized, ...prev]);

        // Show success message first
        alert('Video created successfully!');

        // Close modal and reset form without re-fetching to avoid disappearance
        setIsAddVideoModalOpen(false);
        setVideoForm({ title: '', description: '', videoUrl: '', subject: '', duration: '', difficulty: 'beginner' });
      } else {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.log('Video creation error details:', error);
        alert(`Failed to create video: ${error.message || error.error || 'Server error'}`);
      }
    } catch (error) {
      console.error('Failed to create video:', error);
      alert(`Failed to create video: ${error.message || 'Please check your internet connection and try again.'}`);
    } finally {
      setIsCreatingVideo(false);
    }
  };

  const handleGenerateLessonPlan = async () => {
    if (!lessonPlanForm.subject || !lessonPlanForm.topic || !lessonPlanForm.gradeLevel) {
      alert('Please fill in all required fields');
      return;
    }

    setIsGeneratingLessonPlan(true);
    setGeneratedLessonPlan('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/lesson-plan/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(lessonPlanForm)
      });

      if (response.ok) {
        const result = await response.json();
        setGeneratedLessonPlan(result.lessonPlan);
      } else {
        const error = await response.json();
        alert(`Failed to generate lesson plan: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to generate lesson plan:', error);
      alert('Failed to generate lesson plan. Please try again.');
    } finally {
      setIsGeneratingLessonPlan(false);
    }
  };


  // Fetch student performance data
  const fetchStudentPerformance = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/teacher/students/performance`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Update students with performance data
          setStudents(data.data.map((student: any) => ({
            id: student._id || student.id,
            name: student.fullName || student.name,
            email: student.email,
            classNumber: student.classNumber,
            performance: student.performance || {
              recentExamTitle: null,
              recentMarks: null,
              recentPercentage: null,
              totalExams: 0,
              averageMarks: 0
            }
          })));
        }
      }
    } catch (error) {
      console.error('Failed to fetch student performance:', error);
    }
  };

  const fetchTeacherData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/teacher/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Teacher dashboard data:', data);
        
        if (data.success) {
          setStats({
            ...(data.data.stats || {}),
            recentActivity: data.data.recentActivity || []
          });
          setStudents(data.data.students || []);
          
          // Fetch performance data for students
          fetchStudentPerformance();
          setVideos(data.data.videos || []);

          setTeacherEmail(data.data.teacherEmail || '');
          setAssignedClasses(data.data.assignedClasses || []);
          setTeacherSubjects(data.data.teacherSubjects || []);
          console.log('Teacher subjects received:', data.data.teacherSubjects);
        } else {
          console.error('API returned success: false:', data.message);
        }
      } else {
        console.error('Failed to fetch teacher data:', response.status);
        // Show fallback data when API fails
        setStats({
          totalStudents: 0,
          totalClasses: 0,
          totalVideos: 0,
          totalAssessments: 0,
          averagePerformance: 0,
          recentActivity: []
        });
        setStudents([]);
        setVideos([]);
        setAssignedClasses([]);
        setTeacherSubjects([]);
      }
    } catch (error) {
      console.error('Failed to fetch teacher data:', error);
      // Show fallback data when API fails
      setStats({
        totalStudents: 0,
        totalClasses: 0,
        totalVideos: 0,
        totalAssessments: 0,
        averagePerformance: 0,
        recentActivity: []
      });
      setStudents([]);
      setVideos([]);
      setAssignedClasses([]);
      setTeacherSubjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="flex">
        {/* Mobile Header */}
        {isMobile && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-white/20">
            <div className="flex items-center justify-between p-responsive">
              <div className="flex items-center space-x-responsive">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-responsive-base font-bold text-gray-900">Asli Prep</h1>
                  <p className="text-responsive-xs text-gray-600">Teacher Portal</p>
                </div>
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Menu className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64">
                  <div className="p-responsive">
                    <div className="flex items-center space-x-responsive mb-responsive">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <GraduationCap className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h1 className="text-responsive-lg font-bold text-gray-900">Asli Prep</h1>
                        <p className="text-responsive-sm text-gray-600">Teacher Portal</p>
                      </div>
                    </div>
                    <nav className="space-responsive">
                      <Button
                        variant={activeTab === 'overview' ? 'default' : 'ghost'}
                        className={`w-full justify-start text-responsive-sm ${activeTab === 'overview' ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                        onClick={() => setActiveTab('overview')}
                      >
                        <BarChart3 className="w-4 h-4 mr-responsive" />
                        Dashboard
                      </Button>
                      <Button
                        variant={activeTab === 'content' ? 'default' : 'ghost'}
                        className={`w-full justify-start text-responsive-sm ${activeTab === 'content' ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                        onClick={() => setActiveTab('content')}
                      >
                        <BookOpen className="w-4 h-4 mr-responsive" />
                        Content Management
                      </Button>
                      <Button
                        variant={activeTab === 'ai-tools' ? 'default' : 'ghost'}
                        className={`w-full justify-start text-responsive-sm ${activeTab === 'ai-tools' ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                        onClick={() => setActiveTab('ai-tools')}
                      >
                        <Sparkles className="w-4 h-4 mr-responsive" />
                        AI Tools
                      </Button>
                      <Button
                        variant={activeTab === 'classes' ? 'default' : 'ghost'}
                        className={`w-full justify-start text-responsive-sm ${activeTab === 'classes' ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                        onClick={() => setActiveTab('classes')}
                      >
                        <Users className="w-4 h-4 mr-responsive" />
                        My Classes
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-responsive-sm text-gray-700 hover:bg-gray-100"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-4 h-4 mr-responsive" />
                        Logout
                      </Button>
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        )}

        {/* Desktop Sidebar */}
        {!isMobile && (
        <div className="w-64 bg-white/80 backdrop-blur-xl shadow-xl border-r border-white/20 min-h-screen">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Asli Prep</h1>
                <p className="text-sm text-gray-600">Teacher Portal</p>
              </div>
            </div>

            <nav className="space-y-2">
              <Button
                variant={activeTab === 'overview' ? 'default' : 'ghost'}
                className={`w-full justify-start ${activeTab === 'overview' ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setActiveTab('overview')}
              >
                <BarChart3 className="w-4 h-4 mr-3" />
                Dashboard
              </Button>
              <Button
                variant={activeTab === 'content' ? 'default' : 'ghost'}
                className={`w-full justify-start ${activeTab === 'content' ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setActiveTab('content')}
              >
                <BookOpen className="w-4 h-4 mr-3" />
                Content Management
              </Button>
              <Button
                variant={activeTab === 'ai-tools' ? 'default' : 'ghost'}
                className={`w-full justify-start ${activeTab === 'ai-tools' ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setActiveTab('ai-tools')}
              >
                <Sparkles className="w-4 h-4 mr-3" />
                AI Tools
              </Button>
              <Button
                variant={activeTab === 'classes' ? 'default' : 'ghost'}
                className={`w-full justify-start ${activeTab === 'classes' ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setActiveTab('classes')}
              >
                <Users className="w-4 h-4 mr-3" />
                My Classes
              </Button>
              <Button
                variant={activeTab === 'students' ? 'default' : 'ghost'}
                className={`w-full justify-start ${activeTab === 'students' ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setActiveTab('students')}
              >
                <Users className="w-4 h-4 mr-3" />
                Students
              </Button>
            </nav>
          </div>
        </div>
        )}

        {/* Main Content */}
        <div className={`flex-1 p-responsive ${isMobile ? 'pt-20' : ''}`}>
          {/* Header */}
          <div className="mb-responsive">
            <div className="flex-responsive-col items-center sm:items-start justify-between space-y-responsive sm:space-y-0">
              <div className="text-center sm:text-left">
                <h1 className="text-responsive-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Welcome, {teacherEmail || localStorage.getItem('userEmail') || 'Teacher'}!
        </h1>
                <p className="text-gray-600 mt-responsive text-responsive-sm">Manage your classes and track student progress</p>
              </div>
              {!isMobile && (
                <div className="flex items-center space-x-responsive">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleLogout}
                  className="hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                >
                    <LogOut className="w-4 h-4 mr-responsive" />
                  Logout
                </Button>
              </div>
              )}
            </div>
          </div>

          {/* Dashboard Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid-responsive-4 gap-responsive">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white/80 backdrop-blur-xl rounded-responsive p-responsive shadow-responsive border border-white/20"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-responsive-xs font-medium">Total Students</p>
                      <p className="text-responsive-xl font-bold text-gray-900">{stats.totalStudents}</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-green-600 text-sm">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span>+12% this month</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white/80 backdrop-blur-xl rounded-responsive p-responsive shadow-responsive border border-white/20"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-responsive-xs font-medium">My Classes</p>
                      <p className="text-responsive-xl font-bold text-gray-900">{stats.totalClasses}</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-green-600 text-sm">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span>+8% this month</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white/80 backdrop-blur-xl rounded-responsive p-responsive shadow-responsive border border-white/20"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-responsive-xs font-medium">Videos</p>
                      <p className="text-responsive-xl font-bold text-gray-900">{stats.totalVideos}</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-green-600 text-sm">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span>+15% this month</span>
                  </div>
                </motion.div>

              </div>

              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h3>
                <div className="space-y-4">
                  {(stats.recentActivity || []).map((activity, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{activity.action}</p>
                        <p className="text-sm text-gray-600">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {/* AI Teaching Tools */}
          {activeTab === 'ai-tools' && (
            <div className="space-y-8">
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-responsive-xl font-bold text-gray-900">AI Teaching Tools</h2>
                </div>

                <div className="mt-6">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Lesson Plan Generator</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-responsive-xs font-medium text-gray-700 mb-2">Class *</label>
                        <select 
                          value={lessonPlanForm.gradeLevel}
                          onChange={(e) => setLessonPlanForm({...lessonPlanForm, gradeLevel: e.target.value, subject: '', topic: ''})}
                          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select class</option>
                          <option value="Class 11">Class 11</option>
                          <option value="Class 12">Class 12</option>
                          <option value="Dropper Batch">Dropper Batch</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-responsive-xs font-medium text-gray-700 mb-2">Subject *</label>
                        <select 
                          value={lessonPlanForm.subject}
                          onChange={(e) => setLessonPlanForm({...lessonPlanForm, subject: e.target.value, topic: ''})}
                          disabled={!lessonPlanForm.gradeLevel}
                          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        >
                          <option value="">Select subject</option>
                          {lessonPlanForm.gradeLevel && (
                            <>
                              <option value="Physics">Physics</option>
                              <option value="Chemistry">Chemistry</option>
                              <option value="Mathematics">Mathematics</option>
                            </>
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-responsive-xs font-medium text-gray-700 mb-2">Topic *</label>
                        <select 
                          value={lessonPlanForm.topic}
                          onChange={(e) => setLessonPlanForm({...lessonPlanForm, topic: e.target.value})}
                          disabled={!lessonPlanForm.subject}
                          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        >
                          <option value="">Select topic</option>
                          {lessonPlanForm.subject === 'Physics' && (
                            <>
                              <option value="Mechanics">Mechanics</option>
                              <option value="Thermodynamics">Thermodynamics</option>
                              <option value="Electromagnetism">Electromagnetism</option>
                              <option value="Optics">Optics</option>
                              <option value="Modern Physics">Modern Physics</option>
                              <option value="Waves and Oscillations">Waves and Oscillations</option>
                              <option value="Kinematics">Kinematics</option>
                              <option value="Dynamics">Dynamics</option>
                              <option value="Work, Energy and Power">Work, Energy and Power</option>
                              <option value="Rotational Motion">Rotational Motion</option>
                              <option value="Gravitation">Gravitation</option>
                              <option value="Properties of Matter">Properties of Matter</option>
                              <option value="Heat and Temperature">Heat and Temperature</option>
                              <option value="Electric Charges and Fields">Electric Charges and Fields</option>
                              <option value="Electrostatic Potential">Electrostatic Potential</option>
                              <option value="Current Electricity">Current Electricity</option>
                              <option value="Moving Charges and Magnetism">Moving Charges and Magnetism</option>
                              <option value="Magnetism and Matter">Magnetism and Matter</option>
                              <option value="Electromagnetic Induction">Electromagnetic Induction</option>
                              <option value="Alternating Current">Alternating Current</option>
                              <option value="Electromagnetic Waves">Electromagnetic Waves</option>
                              <option value="Ray Optics">Ray Optics</option>
                              <option value="Wave Optics">Wave Optics</option>
                              <option value="Dual Nature of Radiation">Dual Nature of Radiation</option>
                              <option value="Atoms">Atoms</option>
                              <option value="Nuclei">Nuclei</option>
                              <option value="Semiconductor Electronics">Semiconductor Electronics</option>
                            </>
                          )}
                          {lessonPlanForm.subject === 'Chemistry' && (
                            <>
                              <option value="Physical Chemistry">Physical Chemistry</option>
                              <option value="Inorganic Chemistry">Inorganic Chemistry</option>
                              <option value="Organic Chemistry">Organic Chemistry</option>
                              <option value="Atomic Structure">Atomic Structure</option>
                              <option value="Chemical Bonding">Chemical Bonding</option>
                              <option value="States of Matter">States of Matter</option>
                              <option value="Thermodynamics">Thermodynamics</option>
                              <option value="Chemical Equilibrium">Chemical Equilibrium</option>
                              <option value="Ionic Equilibrium">Ionic Equilibrium</option>
                              <option value="Redox Reactions">Redox Reactions</option>
                              <option value="Electrochemistry">Electrochemistry</option>
                              <option value="Chemical Kinetics">Chemical Kinetics</option>
                              <option value="Surface Chemistry">Surface Chemistry</option>
                              <option value="Classification of Elements">Classification of Elements</option>
                              <option value="Hydrogen">Hydrogen</option>
                              <option value="s-Block Elements">s-Block Elements</option>
                              <option value="p-Block Elements">p-Block Elements</option>
                              <option value="d and f-Block Elements">d and f-Block Elements</option>
                              <option value="Coordination Compounds">Coordination Compounds</option>
                              <option value="Environmental Chemistry">Environmental Chemistry</option>
                              <option value="Basic Principles of Organic Chemistry">Basic Principles of Organic Chemistry</option>
                              <option value="Hydrocarbons">Hydrocarbons</option>
                              <option value="Organic Compounds Containing Halogens">Organic Compounds Containing Halogens</option>
                              <option value="Organic Compounds Containing Oxygen">Organic Compounds Containing Oxygen</option>
                              <option value="Organic Compounds Containing Nitrogen">Organic Compounds Containing Nitrogen</option>
                              <option value="Biomolecules">Biomolecules</option>
                              <option value="Polymers">Polymers</option>
                              <option value="Chemistry in Everyday Life">Chemistry in Everyday Life</option>
                            </>
                          )}
                          {lessonPlanForm.subject === 'Mathematics' && (
                            <>
                              <option value="Sets, Relations and Functions">Sets, Relations and Functions</option>
                              <option value="Complex Numbers">Complex Numbers</option>
                              <option value="Quadratic Equations">Quadratic Equations</option>
                              <option value="Sequences and Series">Sequences and Series</option>
                              <option value="Permutations and Combinations">Permutations and Combinations</option>
                              <option value="Binomial Theorem">Binomial Theorem</option>
                              <option value="Trigonometry">Trigonometry</option>
                              <option value="Coordinate Geometry">Coordinate Geometry</option>
                              <option value="Straight Lines">Straight Lines</option>
                              <option value="Circles">Circles</option>
                              <option value="Conic Sections">Conic Sections</option>
                              <option value="Three Dimensional Geometry">Three Dimensional Geometry</option>
                              <option value="Limits and Derivatives">Limits and Derivatives</option>
                              <option value="Mathematical Reasoning">Mathematical Reasoning</option>
                              <option value="Statistics">Statistics</option>
                              <option value="Probability">Probability</option>
                              <option value="Matrices">Matrices</option>
                              <option value="Determinants">Determinants</option>
                              <option value="Continuity and Differentiability">Continuity and Differentiability</option>
                              <option value="Applications of Derivatives">Applications of Derivatives</option>
                              <option value="Integrals">Integrals</option>
                              <option value="Applications of Integrals">Applications of Integrals</option>
                              <option value="Differential Equations">Differential Equations</option>
                              <option value="Vector Algebra">Vector Algebra</option>
                              <option value="Linear Programming">Linear Programming</option>
                            </>
                          )}
                        </select>
                      </div>
                        <div>
                        <label className="block text-responsive-xs font-medium text-gray-700 mb-2">Duration (minutes)</label>
                          <input
                            type="number"
                            value={lessonPlanForm.duration}
                            onChange={(e) => setLessonPlanForm({...lessonPlanForm, duration: e.target.value})}
                            placeholder="90"
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    <Button 
                      onClick={handleGenerateLessonPlan}
                      disabled={isGeneratingLessonPlan || !lessonPlanForm.subject || !lessonPlanForm.topic || !lessonPlanForm.gradeLevel}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-3 rounded-xl disabled:opacity-50"
                    >
                      {isGeneratingLessonPlan ? (
                        <>
                          <div className="w-5 h-5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Generate Lesson Plan
                        </>
                      )}
                      </Button>
                    
                    {generatedLessonPlan && (
                      <div className="mt-6 p-6 bg-white rounded-xl border border-gray-200 shadow-lg">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Generated Lesson Plan:</h4>
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                          <div className="prose prose-sm max-w-none">
                            <div className="text-gray-800 leading-relaxed">
                              {generatedLessonPlan.split('\n').map((line, index) => {
                                if (line.startsWith('###')) {
                                  return (
                                    <h3 key={index} className="text-lg font-bold text-blue-900 mt-4 mb-2">
                                      {line.replace('###', '').trim()}
                                    </h3>
                                  );
                                } else if (line.startsWith('**') && line.endsWith('**')) {
                                  return (
                                    <h4 key={index} className="text-base font-semibold text-blue-800 mt-3 mb-1">
                                      {line.replace(/\*\*/g, '').trim()}
                                    </h4>
                                  );
                                } else if (line.startsWith('-') || line.startsWith('*')) {
                                  return (
                                    <div key={index} className="ml-4 mb-1 text-gray-700">
                                      • {line.replace(/^[-*]\s*/, '').trim()}
                                    </div>
                                  );
                                } else if (line.trim() === '') {
                                  return <br key={index} />;
                                } else {
                                  return (
                                    <p key={index} className="mb-2 text-gray-700">
                                      {line.trim()}
                                    </p>
                                  );
                                }
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    </div>
                </div>
              </div>
            </div>
          )}

          {/* Content Management */}
          {activeTab === 'content' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-responsive-xl font-bold text-gray-900">Content Management</h2>
                <div className="flex space-x-3">
                  <Button 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                    onClick={() => setIsAddVideoModalOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Video
                  </Button>
                </div>
              </div>

              {/* Videos */}
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">My Videos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {videos.map((video, index) => (
                    <div key={video.id || (video as any)._id || index} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{video.title}</h4>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => handleViewVideo(video)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDeleteVideo(video)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{video.subject}</p>
                      <p className="text-xs text-gray-500 mb-2">Created by: {video.createdBy?.name || 'Unknown'}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{video.duration}</span>
                        <span>{video.views} views</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* My Classes */}
          {activeTab === 'classes' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-responsive-xl font-bold text-gray-900">My Classes</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignedClasses.length > 0 ? (
                  // Show real assigned classes
                  assignedClasses.map((classItem, index) => (
                    <div key={classItem.id || index} className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-900">{classItem.name}</h3>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Students:</span>
                          <span className="font-medium">{classItem.studentCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Subject:</span>
                          <span className="font-medium">{classItem.subject}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Schedule:</span>
                          <span className="font-medium">{classItem.schedule}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Room:</span>
                          <span className="font-medium">{classItem.room}</span>
                        </div>
                      </div>
                      
                      {/* Students List */}
                      {classItem.students && classItem.students.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <h4 className="font-semibold text-gray-900 text-sm">Students:</h4>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {classItem.students.map(student => (
                              <div key={student.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{student.name}</p>
                                  <p className="text-xs text-gray-600">{student.email}</p>
                                </div>
                                <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                                  {student.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="mt-4 flex space-x-2">
                        <Button size="sm" className="flex-1">View Students</Button>
                        <Button size="sm" variant="outline">Manage</Button>
                      </div>
                    </div>
                  ))
                ) : (
                  // Show message when no classes assigned
                  <div className="col-span-full bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Classes Assigned</h3>
                    <p className="text-gray-600 mb-4">You haven't been assigned to any classes yet. Contact your administrator.</p>
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white">
                      Request Class Assignment
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Students */}
          {activeTab === 'students' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-responsive-xl font-bold text-gray-900">My Students</h2>
              </div>

              {/* Search Bar */}
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <Input
                    placeholder="Search students by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full rounded-xl bg-white/70 border-gray-200 text-gray-900 backdrop-blur-sm"
                  />
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Student</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Class</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Recent Performance</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Average</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students
                        .filter(student => 
                          student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.email.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((student) => {
                          const perf = (student as any).performance || {};
                          return (
                            <tr key={student.id} className="border-b border-gray-100">
                              <td className="py-3 px-4">
                                <div>
                                  <p className="font-medium text-gray-900">{student.name}</p>
                                  <p className="text-sm text-gray-600">{student.email}</p>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <Badge className="bg-blue-100 text-blue-800">{student.classNumber}</Badge>
                              </td>
                              <td className="py-3 px-4">
                                {perf.recentMarks !== null && perf.recentMarks !== undefined ? (
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm font-medium text-gray-900">
                                        {perf.recentMarks}/{perf.recentExamTitle ? '100' : 'N/A'}
                                      </span>
                                      <Badge className={perf.recentPercentage >= 70 ? 'bg-green-100 text-green-800' : 
                                                       perf.recentPercentage >= 50 ? 'bg-yellow-100 text-yellow-800' : 
                                                       'bg-red-100 text-red-800'}>
                                        {perf.recentPercentage?.toFixed(1)}%
                                      </Badge>
                                    </div>
                                    {perf.recentExamTitle && (
                                      <p className="text-xs text-gray-500 mt-1">{perf.recentExamTitle}</p>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-400">No exams taken</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {perf.totalExams > 0 ? (
                                  <div>
                                    <span className="text-sm font-medium text-gray-900">
                                      {perf.averageMarks?.toFixed(1) || '0'}
                                    </span>
                                    <p className="text-xs text-gray-500">{perf.totalExams} exam{perf.totalExams !== 1 ? 's' : ''}</p>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-400">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}


        </div>
      </div>

      {/* Add Video Modal */}
      <Dialog open={isAddVideoModalOpen} onOpenChange={setIsAddVideoModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-800">Add New Video</DialogTitle>
            <DialogDescription>
              Create a new educational video for your students.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateVideo} className="space-y-4">
            <div>
              <Label htmlFor="video-title" className="text-gray-700 font-medium">Title *</Label>
              <Input
                id="video-title"
                value={videoForm.title}
                onChange={(e) => setVideoForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter video title"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="video-description" className="text-gray-700 font-medium">Description</Label>
              <Textarea
                id="video-description"
                value={videoForm.description}
                onChange={(e) => setVideoForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter video description"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="video-url" className="text-gray-700 font-medium">Video URL *</Label>
              <Input
                id="video-url"
                type="url"
                value={videoForm.videoUrl}
                onChange={(e) => setVideoForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                placeholder="https://youtube.com/watch?v=..."
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="video-subject" className="text-gray-700 font-medium">Subject *</Label>
              {teacherSubjects.length === 0 && (
                <div className="mt-1 mb-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>No subjects assigned:</strong> You need to be assigned subjects by an admin before creating videos. 
                    Please contact your administrator to assign subjects to your account.
                  </p>
                </div>
              )}
              <Select value={videoForm.subject} onValueChange={(value) => setVideoForm(prev => ({ ...prev, subject: value }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {teacherSubjects.length > 0 ? (
                    teacherSubjects.map(subject => (
                      <SelectItem key={subject._id || subject.id} value={subject.name}>
                        {subject.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-subjects" disabled>
                      No subjects assigned - Contact admin to assign subjects
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="video-duration" className="text-gray-700 font-medium">Duration (minutes) *</Label>
              <Input
                id="video-duration"
                type="number"
                value={videoForm.duration}
                onChange={(e) => setVideoForm(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="60"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="video-difficulty" className="text-gray-700 font-medium">Difficulty</Label>
              <Select value={videoForm.difficulty} onValueChange={(value) => setVideoForm(prev => ({ ...prev, difficulty: value }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddVideoModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreatingVideo || teacherSubjects.length === 0} className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                {isCreatingVideo ? 'Creating...' : teacherSubjects.length === 0 ? 'No Subjects Assigned' : 'Create Video'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>


      {/* Video Viewer Modal */}
      <Dialog open={isVideoViewerOpen} onOpenChange={setIsVideoViewerOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-800">
              {selectedVideo?.title || 'Video Viewer'}
            </DialogTitle>
            <DialogDescription>
              {selectedVideo?.description || 'Watch your uploaded video'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedVideo && (
            <div className="space-y-4">
              {/* Video Player */}
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                {selectedVideo.videoUrl ? (
                  <iframe
                    src={selectedVideo.videoUrl}
                    title={selectedVideo.title}
                    className="w-full h-full"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-white">
                    <div className="text-center">
                      <Play className="w-16 h-16 mx-auto mb-4" />
                      <p>Video URL not available</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Video Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Subject:</span>
                  <span className="ml-2 text-gray-900">{selectedVideo.subject}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Duration:</span>
                  <span className="ml-2 text-gray-900">{selectedVideo.duration} minutes</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Difficulty:</span>
                  <span className="ml-2 text-gray-900 capitalize">{selectedVideo.difficulty}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Views:</span>
                  <span className="ml-2 text-gray-900">{selectedVideo.views || 0}</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setIsVideoViewerOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherDashboard;
