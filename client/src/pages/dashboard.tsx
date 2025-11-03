import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import Navigation from "@/components/navigation";
import AIChat from "@/components/ai-chat";
import ProgressChart from "@/components/progress-chart";
import { 
  CheckCircle, 
  TrendingUp, 
  BarChart3, 
  Play, 
  FileText, 
  Zap,
  Calendar,
  Download,
  Users,
  Star,
  Clock,
  Award,
  Target
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";
import YouTubePlayer from '@/components/youtube-player';
import DriveViewer from '@/components/drive-viewer';
import VideoModal from '@/components/video-modal';
import AsliPrepContent from '@/components/student/asli-prep-content';
import { API_BASE_URL } from '@/lib/api-config';

// Mock user ID - in a real app, this would come from authentication
const MOCK_USER_ID = "user-1";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const [user, setUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.log('No auth token found');
          setUser({ 
            fullName: "Student", 
            email: "student@example.com", 
            age: 18, 
            educationStream: "JEE" 
          });
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          console.log('Dashboard auth check - user data:', userData);
          setUser(userData.user);
        } else {
          console.log('Dashboard auth check failed with status:', response.status);
          // Fallback to mock data if not authenticated
          setUser({ 
            fullName: "Student", 
            email: "student@example.com", 
            age: 18, 
            educationStream: "JEE" 
          });
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        // Fallback to mock data
        setUser({ 
          fullName: "Student", 
          email: "student@example.com", 
          age: 18, 
          educationStream: "JEE" 
        });
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUser();
  }, []);

  // Fetch content data
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const videosRes = await fetch(`${API_BASE_URL}/api/student/videos`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        });

        if (videosRes.ok) {
          const videosData = await videosRes.json();
          setVideos((videosData.data || videosData).slice(0, 3)); // Show first 3 videos
        }
      } catch (error) {
        console.error('Failed to fetch content:', error);
        setVideos([]);
      } finally {
        setIsLoadingContent(false);
      }
    };

    fetchContent();
  }, []);

  // Fetch real dashboard data
  const [stats, setStats] = useState({ questionsAnswered: 0, accuracyRate: 0, rank: 0 });
  const [exams, setExams] = useState<any[]>([]);
  const [subjectProgress, setSubjectProgress] = useState<any[]>([]);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setIsLoadingDashboard(false);
          return;
        }

        // Fetch exam results to calculate stats
        const [examsRes, resultsRes, rankingsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/student/exams`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch(`${API_BASE_URL}/api/student/exam-results`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch(`${API_BASE_URL}/api/student/rankings`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        ]);

        let examsData = [];
        if (examsRes.ok) {
          const examsJson = await examsRes.json();
          examsData = examsJson.data || [];
          setExams(examsData);
        }

        let resultsData = [];
        if (resultsRes.ok) {
          const resultsJson = await resultsRes.json();
          resultsData = resultsJson.data || [];
        }

        let rankingsData = [];
        if (rankingsRes.ok) {
          const rankingsJson = await rankingsRes.json();
          rankingsData = rankingsJson.data || [];
        }

        // Calculate real stats from exam results
        const totalQuestions = resultsData.reduce((sum: number, r: any) => sum + (r.totalQuestions || 0), 0);
        const correctAnswers = resultsData.reduce((sum: number, r: any) => sum + (r.correctAnswers || 0), 0);
        const totalMarks = resultsData.reduce((sum: number, r: any) => sum + (r.totalMarks || 0), 0);
        const obtainedMarks = resultsData.reduce((sum: number, r: any) => sum + (r.obtainedMarks || 0), 0);
        const avgAccuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
        const avgScore = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
        
        // Get average rank
        const avgRank = rankingsData.length > 0 
          ? Math.round(rankingsData.reduce((sum: number, r: any) => sum + (r.rank || 0), 0) / rankingsData.length)
          : 0;

        // Calculate subject-wise progress from exam results
        const subjectMap = new Map<string, { total: number; correct: number; exams: number }>();
        
        resultsData.forEach((result: any) => {
          if (result.subjectWiseScore && typeof result.subjectWiseScore === 'object') {
            Object.entries(result.subjectWiseScore).forEach(([subject, score]: [string, any]) => {
              if (!subjectMap.has(subject)) {
                subjectMap.set(subject, { total: 0, correct: 0, exams: 0 });
              }
              const subj = subjectMap.get(subject)!;
              subj.total += score.total || 0;
              subj.correct += score.correct || 0;
              subj.exams += 1;
            });
          }
        });

        // Convert subject map to progress array
        const progressArray = Array.from(subjectMap.entries()).map(([name, data]) => {
          const progress = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
          const colors = [
            'bg-blue-100 text-blue-600',
            'bg-green-100 text-green-600',
            'bg-purple-100 text-purple-600',
            'bg-orange-100 text-orange-600',
            'bg-pink-100 text-pink-600'
          ];
          return {
            id: name.toLowerCase(),
            name: name,
            progress: progress,
            trend: progress >= 70 ? 'up' as const : progress >= 50 ? 'neutral' as const : 'down' as const,
            currentTopic: `${name} - Recent Exams`,
            color: colors[Math.min(subjectMap.size - 1, Math.floor(Math.random() * colors.length))]
          };
        });

        // If no subject progress from exams, set default empty
        if (progressArray.length === 0) {
          setSubjectProgress([]);
        } else {
          setSubjectProgress(progressArray);
        }

        // Set calculated stats
        setStats({
          questionsAnswered: totalQuestions,
          accuracyRate: Math.round(avgAccuracy),
          rank: avgRank || 0
        });

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoadingDashboard(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleWatchVideo = (video: any) => {
    setSelectedVideo(video);
    setIsVideoModalOpen(true);
  };

  const handleCloseVideoModal = () => {
    setIsVideoModalOpen(false);
    setSelectedVideo(null);
  };

  // Dashboard data is now handled by other queries (userData, contentData)
  // Removed problematic mock query that was causing 404 errors

  if (isLoadingUser || isLoadingContent || isLoadingDashboard) {
    return (
      <>
        <Navigation />
        <div className="container-responsive py-responsive">
          <div className="space-responsive">
            <Skeleton className="h-48 w-full rounded-responsive" />
            <div className="grid-responsive-4 gap-responsive">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  const recommendedVideos = [];
  const availableTests = exams.slice(0, 2); // Show first 2 exams as available tests

  return (
    <>
      <Navigation />
      <div className={`container-responsive pt-responsive pb-responsive bg-gray-50 min-h-screen ${isMobile ? 'pb-20' : ''}`}>
        
        {/* Welcome Section */}
        <div className="mb-responsive">
          <div className="gradient-primary rounded-responsive p-responsive text-white relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-responsive-xl font-bold mb-responsive">
                Welcome back, {user?.email || 'Student'}!
              </h1>
              <p className="text-blue-100 mb-responsive text-responsive-sm">
                Ready to continue your {user?.educationStream || 'JEE'} preparation journey? Your AI tutor has personalized recommendations waiting.
              </p>
              
              <div className="flex-responsive-col gap-responsive">
                <Button 
                  className="bg-white text-primary hover:bg-blue-50 w-full sm:w-auto"
                  onClick={() => setLocation('/learning-paths')}
                >
                  Continue Learning
                </Button>
                <Button 
                  variant="outline" 
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20 w-full sm:w-auto"
                  onClick={() => setLocation('/ai-tutor')}
                >
                  Ask AI Tutor
                </Button>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <path fill="currentColor" d="M47.1,-78.5C58.9,-69.2,64.3,-50.4,73.2,-32.8C82.1,-15.1,94.5,1.4,94.4,17.9C94.3,34.4,81.7,50.9,66.3,63.2C50.9,75.5,32.7,83.6,13.8,87.1C-5.1,90.6,-24.7,89.5,-41.6,82.1C-58.5,74.7,-72.7,61,-79.8,44.8C-86.9,28.6,-86.9,9.9,-83.2,-6.8C-79.5,-23.5,-72.1,-38.2,-61.3,-49.6C-50.5,-61,-36.3,-69.1,-21.4,-75.8C-6.5,-82.5,9.1,-87.8,25.2,-84.9C41.3,-82,57.9,-70,47.1,-78.5Z" transform="translate(100 100)"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid-responsive-3 gap-responsive mb-responsive">
          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-responsive-xs">Questions Solved</p>
                <p className="text-responsive-lg font-bold text-gray-900">{stats.questionsAnswered.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-responsive-xs">Accuracy Rate</p>
                <p className="text-responsive-lg font-bold text-gray-900">{stats.accuracyRate}%</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-responsive-xs">Rank</p>
                <p className="text-responsive-lg font-bold text-gray-900">#{stats.rank}</p>
              </div>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-8">

          {/* Asli Prep Exclusive Section */}
          <Card className="hover:shadow-lg transition-shadow duration-200 border-2 border-gradient-to-r from-purple-200 to-pink-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-purple-600" />
                  Asli Learn Exclusive
                </CardTitle>
                <Badge variant="outline" className="bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-purple-200">
                  Premium
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-center py-4">
                  <Award className="w-12 h-12 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-700 font-medium mb-2">Exclusive Study Materials</p>
                  <p className="text-xs text-gray-600 mb-4">
                    Premium content created by Super Admin for your board
                  </p>
                  <Link to="/asli-prep-content">
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                      Explore Asli Learn Exclusive
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Learning Path & Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* AI-Powered Learning Path */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Your AI-Powered Learning Path</CardTitle>
                  <Badge className="gradient-primary text-white">
                    {user?.educationStream || 'JEE'} 2024
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Progress Overview */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-responsive-xs font-medium text-gray-700">Overall Progress</span>
                    <span className="text-responsive-xs font-medium text-primary">68%</span>
                  </div>
                  <Progress value={68} className="h-3" />
                </div>

                {/* Subject Progress */}
                <div className="space-y-4">
                  {subjectProgress.length > 0 ? subjectProgress.map((subject) => (
                    <div key={subject.id} className="subject-progress-card">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${subject.color}`}>
                          <span className="text-responsive-xs font-medium">
                            {subject.name.substring(0, 2)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{subject.name}</h3>
                          <p className="text-responsive-xs text-gray-600">{subject.currentTopic}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-responsive-xs font-medium text-gray-900">{subject.progress}%</p>
                        <div className="w-16 bg-gray-200 rounded-full h-1 mt-1">
                          <div 
                            className="bg-primary h-1 rounded-full" 
                            style={{ width: `${subject.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-4 text-gray-500">
                      Complete exams to see your subject-wise progress
                    </div>
                  )}
                </div>

                <Button 
                  className="w-full gradient-primary text-white"
                  onClick={() => setLocation('/learning-paths')}
                >
                  View Complete Learning Path
                </Button>
              </CardContent>
            </Card>

            {/* Weekend Exams */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Weekend Exams & JEE Tests</CardTitle>
                  <Link href="/student-exams">
                    <Button variant="ghost" size="sm">View All</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingDashboard ? (
                  <div className="text-center py-4">Loading exams...</div>
                ) : availableTests.length > 0 ? (
                  <>
                    {availableTests.map((exam: any) => (
                      <div key={exam._id} className="test-card">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 gradient-accent rounded-lg flex items-center justify-center">
                              <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">{exam.title || exam.name || 'Exam'}</h3>
                              <p className="text-responsive-xs text-gray-600">
                                {exam.totalQuestions || 0} Questions • {exam.duration ? `${Math.floor(exam.duration / 60)} Hours` : 'N/A'} • {exam.examType || 'Practice Test'}
                              </p>
                              <div className="flex items-center space-x-4 mt-1">
                                <Badge className={`text-xs ${
                                  exam.examType === 'mains' ? 'bg-blue-100 text-blue-700' :
                                  exam.examType === 'advanced' ? 'bg-purple-100 text-purple-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {(exam.examType || 'PRACTICE').toUpperCase()}
                                </Badge>
                                {exam.totalMarks && (
                                  <span className="text-xs text-gray-500">{exam.totalMarks} Marks</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Link href="/student-exams">
                            <Button className="bg-primary text-white hover:bg-primary/90">
                              Start Test
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No exams available. Check back later!
                  </div>
                )}

                {/* Daily Quiz */}
                <div className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 gradient-accent rounded-lg flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Daily Quick Quiz</h4>
                        <p className="text-responsive-xs text-gray-600">5 Questions • Earn 50 XP</p>
                      </div>
                    </div>
                    <Button 
                      className="gradient-accent text-white"
                      onClick={() => setLocation('/student-exams')}
                    >
                      Start Quiz
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: AI Tutor & Performance */}
          <div className="space-y-6">
            
            {/* AI Chat */}
            <AIChat 
              userId={MOCK_USER_ID}
              context={{
                currentSubject: "Physics",
                currentTopic: "Rotational Motion"
              }}
            />

            {/* Performance Dashboard */}
            <ProgressChart 
              subjects={subjectProgress.length > 0 ? subjectProgress : []}
              overallProgress={subjectProgress.length > 0 
                ? Math.round(subjectProgress.reduce((sum, s) => sum + s.progress, 0) / subjectProgress.length)
                : 0
              }
            />

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    className="quick-action-button"
                    onClick={() => setLocation('/learning-paths')}
                  >
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mb-2">
                      <TrendingUp className="w-4 h-4 text-red-600" />
                    </div>
                    <p className="text-responsive-xs font-medium text-gray-900">Practice Weak Topics</p>
                  </button>

                  <button 
                    className="quick-action-button"
                    onClick={() => alert('Schedule Study feature coming soon!')}
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-responsive-xs font-medium text-gray-900">Schedule Study</p>
                  </button>

                  <button 
                    className="quick-action-button"
                    onClick={() => setLocation('/asli-prep-content')}
                  >
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                      <Download className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-responsive-xs font-medium text-gray-900">Download Notes</p>
                  </button>

                  <button 
                    className="quick-action-button"
                    onClick={() => alert('Study Groups feature coming soon!')}
                  >
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                      <Users className="w-4 h-4 text-purple-600" />
                    </div>
                    <p className="text-responsive-xs font-medium text-gray-900">Study Groups</p>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Achievements */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Achievements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="achievement-card">
                  <div className="w-8 h-8 gradient-accent rounded-full flex items-center justify-center">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-responsive-xs font-medium text-gray-900">Quiz Champion</p>
                    <p className="text-xs text-gray-600">90% accuracy in daily quizzes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={handleCloseVideoModal}
        video={selectedVideo}
      />
    </>
  );
}
