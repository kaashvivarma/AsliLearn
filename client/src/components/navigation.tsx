import { Link, useLocation } from "wouter";
import { BookOpen, FileText, MessageCircle, User, Menu, Bell, LogOut, Sparkles } from "lucide-react";
import { API_BASE_URL } from '@/lib/api-config';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

export default function Navigation() {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        window.location.href = '/signin';
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navItems = [
    { path: "/learning-paths", label: "Learning Paths", icon: BookOpen },
    { path: "/student-exams", label: "Exams", icon: FileText },
    { path: "/ai-tutor", label: "Vidya Tutor", icon: MessageCircle },
  ];

  const NavContent = () => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location === item.path;
        
        return (
          <Link key={item.path} href={item.path}>
            <Button
              variant="ghost"
              className={`w-full justify-start rounded-2xl transition-all duration-300 ${
                isActive 
                  ? "bg-sky-200/40 text-sky-800 shadow-lg backdrop-blur-sm border border-sky-300/50" 
                  : "text-sky-700 hover:bg-sky-100/30 hover:text-sky-800"
              }`}
            >
              <Icon className="w-4 h-4 mr-3" />
              {item.label}
            </Button>
          </Link>
        );
      })}
    </>
  );

  return (
    <>
      {/* Desktop Header - Liquid Glass Sky Blue Design */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-sky-100/30 border-b border-sky-200/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo Section */}
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <div className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-sm overflow-hidden">
                    <img 
                      src="/logo.jpg" 
                      alt="Asli Stud Logo" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      Asli Stud
                    </span>
                    <span className="text-xs text-gray-500 -mt-1">AI-Powered Learning</span>
                  </div>
                </div>
              </Link>
            </div>
            
            {/* Navigation Links */}
            {!isMobile && (
              <div className="hidden md:flex items-center space-x-2">
                {navItems.map((item) => {
                  const isActive = location === item.path;
                  return (
                    <Link key={item.path} href={item.path}>
                      <button className={`px-4 py-2 rounded-full transition-all duration-300 ${
                        isActive 
                          ? "bg-sky-200/40 text-sky-800 shadow-lg backdrop-blur-sm border border-sky-300/50" 
                          : "text-sky-700 hover:bg-sky-100/30 hover:text-sky-800 hover:backdrop-blur-sm"
                      }`}>
                        {item.label}
                      </button>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Right Section */}
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="icon"
                className="w-10 h-10 rounded-full bg-sky-100/30 hover:bg-sky-200/40 backdrop-blur-sm border border-sky-200/50"
              >
                <Bell className="w-5 h-5 text-sky-700" />
              </Button>
              
              {isMobile ? (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="w-10 h-10 rounded-full bg-sky-100/30 hover:bg-sky-200/40 backdrop-blur-sm border border-sky-200/50"
                    >
                      <Menu className="w-5 h-5 text-sky-700" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-64 bg-sky-100/30 backdrop-blur-xl border-l border-sky-200/50">
                    <div className="flex flex-col space-y-2 mt-8">
                      {/* Mobile Logo */}
                      <Link href="/dashboard">
                        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-sky-200/50 cursor-pointer hover:opacity-80 transition-opacity">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-sm overflow-hidden">
                            <img 
                              src="/logo.jpg" 
                              alt="Asli Stud Logo" 
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                              Asli Stud
                            </span>
                            <span className="text-xs text-gray-500">AI-Powered Learning</span>
                          </div>
                        </div>
                      </Link>
                      <NavContent />
                      <div className="pt-4 border-t border-white/30">
                        <Button 
                          onClick={handleLogout}
                          disabled={isLoggingOut}
                          variant="ghost"
                          className="w-full justify-start text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          {isLoggingOut ? "Logging out..." : "Logout"}
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link href="/profile">
                    <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-500 rounded-full flex items-center justify-center cursor-pointer shadow-lg backdrop-blur-sm border border-sky-200/50">
                      <span className="text-sm font-medium text-white">AK</span>
                    </div>
                  </Link>
                  <Button 
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    variant="ghost"
                    className="px-4 py-2 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-600 backdrop-blur-sm border border-red-300/30"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation - Liquid Glass Sky Blue Design */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 backdrop-blur-xl bg-sky-100/30 border-t border-sky-200/50 shadow-lg z-50">
          <div className="grid grid-cols-5 py-responsive">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              
              return (
                <Link key={item.path} href={item.path}>
                  <button className={`flex flex-col items-center justify-center py-responsive px-responsive rounded-responsive transition-all duration-300 ${
                    isActive 
                      ? "bg-sky-200/40 text-sky-800 shadow-lg backdrop-blur-sm" 
                      : "text-sky-600 hover:bg-sky-100/30 hover:text-sky-800"
                  }`}>
                    <Icon className="w-5 h-5 mb-responsive" />
                    <span className="text-responsive-xs font-medium">{item.label.split(" ")[0]}</span>
                  </button>
                </Link>
              );
            })}
            <button 
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`flex flex-col items-center justify-center py-responsive px-responsive rounded-responsive transition-all duration-300 ${
                isLoggingOut 
                  ? "bg-red-500/20 text-red-600" 
                  : "text-sky-600 hover:bg-red-500/20 hover:text-red-600"
              }`}
            >
              <LogOut className="w-5 h-5 mb-responsive" />
              <span className="text-responsive-xs font-medium">Logout</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
