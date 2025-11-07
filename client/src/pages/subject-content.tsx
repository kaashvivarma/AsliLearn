import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Clock, 
  Users, 
  Star,
  BookOpen,
  Target,
  Award,
  ArrowLeft,
  CheckCircle,
  FileText,
  Video,
  Youtube,
  Download,
  Share
} from 'lucide-react';
import Navigation from '@/components/navigation';
import VideoModal from '@/components/video-modal';
import { Link } from 'wouter';
import { API_BASE_URL } from '@/lib/api-config';

interface Subject {
  _id: string;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  duration: string;
  subjects: string[];
  color: string;
  icon: string;
  videos: Video[];
  quizzes: Quiz[];
  students: number;
  rating: number;
  progress: number;
}

interface Video {
  _id: string;
  title: string;
  description: string;
  duration: number;
  videoUrl: string;
  youtubeUrl?: string;
  isYouTubeVideo?: boolean;
  thumbnailUrl?: string;
  views: number;
  createdAt: string;
}

interface Quiz {
  _id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: string;
  duration: number;
  createdAt: string;
}

export default function SubjectContent() {
  const [, params] = useRoute('/subject/:id');
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  useEffect(() => {
    if (params?.id) {
      fetchSubjectContent(params.id);
    }
  }, [params?.id]);

  const fetchSubjectContent = async (subjectId: string) => {
    try {
      const [subjectResponse, videosResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/subjects/${subjectId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          }
        }),
        fetch(`${API_BASE_URL}/api/student/videos?subject=${encodeURIComponent(subjectId)}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          }
        })
      ]);
      
      let subjectName = '';
      
      if (subjectResponse.ok) {
        const contentType = subjectResponse.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const subjectData = await subjectResponse.json();
          setSubject(subjectData.subject);
          subjectName = subjectData.subject.name;
          console.log('Subject name:', subjectName);
        } else {
          console.warn('Subject response is not JSON, using fallback data');
          // Fallback data
          setSubject({
            _id: subjectId,
            name: 'Sample Subject',
            description: 'This is a sample subject for demonstration',
            category: 'Education',
            difficulty: 'Intermediate',
            duration: '2 hours',
            subjects: ['Math', 'Science'],
            color: 'bg-blue-100 text-blue-600',
            icon: '📚',
            videos: [],
            quizzes: [],
            students: 0,
            rating: 4.5,
            progress: 0
          });
          subjectName = 'Sample Subject';
        }
      } else {
        console.warn('Subject API failed, using fallback data');
        // Fallback data
        setSubject({
          _id: subjectId,
          name: 'Sample Subject',
          description: 'This is a sample subject for demonstration',
          category: 'Education',
          difficulty: 'Intermediate',
          duration: '2 hours',
          subjects: ['Math', 'Science'],
          color: 'bg-blue-100 text-blue-600',
          icon: '📚',
          videos: [],
          quizzes: [],
          students: 0,
          rating: 4.5,
          progress: 0
        });
        subjectName = 'Sample Subject';
      }
      
      // Attach subject-specific videos
      if (videosResponse.ok) {
        const vidCt = videosResponse.headers.get('content-type');
        if (vidCt && vidCt.includes('application/json')) {
          const videosData = await videosResponse.json();
          const videosList = (videosData.data || videosData.videos || videosData) as any[];
          console.log('📹 Videos fetched for subject:', {
            subjectId,
            videosCount: videosList.length,
            videos: videosList.map(v => ({ title: v.title, subjectId: v.subjectId }))
          });
          setSubject(prev => prev ? { ...prev, videos: videosList } as any : prev);
        } else {
          console.warn('⚠️ Videos response is not JSON');
          setSubject(prev => prev ? { ...prev, videos: [] } as any : prev);
        }
      } else {
        console.warn('⚠️ Videos API failed:', videosResponse.status, videosResponse.statusText);
        setSubject(prev => prev ? { ...prev, videos: [] } as any : prev);
      }

    } catch (error) {
      console.error('Failed to fetch subject content:', error);
      // Set fallback data on error
      setSubject({
        _id: subjectId,
        name: 'Sample Subject',
        description: 'This is a sample subject for demonstration',
        category: 'Education',
        difficulty: 'Intermediate',
        duration: '2 hours',
        subjects: ['Math', 'Science'],
        color: 'bg-blue-100 text-blue-600',
        icon: '📚',
        videos: [],
        quizzes: [],
        students: 0,
        rating: 4.5,
        progress: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video);
    setIsVideoModalOpen(true);
  };

  const handleCloseVideoModal = () => {
    setIsVideoModalOpen(false);
    setSelectedVideo(null);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-600';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-600';
      case 'Advanced': return 'bg-orange-100 text-orange-600';
      case 'Expert': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'BookOpen': return BookOpen;
      case 'Target': return Target;
      case 'Award': return Award;
      default: return BookOpen;
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="w-full px-2 sm:px-4 lg:px-6 py-8">
          <div className="text-center">Loading subject content...</div>
        </div>
      </>
    );
  }

  if (!subject) {
    return (
      <>
        <Navigation />
        <div className="w-full px-2 sm:px-4 lg:px-6 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Subject not found</h1>
            <Link href="/learning-paths">
              <Button>Back to Learning Paths</Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  const Icon = getIcon(subject.icon);

  return (
    <>
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link href="/learning-paths">
              <Button variant="ghost" className="mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Learning Paths
              </Button>
            </Link>
          </div>
          
          <div className="gradient-primary rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center space-x-4 mb-4">
                <div className={`w-16 h-16 ${subject.color} rounded-2xl flex items-center justify-center`}>
                  <Icon className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">{subject.name}</h1>
                  <p className="text-blue-100">{subject.description}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-6 mb-6">
                <Badge className={getDifficultyColor(subject.difficulty)}>
                  {subject.difficulty}
                </Badge>
                <Badge variant="outline" className="border-white/30 text-white">
                  {subject.category}
                </Badge>
                <div className="flex items-center space-x-1 text-blue-100">
                  <Clock className="w-4 h-4" />
                  <span>{subject.duration}</span>
                </div>
                <div className="flex items-center space-x-1 text-blue-100">
                  <Users className="w-4 h-4" />
                  <span>{subject.students} students</span>
                </div>
                <div className="flex items-center space-x-1 text-blue-100">
                  <Star className="w-4 h-4" />
                  <span>{subject.rating}</span>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-100">Your Progress</span>
                  <span className="text-sm font-medium text-white">{subject.progress || 0}%</span>
                </div>
                <Progress value={subject.progress || 0} className="h-2 bg-white/20" />
              </div>

              <div className="flex flex-wrap gap-4">
                <Button className="bg-white text-primary hover:bg-blue-50">
                  <Play className="w-4 h-4 mr-2" />
                  Start Learning
                </Button>
                <Button variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                  <Download className="w-4 h-4 mr-2" />
                  Download Materials
                </Button>
                <Button variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                  <Share className="w-4 h-4 mr-2" />
                  Share
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

        {/* Content Tabs */}
        <Tabs defaultValue="videos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="videos" className="flex items-center space-x-2">
              <Video className="w-4 h-4" />
              <span>Videos ({subject.videos?.length || 0})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="videos" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subject.videos?.map((video) => (
                <Card key={video._id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader>
                    <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                      {video.isYouTubeVideo ? (
                        <Youtube className="w-12 h-12 text-red-500" />
                      ) : (
                        <Video className="w-12 h-12 text-blue-500" />
                      )}
                    </div>
                    <CardTitle className="text-lg">{video.title}</CardTitle>
                    <p className="text-gray-600 text-sm">{video.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{video.duration} min</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{video.views} views</span>
                      </div>
                    </div>

                    <Button 
                      className="w-full gradient-primary text-white"
                      onClick={() => handleVideoClick(video)}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Watch Video
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {(!subject.videos || subject.videos.length === 0) && (
              <div className="text-center py-12">
                <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No videos available</h3>
                <p className="text-gray-600">Videos will appear here once they are added to this learning path.</p>
              </div>
            )}
          </TabsContent>

        </Tabs>
      </div>

      {/* Video Modal */}
      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={handleCloseVideoModal}
        video={selectedVideo ? {
          id: selectedVideo._id,
          title: selectedVideo.title,
          description: selectedVideo.description,
          duration: Math.floor(selectedVideo.duration / 60),
          subject: subject.name,
          videoUrl: selectedVideo.videoUrl,
          youtubeUrl: selectedVideo.youtubeUrl || selectedVideo.videoUrl,
          isYouTubeVideo: selectedVideo.isYouTubeVideo || false
        } : null}
      />
    </>
  );
}
