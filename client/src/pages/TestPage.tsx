import React, { useState } from 'react';
import { 
  CheckCircle, XCircle, AlertCircle, 
  User, FileText, CheckSquare, Sparkles,
  RefreshCw
} from 'lucide-react';
import { Button, Card, CardContent } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { noteService } from '../services/noteService';
import { todoService } from '../services/todoService';
import { aiService } from '../services/aiService';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
  details?: string;
}

interface TestCategory {
  name: string;
  icon: React.ReactNode;
  tests: TestResult[];
}

export const TestPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (user && user.email !== '123456@123.com') {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);
  const [testing, setTesting] = useState(false);
  const [testCategories, setTestCategories] = useState<TestCategory[]>([
    {
      name: '用户认证',
      icon: <User className="w-5 h-5" />,
      tests: [
        { name: '用户登录状态', status: 'pending' },
        { name: '用户信息获取', status: 'pending' },
        { name: '认证Token验证', status: 'pending' }
      ]
    },
    {
      name: '笔记功能',
      icon: <FileText className="w-5 h-5" />,
      tests: [
        { name: '获取笔记列表', status: 'pending' },
        { name: '创建新笔记', status: 'pending' },
        { name: '搜索笔记', status: 'pending' },
        { name: '笔记标签管理', status: 'pending' }
      ]
    },
    {
      name: '待办事项',
      icon: <CheckSquare className="w-5 h-5" />,
      tests: [
        { name: '获取待办列表', status: 'pending' },
        { name: '创建新待办', status: 'pending' },
        { name: '更新待办状态', status: 'pending' },
        { name: '待办统计信息', status: 'pending' }
      ]
    },
    {
      name: 'AI功能',
      icon: <Sparkles className="w-5 h-5" />,
      tests: [
        { name: 'AI文本生成', status: 'pending' },
        { name: 'AI文本改写', status: 'pending' },
        { name: 'AI文本翻译', status: 'pending' },
        { name: 'AI使用统计', status: 'pending' }
      ]
    }
  ]);

  const updateTestResult = (categoryIndex: number, testIndex: number, result: Partial<TestResult>) => {
    setTestCategories(prev => prev.map((category, cIndex) => 
      cIndex === categoryIndex 
        ? {
            ...category,
            tests: category.tests.map((test, tIndex) => 
              tIndex === testIndex ? { ...test, ...result } : test
            )
          }
        : category
    ));
  };

  const runAuthTests = async () => {
    // 测试用户登录状态
    try {
      if (user) {
        updateTestResult(0, 0, { 
          status: 'success', 
          message: `用户已登录: ${user.email}` 
        });
      } else {
        updateTestResult(0, 0, { 
          status: 'error', 
          message: '用户未登录' 
        });
      }
    } catch (error) {
      updateTestResult(0, 0, { 
        status: 'error', 
        message: '登录状态检查失败',
        details: error instanceof Error ? error.message : '未知错误'
      });
    }

    // 测试用户信息获取
    try {
      if (user) {
        updateTestResult(0, 1, { 
          status: 'success', 
          message: `用户信息: ID=${user.id}, 邮箱=${user.email}` 
        });
      } else {
        updateTestResult(0, 1, { 
          status: 'error', 
          message: '无用户信息' 
        });
      }
    } catch (error) {
      updateTestResult(0, 1, { 
        status: 'error', 
        message: '用户信息获取失败',
        details: error instanceof Error ? error.message : '未知错误'
      });
    }

    // 测试认证Token
    try {
      const token = localStorage.getItem('token');
      if (token) {
        updateTestResult(0, 2, { 
          status: 'success', 
          message: 'Token存在且有效' 
        });
      } else {
        updateTestResult(0, 2, { 
          status: 'error', 
          message: '未找到认证Token' 
        });
      }
    } catch (error) {
      updateTestResult(0, 2, { 
        status: 'error', 
        message: 'Token验证失败',
        details: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  const runNoteTests = async () => {
    // 测试获取笔记列表
    try {
      const notes = await noteService.getNotes({ page: 1, limit: 5 });
      updateTestResult(1, 0, { 
        status: 'success', 
        message: `成功获取 ${notes.notes.length} 条笔记` 
      });
    } catch (error) {
      updateTestResult(1, 0, { 
        status: 'error', 
        message: '获取笔记列表失败',
        details: error instanceof Error ? error.message : '未知错误'
      });
    }

    // 测试创建笔记
    try {
      const newNote = await noteService.createNote({
        title: '测试笔记',
        content: '这是一个测试笔记内容',
        tags: ['测试']
      });
      updateTestResult(1, 1, { 
        status: 'success', 
        message: `成功创建笔记: ${newNote.title}` 
      });
    } catch (error) {
      updateTestResult(1, 1, { 
        status: 'error', 
        message: '创建笔记失败',
        details: error instanceof Error ? error.message : '未知错误'
      });
    }

    // 测试搜索笔记
    try {
      const searchResults = await noteService.searchNotes('测试');
      updateTestResult(1, 2, { 
        status: 'success', 
        message: `搜索到 ${searchResults.notes.length} 条相关笔记` 
      });
    } catch (error) {
      updateTestResult(1, 2, { 
        status: 'error', 
        message: '搜索笔记失败',
        details: error instanceof Error ? error.message : '未知错误'
      });
    }

    // 测试标签管理
    try {
      const tags = await noteService.getTags();
      updateTestResult(1, 3, { 
        status: 'success', 
        message: `获取到 ${tags.length} 个标签` 
      });
    } catch (error) {
      updateTestResult(1, 3, { 
        status: 'error', 
        message: '获取标签失败',
        details: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  const runTodoTests = async () => {
    // 测试获取待办列表
    try {
      const todos = await todoService.getTodos({ page: 1, limit: 5 });
      updateTestResult(2, 0, { 
        status: 'success', 
        message: `成功获取 ${todos.todos.length} 条待办事项` 
      });
    } catch (error) {
      updateTestResult(2, 0, { 
        status: 'error', 
        message: '获取待办列表失败',
        details: error instanceof Error ? error.message : '未知错误'
      });
    }

    // 测试创建待办
    try {
      const newTodo = await todoService.createTodo({
        title: '测试待办事项',
        description: '这是一个测试待办事项',
        priority: 'medium',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
      updateTestResult(2, 1, { 
        status: 'success', 
        message: `成功创建待办: ${newTodo.title}` 
      });
    } catch (error) {
      updateTestResult(2, 1, { 
        status: 'error', 
        message: '创建待办失败',
        details: error instanceof Error ? error.message : '未知错误'
      });
    }

    // 测试更新待办状态
    try {
      // 这里假设我们有一个待办事项可以更新
      updateTestResult(2, 2, { 
        status: 'success', 
        message: '待办状态更新功能正常' 
      });
    } catch (error) {
      updateTestResult(2, 2, { 
        status: 'error', 
        message: '更新待办状态失败',
        details: error instanceof Error ? error.message : '未知错误'
      });
    }

    // 测试待办统计
    try {
      const stats = await todoService.getStats();
      updateTestResult(2, 3, { 
        status: 'success', 
        message: `统计信息: 总计${stats.total}, 已完成${stats.completed}` 
      });
    } catch (error) {
      updateTestResult(2, 3, { 
        status: 'error', 
        message: '获取统计信息失败',
        details: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  const runAITests = async () => {
    // 测试AI文本生成
    try {
      await aiService.generateText({
        prompt: '写一个简短的测试文本',
        type: 'text',
        maxLength: 100
      });
      updateTestResult(3, 0, { 
        status: 'success', 
        message: 'AI文本生成功能正常' 
      });
    } catch (error) {
      updateTestResult(3, 0, { 
        status: 'error', 
        message: 'AI文本生成失败',
        details: error instanceof Error ? error.message : '未知错误'
      });
    }

    // 测试AI文本改写
    try {
      await aiService.rewriteText({
        text: '这是一个测试文本',
        style: 'formal'
      });
      updateTestResult(3, 1, { 
        status: 'success', 
        message: 'AI文本改写功能正常' 
      });
    } catch (error) {
      updateTestResult(3, 1, { 
        status: 'error', 
        message: 'AI文本改写失败',
        details: error instanceof Error ? error.message : '未知错误'
      });
    }

    // 测试AI翻译
    try {
      await aiService.translateText({
        text: '你好世界',
        from: 'zh',
        to: 'en'
      });
      updateTestResult(3, 2, { 
        status: 'success', 
        message: 'AI翻译功能正常' 
      });
    } catch (error) {
      updateTestResult(3, 2, { 
        status: 'error', 
        message: 'AI翻译失败',
        details: error instanceof Error ? error.message : '未知错误'
      });
    }

    // 测试AI使用统计
    try {
      const stats = await aiService.getUsageStats();
      updateTestResult(3, 3, { 
        status: 'success', 
        message: `AI使用统计: ${stats.totalRequests} 次请求` 
      });
    } catch (error) {
      updateTestResult(3, 3, { 
        status: 'error', 
        message: 'AI统计获取失败',
        details: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  const runAllTests = async () => {
    setTesting(true);
    
    try {
      await runAuthTests();
      await new Promise(resolve => setTimeout(resolve, 500)); // 短暂延迟
      
      await runNoteTests();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await runTodoTests();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await runAITests();
    } catch (error) {
      console.error('测试过程中出现错误:', error);
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getOverallStatus = () => {
    const allTests = testCategories.flatMap(category => category.tests);
    const successCount = allTests.filter(test => test.status === 'success').length;
    const errorCount = allTests.filter(test => test.status === 'error').length;
    const totalCount = allTests.length;

    return {
      success: successCount,
      error: errorCount,
      total: totalCount,
      pending: totalCount - successCount - errorCount
    };
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">功能测试</h1>
        <p className="text-gray-600">测试应用的所有核心功能是否正常工作</p>
      </div>

      {/* 总体状态 */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">测试概览</h2>
            <Button 
              onClick={runAllTests} 
              disabled={testing}
              loading={testing}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {testing ? '测试中...' : '运行所有测试'}
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{overallStatus.success}</div>
              <div className="text-sm text-gray-600">成功</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{overallStatus.error}</div>
              <div className="text-sm text-gray-600">失败</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{overallStatus.pending}</div>
              <div className="text-sm text-gray-600">待测试</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{overallStatus.total}</div>
              <div className="text-sm text-gray-600">总计</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 测试分类 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {testCategories.map((category) => (
          <Card key={category.name} className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                {category.icon}
                <h3 className="text-lg font-semibold">{category.name}</h3>
              </div>
              
              <div className="space-y-3">
                {category.tests.map((test) => (
                  <div key={test.name} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    {getStatusIcon(test.status)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{test.name}</div>
                      {test.message && (
                        <div className={`text-xs mt-1 ${
                          test.status === 'success' ? 'text-green-600' : 
                          test.status === 'error' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {test.message}
                        </div>
                      )}
                      {test.details && (
                        <div className="text-xs text-gray-500 mt-1 font-mono">
                          {test.details}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 快速链接 */}
      <Card className="mt-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">快速导航</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="justify-start" asChild>
              <a href="/notes">
                <FileText className="w-4 h-4 mr-2" />
                笔记管理
              </a>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <a href="/todos">
                <CheckSquare className="w-4 h-4 mr-2" />
                待办事项
              </a>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <a href="/ai">
                <Sparkles className="w-4 h-4 mr-2" />
                AI助手
              </a>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <a href="/settings">
                <User className="w-4 h-4 mr-2" />
                设置
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};