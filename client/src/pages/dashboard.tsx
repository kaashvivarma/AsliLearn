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
  const [overallProgress, setOverallProgress] = useState(0);
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

        // Fetch actual subject names from API FIRST to map exam subject keys to real names
        let subjectNameMap = new Map<string, string>(); // Maps subject keys (maths, physics, etc.) to actual names
        let subjectsList: any[] = [];
        try {
          const token = localStorage.getItem('authToken');
          if (token) {
            const subjectsResponse = await fetch(`${API_BASE_URL}/api/student/subjects`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (subjectsResponse.ok) {
              const subjectsData = await subjectsResponse.json();
              subjectsList = subjectsData.subjects || subjectsData.data || [];
              
              // Create a map from subject keys to actual names
              // Map common exam subject keys to actual subject names
              subjectsList.forEach((subject: any) => {
                const subjectName = subject.name || '';
                const subjectNameLower = subjectName.toLowerCase();
                
                // Map common variations
                if (subjectNameLower.includes('math') || subjectNameLower.includes('mathematics')) {
                  subjectNameMap.set('maths', subjectName);
                  subjectNameMap.set('mathematics', subjectName);
                }
                if (subjectNameLower.includes('physics')) {
                  subjectNameMap.set('physics', subjectName);
                }
                if (subjectNameLower.includes('chemistry')) {
                  subjectNameMap.set('chemistry', subjectName);
                }
                
                // Also map by exact name match (case-insensitive)
                subjectNameMap.set(subjectNameLower, subjectName);
              });
            }
          }
        } catch (error) {
          console.error('Failed to fetch subjects for name mapping:', error);
        }

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

        // Convert subject map to progress array with actual subject names
        const progressArray = Array.from(subjectMap.entries()).map(([key, data]) => {
          const progress = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
          // Get actual subject name from map, or capitalize the key as fallback
          const actualName = subjectNameMap.get(key.toLowerCase()) || 
                           subjectNameMap.get(key) || 
                           key.charAt(0).toUpperCase() + key.slice(1);
          const colors = [
            'bg-blue-100 text-blue-600',
            'bg-green-100 text-green-600',
            'bg-purple-100 text-purple-600',
            'bg-orange-100 text-orange-600',
            'bg-pink-100 text-pink-600'
          ];
          return {
            id: key.toLowerCase(),
            name: actualName,
            progress: progress,
            trend: progress >= 70 ? 'up' as const : progress >= 50 ? 'neutral' as const : 'down' as const,
            currentTopic: `${actualName} - Recent Exams`,
            color: colors[Math.min(subjectMap.size - 1, Math.floor(Math.random() * colors.length))]
          };
        });

        // Fetch subject progress from learning paths (localStorage)
        // Get all subjects assigned to the student
        let learningPathProgress: Map<string, number> = new Map();
        try {
          const token = localStorage.getItem('authToken');
          if (token && subjectsList.length > 0) {
            // Get progress for each subject from localStorage and content count
            for (const subject of subjectsList) {
              const subjectId = subject._id || subject.id;
              try {
                const stored = localStorage.getItem(`completed_content_${subjectId}`);
                if (stored) {
                  const completedIds = JSON.parse(stored);
                  
                  // Fetch content count for this subject to calculate accurate progress
                  try {
                    const contentResponse = await fetch(`${API_BASE_URL}/api/student/asli-prep-content?subject=${encodeURIComponent(subjectId)}`, {
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      }
                    });
                    
                    if (contentResponse.ok) {
                      const contentData = await contentResponse.json();
                      const contents = contentData.data || contentData || [];
                      const totalContent = contents.length;
                      
                      if (totalContent > 0) {
                        const progress = Math.round((completedIds.length / totalContent) * 100);
                        learningPathProgress.set(subjectId, progress);
                      } else if (completedIds.length > 0) {
                        // If there's no content but items are marked, set to 0
                        learningPathProgress.set(subjectId, 0);
                      }
                    }
                  } catch (contentError) {
                    console.error('Error fetching content for subject:', subjectId, contentError);
                    // Fallback: use completed count as rough estimate
                    if (completedIds.length > 0) {
                      const progress = Math.min(100, (completedIds.length * 10));
                      learningPathProgress.set(subjectId, progress);
                    }
                  }
                }
              } catch (e) {
                console.error('Error reading progress for subject:', subjectId, e);
              }
            }
          }
        } catch (error) {
          console.error('Failed to fetch learning path progress:', error);
        }

        // Merge exam progress with learning path progress
        // If a subject has both, take the average or use the higher value
        const mergedProgress = new Map<string, { progress: number; name: string; color: string; currentTopic: string }>();
        
        // Add exam-based progress
        progressArray.forEach(subj => {
          mergedProgress.set(subj.id, {
            progress: subj.progress,
            name: subj.name,
            color: subj.color,
            currentTopic: subj.currentTopic
          });
        });

        // Merge with learning path progress
        learningPathProgress.forEach((progress, subjectId) => {
          // Find the subject name from the subjects list
          const subject = subjectsList.find(s => (s._id || s.id) === subjectId);
          const subjectName = subject?.name || 'Subject';
          
          // Try to match by subject ID or find existing entry
          let existing = null;
          // Check if this subject matches any exam-based subject by name
          Array.from(mergedProgress.entries()).forEach(([key, value]) => {
            if (value.name === subjectName) {
              existing = value;
              // Update the existing entry with averaged progress
              mergedProgress.set(key, {
                ...value,
                progress: Math.round((value.progress + progress) / 2)
              });
            }
          });
          
          // If we found a match, skip adding new entry
          if (existing) {
            return;
          }
          
          // If no match found, add as new entry
          if (!existing) {
            const colors = [
              'bg-blue-100 text-blue-600',
              'bg-green-100 text-green-600',
              'bg-purple-100 text-purple-600',
              'bg-orange-100 text-orange-600',
              'bg-pink-100 text-pink-600'
            ];
            // Use subject ID as key, but display actual name
            mergedProgress.set(subjectId, {
              progress: progress,
              name: subjectName,
              color: colors[Math.floor(Math.random() * colors.length)],
              currentTopic: `${subjectName} - Learning Path`
            });
          }
        });

        // Convert to array
        const finalProgressArray = Array.from(mergedProgress.values());

        // Calculate overall progress as average of all subject progress
        const calculatedOverallProgress = finalProgressArray.length > 0
          ? Math.round(finalProgressArray.reduce((sum, s) => sum + s.progress, 0) / finalProgressArray.length)
          : 0;

        // If no subject progress from exams, set default empty
        if (finalProgressArray.length === 0) {
          setSubjectProgress([]);
          setOverallProgress(0);
        } else {
          setSubjectProgress(finalProgressArray);
          setOverallProgress(calculatedOverallProgress);
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
        <div className="w-full px-2 sm:px-4 lg:px-6 py-responsive">
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
      <div className={`w-full px-2 sm:px-4 lg:px-6 pt-responsive pb-responsive bg-gray-50 min-h-screen ${isMobile ? 'pb-20' : ''}`}>
        
        {/* Welcome Section */}
        <div className="mb-responsive">
          <div className="gradient-primary rounded-responsive p-responsive text-white relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-responsive-xl font-bold mb-responsive">
                Welcome back, {user?.email || 'Student'}!
              </h1>
              <p className="text-blue-100 mb-responsive text-responsive-sm">
                Ready to continue your {user?.educationStream || 'JEE'} preparation journey? Your Vidya Tutor has personalized recommendations waiting.
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
                  Ask Vidya Tutor
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


        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Learning Path & Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Learning Progress */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Your Learning Progress</CardTitle>
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
                    <span className="text-responsive-xs font-medium text-primary">{overallProgress}%</span>
                  </div>
                  <Progress value={overallProgress} className="h-3" />
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

            {/* Exams */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Exams</CardTitle>
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

          {/* Right Column: Vidya Tutor & Performance */}
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
              overallProgress={overallProgress}
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
