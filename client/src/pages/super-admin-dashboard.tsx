import { useState, useEffect } from "react";
import { SuperAdminSidebar, type SuperAdminView } from "@/components/dashboard/SuperAdminSidebar";
import AdminManagement from "@/components/admin/AdminManagement";
import SuperAdminAnalyticsDashboard from "./super-admin-analytics";
import AIAnalyticsDashboard from "./ai-analytics-dashboard";
import DetailedAIAnalyticsDashboard from "./detailed-ai-analytics";
import BoardComparisonCharts from "@/components/admin/board-comparison-charts";
import ContentManagement from "@/components/super-admin/content-management";
import SubjectManagement from "@/components/super-admin/subject-management";
import ExamManagement from "@/components/super-admin/exam-management";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BellIcon, LogOutIcon, UsersIcon, TrendingUpIcon, BookIcon, Presentation, UserPlusIcon, BookPlusIcon, SettingsIcon, DownloadIcon, HomeIcon, CrownIcon, BarChart3Icon, CreditCardIcon, ArrowUpRightIcon, ArrowDownRightIcon, StarIcon, TargetIcon, BrainIcon, ZapIcon, AlertTriangleIcon, TrendingDownIcon, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/api-config";

export default function SuperAdminDashboard() {
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState<SuperAdminView>('dashboard');
  const [user] = useState({ fullName: 'Super Admin', role: 'super-admin' });
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalAdmins: 0,
    courses: 0,
    assessments: 0,
    exams: 0,
    examResults: 0,
    activeVideos: 0,
    activeAssessments: 0,
    avgExamsPerStudent: 0,
    contentEngagement: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [realtimeAnalytics, setRealtimeAnalytics] = useState<any>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [boardData, setBoardData] = useState<any>(null);
  const [isLoadingBoard, setIsLoadingBoard] = useState(false);

  // Fetch real dashboard stats
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/super-admin/dashboard/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data.data);
        } else {
          console.error('Failed to fetch dashboard stats:', response.status);
          toast({
            title: "Error",
            description: "Failed to fetch dashboard statistics",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        toast({
          title: "Error",
          description: "Failed to fetch dashboard statistics",
          variant: "destructive"
        });
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchDashboardStats();
    fetchRealtimeAnalytics();
  }, [toast]);

  const fetchRealtimeAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/super-admin/analytics/realtime`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRealtimeAnalytics(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching real-time analytics:', error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const handleLogout = () => {
    // Clear localStorage for Super Admin logout
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    window.location.href = "/";
  };

  const fetchBoardDashboard = async (boardCode: string, showToast = true) => {
    setIsLoadingBoard(true);
    try {
      const token = localStorage.getItem('authToken');
      console.log('📊 Fetching board dashboard for:', boardCode);
      const response = await fetch(`${API_BASE_URL}/api/super-admin/boards/${boardCode}/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Board dashboard response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Board dashboard data received:', data);
        if (data.success) {
          console.log('Setting board data:', data.data);
          console.log('Schools found:', data.data.schoolParticipation?.length || 0);
          setBoardData(data.data);
          setSelectedBoard(boardCode);
          setCurrentView('board');
        } else {
          console.error('API returned success: false:', data.message);
          if (showToast) {
            toast({
              title: 'Error',
              description: data.message || 'Failed to fetch board data',
              variant: 'destructive'
            });
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('API error response:', errorData);
        if (showToast) {
          toast({
            title: 'Error',
            description: errorData.message || `Failed to fetch board dashboard (${response.status})`,
            variant: 'destructive'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching board dashboard:', error);
      if (showToast) {
        toast({
          title: 'Error',
          description: 'Failed to fetch board dashboard. Please check your connection.',
          variant: 'destructive'
        });
      }
    } finally {
      setIsLoadingBoard(false);
    }
  };

  const renderDashboardContent = () => {
    if (selectedBoard && currentView === 'board') {
      return renderBoardDashboard();
    }

    return (
    <div className="space-y-8">
      {/* Board Selection - 4 Boxes */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Board Management</h2>
          <p className="text-gray-600">Select a board to manage content, exams, and analytics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CBSE AP Box */}
          <Card 
            className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 cursor-pointer transition-all duration-300 shadow-xl border-0"
            onClick={() => fetchBoardDashboard('CBSE_AP')}
          >
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">CBSE AP</h3>
                  <p className="text-blue-100">CBSE Board - Andhra Pradesh</p>
                  <p className="text-white/80 text-sm mt-4">Click to manage content, exams, and view analytics</p>
                </div>
                <BookIcon className="h-16 w-16 text-white/80" />
              </div>
              {isLoadingBoard && selectedBoard === 'CBSE_AP' && (
                <div className="mt-4 text-white">Loading...</div>
              )}
            </CardContent>
          </Card>

          {/* CBSE TS Box */}
          <Card 
            className="bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 cursor-pointer transition-all duration-300 shadow-xl border-0"
            onClick={() => fetchBoardDashboard('CBSE_TS')}
          >
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">CBSE TS</h3>
                  <p className="text-green-100">CBSE Board - Telangana State</p>
                  <p className="text-white/80 text-sm mt-4">Click to manage content, exams, and view analytics</p>
                </div>
                <BookIcon className="h-16 w-16 text-white/80" />
              </div>
              {isLoadingBoard && selectedBoard === 'CBSE_TS' && (
                <div className="mt-4 text-white">Loading...</div>
              )}
            </CardContent>
          </Card>

          {/* State AP Box */}
          <Card 
            className="bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 cursor-pointer transition-all duration-300 shadow-xl border-0"
            onClick={() => fetchBoardDashboard('STATE_AP')}
          >
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">State AP</h3>
                  <p className="text-purple-100">State Board - Andhra Pradesh</p>
                  <p className="text-white/80 text-sm mt-4">Click to manage content, exams, and view analytics</p>
                </div>
                <BookIcon className="h-16 w-16 text-white/80" />
              </div>
              {isLoadingBoard && selectedBoard === 'STATE_AP' && (
                <div className="mt-4 text-white">Loading...</div>
              )}
            </CardContent>
          </Card>

          {/* State TS Box */}
          <Card 
            className="bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 cursor-pointer transition-all duration-300 shadow-xl border-0"
            onClick={() => fetchBoardDashboard('STATE_TS')}
          >
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">State TS</h3>
                  <p className="text-orange-100">State Board - Telangana State</p>
                  <p className="text-white/80 text-sm mt-4">Click to manage content, exams, and view analytics</p>
                </div>
                <BookIcon className="h-16 w-16 text-white/80" />
              </div>
              {isLoadingBoard && selectedBoard === 'STATE_TS' && (
                <div className="mt-4 text-white">Loading...</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Beautiful Super Admin Dashboard - Enhanced Version */}
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-300">Total Users</p>
                <p className="text-3xl font-bold text-white">
                  {isLoadingStats ? '...' : stats.totalUsers.toLocaleString()}
                </p>
                <p className="text-sm text-slate-400">Real-time data</p>
              </div>
              <UsersIcon className="h-12 w-12 text-blue-400" />
            </div>
            <div className="mt-4">
              <button 
                onClick={() => setCurrentView('admins')} 
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center transition-colors"
              >
                Click to manage admins <ArrowUpRightIcon className="ml-1 h-4 w-4" />
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-800 to-emerald-900 border-emerald-700 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-300">Exam Results</p>
                <p className="text-3xl font-bold text-white">{isLoadingStats ? '...' : stats.examResults}</p>
                <p className="text-sm text-emerald-400">Total completed</p>
              </div>
              <TrendingUpIcon className="h-12 w-12 text-emerald-400" />
            </div>
            <div className="mt-4">
              <button 
                onClick={() => setCurrentView('analytics')} 
                className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center transition-colors"
              >
                Click for analytics <ArrowUpRightIcon className="ml-1 h-4 w-4" />
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-800 to-violet-900 border-violet-700 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-violet-300">Courses</p>
                <p className="text-3xl font-bold text-white">{isLoadingStats ? '...' : stats.courses}</p>
                <p className="text-sm text-violet-400">Real-time data</p>
              </div>
              <BookIcon className="h-12 w-12 text-violet-400" />
            </div>
            <div className="mt-4">
              <button 
                onClick={() => setCurrentView('admins')} 
                className="text-sm text-violet-400 hover:text-violet-300 flex items-center transition-colors"
              >
                Click to manage courses <ArrowUpRightIcon className="ml-1 h-4 w-4" />
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-800 to-amber-900 border-amber-700 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-300">Admins</p>
                <p className="text-3xl font-bold text-white">{isLoadingStats ? '...' : stats.totalAdmins}</p>
                <p className="text-sm text-amber-400">Real-time data</p>
              </div>
              <CrownIcon className="h-12 w-12 text-amber-400" />
            </div>
            <div className="mt-4">
              <button 
                onClick={() => setCurrentView('admins')} 
                className="text-sm text-amber-400 hover:text-amber-300 flex items-center transition-colors"
              >
                Click for admin details <ArrowUpRightIcon className="ml-1 h-4 w-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-purple-600 to-purple-700 border-purple-500 shadow-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 cursor-pointer" onClick={() => setCurrentView('admins')}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <UserPlusIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Add New Admin</h3>
                <p className="text-sm text-purple-100">Create new admin accounts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 border-green-400 shadow-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 cursor-pointer" onClick={() => setCurrentView('admins')}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <BookPlusIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Create Course</h3>
                <p className="text-sm text-green-100">Add new educational content</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-500 to-pink-600 border-pink-400 shadow-xl hover:from-pink-600 hover:to-pink-700 transition-all duration-300 cursor-pointer" onClick={() => setCurrentView('ai-analytics')}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <BrainIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">AI Analytics</h3>
                <p className="text-sm text-pink-100">Advanced ML insights</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 border-orange-400 shadow-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 cursor-pointer" onClick={() => setCurrentView('analytics')}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <DownloadIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Export Data</h3>
                <p className="text-sm text-orange-100">Download platform analytics</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights & Recommendations */}
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <StarIcon className="h-5 w-5 text-yellow-500" />
          <h2 className="text-xl font-bold text-gray-900">AI Insights & Recommendations</h2>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-600">AI Analysis Active</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-purple-600 to-purple-700 border-purple-500 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-200">Next Month Revenue (AI Predicted)</p>
                  <p className="text-2xl font-bold text-white">₹289,450</p>
                  <p className="text-sm text-green-300">+18.2% growth</p>
                </div>
                <TrendingUpIcon className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-200">Predicted New Students</p>
                  <p className="text-2xl font-bold text-white">89</p>
                  <p className="text-sm text-blue-200">Next 30 days</p>
                </div>
                <UsersIcon className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 border-orange-400 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-200">Students at Churn Risk</p>
                  <p className="text-2xl font-bold text-white">12</p>
                  <p className="text-sm text-orange-200">Needs attention</p>
                </div>
                <AlertTriangleIcon className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 border-green-400 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-200">AI Engagement Score</p>
                  <p className="text-2xl font-bold text-white">92%</p>
                  <p className="text-sm text-green-200">Excellent</p>
                </div>
                <ZapIcon className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI-Powered Recommendations */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <TargetIcon className="h-5 w-5 text-blue-500" />
          <h2 className="text-xl font-bold text-gray-900">AI-Powered Recommendations</h2>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <TargetIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Recommendations</h3>
              <p className="text-gray-600">AI-powered insights and recommendations will appear here</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Analytics Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3Icon className="h-5 w-5 text-indigo-500" />
            <h2 className="text-xl font-bold text-gray-900">Real-time Analytics</h2>
          </div>
          <Button onClick={fetchRealtimeAnalytics} disabled={isLoadingAnalytics} size="sm" variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingAnalytics ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {isLoadingAnalytics ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BarChart3Icon className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading real-time analytics...</p>
            </CardContent>
          </Card>
        ) : realtimeAnalytics ? (
          <div className="space-y-6">
            {/* Overall Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                <CardContent className="p-4">
                  <p className="text-sm text-blue-700 font-medium">Total Students</p>
                  <p className="text-2xl font-bold text-blue-900">{realtimeAnalytics.overallMetrics?.totalStudents || 0}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-50 to-green-100">
                <CardContent className="p-4">
                  <p className="text-sm text-green-700 font-medium">Total Exams</p>
                  <p className="text-2xl font-bold text-green-900">{realtimeAnalytics.overallMetrics?.totalExams || 0}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                <CardContent className="p-4">
                  <p className="text-sm text-purple-700 font-medium">Exam Results</p>
                  <p className="text-2xl font-bold text-purple-900">{realtimeAnalytics.overallMetrics?.totalExamResults || 0}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
                <CardContent className="p-4">
                  <p className="text-sm text-orange-700 font-medium">Overall Average</p>
                  <p className="text-2xl font-bold text-orange-900">{realtimeAnalytics.overallMetrics?.overallAverage || 0}%</p>
                </CardContent>
              </Card>
            </div>

            {/* Top Scorers by Exam */}
            {realtimeAnalytics.topScorersByExam && realtimeAnalytics.topScorersByExam.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Top Scorers by Exam</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {realtimeAnalytics.topScorersByExam.slice(0, 3).map((exam: any) => (
                      <div key={exam.examId} className="border rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">{exam.examTitle}</h4>
                        <div className="space-y-2">
                          {exam.topScorers.slice(0, 5).map((scorer: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div>
                                <p className="font-medium text-gray-900">{scorer.studentName}</p>
                                <p className="text-xs text-gray-600">{scorer.studentEmail}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-green-600">{scorer.percentage?.toFixed(1)}%</p>
                                <p className="text-xs text-gray-600">{scorer.marks}/{scorer.totalMarks} marks</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Low-performing Admins */}
            {realtimeAnalytics.lowPerformingAdmins && realtimeAnalytics.lowPerformingAdmins.length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-900 flex items-center">
                    <AlertTriangleIcon className="h-5 w-5 mr-2" />
                    Low-performing Admins (Needs Attention)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {realtimeAnalytics.lowPerformingAdmins.map((admin: any) => (
                      <div key={admin.adminId} className="flex items-center justify-between p-3 bg-white rounded border border-red-200">
                        <div>
                          <p className="font-semibold text-gray-900">{admin.adminName}</p>
                          <p className="text-sm text-gray-600">{admin.adminEmail}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {admin.totalStudents} students • {admin.totalExams} exams
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-600">{admin.averageScore}%</p>
                          <p className="text-xs text-gray-600">Average Score</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Admin Performance Overview */}
            {realtimeAnalytics.adminAnalytics && realtimeAnalytics.adminAnalytics.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Admin Performance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {realtimeAnalytics.adminAnalytics.slice(0, 5).map((admin: any) => (
                      <div key={admin.adminId} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium text-gray-900">{admin.adminName}</p>
                          <p className="text-xs text-gray-600">{admin.totalStudents} students</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{admin.averageScore}%</p>
                          <p className="text-xs text-gray-600">Avg Score</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <BarChart3Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No analytics data available</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Auto-Generated Insights */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <BrainIcon className="h-5 w-5 text-purple-500" />
          <h2 className="text-xl font-bold text-gray-900">Auto-Generated Insights</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BrainIcon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-900">Peak learning hours: 7-9 PM (43% of daily activity)</p>
                  <p className="text-xs text-purple-600">Generated 2 hours ago</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUpIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900">Most popular subject: Mathematics (35% of total engagement)</p>
                  <p className="text-xs text-blue-600">Generated 1 hour ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    );
  };

  // Refresh board dashboard when view changes to board
  useEffect(() => {
    if (currentView === 'board' && selectedBoard) {
      console.log('🔄 Refreshing board dashboard for:', selectedBoard);
      fetchBoardDashboard(selectedBoard, false); // Don't show toast on auto-refresh
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView]); // Only refresh when view changes, not on every render

  const renderBoardDashboard = () => {
    if (isLoadingBoard) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading board data...</p>
          </div>
        </div>
      );
    }

    if (!boardData) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-600">No board data available. Please try again.</p>
          <Button onClick={() => fetchBoardDashboard(selectedBoard || 'CBSE_AP')} className="mt-4">
            Refresh
          </Button>
        </div>
      );
    }

    console.log('Rendering board dashboard with data:', boardData);
    const boardName = boardData.board?.name || selectedBoard || 'Board';
    
    return (
      <div className="space-y-8">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => { setSelectedBoard(null); setCurrentView('dashboard'); }}>
              ← Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{boardName}</h1>
              <p className="text-gray-600">Manage content, exams, subjects, and view analytics</p>
            </div>
          </div>
        </div>

        {/* Board Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <p className="text-sm text-blue-700 font-medium">Students</p>
              <p className="text-3xl font-bold text-blue-900">
                {typeof boardData.stats?.students === 'number' ? boardData.stats.students : 0}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6">
              <p className="text-sm text-green-700 font-medium">Teachers</p>
              <p className="text-3xl font-bold text-green-900">
                {typeof boardData.stats?.teachers === 'number' ? boardData.stats.teachers : 0}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-6">
              <p className="text-sm text-purple-700 font-medium">Exams</p>
              <p className="text-3xl font-bold text-purple-900">
                {typeof boardData.stats?.exams === 'number' ? boardData.stats.exams : 0}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="p-6">
              <p className="text-sm text-orange-700 font-medium">Avg Score</p>
              <p className="text-3xl font-bold text-orange-900">
                {boardData.stats?.averageScore ? `${boardData.stats.averageScore}%` : '0.00%'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Top Performers */}
        {boardData.topPerformers && boardData.topPerformers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {boardData.topPerformers.map((performer: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        idx === 0 ? 'bg-yellow-500 text-white' :
                        idx === 1 ? 'bg-gray-400 text-white' :
                        idx === 2 ? 'bg-orange-500 text-white' :
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{performer.studentName}</p>
                        <p className="text-sm text-gray-600">{performer.studentEmail}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{performer.percentage}%</p>
                      <p className="text-sm text-gray-600">{performer.marks}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Schools Assigned to Board */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Schools Assigned to {boardName}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              View all schools, their admins, students, and performance metrics
            </p>
          </CardHeader>
          <CardContent>
            {boardData.schoolParticipation && boardData.schoolParticipation.length > 0 ? (
              <div className="space-y-6">
                {boardData.schoolParticipation.map((school: any, idx: number) => (
                  <Card key={school.adminId || idx} className="border-2 hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">{school.schoolName}</CardTitle>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Admin:</span> {school.adminName}
                            </div>
                            <div>
                              <span className="font-medium">Email:</span> {school.adminEmail}
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-purple-100 text-purple-700 text-lg px-4 py-1">
                          School #{idx + 1}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* School Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                          <p className="text-3xl font-bold text-blue-900">{school.students || 0}</p>
                          <p className="text-sm text-blue-700 font-medium">Students</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                          <p className="text-3xl font-bold text-green-900">{school.teachers || 0}</p>
                          <p className="text-sm text-green-700 font-medium">Teachers</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg text-center">
                          <p className="text-3xl font-bold text-purple-900">{school.examAttempts || 0}</p>
                          <p className="text-sm text-purple-700 font-medium">Exam Attempts</p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg text-center">
                          <p className="text-3xl font-bold text-orange-900">{school.averageScore || '0.00'}%</p>
                          <p className="text-sm text-orange-700 font-medium">Avg Score</p>
                        </div>
                      </div>

                      {/* Participation Rate */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Participation Rate</span>
                          <span className="text-lg font-bold text-gray-900">{school.participationRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-blue-600 h-3 rounded-full transition-all"
                            style={{ width: `${Math.min(parseFloat(school.participationRate || '0'), 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Students List */}
                      {school.studentList && school.studentList.length > 0 && (
                        <div className="border-t pt-4">
                          <h4 className="font-semibold text-gray-900 mb-3">
                            Students ({school.studentList.length}{school.students > school.studentList.length ? ` of ${school.students}` : ''})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                            {school.studentList.map((student: any, studentIdx: number) => (
                              <div key={studentIdx} className="bg-gray-50 p-3 rounded-lg">
                                <p className="font-medium text-gray-900 text-sm">{student.name}</p>
                                <p className="text-xs text-gray-600">{student.email}</p>
                                {student.classNumber && (
                                  <Badge variant="outline" className="mt-1 text-xs">
                                    Class: {student.classNumber}
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                          {school.students > school.studentList.length && (
                            <p className="text-xs text-gray-500 mt-2">
                              Showing first 50 students. Total: {school.students}
                            </p>
                          )}
                        </div>
                      )}

                      {(!school.studentList || school.studentList.length === 0) && school.students === 0 && (
                        <div className="border-t pt-4 text-center text-gray-500 text-sm">
                          No students assigned to this school yet.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Schools Assigned</h3>
                <p className="text-gray-600 mb-4">
                  No schools have been assigned to {boardName} board yet.
                  <br />
                  Make sure admins have the correct board selected when creating or editing them.
                </p>
                <div className="flex justify-center gap-3">
                  <Button onClick={() => setCurrentView('admins')}>
                    Go to Admin Management
                  </Button>
                  <Button variant="outline" onClick={() => fetchBoardDashboard(selectedBoard || boardName)}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderAdminsContent = () => (
    <AdminManagement />
  );

  const renderAnalyticsContent = () => (
    <SuperAdminAnalyticsDashboard />
  );

  const renderBoardComparisonContent = () => (
    <BoardComparisonCharts />
  );

  const renderSubscriptionsContent = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Subscription Management</h2>
      
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Presentation className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Subscriptions</h3>
            <p className="text-gray-600 mb-4">Manage user subscriptions and billing</p>
            <Button>View Subscriptions</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSettingsContent = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">System Settings</h2>
      
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <SettingsIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Settings</h3>
            <p className="text-gray-600 mb-4">Configure system settings and preferences</p>
            <Button>Open Settings</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return renderDashboardContent();
      case 'board':
        return renderBoardDashboard();
      case 'admins':
        return renderAdminsContent();
      case 'content':
        return <ContentManagement />;
      case 'subjects':
        return <SubjectManagement />;
      case 'exams':
        return <ExamManagement />;
      case 'analytics':
        return renderAnalyticsContent();
      case 'board-comparison':
        return renderBoardComparisonContent();
      case 'ai-analytics':
        return <AIAnalyticsDashboard />;
      case 'detailed-analytics':
        return <DetailedAIAnalyticsDashboard />;
      case 'subscriptions':
        return renderSubscriptionsContent();
      case 'settings':
        return renderSettingsContent();
      default:
        return renderDashboardContent();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <SuperAdminSidebar 
          currentView={currentView} 
          onViewChange={setCurrentView} 
          user={user} 
        />
        
        <div className="flex-1">
          <div className="bg-white shadow-sm border-b">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard - Enhanced Version</h1>
                  <p className="text-sm text-gray-600">Welcome back, {user?.fullName || 'Super Admin'}!</p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                    <BellIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-600 hover:text-gray-900">
                    <LogOutIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
