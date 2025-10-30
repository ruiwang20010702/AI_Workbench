import React, { useState, useEffect } from 'react';
import {
  Calendar,
  FileText,
  Download,
  Sparkles,
  Send,
  History,
  Settings,
  Plus,
  Loader2,
  Edit2,
  Trash2,
  Save,
  X,
} from 'lucide-react';
import reportService, {
  WeeklyReport,
  ReportTemplate,
  GenerateReportRequest,
} from '../../services/reportService';
import toast from 'react-hot-toast';

/**
 * 周报生成页面
 */
export const WeeklyReportPage: React.FC = () => {
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [recentReports, setRecentReports] = useState<WeeklyReport[]>([]);
  const [currentReport, setCurrentReport] = useState<WeeklyReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // 表单状态
  const [weekRange, setWeekRange] = useState(() => reportService.getCurrentWeekRange());
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [reportTitle, setReportTitle] = useState('');
  const [autoOptimize, setAutoOptimize] = useState(false);

  // 视图状态
  const [activeTab, setActiveTab] = useState<'generate' | 'preview' | 'history'>('generate');

  // 编辑模式状态
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');

  // 加载初始数据
  useEffect(() => {
    loadTemplates();
    loadRecentReports();
  }, []);

  /**
   * 加载模板列表
   */
  const loadTemplates = async () => {
    try {
      const { data } = await reportService.getTemplates({ limit: 50 });
      setTemplates(data);

      // 自动选择默认模板
      const defaultTemplate = data.find((t) => t.is_default);
      if (defaultTemplate) {
        setSelectedTemplate(defaultTemplate.id);
      }
    } catch (error) {
      console.error('加载模板失败:', error);
      toast.error('加载模板失败');
    }
  };

  /**
   * 加载最近的周报
   */
  const loadRecentReports = async () => {
    try {
      const { data } = await reportService.getReports({ limit: 5 });
      setRecentReports(data);
    } catch (error) {
      console.error('加载周报失败:', error);
    }
  };

  /**
   * 生成周报
   */
  const handleGenerate = async () => {
    if (!weekRange.start || !weekRange.end) {
      toast.error('请选择周报时间范围');
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading('正在生成周报...');

    try {
      const request: GenerateReportRequest = {
        week_start_date: weekRange.start,
        week_end_date: weekRange.end,
        template_id: selectedTemplate || undefined,
        title: reportTitle || undefined,
        auto_optimize: autoOptimize,
      };

      const report = await reportService.generateReport(request);
      setCurrentReport(report);
      setActiveTab('preview');

      toast.success('周报生成成功！', { id: toastId });
      loadRecentReports(); // 刷新列表
    } catch (error: any) {
      console.error('生成周报失败:', error);
      const message = error.response?.data?.message || '生成周报失败';
      toast.error(message, { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * 下载周报
   */
  const handleDownload = async (format: 'docx' | 'markdown' | 'html') => {
    if (!currentReport) return;

    const toastId = toast.loading('正在准备下载...');
    try {
      await reportService.downloadReport(currentReport.id, format);
      toast.success('下载成功！', { id: toastId });
    } catch (error) {
      console.error('下载失败:', error);
      toast.error('下载失败', { id: toastId });
    }
  };

  /**
   * AI优化周报
   */
  const handleOptimize = async () => {
    if (!currentReport) return;

    const toastId = toast.loading('AI正在优化周报...');
    try {
      const optimized = await reportService.optimizeReport(currentReport.id);
      setCurrentReport(optimized);
      toast.success('优化完成！', { id: toastId });
    } catch (error) {
      console.error('优化失败:', error);
      toast.error('优化失败', { id: toastId });
    }
  };

  /**
   * 发布周报
   */
  const handlePublish = async () => {
    if (!currentReport) return;

    try {
      const published = await reportService.publishReport(currentReport.id);
      setCurrentReport(published);
      toast.success('周报已发布！');
      loadRecentReports();
    } catch (error) {
      console.error('发布失败:', error);
      toast.error('发布失败');
    }
  };

  /**
   * 查看历史周报
   */
  const handleViewReport = async (id: string) => {
    setLoading(true);
    try {
      const report = await reportService.getReport(id);
      setCurrentReport(report);
      setIsEditMode(false); // 重置编辑模式
      setActiveTab('preview');
    } catch (error) {
      console.error('加载周报失败:', error);
      toast.error('加载周报失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 开始编辑周报
   */
  const handleStartEdit = () => {
    if (!currentReport) return;
    setEditedTitle(currentReport.title);
    setEditedContent(currentReport.content);
    setIsEditMode(true);
  };

  /**
   * 取消编辑
   */
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedTitle('');
    setEditedContent('');
  };

  /**
   * 保存编辑
   */
  const handleSaveEdit = async () => {
    if (!currentReport) return;

    const toastId = toast.loading('正在保存...');
    try {
      const updated = await reportService.updateReport(currentReport.id, {
        title: editedTitle,
        content: editedContent,
      });
      setCurrentReport(updated);
      setIsEditMode(false);
      toast.success('保存成功！', { id: toastId });
      loadRecentReports(); // 刷新列表
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('保存失败', { id: toastId });
    }
  };

  /**
   * 删除周报
   */
  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除这份周报吗？此操作无法撤销。')) {
      return;
    }

    const toastId = toast.loading('正在删除...');
    try {
      await reportService.deleteReport(id);
      toast.success('删除成功！', { id: toastId });
      
      // 如果删除的是当前预览的周报，清空预览
      if (currentReport?.id === id) {
        setCurrentReport(null);
        setActiveTab('generate');
      }
      
      loadRecentReports(); // 刷新列表
    } catch (error) {
      console.error('删除失败:', error);
      toast.error('删除失败', { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">周报管理</h1>
          <p className="text-gray-600">自动生成周报，AI智能优化，一键导出</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'generate'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>生成周报</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'preview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            disabled={!currentReport}
          >
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>预览</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4" />
              <span>历史记录</span>
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'generate' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold mb-6">生成新周报</h2>

                {/* Week Range Selector */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    周报时间范围
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">开始日期</label>
                      <input
                        type="date"
                        value={weekRange.start}
                        onChange={(e) => setWeekRange({ ...weekRange, start: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">结束日期</label>
                      <input
                        type="date"
                        value={weekRange.end}
                        onChange={(e) => setWeekRange({ ...weekRange, end: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex space-x-2">
                    <button
                      onClick={() => setWeekRange(reportService.getCurrentWeekRange())}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      本周
                    </button>
                    <button
                      onClick={() => setWeekRange(reportService.getLastWeekRange())}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      上周
                    </button>
                  </div>
                </div>

                {/* Template Selector */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择模板
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">使用默认模板</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                        {template.is_default && ' (默认)'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    周报标题（可选）
                  </label>
                  <input
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="留空则自动生成标题"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Options */}
                <div className="mb-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoOptimize}
                      onChange={(e) => setAutoOptimize(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      使用AI自动优化周报内容
                    </span>
                  </label>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>生成中...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>生成周报</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {activeTab === 'preview' && loading && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
                  <span className="text-gray-600">加载周报中...</span>
                </div>
              </div>
            )}

            {activeTab === 'preview' && !loading && currentReport && (
              <div className="bg-white rounded-lg border border-gray-200">
                {/* Preview Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="text-2xl font-bold border border-gray-300 rounded px-3 py-2 flex-1 mr-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="周报标题"
                      />
                    ) : (
                      <h2 className="text-2xl font-bold">{currentReport.title}</h2>
                    )}
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        currentReport.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : currentReport.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {currentReport.status === 'draft'
                        ? '草稿'
                        : currentReport.status === 'published'
                        ? '已发布'
                        : '已归档'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>{reportService.formatWeekRange(currentReport.week_start_date, currentReport.week_end_date)}</span>
                    {currentReport.ai_optimized && (
                      <span className="flex items-center text-blue-600">
                        <Sparkles className="w-4 h-4 mr-1" />
                        AI优化
                      </span>
                    )}
                  </div>
                </div>

                {/* Preview Content */}
                {isEditMode ? (
                  <div className="p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      周报内容（Markdown格式）
                    </label>
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="w-full h-96 border border-gray-300 rounded-lg px-4 py-3 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="编辑周报内容..."
                    />
                  </div>
                ) : (
                  <div
                    className="p-6 prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: currentReport.content_html || '' }}
                  />
                )}

                {/* Actions */}
                <div className="p-6 border-t border-gray-200 flex flex-wrap gap-3">
                  {isEditMode ? (
                    <>
                      <button
                        onClick={handleSaveEdit}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Save className="w-4 h-4" />
                        <span>保存</span>
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        <X className="w-4 h-4" />
                        <span>取消</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleStartEdit}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>编辑</span>
                      </button>
                      <button
                        onClick={() => handleDelete(currentReport.id)}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>删除</span>
                      </button>
                      {currentReport.status === 'draft' && (
                        <button
                          onClick={handlePublish}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          <Send className="w-4 h-4" />
                          <span>发布</span>
                        </button>
                      )}
                      {!currentReport.ai_optimized && (
                        <button
                          onClick={handleOptimize}
                          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>AI优化</span>
                        </button>
                      )}
                      <div className="relative group">
                        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                          <Download className="w-4 h-4" />
                          <span>下载</span>
                        </button>
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-white border border-gray-200 rounded-lg shadow-lg p-2 w-40 z-10">
                          <button
                            onClick={() => handleDownload('docx')}
                            className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                          >
                            Word (docx)
                          </button>
                          <button
                            onClick={() => handleDownload('markdown')}
                            className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                          >
                            Markdown (md)
                          </button>
                          <button
                            onClick={() => handleDownload('html')}
                            className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                          >
                            HTML
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold mb-6">历史周报</h2>
                {recentReports.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>还没有周报记录</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentReports.map((report) => (
                      <div
                        key={report.id}
                        className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 transition-colors group"
                      >
                        <div className="flex items-start justify-between">
                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() => handleViewReport(report.id)}
                          >
                            <h3 className="font-medium text-gray-900">{report.title}</h3>
                            <div className="flex items-center space-x-3 mt-2 text-sm text-gray-600">
                              <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {reportService.formatWeekRange(report.week_start_date, report.week_end_date)}
                              </span>
                              {report.ai_optimized && (
                                <span className="flex items-center text-blue-600">
                                  <Sparkles className="w-4 h-4 mr-1" />
                                  AI优化
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                report.status === 'published'
                                  ? 'bg-green-100 text-green-800'
                                  : report.status === 'draft'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {report.status === 'draft' ? '草稿' : report.status === 'published' ? '已发布' : '已归档'}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(report.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="删除周报"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
              <h3 className="text-lg font-semibold mb-4">快捷操作</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setActiveTab('generate')}
                  className="w-full flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>新建周报</span>
                </button>
                <button className="w-full flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  <Settings className="w-4 h-4" />
                  <span>模板管理</span>
                </button>
              </div>

              {/* Recent Reports Summary */}
              {recentReports.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">最近周报</h4>
                  <div className="space-y-2">
                    {recentReports.slice(0, 3).map((report) => (
                      <button
                        key={report.id}
                        onClick={() => handleViewReport(report.id)}
                        className="w-full text-left p-2 rounded hover:bg-gray-100 transition-colors text-sm"
                      >
                        <div className="font-medium text-gray-900 truncate">{report.title}</div>
                        <div className="text-xs text-gray-500">
                          {reportService.formatWeekRange(report.week_start_date, report.week_end_date)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

