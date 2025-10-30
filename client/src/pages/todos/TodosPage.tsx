import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Search, Calendar, CheckCircle2, Circle,
  Clock, AlertCircle, Tag, Trash2, Edit,
  Download
} from 'lucide-react';
import { Button, Input, Card, CardContent, Loading } from '../../components/ui';
import { todoService, Todo, GetTodosParams } from '../../services/todoService';

export const TodosPage: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [selectedTodos, setSelectedTodos] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'createdAt' | 'dueDate' | 'priority'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [tags, setTags] = useState<string[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 仅在挂载时加载标签和统计，避免搜索时重复刷新
  useEffect(() => {
    loadTags();
    loadStats();
  }, []);

  // 列表加载依赖：搜索与筛选变化时刷新
  useEffect(() => {
    loadTodos();
  }, [debouncedQuery, filterStatus, filterPriority, selectedTags, sortBy, sortOrder, page]);

  // 搜索输入防抖，减少不必要的请求（合成输入期间不触发）
  useEffect(() => {
    if (isComposing) return; // 中文拼音合成中，跳过防抖更新
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, isComposing]);

  const loadTodos = () => {
    setLoading(true);

    // 取消前一个请求，避免并发响应乱序
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const { signal } = controller;

    const params: GetTodosParams = {
      page,
      limit: 20,
      sortBy,
      sortOrder,
    };

    // 根据搜索与筛选进行调用
    if (debouncedQuery) {
      todoService
        .searchTodos(debouncedQuery, params, signal)
        .then((response) => {
          setTodos(response.todos);
          setTotal(response.total);
        })
        .catch((error: any) => {
          if (String(error?.message || '').toLowerCase() === 'canceled') {
            // 被取消的请求不影响 loading，由后续最新请求处理
            return;
          }
          console.error('Failed to load todos:', error);
        })
        .finally(() => {
          // 确保只有当前最新请求结束后才关闭 loading
          if (abortControllerRef.current === controller) {
            setLoading(false);
          }
        });
    } else {
      if (filterStatus !== 'all') {
        params.completed = filterStatus === 'completed';
      }
      if (filterPriority !== 'all') {
        params.priority = filterPriority;
      }
      if (selectedTags.length > 0) {
        params.tags = selectedTags;
      }

      todoService
        .getTodos(params, signal)
        .then((response) => {
          setTodos(response.todos);
          setTotal(response.total);
        })
        .catch((error: any) => {
          if (String(error?.message || '').toLowerCase() === 'canceled') {
            return;
          }
          console.error('Failed to load todos:', error);
        })
        .finally(() => {
          if (abortControllerRef.current === controller) {
            setLoading(false);
          }
        });
    }
  };

  const loadTags = async () => {
    try {
      const tagsData = await todoService.getTags();
      setTags(tagsData);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await todoService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleToggleComplete = async (todoId: string) => {
    try {
      await todoService.toggleComplete(todoId);
      loadTodos();
      loadStats();
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    if (!window.confirm('确定要删除这个待办事项吗？')) return;

    try {
      await todoService.deleteTodo(todoId);
      loadTodos();
      loadStats();
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const handleBatchAction = async (action: 'complete' | 'delete') => {
    if (selectedTodos.length === 0) return;

    if (action === 'delete' && !window.confirm(`确定要删除 ${selectedTodos.length} 个待办事项吗？`)) {
      return;
    }

    try {
      if (action === 'complete') {
        await todoService.batchUpdate(selectedTodos, { completed: true });
      } else {
        await todoService.batchDelete(selectedTodos);
      }
      setSelectedTodos([]);
      loadTodos();
      loadStats();
    } catch (error) {
      console.error('Failed to perform batch action:', error);
    }
  };

  const handleSelectTodo = (todoId: string) => {
    setSelectedTodos(prev => 
      prev.includes(todoId) 
        ? prev.filter(id => id !== todoId)
        : [...prev, todoId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTodos.length === todos.length) {
      setSelectedTodos([]);
    } else {
      setSelectedTodos(todos.map(todo => todo.id));
    }
  };

  const handleTagFilter = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
    setPage(1);
  };

  const handleExport = async () => {
    try {
      const blob = await todoService.exportTodos('json');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `todos-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export todos:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '无';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isOverdue = date < now;
    
    return {
      text: date.toLocaleString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      isOverdue
    };
  };

  if (loading && todos.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading text="加载待办事项中..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">总计</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">已完成</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">待完成</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                </div>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">已逾期</p>
                  <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 页面标题和操作 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">待办事项</h1>
          <p className="text-gray-600 mt-1">
            共 {total} 个待办事项
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            导出
          </Button>
          <Button as={Link} to="/todos/new">
            <Plus className="w-4 h-4 mr-2" />
            新建待办
          </Button>
        </div>
      </div>

      {/* 搜索和过滤 */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* 搜索框 */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="搜索待办事项..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={(e) => {
                setIsComposing(false);
                // 结束合成时同步最新值，随后由防抖触发加载
                setSearchQuery(e.currentTarget.value);
              }}
              spellCheck={false}
              className="pl-10"
            />
          </div>
        </div>

        {/* 过滤器 */}
        <div className="flex gap-2 flex-wrap">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">全部状态</option>
            <option value="pending">待完成</option>
            <option value="completed">已完成</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">全部优先级</option>
            <option value="high">高优先级</option>
            <option value="medium">中优先级</option>
            <option value="low">低优先级</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="createdAt">创建时间</option>
            <option value="dueDate">截止时间</option>
            <option value="priority">优先级</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </div>
      </div>

      {/* 标签过滤 */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600 flex items-center">
            <Tag className="w-4 h-4 mr-1" />
            标签:
          </span>
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => handleTagFilter(tag)}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* 批量操作 */}
      {selectedTodos.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
          <span className="text-sm text-blue-700">
            已选择 {selectedTodos.length} 个待办事项
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBatchAction('complete')}
            >
              标记完成
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBatchAction('delete')}
              className="text-red-600 hover:text-red-700"
            >
              批量删除
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTodos([])}
            >
              取消选择
            </Button>
          </div>
        </div>
      )}

      {/* 待办事项列表 */}
      {todos.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <CheckCircle2 className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? '未找到相关待办事项' : '还没有待办事项'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery ? '尝试使用其他关键词搜索' : '创建您的第一个待办事项'}
          </p>
          <Button as={Link} to="/todos/new">
            <Plus className="w-4 h-4 mr-2" />
            新建待办
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* 全选 */}
          <div className="flex items-center gap-3 p-3 border-b">
            <input
              type="checkbox"
              checked={selectedTodos.length === todos.length}
              onChange={handleSelectAll}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-600">全选</span>
          </div>

          {todos.map(todo => {
            const dueDate = todo.dueDate ? formatDate(todo.dueDate) : null;
            
            return (
              <Card key={todo.id} className={`hover:shadow-md transition-shadow ${
                todo.completed ? 'opacity-75' : ''
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* 选择框 */}
                    <input
                      type="checkbox"
                      checked={selectedTodos.includes(todo.id)}
                      onChange={() => handleSelectTodo(todo.id)}
                      className="w-4 h-4 text-blue-600 rounded mt-1"
                    />

                    {/* 完成状态 */}
                    <button
                      onClick={() => handleToggleComplete(todo.id)}
                      className="mt-1"
                    >
                      {todo.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>

                    {/* 内容 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <Link
                          to={`/todos/${todo.id}`}
                          className="flex-1 hover:text-blue-600 transition-colors"
                        >
                          <h3 className={`font-medium ${
                            todo.completed ? 'line-through text-gray-500' : 'text-gray-900'
                          }`}>
                            {todo.title}
                          </h3>
                        </Link>

                        {/* 操作按钮 */}
                        <div className="flex gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            as={Link}
                            to={`/todos/${todo.id}/edit`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTodo(todo.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {todo.description && (
                        <p className={`text-sm mt-1 ${
                          todo.completed ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {todo.description}
                        </p>
                      )}

                      {/* 标签和元信息 */}
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        {/* 优先级 */}
                        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(todo.priority)}`}>
                          {getPriorityText(todo.priority)}优先级
                        </span>

                        {/* 截止时间 */}
                        {dueDate && (
                          <span className={`flex items-center gap-1 ${
                            dueDate.isOverdue ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            <Calendar className="w-3 h-3" />
                            {dueDate.text}
                            {dueDate.isOverdue && <span className="text-xs">(已逾期)</span>}
                          </span>
                        )}

                        {/* 标签 */}
                        {todo.tags.length > 0 && (
                          <div className="flex gap-1">
                            {todo.tags.slice(0, 2).map(tag => (
                              <span
                                key={tag}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                            {todo.tags.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{todo.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 分页 */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            上一页
          </Button>
          <span className="px-3 py-2 text-sm text-gray-600">
            第 {page} 页，共 {Math.ceil(total / 20)} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= Math.ceil(total / 20)}
            onClick={() => setPage(page + 1)}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
};