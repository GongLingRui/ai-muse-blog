import { useState } from 'react';
import { api } from '@/lib/api';
import { AISummary } from '@/types';
import { Sparkles, Loader2, Copy, Check, ThumbsUp, ThumbsDown } from 'lucide-react';

interface AISummaryProps {
  contentType: 'paper' | 'article';
  contentId: string;
  title?: string;
}

const AISummary = ({ contentType, contentId, title }: AISummaryProps) => {
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [summaryType, setSummaryType] = useState<'short' | 'detailed' | 'bullet_points' | 'key_findings'>('short');
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<{ helpful?: boolean } | null>(null);

  const summaryTypes = [
    { value: 'short', label: '简短摘要', description: '2-3句话概述' },
    { value: 'detailed', label: '详细摘要', description: '完整的摘要内容' },
    { value: 'bullet_points', label: '要点列表', description: '以要点形式呈现' },
    { value: 'key_findings', label: '关键发现', description: '重点研究发现' },
  ] as const;

  const generateSummary = async () => {
    setLoading(true);
    setSummary(null);
    setFeedback(null);
    try {
      const response = await api.ai.generateSummary({
        content_type: contentType,
        content_id: contentId,
        summary_type: summaryType,
      }) as { success: boolean; data: AISummary };
      if (response.success) {
        setSummary(response.data);
      }
    } catch (error) {
      console.error('Failed to generate summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (summary?.content) {
      navigator.clipboard.writeText(summary.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const submitFeedback = async (helpful: boolean) => {
    if (!summary) return;

    setFeedback({ helpful });
    try {
      await api.ai.submitFeedback({
        content_type: contentType,
        content_id: contentId,
        summary_id: summary.id || '',
        helpful,
        feedback_type: helpful ? 'positive' : 'negative',
      });
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      // Revert UI state if API call fails
      setFeedback(null);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-white" />
            <h3 className="text-lg font-semibold text-white">AI 智能摘要</h3>
          </div>
          {summary && (
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  复制
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Summary Type Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            摘要类型
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {summaryTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setSummaryType(type.value)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  summaryType === type.value
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-sm">{type.label}</div>
                <div className="text-xs text-gray-500 mt-1">{type.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        {!summary && !loading && (
          <button
            onClick={generateSummary}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            生成 AI 摘要
          </button>
        )}

        {/* Loading State */}
        {loading && (
          <div className="py-8 text-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
            <p className="text-gray-600">AI 正在生成摘要...</p>
            <p className="text-sm text-gray-400 mt-1">这可能需要几秒钟</p>
          </div>
        )}

        {/* Summary Content */}
        {summary && !loading && (
          <div className="space-y-4">
            {/* Summary Type Badge */}
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                {summaryTypes.find(t => t.value === summary.summary_type)?.label}
              </span>
              <span className="text-xs text-gray-500">
                由 {summary.model_name} 生成
              </span>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-lg p-5 border border-gray-200">
              {summary.summary_type === 'bullet_points' ? (
                <ul className="space-y-3">
                  {summary.content.split('\n').map((point, index) => (
                    point.trim() && (
                      <li key={index} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-2 h-2 bg-indigo-600 rounded-full mt-2"></span>
                        <span className="text-gray-800">{point}</span>
                      </li>
                    )
                  ))}
                </ul>
              ) : (
                <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-line">
                  {summary.content}
                </div>
              )}
            </div>

            {/* Key Points */}
            {summary.key_points && summary.key_points.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">关键要点</h4>
                <ul className="space-y-2">
                  {summary.key_points.map((point, index) => (
                    <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Related Topics */}
            {summary.tags_suggested && summary.tags_suggested.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {summary.tags_suggested.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 cursor-pointer transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Feedback */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">这个摘要有用吗？</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => submitFeedback(true)}
                    className={`p-2 rounded-lg transition-colors ${
                      feedback?.helpful === true
                        ? 'bg-green-100 text-green-700'
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => submitFeedback(false)}
                    className={`p-2 rounded-lg transition-colors ${
                      feedback?.helpful === false
                        ? 'bg-red-100 text-red-700'
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button
                onClick={generateSummary}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                <Sparkles className="w-4 h-4" />
                重新生成
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AISummary;
