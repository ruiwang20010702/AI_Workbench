import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Plus, Star, Archive, Tag, Grid, List, Trash2 } from 'lucide-react';
import { Button, Input, Card, CardContent, Loading } from '../../components/ui';
import { noteService, Note } from '../../services/noteService';

export const NotesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(searchParams.get('search') || '');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'favorites' | 'archived'>('all');
  const [tags, setTags] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const latestReqRef = useRef<number>(0);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    loadNotes();
    // 移除 loadTags 以避免每次搜索触发
  }, [debouncedQuery, selectedTags, filterType, page]);

  useEffect(() => {
    // 标签只在首次加载
    loadTags();
  }, []);

  const loadNotes = async () => {
    const reqId = Date.now();
    latestReqRef.current = reqId;
    try {
      setLoading(true);
      let response;

      if (debouncedQuery) {
        response = await noteService.searchNotes(debouncedQuery, { page, limit: 12 });
      } else if (filterType === 'favorites') {
        response = await noteService.getNotes({ page, limit: 12, isFavorite: true });
      } else if (filterType === 'archived') {
        response = await noteService.getNotes({ page, limit: 12, isArchived: true });
      } else {
        response = await noteService.getNotes({
          page,
          limit: 12,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
          isArchived: false
        });
      }

      if (latestReqRef.current !== reqId) return; // 旧请求结果丢弃
      setNotes(response.notes);
      setTotal(response.total);
    } catch (error) {
      if (latestReqRef.current !== reqId) return; // 旧请求错误忽略
      console.error('Failed to load notes:', error);
    } finally {
      if (latestReqRef.current === reqId) {
        setLoading(false);
      }
    }
  };

  const loadTags = async () => {
    try {
      const tagsData = await noteService.getTags();
      setTags(tagsData);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    const q = searchQuery.trim();
    if (q) {
      setSearchParams({ search: q });
    } else {
      setSearchParams({});
    }
  };

  const handleToggleFavorite = async (noteId: string) => {
    try {
      await noteService.toggleFavorite(noteId);
      loadNotes();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleToggleArchive = async (noteId: string) => {
    try {
      await noteService.toggleArchive(noteId);
      loadNotes();
    } catch (error) {
      console.error('Failed to toggle archive:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm('确定要删除这篇笔记吗？此操作无法撤销。')) return;

    try {
      await noteService.deleteNote(noteId);
      loadNotes();
    } catch (error) {
      console.error('Failed to delete note:', error);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateContent = (content?: string, maxLength: number = 150) => {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (loading && notes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading text="加载笔记中..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {filterType === 'favorites' ? '收藏笔记' : 
             filterType === 'archived' ? '归档笔记' : '我的笔记'}
          </h1>
          <p className="text-gray-600 mt-1">
            共 {total} 篇笔记
          </p>
        </div>
        <Button as={Link} to="/notes/new">
          <Plus className="w-4 h-4 mr-2" />
          新建笔记
        </Button>
      </div>

      {/* 搜索和过滤 */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* 搜索框 */}
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="搜索笔记..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </form>

        {/* 过滤器 */}
        <div className="flex gap-2">
          <Button
            variant={filterType === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterType('all')}
          >
            全部
          </Button>
          <Button
            variant={filterType === 'favorites' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterType('favorites')}
          >
            <Star className="w-4 h-4 mr-1" />
            收藏
          </Button>
          <Button
            variant={filterType === 'archived' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterType('archived')}
          >
            <Archive className="w-4 h-4 mr-1" />
            归档
          </Button>
        </div>

        {/* 视图切换 */}
        <div className="flex border rounded-lg">
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="rounded-r-none"
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="rounded-l-none"
          >
            <List className="w-4 h-4" />
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

      {/* 笔记列表 */}
      {notes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? '未找到相关笔记' : '还没有笔记'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery ? '尝试使用其他关键词搜索' : '创建您的第一篇笔记开始记录'}
          </p>
          <Button as={Link} to="/notes/new">
            <Plus className="w-4 h-4 mr-2" />
            新建笔记
          </Button>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {notes.map(note => (
            <Card key={note.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <Link
                    to={`/notes/${note.id}`}
                    className="flex-1 hover:text-blue-600 transition-colors"
                  >
                    <h3 className="font-semibold text-lg line-clamp-2">
                      {note.title || '无标题'}
                    </h3>
                  </Link>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => handleToggleFavorite(note.id)}
                      className={`p-1 rounded hover:bg-gray-100 ${
                        note.isFavorite ? 'text-yellow-500' : 'text-gray-400'
                      }`}
                    >
                      <Star className="w-4 h-4" fill={note.isFavorite ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={() => handleToggleArchive(note.id)}
                      className={`p-1 rounded hover:bg-gray-100 ${
                        note.isArchived ? 'text-blue-500' : 'text-gray-400'
                      }`}
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-1 rounded hover:bg-gray-100 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {truncateContent(note.content)}
                </p>

                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {note.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {note.tags && note.tags.length > 3 && (
                      <span className="px-2 py-1 text-xs text-gray-500">
                        +{note.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  更新于 {formatDate(note.updatedAt)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 分页 */}
      {total > 12 && (
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
            第 {page} 页，共 {Math.ceil(total / 12)} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= Math.ceil(total / 12)}
            onClick={() => setPage(page + 1)}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
};