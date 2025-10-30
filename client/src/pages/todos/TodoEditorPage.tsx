import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Calendar, Tag, Trash2, AlertCircle } from 'lucide-react';
import { Button, Input, Card, CardContent, Loading } from '../../components/ui';
import { todoService, Todo, CreateTodoRequest, UpdateTodoRequest } from '../../services/todoService';

export const TodoEditorPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditing = !!id && id !== 'new';

  const [todo, setTodo] = useState<Todo | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditing && id) {
      loadTodo(id);
    }
  }, [id, isEditing]);

  const loadTodo = async (todoId: string) => {
    try {
      setLoading(true);
      const todoData = await todoService.getTodo(todoId);
      setTodo(todoData);
      setTitle(todoData.title);
      setDescription(todoData.description || '');
      setPriority(todoData.priority);
      setDueDate(todoData.dueDate ? todoData.dueDate.slice(0, 16) : '');
      setTags(todoData.tags);
    } catch (error) {
      console.error('Failed to load todo:', error);
      navigate('/todos');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = '标题不能为空';
    }

    if (dueDate) {
      const selectedDate = new Date(dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.dueDate = '截止日期不能早于今天';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      if (isEditing && todo) {
        const updateData: UpdateTodoRequest = {
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          dueDate: dueDate || undefined,
          tags
        };

        const updatedTodo = await todoService.updateTodo(todo.id, updateData);
        setTodo(updatedTodo);
      } else {
        const createData: CreateTodoRequest = {
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          dueDate: dueDate || undefined,
          tags
        };

        const newTodo = await todoService.createTodo(createData);
        navigate(`/todos/${newTodo.id}`);
      }
    } catch (error) {
      console.error('Failed to save todo:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!todo || !window.confirm('确定要删除这个待办事项吗？此操作无法撤销。')) return;

    try {
      await todoService.deleteTodo(todo.id);
      navigate('/todos');
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
  };

  const getPriorityColor = (priorityValue: string) => {
    switch (priorityValue) {
      case 'high': return 'border-red-300 bg-red-50';
      case 'medium': return 'border-yellow-300 bg-yellow-50';
      case 'low': return 'border-green-300 bg-green-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getPriorityText = (priorityValue: string) => {
    switch (priorityValue) {
      case 'high': return '高优先级';
      case 'medium': return '中优先级';
      case 'low': return '低优先级';
      default: return '无优先级';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading text="加载待办事项中..." />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/todos')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
          
          <h1 className="text-xl font-semibold">
            {isEditing ? '编辑待办事项' : '新建待办事项'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {isEditing && todo && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}

          <Button
            onClick={handleSave}
            disabled={saving}
            loading={saving}
          >
            <Save className="w-4 h-4 mr-2" />
            保存
          </Button>
        </div>
      </div>

      {/* 编辑表单 */}
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* 标题 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              标题 <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="输入待办事项标题..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyPress={handleKeyPress}
              className={errors.title ? 'border-red-300' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.title}
              </p>
            )}
          </div>

          {/* 描述 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              描述
            </label>
            <textarea
              placeholder="输入详细描述（可选）..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 优先级 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              优先级
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['low', 'medium', 'high'] as const).map(priorityValue => (
                <button
                  key={priorityValue}
                  onClick={() => setPriority(priorityValue)}
                  className={`p-3 border-2 rounded-lg text-center transition-colors ${
                    priority === priorityValue
                      ? getPriorityColor(priorityValue)
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">
                    {getPriorityText(priorityValue)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 截止日期 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              截止日期
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`pl-10 ${errors.dueDate ? 'border-red-300' : ''}`}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
            {errors.dueDate && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.dueDate}
              </p>
            )}
          </div>

          {/* 标签管理 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              标签
            </label>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-blue-500 hover:text-blue-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="添加标签..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddTag}
                disabled={!newTag.trim()}
              >
                添加
              </Button>
            </div>
          </div>

          {/* 状态显示（仅编辑时） */}
          {isEditing && todo && (
            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">创建时间：</span>
                  {new Date(todo.createdAt).toLocaleString('zh-CN')}
                </div>
                <div>
                  <span className="font-medium">更新时间：</span>
                  {new Date(todo.updatedAt).toLocaleString('zh-CN')}
                </div>
                <div>
                  <span className="font-medium">完成状态：</span>
                  <span className={todo.completed ? 'text-green-600' : 'text-orange-600'}>
                    {todo.completed ? '已完成' : '待完成'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 快捷键提示 */}
      <div className="text-center text-sm text-gray-500">
        按 Ctrl+Enter (Mac: Cmd+Enter) 快速保存
      </div>
    </div>
  );
};