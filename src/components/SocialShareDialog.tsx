import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { ShareTemplate } from '@/types';
import { X, Share2, Twitter, Linkedin, Link as LinkIcon, Mail } from 'lucide-react';

interface SocialShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: 'paper' | 'article';
  contentId: string;
  title: string;
  url?: string;
}

const platformIcons = {
  twitter: Twitter,
  linkedin: Linkedin,
  email: Mail,
  copy: LinkIcon,
};

const platformColors = {
  twitter: 'bg-[#1DA1F2] hover:bg-[#1a8cd8]',
  linkedin: 'bg-[#0077B5] hover:bg-[#006397]',
  email: 'bg-gray-600 hover:bg-gray-700',
  copy: 'bg-indigo-600 hover:bg-indigo-700',
};

const SocialShareDialog = ({
  isOpen,
  onClose,
  contentType,
  contentId,
  title,
  url = window.location.href,
}: SocialShareDialogProps) => {
  const [templates, setTemplates] = useState<ShareTemplate[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('twitter');
  const [customMessage, setCustomMessage] = useState('');
  const [shareContent, setShareContent] = useState<{
    title: string;
    description: string;
    url: string;
    hashtags: string[];
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      generatePreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedPlatform]);

  const fetchTemplates = async () => {
    try {
      const response = await api.socialShare.getTemplates() as { success: boolean; data: ShareTemplate[] };
      if (response.success) {
        setTemplates(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const generatePreview = async () => {
    try {
      const response = await api.socialShare.generatePreview({
        content_type: contentType,
        content_id: contentId,
        platform: selectedPlatform,
      }) as { success: boolean; data: { title: string; description: string; url: string; hashtags: string[] } };
      if (response.success) {
        setShareContent(response.data);
        if (!customMessage) {
          setCustomMessage(response.data.description || '');
        }
      }
    } catch (error) {
      console.error('Failed to generate preview:', error);
      // Set default content
      setShareContent({
        title,
        description: `查看这篇精彩内容: ${title}`,
        url,
        hashtags: ['#AI', '#Research'],
      });
      setCustomMessage(`查看这篇精彩内容: ${title}`);
    }
  };

  const handleShare = async () => {
    const finalUrl = shareContent?.url || url;
    const finalMessage = customMessage || shareContent?.description || '';
    const hashtags = shareContent?.hashtags || [];
    const fullMessage = `${finalMessage}\n\n${hashtags.join(' ')}`;

    switch (selectedPlatform) {
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullMessage)}&url=${encodeURIComponent(finalUrl)}`,
          '_blank',
          'width=600,height=400'
        );
        break;
      case 'linkedin':
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(finalUrl)}`,
          '_blank',
          'width=600,height=400'
        );
        break;
      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(fullMessage + '\n\n' + finalUrl)}`;
        break;
      case 'copy':
        await navigator.clipboard.writeText(finalMessage + '\n\n' + finalUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        break;
    }
  };

  const selectTemplate = (template: ShareTemplate) => {
    const message = template.template
      .replace('{title}', title)
      .replace('{topic}', contentType === 'paper' ? '论文' : '文章')
      .replace('{url}', url);
    setCustomMessage(message);
  };

  if (!isOpen) return null;

  const PlatformIcon = platformIcons[selectedPlatform as keyof typeof platformIcons] || Share2;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Share2 className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">分享内容</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Platform Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              选择平台
            </label>
            <div className="grid grid-cols-4 gap-3">
              {[
                { id: 'twitter', name: 'Twitter' },
                { id: 'linkedin', name: 'LinkedIn' },
                { id: 'email', name: '邮件' },
                { id: 'copy', name: '复制链接' },
              ].map((platform) => {
                const Icon = platformIcons[platform.id as keyof typeof platformIcons];
                return (
                  <button
                    key={platform.id}
                    onClick={() => setSelectedPlatform(platform.id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      selectedPlatform === platform.id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${
                      selectedPlatform === platform.id
                        ? 'text-indigo-600'
                        : 'text-gray-600'
                    }`} />
                    <span className="text-xs text-gray-700">{platform.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Templates */}
          {templates.length > 0 && selectedPlatform !== 'copy' && selectedPlatform !== 'email' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                选择模板
              </label>
              <div className="space-y-2">
                {templates
                  .filter(t => t.platform === selectedPlatform)
                  .map((template) => (
                    <button
                      key={template.id}
                      onClick={() => selectTemplate(template)}
                      className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{template.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Custom Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              自定义消息
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="输入自定义分享消息..."
            />
            {shareContent?.hashtags && (
              <div className="mt-2 flex flex-wrap gap-2">
                {shareContent.hashtags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          {shareContent && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="text-xs text-gray-500 mb-2">预览</div>
              <div className="text-sm text-gray-800 whitespace-pre-wrap">
                {customMessage || shareContent.description}
              </div>
              <div className="text-xs text-indigo-600 mt-2 truncate">
                {shareContent.url}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            >
              取消
            </button>
            <button
              onClick={handleShare}
              className={`flex-1 py-3 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2 ${
                copied ? 'bg-green-600' : platformColors[selectedPlatform as keyof typeof platformColors]
              }`}
            >
              {copied ? (
                <>
                  <LinkIcon className="w-4 h-4" />
                  已复制
                </>
              ) : (
                <>
                  <PlatformIcon className="w-4 h-4" />
                  分享
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialShareDialog;
