import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { API_BASE_URL } from '@/lib/api-config';
import { useToast } from '@/hooks/use-toast';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  UserPlus,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Student {
  id: string;
  name: string;
  email: string;
  classNumber: string;
  phone?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin?: string;
}

interface Class {
  id: string;
  name: string;
  description: string;
  subject: string;
  grade: string;
  teacher: string;
  schedule: string;
  room: string;
  studentCount: number;
  students: Student[];
  createdAt: string;
}

interface Subject {
  _id: string;
  id: string;
  name: string;
  code?: string;
  description?: string;
  board: string;
}

const ClassDashboard = () => {
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [isAddClassDialogOpen, setIsAddClassDialogOpen] = useState(false);
  const [isAddStudentDialogOpen, setIsAddStudentDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);
  const [newClass, setNewClass] = useState({
    name: '',
    description: '',
    subject: '',
    grade: '',
    teacher: '',
    schedule: '',
    room: ''
  });
  // Assign Subjects state
  const [selectedClassForSubjects, setSelectedClassForSubjects] = useState<string>('');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [isSavingSubjects, setIsSavingSubjects] = useState(false);
  const [isLoadingClassSubjects, setIsLoadingClassSubjects] = useState(false);

  useEffect(() => {
    fetchClasses();
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/admin/subjects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const subjectsArray = Array.isArray(data) ? data : (data.data || []);
        setSubjects(subjectsArray.map((subject: any) => ({
          _id: subject._id || subject.id,
          id: subject._id || subject.id,
          name: subject.name,
          code: subject.code,
          description: subject.description,
          board: subject.board
        })));
      }
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch subjects',
        variant: 'destructive'
      });
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        console.error('Expected array but got:', data);
        throw new Error('Invalid data format received from server');
      }
      
      // Note: Students are already included in classes data from backend
      // This function is kept for potential future use
    } catch (error) {
      console.error('Failed to fetch students:', error);
      // Note: Students are fetched as part of classes data
    }
  };

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/admin/classes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        console.error('Expected array but got:', data);
        throw new Error('Invalid data format received from server');
      }
      
      // Use the data directly from backend (already grouped by class)
      console.log('Classes data received:', data);
      console.log('Classes with students:', data.map(c => ({ 
        name: c.name, 
        studentCount: c.studentCount, 
        students: c.students?.length || 0 
      })));
      setClasses(data);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
      // Set mock data for development
      setClasses([
        {
          id: '10A',
          name: 'Class 10A',
          description: 'Grade 10 Section A',
          subject: 'General',
          grade: '10',
          teacher: 'Ms. Sarah Wilson',
          schedule: 'Mon-Fri 9:00 AM - 3:00 PM',
          room: 'Room 101',
          studentCount: 2,
          students: [],
          createdAt: new Date().toISOString()
        },
        {
          id: '12B',
          name: 'Class 12B',
          description: 'Grade 12 Section B',
          subject: 'General',
          grade: '12',
          teacher: 'Mr. David Brown',
          schedule: 'Mon-Fri 10:00 AM - 4:00 PM',
          room: 'Room 201',
          studentCount: 1,
          students: [],
          createdAt: new Date().toISOString()
        }
      ]);
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newClass)
      });

      if (response.ok) {
        setNewClass({ name: '', description: '', subject: '', grade: '', teacher: '', schedule: '', room: '' });
        setIsAddClassDialogOpen(false);
        fetchClasses();
        alert('Class created successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to create class: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to create class:', error);
      alert('Failed to create class. Please try again.');
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/classes/${classId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        fetchClasses();
        alert('Class deleted successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to delete class: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to delete class:', error);
      alert('Failed to delete class. Please try again.');
    }
  };

  const handleClassCardClick = (classId: string) => {
    // If clicking the same class, collapse it
    if (expandedClassId === classId) {
      setExpandedClassId(null);
    } else {
      // Expand the clicked class and collapse any previously expanded class
      setExpandedClassId(classId);
    }
  };

  const fetchClassSubjects = async (classNumber: string) => {
    if (!classNumber) return;
    
    setIsLoadingClassSubjects(true);
    try {
      const token = localStorage.getItem('authToken');
      // URL encode the classNumber to handle special characters
      const encodedClassNumber = encodeURIComponent(classNumber);
      const url = `${API_BASE_URL}/api/admin/classes/${encodedClassNumber}/subjects`;
      console.log('Fetching class subjects for:', classNumber, 'URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.subjects) {
          // Extract subject IDs from the populated subjects
          const subjectIds = data.data.subjects.map((s: any) => s._id || s.id);
          setSelectedSubjectIds(subjectIds);
        } else {
          setSelectedSubjectIds([]);
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch class subjects - Status:', response.status, 'Response:', errorText);
        setSelectedSubjectIds([]);
      }
    } catch (error) {
      console.error('Failed to fetch class subjects:', error);
      setSelectedSubjectIds([]);
    } finally {
      setIsLoadingClassSubjects(false);
    }
  };

  const handleSaveClassSubjects = async () => {
    if (!selectedClassForSubjects) {
      toast({
        title: 'Validation Error',
        description: 'Please select a class',
        variant: 'destructive'
      });
      return;
    }

    setIsSavingSubjects(true);
    try {
      const token = localStorage.getItem('authToken');
      const selectedClassData = classes.find(c => c.id === selectedClassForSubjects);
      
      if (!selectedClassData) {
        toast({
          title: 'Error',
          description: 'Class not found',
          variant: 'destructive'
        });
        setIsSavingSubjects(false);
        return;
      }

      // The id is the classNumber (e.g., "9", "10A", etc.)
      const classNumber = selectedClassData.id;
      // URL encode the classNumber to handle special characters
      const encodedClassNumber = encodeURIComponent(classNumber);
      const url = `${API_BASE_URL}/api/admin/classes/${encodedClassNumber}/subjects`;
      console.log('Saving class subjects for:', classNumber, 'URL:', url, 'Subject IDs:', selectedSubjectIds);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ subjectIds: selectedSubjectIds })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast({
            title: 'Success',
            description: `Subjects saved for ${selectedClassData.name}`,
          });
        } else {
          toast({
            title: 'Error',
            description: data.message || 'Failed to save subjects',
            variant: 'destructive'
          });
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to save class subjects - Status:', response.status, 'Response:', errorText);
        let errorMessage = 'Failed to save subjects';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If response is not JSON, use the text or default message
          errorMessage = errorText.includes('<!DOCTYPE') ? 'Server error - check server logs' : errorMessage;
        }
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Failed to save class subjects:', error);
      toast({
        title: 'Error',
        description: 'Failed to save subjects',
        variant: 'destructive'
      });
    } finally {
      setIsSavingSubjects(false);
    }
  };

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjectIds(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleClassChange = (classId: string) => {
    setSelectedClassForSubjects(classId);
    if (classId) {
      const selectedClassData = classes.find(c => c.id === classId);
      if (selectedClassData) {
        // The class id is the classNumber (e.g., "9", "10A", etc.)
        // Use it directly as it matches what's stored in the database
        console.log('Class selected - ID:', selectedClassData.id, 'Name:', selectedClassData.name);
        fetchClassSubjects(selectedClassData.id);
      }
    } else {
      setSelectedSubjectIds([]);
    }
  };

  const filteredClasses = classes.filter(classItem => {
    const matchesSearch = classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classItem.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classItem.teacher.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || classItem.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const classSubjects = Array.from(new Set(classes.map(c => c.subject)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="space-y-8 p-6">
        {/* Hero Section with Vibrant Class Stats */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 opacity-20 rounded-3xl"></div>
          <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 bg-clip-text text-transparent">
                  Class Management
                </h1>
                <p className="text-gray-700 mt-3 text-xl font-medium">Organize and manage your classes and students with style</p>
              </div>
              <div className="hidden lg:block">
                <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-xl">
                  <GraduationCap className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="group relative overflow-hidden bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-500/20 backdrop-blur-sm"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
                      <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-gray-700 text-sm font-medium">Total Classes</p>
                      <p className="text-3xl font-bold text-gray-900">{classes.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-600 text-sm">
                    <BookOpen className="w-4 h-4 mr-1" />
                    <span>Active classes</span>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="group relative overflow-hidden bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-emerald-500/20 backdrop-blur-sm"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-gray-700 text-sm font-medium">Total Students</p>
                      <p className="text-3xl font-bold text-gray-900">{classes.reduce((total, cls) => total + cls.studentCount, 0)}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-600 text-sm">
                    <Users className="w-4 h-4 mr-1" />
                    <span>Enrolled students</span>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="group relative overflow-hidden bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-cyan-500/20 backdrop-blur-sm"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-gray-700 text-sm font-medium">Avg. Class Size</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {classes.length > 0 ? Math.round(classes.reduce((total, cls) => total + cls.studentCount, 0) / classes.length) : 0}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-600 text-sm">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span>Students per class</span>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="group relative overflow-hidden bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-amber-500/20 backdrop-blur-sm"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl shadow-lg">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-gray-700 text-sm font-medium">Subjects</p>
                      <p className="text-3xl font-bold text-gray-900">{classSubjects.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-600 text-sm">
                    <BookOpen className="w-4 h-4 mr-1" />
                    <span>Different subjects</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="classes" className="space-y-6">
          <TabsList className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl p-1">
            <TabsTrigger value="classes" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-2xl">
              <GraduationCap className="w-4 h-4 mr-2" />
              Classes
            </TabsTrigger>
            <TabsTrigger value="assign-subjects" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-2xl">
              <BookOpen className="w-4 h-4 mr-2" />
              Assign Subjects
            </TabsTrigger>
          </TabsList>

          <TabsContent value="classes" className="space-y-6">
            {/* Action Bar */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <Input
                      placeholder="Search classes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64 rounded-xl bg-white/70 border-gray-200 text-gray-900 backdrop-blur-sm"
                    />
                  </div>
                  
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="w-48 rounded-xl bg-white/70 border-gray-200 text-gray-900 backdrop-blur-sm">
                      <SelectValue placeholder="Filter by subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      {classSubjects.map(subject => (
                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Classes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((classItem, index) => {
            const isExpanded = expandedClassId === classItem.id;
            return (
            <motion.div
              key={classItem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`group relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border ${
                isExpanded ? 'border-sky-400 border-2' : 'border-white/20'
              } cursor-pointer`}
              onClick={() => handleClassCardClick(classItem.id)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-sky-400/10 to-blue-500/10 backdrop-blur-sm"></div>
              <div className="relative z-10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-white/40 rounded-xl backdrop-blur-sm">
                      <GraduationCap className="w-6 h-6 text-sky-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sky-900 text-lg">{classItem.name}</h3>
                      <p className="text-sky-700 text-sm">{classItem.subject}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-sky-200 text-sky-700 hover:bg-sky-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-red-200 text-red-700 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClass(classItem.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-sky-700">
                    <Users className="w-4 h-4 mr-3 text-sky-600" />
                    <span>{classItem.studentCount} students</span>
                  </div>
                  <div className="flex items-center text-sm text-sky-700">
                    <Calendar className="w-4 h-4 mr-3 text-sky-600" />
                    <span>{classItem.schedule}</span>
                  </div>
                  <div className="flex items-center text-sm text-sky-700">
                    <BookOpen className="w-4 h-4 mr-3 text-sky-600" />
                    <span>{classItem.room}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sky-900 text-sm">Students:</h4>
                    {isExpanded && (
                      <Badge variant="outline" className="text-xs border-sky-300 text-sky-700 bg-sky-50">
                        Expanded
                      </Badge>
                    )}
                  </div>
                  <div className={`space-y-1 transition-all duration-300 ${
                    isExpanded ? 'max-h-none' : 'max-h-32 overflow-y-auto'
                  }`}>
                    {classItem.students && classItem.students.length > 0 ? (
                      classItem.students.map(student => (
                      <div key={student.id} className="flex items-center justify-between bg-white/50 rounded-lg p-2 hover:bg-white/70 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-sky-900">{student.name}</p>
                          <p className="text-xs text-sky-600">{student.email}</p>
                        </div>
                        <Badge variant="outline" className="text-xs border-sky-200 text-sky-700">
                          {student.status}
                        </Badge>
                      </div>
                      ))
                    ) : (
                      <div className="text-sm text-sky-600 text-center py-2">
                        No students assigned to this class
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
            );
          })}
          </div>
          </TabsContent>

          <TabsContent value="assign-subjects" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20">
              <CardHeader>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 bg-clip-text text-transparent">
                  Assign Subjects to Class
                </CardTitle>
                <p className="text-gray-600 mt-2">Select a class and choose which subjects are assigned to that class</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="class-select" className="text-base font-semibold mb-2 block">Select Class *</Label>
                  <Select value={selectedClassForSubjects} onValueChange={handleClassChange}>
                    <SelectTrigger id="class-select" className="w-full">
                      <SelectValue placeholder="Choose a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(classItem => (
                        <SelectItem key={classItem.id} value={classItem.id}>
                          {classItem.name} ({classItem.studentCount} students)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-base font-semibold mb-4 block">Select Subjects</Label>
                  {isLoadingClassSubjects ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl">
                      <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading subjects...</p>
                    </div>
                  ) : subjects.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl">
                      <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No subjects available. Please create subjects first.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-xl">
                      {subjects.map(subject => (
                        <div
                          key={subject.id}
                          className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedSubjectIds.includes(subject.id)
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 bg-white hover:border-purple-300'
                          }`}
                          onClick={() => handleSubjectToggle(subject.id)}
                        >
                          <Checkbox
                            checked={selectedSubjectIds.includes(subject.id)}
                            onCheckedChange={() => handleSubjectToggle(subject.id)}
                          />
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{subject.name}</p>
                            {subject.code && (
                              <p className="text-sm text-gray-600">Code: {subject.code}</p>
                            )}
                            {subject.description && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{subject.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedSubjectIds.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>{selectedSubjectIds.length}</strong> subject(s) selected
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedSubjectIds.map(subjectId => {
                          const subject = subjects.find(s => s.id === subjectId);
                          return subject ? (
                            <Badge key={subjectId} className="bg-purple-100 text-purple-700">
                              {subject.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedClassForSubjects('');
                      setSelectedSubjectIds([]);
                    }}
                    disabled={isSavingSubjects}
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={handleSaveClassSubjects}
                    disabled={!selectedClassForSubjects || isSavingSubjects}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    {isSavingSubjects ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Class Dialog */}
        <Dialog open={isAddClassDialogOpen} onOpenChange={setIsAddClassDialogOpen}>
          <DialogContent className="bg-white/90 backdrop-blur-xl border-sky-200">
            <DialogHeader>
              <DialogTitle className="text-sky-900">Add New Class</DialogTitle>
              <DialogDescription>
                Create a new class to organize your students
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddClass} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="className" className="text-sm font-medium text-sky-800">Class Name</Label>
                  <Input
                    id="className"
                    value={newClass.name}
                    onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                    className="rounded-xl bg-white/70 border-sky-200 text-sky-900 backdrop-blur-sm"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-sm font-medium text-sky-800">Subject</Label>
                  <Input
                    id="subject"
                    value={newClass.subject}
                    onChange={(e) => setNewClass({ ...newClass, subject: e.target.value })}
                    className="rounded-xl bg-white/70 border-sky-200 text-sky-900 backdrop-blur-sm"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade" className="text-sm font-medium text-sky-800">Grade</Label>
                  <Input
                    id="grade"
                    value={newClass.grade}
                    onChange={(e) => setNewClass({ ...newClass, grade: e.target.value })}
                    className="rounded-xl bg-white/70 border-sky-200 text-sky-900 backdrop-blur-sm"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teacher" className="text-sm font-medium text-sky-800">Teacher</Label>
                  <Input
                    id="teacher"
                    value={newClass.teacher}
                    onChange={(e) => setNewClass({ ...newClass, teacher: e.target.value })}
                    className="rounded-xl bg-white/70 border-sky-200 text-sky-900 backdrop-blur-sm"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule" className="text-sm font-medium text-sky-800">Schedule</Label>
                  <Input
                    id="schedule"
                    value={newClass.schedule}
                    onChange={(e) => setNewClass({ ...newClass, schedule: e.target.value })}
                    className="rounded-xl bg-white/70 border-sky-200 text-sky-900 backdrop-blur-sm"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room" className="text-sm font-medium text-sky-800">Room</Label>
                  <Input
                    id="room"
                    value={newClass.room}
                    onChange={(e) => setNewClass({ ...newClass, room: e.target.value })}
                    className="rounded-xl bg-white/70 border-sky-200 text-sky-900 backdrop-blur-sm"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-sky-800">Description</Label>
                <Textarea
                  id="description"
                  value={newClass.description}
                  onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                  className="rounded-xl bg-white/70 border-sky-200 text-sky-900 backdrop-blur-sm"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddClassDialogOpen(false)}
                  className="border-sky-200 text-sky-700 hover:bg-sky-50"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white">
                  Create Class
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ClassDashboard;
