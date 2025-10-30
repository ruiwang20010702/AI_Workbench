import { Router } from 'express';
import { TodoController } from '../controllers/todoController';
import { validate, createTodoSchema, updateTodoSchema, validateUUIDParam, batchUpdateTodosSchema, batchDeleteTodosSchema } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// 所有Todo路由都需要认证
router.use(authenticateToken);

// 获取用户的所有Todo
router.get('/', TodoController.getTodos);

// 获取Todo统计信息
router.get('/stats', TodoController.getStatistics);

// 获取标签列表
router.get('/tags', TodoController.getTags);

// 搜索待办事项
router.get('/search', TodoController.searchTodos);

// 导出待办事项
router.get('/export', TodoController.exportTodos);

// 根据ID获取单个Todo
router.get('/:id', TodoController.getTodoById);

// 创建新Todo
router.post('/', validate(createTodoSchema), TodoController.createTodo);

// 批量创建Todo
router.post('/batch', TodoController.createBatchTodos);

// 批量操作
router.patch('/batch', validate(batchUpdateTodosSchema), TodoController.batchUpdate);

// 批量删除
router.delete('/batch', validate(batchDeleteTodosSchema), TodoController.batchDelete);

// 更新Todo
router.put('/:id', validate(updateTodoSchema), TodoController.updateTodo);

// 删除Todo
router.delete('/:id', TodoController.deleteTodo);

// 切换Todo完成状态
router.patch('/:id/toggle', validateUUIDParam('id'), TodoController.toggleComplete);

export default router;