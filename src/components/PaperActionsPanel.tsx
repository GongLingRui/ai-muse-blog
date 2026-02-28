import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import AISummary from '@/components/AISummary';
import CitationExportDialog from '@/components/CitationExportDialog';
import SocialShareDialog from '@/components/SocialShareDialog';
import AnnotationEditor from '@/components/AnnotationEditor';
import {
  FileText,
  Download,
  Bookmark,
  BookmarkPlus,
  Share2,
  MessageSquare,
  Quote,
  FileText as FileTextIcon,
  Sparkles,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dialog';

interface PaperActionsPanelProps {
  paperId: string;
  paperTitle: string;
  paperArxivId?: string;
  pdfUrl?: string;
}

const PaperActionsPanel = ({
  paperId,
  paperTitle,
  paperArxivId,
  pdfUrl,
}: PaperActionsPanelProps) => {
  const { isAuthenticated } = useAuth();
  const [showCitationExport, setShowCitationExport] = useState(false);
  const [showSocialShare, setShowSocialShare] = useState(false);
  const [showAISummary, setShowAISummary] = useState(false);
  const [showAnnotationEditor, setShowAnnotationEditor] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [activeTab, setActiveTab] = useState<'actions' | 'ai' | 'annotations'>('actions');

  // Handle text selection for annotations
  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString();
    if (text && text.trim().length > 0) {
      setSelectedText(text);
      setShowAnnotationEditor(true);
    }
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleTextSelection);
    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
    };
  }, []);

  const addToReadingList = async () => {
    if (!isAuthenticated) {
      toast.error('请先登录后再添加到阅读列表');
      return;
    }
    try {
      await api.readingList.add({
        paper_id: paperId,
        priority: 'normal',
      });
      toast.success('已添加到阅读列表');
    } catch (error: any) {
      // Silently ignore 401 errors
      if (!error?.message?.includes('401')) {
        toast.error('添加失败');
      }
    }
  };

  const downloadPDF = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    } else if (paperArxivId) {
      window.open(`https://arxiv.org/pdf/${paperArxivId}.pdf`, '_blank');
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={addToReadingList}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <BookmarkPlus className="w-4 h-4" />
          加入阅读列表
        </Button>

        <Button
          onClick={() => setShowCitationExport(true)}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Quote className="w-4 h-4" />
          导出引用
        </Button>

        <Button
          onClick={() => setShowSocialShare(true)}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          分享
        </Button>

        <Button
          onClick={downloadPDF}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          下载PDF
        </Button>

        <Link to={`/papers/${paperId}#discussions`}>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            讨论
          </Button>
        </Link>
      </div>

      {/* Tabs for Advanced Features */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab('actions')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'actions'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            快捷操作
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'ai'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Sparkles className="w-4 h-4 inline mr-1" />
            AI助手
          </button>
          <button
            onClick={() => setActiveTab('annotations')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'annotations'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-1" />
            批注
          </button>
        </div>

        <div className="p-4 bg-white">
          {/* Actions Tab */}
          {activeTab === 'actions' && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">更多操作</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => setActiveTab('ai')}
                  variant="outline"
                  className="justify-start"
                >
                  <Sparkles className="w-4 h-4 mr-2 text-indigo-600" />
                  生成AI摘要
                </Button>
                <Button
                  onClick={() => setActiveTab('annotations')}
                  variant="outline"
                  className="justify-start"
                >
                  <MessageSquare className="w-4 h-4 mr-2 text-green-600" />
                  添加批注
                </Button>
                <Button
                  onClick={() => setShowCitationExport(true)}
                  variant="outline"
                  className="justify-start"
                >
                  <Quote className="w-4 h-4 mr-2 text-blue-600" />
                  复制引用
                </Button>
                <Button
                  onClick={() => setShowSocialShare(true)}
                  variant="outline"
                  className="justify-start"
                >
                  <Share2 className="w-4 h-4 mr-2 text-purple-600" />
                  社交分享
                </Button>
              </div>
            </div>
          )}

          {/* AI Tab */}
          {activeTab === 'ai' && (
            <AISummary
              contentType="paper"
              contentId={paperId}
              title={paperTitle}
            />
          )}

          {/* Annotations Tab */}
          {activeTab === 'annotations' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">批注</h4>
                <Button
                  onClick={() => setShowAnnotationEditor(!showAnnotationEditor)}
                  size="sm"
                  variant="outline"
                >
                  {showAnnotationEditor ? '关闭' : '打开'}编辑器
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                选择论文中的文本即可添加批注，或点击打开编辑器查看所有批注
              </p>
              {showAnnotationEditor && (
                <AnnotationEditor
                  contentType="paper"
                  contentId={paperId}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <CitationExportDialog
        isOpen={showCitationExport}
        onClose={() => setShowCitationExport(false)}
        paperIds={[paperId]}
        paperTitles={[paperTitle]}
      />

      <SocialShareDialog
        isOpen={showSocialShare}
        onClose={() => setShowSocialShare(false)}
        contentType="paper"
        contentId={paperId}
        title={paperTitle}
      />
    </div>
  );
};

export default PaperActionsPanel;
