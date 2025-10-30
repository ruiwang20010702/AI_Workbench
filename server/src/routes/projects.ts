import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats,
  getSubProjects
} from '../controllers/projectController';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats,
  getTaskTags,
  batchUpdateTaskStatus
} from '../controllers/taskController';
import {
  getProjectMembers,
  getUserProjects,
  addProjectMember,
  updateProjectMember,
  removeProjectMember,
  batchAddProjectMembers,
  getProjectMemberStats,
  searchAvailableUsers,
  getRecentMembers
} from '../controllers/projectMemberController';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 任务相关路由（需要放在项目路由之前，避免路由冲突）
router.get('/tasks', getTasks);                        // 获取任务列表（支持按 project_id 过滤）
router.get('/tasks/stats', getTaskStats);               // 获取任务统计信息
router.get('/tasks/tags', getTaskTags);                 // 获取任务标签
router.put('/tasks/batch/status', batchUpdateTaskStatus); // 批量更新任务状态
router.get('/tasks/:id', getTask);                      // 获取单个任务详情
router.put('/tasks/:id', updateTask);                   // 更新任务
router.delete('/tasks/:id', deleteTask);                // 删除任务

// 项目相关路由
router.get('/', getProjects);                           // 获取用户的项目列表
router.post('/', createProject);                        // 创建新项目
router.get('/:id', getProject);                         // 获取单个项目详情
router.put('/:id', updateProject);                      // 更新项目
router.delete('/:id', deleteProject);                   // 删除项目
router.get('/:id/stats', getProjectStats);              // 获取项目统计信息
router.get('/:id/sub-projects', getSubProjects);        // 获取子项目

// 项目成员相关路由
router.get('/:project_id/members', getProjectMembers);                    // 获取项目成员列表
router.post('/:project_id/members', addProjectMember);                    // 添加项目成员
router.post('/:project_id/members/batch', batchAddProjectMembers);        // 批量添加项目成员
router.put('/:project_id/members/:member_id', updateProjectMember);       // 更新项目成员角色
router.delete('/:project_id/members/:member_id', removeProjectMember);    // 移除项目成员
router.get('/:project_id/members/stats', getProjectMemberStats);          // 获取项目成员统计信息
router.get('/:project_id/members/search', searchAvailableUsers);          // 搜索可添加的用户
router.get('/:project_id/members/recent', getRecentMembers);              // 获取最近的项目成员

// 用户项目相关路由
router.get('/user/projects', getUserProjects);          // 获取用户参与的项目列表

// 项目任务相关路由
router.get('/:project_id/tasks', getTasks);             // 获取项目任务列表
router.post('/:project_id/tasks', createTask);          // 创建新任务

export default router;