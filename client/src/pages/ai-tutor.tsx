import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Navigation from "@/components/navigation";
import AIChat from "@/components/ai-chat";
import { 
  MessageCircle, 
  Zap, 
  TrendingUp,
  Lightbulb,
  Brain,
  Target,
  Clock,
  Star,
  FileText,
  HelpCircle
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { API_BASE_URL } from "@/lib/api-config";

// Mock user ID - in a real app, this would come from authentication
const MOCK_USER_ID = "user-1";

export default function AITutor() {
  const [user, setUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const isMobile = useIsMobile();

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.log('No auth token found, using mock data');
          setUser({ 
            fullName: "Student", 
            email: "student@example.com", 
            educationStream: "JEE" 
          });
          setIsLoadingUser(false);
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
          setUser(userData.user);
        } else {
          console.log('Auth check failed, using mock data');
          setUser({ 
            fullName: "Student", 
            email: "student@example.com", 
            educationStream: "JEE" 
          });
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        setUser({ 
          fullName: "Student", 
          email: "student@example.com", 
          educationStream: "JEE" 
        });
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUser();
  }, []);

  // Fetch user's chat sessions
  const { data: chatSessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["/api/users", MOCK_USER_ID, "chat-sessions"],
  });

  // Removed problematic dashboard query that was causing 404 errors
  // User data is handled by other queries
  const recentSession = (chatSessions as any[])[0];

  const tutorFeatures = [
    {
      icon: MessageCircle,
      title: "Real-time Doubt Solving",
      description: "Get instant answers to your questions with detailed explanations",
      color: "bg-blue-100 text-blue-600"
    },
    {
      icon: Brain,
      title: "Concept Reinforcement",
      description: "AI provides targeted practice based on your weak areas",
      color: "bg-orange-100 text-orange-600"
    },
    {
      icon: Lightbulb,
      title: "Study Guidance",
      description: "Personalized study tips and learning strategies",
      color: "bg-green-100 text-green-600"
    },
    {
      icon: Target,
      title: "Progress Tracking",
      description: "Monitor your learning progress and identify areas for improvement",
      color: "bg-purple-100 text-purple-600"
    }
  ];

  const quickQuestions = [
    "Explain the concept of rotational motion with examples",
    "What's the difference between alcohols and ethers?",
    "How do I solve integration by parts problems?",
    "Can you help me understand Newton's laws of motion?",
    "What are the key formulas for organic chemistry?",
    "Explain the photoelectric effect in simple terms"
  ];

  const studyTips = [
    {
      icon: Target,
      title: "Set Daily Goals",
      description: "Break down your study plan into achievable daily targets"
    },
    {
      icon: Clock,
      title: "Time Management",
      description: "Use the Pomodoro technique for focused study sessions"
    },
    {
      icon: TrendingUp,
      title: "Track Progress",
      description: "Regularly review your performance analytics"
    },
    {
      icon: Star,
      title: "Consistent Practice",
      description: "Maintain a daily study routine for best results"
    }
  ];

  if (isLoadingUser) {
    return (
      <>
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
          <div className="space-y-8">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className={`container-responsive pt-responsive pb-responsive ${isMobile ? 'pb-20' : ''}`}>
        
        {/* Header */}
        <div className="mb-responsive">
          <div className="flex-responsive-col items-center sm:items-start space-x-responsive space-y-responsive sm:space-y-0 mb-responsive">
            <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-responsive-xl font-bold text-gray-900">AI Tutor</h1>
              <p className="text-responsive-sm text-gray-600">Your personal AI teaching assistant</p>
            </div>
            <Badge className="bg-green-100 text-green-800">
              Available 24/7
            </Badge>
          </div>
          
          {user && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-responsive rounded-responsive border border-blue-100">
              <h2 className="font-semibold text-gray-900 mb-responsive text-responsive-base">
                Welcome, {user.fullName?.split(' ')[0] || 'Student'}!
              </h2>
              <p className="text-gray-700 text-responsive-sm">
                I'm here to help you with your {user.educationStream} preparation. 
                Ask me anything about your studies!
              </p>
            </div>
          )}
        </div>

        <div className="grid-responsive-3 gap-responsive">
          
          {/* Main Chat Interface */}
          <div className="lg:col-span-2">
            <AIChat 
              userId={MOCK_USER_ID}
              className="h-[600px]"
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Quick Questions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HelpCircle className="w-5 h-5 mr-2" />
                  Quick Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickQuestions.slice(0, 4).map((question, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start text-left h-auto p-3 text-sm"
                    onClick={() => {
                      // This would trigger sending the question to the chat
                      // For now, we'll just log it - in a real implementation, 
                      // this would send the question to the AI chat
                      console.log("Quick question:", question);
                      // TODO: Implement sending quick questions to chat
                    }}
                  >
                    {question}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* AI Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  AI Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tutorFeatures.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${feature.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">{feature.title}</h4>
                        <p className="text-xs text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Study Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2" />
                  Study Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {studyTips.map((tip, index) => {
                  const Icon = tip.icon;
                  return (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <Icon className="w-4 h-4 text-yellow-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">{tip.title}</h4>
                        <p className="text-xs text-gray-600">{tip.description}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Session History */}
            {sessionsLoading ? (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ) : chatSessions.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Sessions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(chatSessions as any[]).slice(0, 3).map((session: any, index: number) => (
                    <div key={session.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          Session {index + 1}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(session.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {session.messages?.length || 0} messages
                      </p>
                      {session.context?.currentSubject && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {session.context.currentSubject}
                        </Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <MessageCircle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600">No chat sessions yet</p>
                  <p className="text-xs text-gray-500 mt-1">Start a conversation to see your history</p>
                </CardContent>
              </Card>
            )}

            {/* Usage Stats */}
            <Card>
              <CardHeader>
                <CardTitle>AI Tutor Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {(chatSessions as any[]).reduce((sum: number, session: any) => sum + (session.messages?.length || 0), 0)}
                  </div>
                  <p className="text-sm text-gray-600">Total Messages</p>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {(chatSessions as any[]).length}
                  </div>
                  <p className="text-sm text-gray-600">Chat Sessions</p>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">24/7</div>
                  <p className="text-sm text-gray-600">Always Available</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
