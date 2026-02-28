import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Share2, Check, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
}

/**
 * SocialShare Component
 *
 * Provides social media sharing buttons for Chinese and international platforms.
 *
 * @example
 * <SocialShare
 *   url="https://example.com/article/123"
 *   title="Amazing Article"
 *   description="Check out this amazing article"
 * />
 */
export const SocialShare: React.FC<SocialShareProps> = ({
  url,
  title,
  description = "",
  imageUrl = "",
}) => {
  const [copied, setCopied] = useState(false);

  // Share URLs for different platforms
  const shareUrls = {
    // Chinese platforms
    weibo: `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&pic=${encodeURIComponent(imageUrl)}`,
    wechat: "", // WeChat requires QR code
    qq: `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(description)}`,
    douban: `https://www.douban.com/share/service?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&text=${encodeURIComponent(description)}`,

    // International platforms
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(description)}`,
    reddit: `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(description + "\n\n" + url)}`,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("链接已复制到剪贴板");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("复制失败，请手动复制");
    }
  };

  const handleShare = (platform: string, shareUrl: string) => {
    if (platform === "wechat") {
      // WeChat requires QR code - show a modal in production
      toast.info("请使用微信扫一扫分享");
      return;
    }

    window.open(shareUrl, "_blank", "width=600,height=400");
  };

  const platforms = [
    { id: "weibo", name: "微博", icon: "🔄", color: "hover:bg-red-50 dark:hover:bg-red-900/20" },
    { id: "qq", name: "QQ", icon: "🐧", color: "hover:bg-blue-50 dark:hover:bg-blue-900/20" },
    { id: "wechat", name: "微信", icon: "💬", color: "hover:bg-green-50 dark:hover:bg-green-900/20" },
    { id: "douban", name: "豆瓣", icon: "📕", color: "hover:bg-green-50 dark:hover:bg-green-900/20" },
    { id: "twitter", name: "Twitter", icon: "🐦", color: "hover:bg-sky-50 dark:hover:bg-sky-900/20" },
    { id: "facebook", name: "Facebook", icon: "👤", color: "hover:bg-blue-50 dark:hover:bg-blue-900/20" },
    { id: "linkedin", name: "LinkedIn", icon: "💼", color: "hover:bg-blue-50 dark:hover:bg-blue-900/20" },
    { id: "reddit", name: "Reddit", icon: "🔴", color: "hover:bg-orange-50 dark:hover:bg-orange-900/20" },
    { id: "email", name: "邮件", icon: "📧", color: "hover:bg-gray-50 dark:hover:bg-gray-800" },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          分享
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto" align="end">
        <div className="space-y-3">
          <div className="text-sm font-medium text-muted-foreground">
            分享到
          </div>

          <div className="grid grid-cols-3 gap-2">
            {platforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => handleShare(platform.id, shareUrls[platform.id as keyof typeof shareUrls])}
                className={`
                  flex flex-col items-center gap-1 p-3 rounded-lg transition-colors
                  ${platform.color}
                  hover:bg-accent
                `}
                title={platform.name}
              >
                <span className="text-xl">{platform.icon}</span>
                <span className="text-xs">{platform.name}</span>
              </button>
            ))}
          </div>

          <div className="border-t pt-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={handleCopyLink}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  已复制
                </>
              ) : (
                <>
                  <LinkIcon className="h-4 w-4" />
                  复制链接
                </>
              )}
            </Button>
          </div>

          {navigator.share && (
            <div className="border-t pt-3">
              <Button
                variant="default"
                size="sm"
                className="w-full"
                onClick={async () => {
                  try {
                    await navigator.share({
                      title,
                      text: description,
                      url,
                    });
                  } catch (err) {
                    console.log("Share canceled");
                  }
                }}
              >
                <Share2 className="h-4 w-4 mr-2" />
                使用系统分享
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};


/**
 * Simple Share Button Component
 * A simplified version with just a button that opens native share or copy link
 */
interface SimpleShareButtonProps {
  url: string;
  title: string;
  description?: string;
}

export const SimpleShareButton: React.FC<SimpleShareButtonProps> = ({
  url,
  title,
  description = "",
}) => {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
      } catch (err) {
        console.log("Share canceled");
      }
    } else {
      // Fallback to copy link
      try {
        await navigator.clipboard.writeText(url);
        toast.success("链接已复制到剪贴板");
      } catch (err) {
        toast.error("复制失败，请手动复制");
      }
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleShare}>
      <Share2 className="h-4 w-4 mr-2" />
      分享
    </Button>
  );
};