import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { CitationFormat, CitationExportResponse } from '@/types';
import { X, Download, FileText, Copy, Check } from 'lucide-react';

interface CitationExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  paperIds: string[];
  paperTitles?: string[];
}

const CitationExportDialog = ({ isOpen, onClose, paperIds, paperTitles }: CitationExportDialogProps) => {
  const [formats, setFormats] = useState<CitationFormat[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<string>('bibtex');
  const [exportResult, setExportResult] = useState<CitationExportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | -1>(-1);

  useEffect(() => {
    if (isOpen) {
      fetchFormats();
    }
  }, [isOpen]);

  const fetchFormats = async () => {
    try {
      const response = await api.citationExport.getFormats() as any;
      if (response.success) {
        setFormats(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch formats:', error);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    setExportResult(null);
    try {
      const response = await api.citationExport.export({
        paper_ids: paperIds,
        format: selectedFormat,
      }) as any;
      if (response.success) {
        setExportResult(response.data);
      }
    } catch (error) {
      console.error('Failed to export citations:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyCitation = (citation: string, index: number) => {
    navigator.clipboard.writeText(citation);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(-1), 2000);
  };

  const downloadAll = () => {
    if (!exportResult) return;

    const format = formats.find(f => f.id === selectedFormat);
    const extension = format?.extension || '.txt';
    const filename = `citations${extension}`;
    const content = exportResult.citations.join('\n\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-indigo-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">导出引用</h2>
              <p className="text-sm text-gray-500">{paperIds.length} 篇论文</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Format Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              选择引用格式
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {formats.map((format) => (
                <button
                  key={format.id}
                  onClick={() => setSelectedFormat(format.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedFormat === format.id
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{format.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{format.description}</div>
                  <div className="text-xs text-gray-400 mt-1">.{format.extension}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Export Button */}
          {!exportResult && !loading && (
            <button
              onClick={handleExport}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              生成引用
            </button>
          )}

          {/* Loading State */}
          {loading && (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
              <p className="text-gray-600">正在生成引用...</p>
            </div>
          )}

          {/* Export Results */}
          {exportResult && !loading && (
            <div className="space-y-4">
              {/* Actions */}
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                <div>
                  <div className="font-medium text-gray-900">已生成 {exportResult.count} 条引用</div>
                  <div className="text-sm text-gray-500">格式: {selectedFormat.toUpperCase()}</div>
                </div>
                <button
                  onClick={downloadAll}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  下载全部
                </button>
              </div>

              {/* Citations List */}
              <div className="space-y-3">
                {exportResult.citations.map((citation, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        {paperTitles && paperTitles[index] && (
                          <div className="text-xs text-gray-500 mb-2">
                            {paperTitles[index]}
                          </div>
                        )}
                        <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono bg-white p-3 rounded border border-gray-200">
                          {citation}
                        </pre>
                      </div>
                      <button
                        onClick={() => copyCitation(citation, index)}
                        className="flex-shrink-0 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        title="复制引用"
                      >
                        {copiedIndex === index ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Regenerate */}
              <button
                onClick={handleExport}
                className="w-full py-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
              >
                重新生成
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitationExportDialog;
