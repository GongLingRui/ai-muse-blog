import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { ReadingListItem, Paper, Article } from '@/types';
import { Bookmark, Clock, Trash2, CheckCircle, BookOpen } from 'lucide-react';

const ReadingListPage = () => {
  const [items, setItems] = useState<ReadingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'priority' | 'due_date'>('created_at');

  useEffect(() => {
    fetchReadingList();
  }, []);

  const fetchReadingList = async () => {
    try {
      const response = await api.readingList.list() as any;
      if (response.success) {
        setItems(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch reading list:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (itemId: string) => {
    try {
      await api.readingList.markAsRead(itemId);
      setItems(items.map(item =>
        item.id === itemId ? { ...item, is_read: true } : item
      ));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      await api.readingList.remove(itemId);
      setItems(items.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const clearReadItems = async () => {
    try {
      await api.readingList.clearRead();
      setItems(items.filter(item => !item.is_read));
    } catch (error) {
      console.error('Failed to clear read items:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500 bg-red-50 border-red-200';
      case 'high': return 'text-orange-500 bg-orange-50 border-orange-200';
      case 'normal': return 'text-blue-500 bg-blue-50 border-blue-200';
      case 'low': return 'text-gray-500 bg-gray-50 border-gray-200';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityLabel = (priority: string) => {
    const labels = { urgent: '紧急', high: '高', normal: '普通', low: '低' };
    return labels[priority as keyof typeof labels] || priority;
  };

  const filteredItems = items.filter(item => {
    if (filter === 'unread') return !item.is_read;
    if (filter === 'read') return item.is_read;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'created_at') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else if (sortBy === 'priority') {
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
      return priorityOrder[a.priority as keyof typeof priorityOrder] -
             priorityOrder[b.priority as keyof typeof priorityOrder];
    } else if (sortBy === 'due_date') {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    return 0;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Bookmark className="w-8 h-8 text-indigo-600" />
                阅读列表
              </h1>
              <p className="mt-2 text-gray-600">
                管理您待阅读的论文和文章
              </p>
            </div>
            {items.some(i => i.is_read) && (
              <button
                onClick={clearReadItems}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                清除已读
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-gray-900">{items.length}</div>
              <div className="text-sm text-gray-500">总计</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-indigo-600">{items.filter(i => !i.is_read).length}</div>
              <div className="text-sm text-gray-500">未读</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-green-600">{items.filter(i => i.is_read).length}</div>
              <div className="text-sm text-gray-500">已读</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">筛选:</span>
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filter === 'unread'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                未读
              </button>
              <button
                onClick={() => setFilter('read')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filter === 'read'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                已读
              </button>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-gray-600">排序:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="created_at">创建时间</option>
                <option value="priority">优先级</option>
                <option value="due_date">截止日期</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reading List Items */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">阅读列表为空</h3>
            <p className="text-gray-500">
              {filter === 'unread' ? '没有未读项目' : filter === 'read' ? '没有已读项目' : '开始添加论文和文章到您的阅读列表'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-lg shadow-sm p-5 transition-all hover:shadow-md ${
                  item.is_read ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {item.paper?.title || item.article?.title}
                      </h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getPriorityColor(item.priority)}`}>
                        {getPriorityLabel(item.priority)}
                      </span>
                      {item.is_read && (
                        <span className="flex items-center gap-1 text-sm text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          已读
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {item.paper?.summary || item.article?.excerpt}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {item.estimated_reading_time ? `${item.estimated_reading_time} 分钟` : '未知'}
                      </div>
                      {item.due_date && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          截止: {new Date(item.due_date).toLocaleDateString('zh-CN')}
                        </div>
                      )}
                      {item.notes && (
                        <div className="flex items-center gap-1">
                          <span className="italic">{item.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!item.is_read && (
                      <button
                        onClick={() => markAsRead(item.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="标记为已读"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadingListPage;
