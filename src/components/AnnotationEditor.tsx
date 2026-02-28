import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Annotation } from '@/types';
import { MessageSquare, Highlighter, HelpCircle, BookMarked, X, Save, Trash2, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AnnotationEditorProps {
  contentType: 'paper' | 'article';
  contentId: string;
  selectedText?: string;
  textAnchors?: { start: number; end: number };
  onSave?: (annotation: Annotation) => void;
}

const annotationTypes = [
  { value: 'comment', label: '评论', icon: MessageSquare, color: 'blue' },
  { value: 'highlight', label: '高亮', icon: Highlighter, color: 'yellow' },
  { value: 'question', label: '问题', icon: HelpCircle, color: 'red' },
  { value: 'definition', label: '定义', icon: BookMarked, color: 'green' },
] as const;

const colorMap = {
  blue: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-900' },
  yellow: { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-900' },
  red: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-900' },
  green: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-900' },
};

const AnnotationEditor = ({
  contentType,
  contentId,
  selectedText,
  textAnchors,
  onSave,
}: AnnotationEditorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [newAnnotation, setNewAnnotation] = useState({
    type: 'comment' as const,
    content: '',
    color: 'yellow',
    isPublic: false,
  });
  const [loading, setLoading] = useState(false);
  const [highlightedText, setHighlightedText] = useState('');
  const [pageNumber, setPageNumber] = useState(1);

  useEffect(() => {
    if (isOpen) {
      fetchAnnotations();
    }
  }, [isOpen, contentId]);

  useEffect(() => {
    if (selectedText) {
      setNewAnnotation(prev => ({
        ...prev,
        content: `关于: "${selectedText}"\n\n`,
      }));
      setHighlightedText(selectedText);
      setIsOpen(true);
    }
  }, [selectedText]);

  const fetchAnnotations = async () => {
    try {
      const response = await api.annotations.list(contentType, contentId) as any;
      if (response.success) {
        setAnnotations(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch annotations:', error);
    }
  };

  const saveAnnotation = async () => {
    if (!newAnnotation.content.trim()) return;

    setLoading(true);
    try {
      const response = await api.annotations.create({
        content_type: contentType,
        content_id: contentId,
        text_anchors: textAnchors,
        content: newAnnotation.content,
        annotation_type: newAnnotation.type,
        color: newAnnotation.color,
        is_public: newAnnotation.isPublic,
        page_number: pageNumber,
        highlighted_text: highlightedText || undefined,
      }) as any;

      if (response.success) {
        const savedAnnotation = response.data;
        setAnnotations([...annotations, savedAnnotation]);
        setNewAnnotation({
          type: 'comment',
          content: '',
          color: 'yellow',
          isPublic: false,
        });
        setHighlightedText('');
        setPageNumber(1);
        setIsOpen(false);
        onSave?.(savedAnnotation);
      }
    } catch (error) {
      console.error('Failed to save annotation:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteAnnotation = async (id: string) => {
    try {
      await api.annotations.delete(id);
      setAnnotations(annotations.filter(a => a.id !== id));
    } catch (error) {
      console.error('Failed to delete annotation:', error);
    }
  };

  const toggleVisibility = async (id: string, isPublic: boolean) => {
    try {
      await api.annotations.update(id, { is_public: !isPublic });
      setAnnotations(annotations.map(a =>
        a.id === id ? { ...a, is_public: !isPublic } : a
      ));
    } catch (error) {
      console.error('Failed to update annotation:', error);
    }
  };

  return (
    <>
      {/* Annotation Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-all hover:scale-110"
          title="打开批注编辑器"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Annotation Panel */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-indigo-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">批注</h2>
                <p className="text-xs text-gray-500">{annotations.length} 条批注</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Highlighted Text */}
            {highlightedText && (
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                <div className="text-xs text-indigo-600 mb-2">选中的文本</div>
                <p className="text-sm text-gray-800 italic">"{highlightedText}"</p>
              </div>
            )}

            {/* New Annotation Form */}
            <div className="space-y-4">
              {/* Page Number Input */}
              <div>
                <Label htmlFor="pageNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  页码
                </Label>
                <Input
                  id="pageNumber"
                  type="number"
                  value={pageNumber}
                  onChange={(e) => setPageNumber(parseInt(e.target.value) || 1)}
                  min={1}
                  className="w-full"
                  placeholder="输入页码"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  批注类型
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {annotationTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        onClick={() => setNewAnnotation({ ...newAnnotation, type: type.value as any, color: type.color })}
                        className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                          newAnnotation.type === type.value
                            ? 'border-indigo-600 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${
                          newAnnotation.type === type.value ? 'text-indigo-600' : 'text-gray-600'
                        }`} />
                        <span className="text-xs text-gray-700">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  批注内容
                </label>
                <textarea
                  value={newAnnotation.content}
                  onChange={(e) => setNewAnnotation({ ...newAnnotation, content: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  placeholder="输入您的批注内容..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={newAnnotation.isPublic}
                  onChange={(e) => setNewAnnotation({ ...newAnnotation, isPublic: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-700">
                  公开显示
                </label>
              </div>

              <button
                onClick={saveAnnotation}
                disabled={loading || !newAnnotation.content.trim()}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    保存批注
                  </>
                )}
              </button>
            </div>

            {/* Existing Annotations */}
            {annotations.length > 0 && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-4">已有批注</h3>
                <div className="space-y-3">
                  {annotations.map((annotation) => {
                    const typeConfig = annotationTypes.find(t => t.value === annotation.annotation_type);
                    const colors = colorMap[annotation.color as keyof typeof colorMap] || colorMap.yellow;
                    const Icon = typeConfig?.icon || MessageSquare;

                    return (
                      <div
                        key={annotation.id}
                        className={`${colors.bg} rounded-lg p-4 border ${colors.border}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Icon className={`w-4 h-4 ${colors.text}`} />
                              <span className={`text-xs font-medium ${colors.text}`}>
                                {typeConfig?.label || annotation.annotation_type}
                              </span>
                              {annotation.is_public && (
                                <Eye className="w-3 h-3 text-gray-500" />
                              )}
                            </div>
                            <p className={`text-sm ${colors.text} whitespace-pre-wrap`}>
                              {annotation.content}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleVisibility(annotation.id, annotation.is_public)}
                              className="p-1.5 hover:bg-white/50 rounded transition-colors"
                              title={annotation.is_public ? '设为私有' : '设为公开'}
                            >
                              {annotation.is_public ? (
                                <Eye className="w-3.5 h-3.5 text-gray-600" />
                              ) : (
                                <EyeOff className="w-3.5 h-3.5 text-gray-600" />
                              )}
                            </button>
                            <button
                              onClick={() => deleteAnnotation(annotation.id)}
                              className="p-1.5 hover:bg-white/50 rounded transition-colors"
                              title="删除"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AnnotationEditor;
