import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Upload, Video, FileText, File, X, Trash2, Edit, Play, Download, Eye } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api-config';
import { useToast } from '@/hooks/use-toast';

interface Content {
  _id: string;
  title: string;
  description?: string;
  type: 'video' | 'pdf' | 'ppt' | 'note';
  board: string;
  subject: {
    _id: string;
    name: string;
  };
  topic?: string;
  fileUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  createdAt: string;
}

const BOARDS = [
  { value: 'CBSE_AP', label: 'CBSE AP' },
  { value: 'CBSE_TS', label: 'CBSE TS' },
  { value: 'STATE_AP', label: 'State AP' },
  { value: 'STATE_TS', label: 'State TS' }
];

export default function ContentManagement() {
  const { toast } = useToast();
  const [selectedBoard, setSelectedBoard] = useState<string>('CBSE_AP');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'video' as 'video' | 'pdf' | 'ppt' | 'note',
    board: 'CBSE_AP',
    subject: '',
    topic: '',
    fileUrl: '',
    thumbnailUrl: '',
    duration: ''
  });

  useEffect(() => {
    fetchSubjects();
    fetchContents();
  }, [selectedBoard]);

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/super-admin/boards/${selectedBoard}/subjects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSubjects(data.data || []);
        }
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

  const fetchContents = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/super-admin/boards/${selectedBoard}/content`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setContents(data.data || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch contents:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch content',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.fileUrl || !formData.subject) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/super-admin/content`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          board: selectedBoard,
          duration: formData.duration ? Number(formData.duration) : 0
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast({
            title: 'Success',
            description: 'Content uploaded successfully',
          });
          setIsUploadModalOpen(false);
          setFormData({
            title: '',
            description: '',
            type: 'video',
            board: selectedBoard,
            subject: '',
            topic: '',
            fileUrl: '',
            thumbnailUrl: '',
            duration: ''
          });
          fetchContents();
        }
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to upload content',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload content',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (contentId: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    setIsDeleting(contentId);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/super-admin/content/${contentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Content deleted successfully',
        });
        fetchContents();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete content',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete content',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'pdf':
        return <File className="w-4 h-4" />;
      case 'note':
        return <FileText className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'bg-red-100 text-red-700';
      case 'pdf':
        return 'bg-blue-100 text-blue-700';
      case 'note':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Content Management</h2>
          <p className="text-gray-600 mt-1">Upload videos and notes for Asli Learn Exclusive</p>
        </div>
        <Button
          onClick={() => setIsUploadModalOpen(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Content
        </Button>
      </div>

      {/* Board Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <Label className="font-semibold">Select Board:</Label>
            <Select value={selectedBoard} onValueChange={setSelectedBoard}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BOARDS.map(board => (
                  <SelectItem key={board.value} value={board.value}>
                    {board.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline" className="ml-auto">
              {contents.length} items
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Content Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading content...</p>
        </div>
      ) : contents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Content Yet</h3>
            <p className="text-gray-600 mb-4">Start uploading exclusive content for {BOARDS.find(b => b.value === selectedBoard)?.label} students</p>
            <Button onClick={() => setIsUploadModalOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload First Content
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contents.map((content) => (
            <Card key={content._id} className="hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{content.title}</CardTitle>
                    <Badge className={getTypeColor(content.type)}>
                      {getTypeIcon(content.type)}
                      <span className="ml-1 capitalize">{content.type}</span>
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(content._id)}
                    disabled={isDeleting === content._id}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                {content.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{content.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <span className="font-medium mr-2">Subject:</span>
                    <span>{content.subject?.name || 'N/A'}</span>
                  </div>
                  {content.topic && (
                    <div className="flex items-center text-gray-600">
                      <span className="font-medium mr-2">Topic:</span>
                      <span>{content.topic}</span>
                    </div>
                  )}
                  {content.duration && content.type === 'video' && (
                    <div className="flex items-center text-gray-600">
                      <span className="font-medium mr-2">Duration:</span>
                      <span>{content.duration} min</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(content.fileUrl, '_blank')}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(content.fileUrl, '_blank')}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={(open) => {
        setIsUploadModalOpen(open);
        if (open) {
          // Sync form board with selected board when modal opens
          setFormData(prev => ({ ...prev, board: selectedBoard }));
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Upload New Content</DialogTitle>
            <DialogDescription>
              Upload exclusive videos and notes for Asli Learn students
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="board">Board *</Label>
                <Select
                  value={formData.board}
                  onValueChange={async (value) => {
                    setFormData({ ...formData, board: value, subject: '' }); // Reset subject when board changes
                    setSelectedBoard(value);
                    // Fetch subjects for the new board
                    try {
                      const token = localStorage.getItem('authToken');
                      const response = await fetch(`${API_BASE_URL}/api/super-admin/boards/${value}/subjects`, {
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        }
                      });
                      if (response.ok) {
                        const data = await response.json();
                        if (data.success) {
                          setSubjects(data.data || []);
                        }
                      }
                    } catch (error) {
                      console.error('Failed to fetch subjects:', error);
                    }
                  }}
                >
                  <SelectTrigger id="board">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BOARDS.map(board => (
                      <SelectItem key={board.value} value={board.value}>
                        {board.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type">Content Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="ppt">PPT</SelectItem>
                    <SelectItem value="note">Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="subject">Subject *</Label>
              {subjects.length === 0 ? (
                <div className="space-y-2">
                  <Select disabled>
                    <SelectTrigger id="subject">
                      <SelectValue placeholder="No subjects available" />
                    </SelectTrigger>
                  </Select>
                  <p className="text-xs text-yellow-600">
                    ⚠️ No subjects found for {BOARDS.find(b => b.value === formData.board)?.label}. 
                    Please create subjects first in Subject Management.
                  </p>
                </div>
              ) : (
                <Select
                  value={formData.subject}
                  onValueChange={(value) => setFormData({ ...formData, subject: value })}
                >
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject._id} value={subject._id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter content title"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter content description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="topic">Topic (Optional)</Label>
                <Input
                  id="topic"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  placeholder="e.g., Algebra, Mechanics"
                />
              </div>
              {formData.type === 'video' && (
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="0"
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="fileUrl">File URL *</Label>
              <Input
                id="fileUrl"
                value={formData.fileUrl}
                onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                placeholder="https://example.com/video.mp4 or Google Drive link"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter direct URL to video, PDF, or Google Drive shareable link
              </p>
            </div>

            <div>
              <Label htmlFor="thumbnailUrl">Thumbnail URL (Optional)</Label>
              <Input
                id="thumbnailUrl"
                value={formData.thumbnailUrl}
                onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                placeholder="https://example.com/thumbnail.jpg"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsUploadModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                <Upload className="w-4 h-4 mr-2" />
                Upload Content
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

