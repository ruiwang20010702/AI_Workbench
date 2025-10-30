import { Router } from 'express';
import { NoteController } from '../controllers/noteController';
import { validate, createNoteSchema, updateNoteSchema } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// 所有笔记路由都需要认证
router.use(authenticateToken);

// 获取用户的所有笔记
router.get('/', NoteController.getNotes);

// 获取用户统计数据
router.get('/stats', NoteController.getStats);

// 语义搜索笔记
router.get('/search', NoteController.searchNotes);

// 获取所有标签
router.get('/tags', NoteController.getTags);

// 根据ID获取单个笔记
router.get('/:id', NoteController.getNoteById);

// 创建新笔记
router.post('/', validate(createNoteSchema), NoteController.createNote);

// 更新笔记
router.put('/:id', validate(updateNoteSchema), NoteController.updateNote);

// 删除笔记
router.delete('/:id', NoteController.deleteNote);

// 收藏/取消收藏笔记
router.patch('/:id/favorite', NoteController.toggleFavorite);

// 归档/取消归档笔记
router.patch('/:id/archive', NoteController.toggleArchive);

export default router;