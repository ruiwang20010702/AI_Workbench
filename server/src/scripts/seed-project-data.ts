/**
 * 为管理员账号生成测试数据
 * 
 * 包含：
 * - 多个根项目（不同行业和规模）
 * - 完整的项目层级（根项目 -> 子项目 -> 叶子项目）
 * - 不同种类、不同状态的任务
 * - 真实的项目场景和任务描述
 */

import { supabaseAdmin } from '../config/database';
import { ProjectModel, CreateProjectData } from '../models/Project';
import { TaskModel, CreateTaskData } from '../models/Task';

// 获取当前日期相关的辅助函数
function getDate(daysOffset: number = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// 项目状态和优先级
const PROJECT_STATUSES = ['planning', 'active', 'completed', 'paused'] as const;
const PROJECT_PRIORITIES = ['low', 'medium', 'high'] as const;
const TASK_STATUSES = ['todo', 'in_progress', 'completed', 'cancelled'] as const;
const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;

interface TestProject {
  name: string;
  description: string;
  status: typeof PROJECT_STATUSES[number];
  priority: typeof PROJECT_PRIORITIES[number];
  tags: string[];
  startDaysOffset: number;
  endDaysOffset: number;
  subProjects?: TestProject[];
  tasks?: {
    title: string;
    description: string;
    status: typeof TASK_STATUSES[number];
    priority: typeof TASK_PRIORITIES[number];
    tags: string[];
    startDaysOffset?: number;
    dueDaysOffset?: number;
    estimatedHours?: number;
  }[];
}

// 测试数据结构
const testProjects: TestProject[] = [
  // ==================== 项目1：企业级Web应用开发 ====================
  {
    name: '企业级协同办公平台',
    description: '构建一个现代化的企业协同办公平台，支持项目管理、任务追踪、文档协作、即时通讯等功能。目标用户为中大型企业，预计支持1000+并发用户。',
    status: 'active',
    priority: 'high',
    tags: ['Web开发', 'SaaS', '企业应用', 'React', 'Node.js'],
    startDaysOffset: -60,
    endDaysOffset: 120,
    subProjects: [
      {
        name: '前端开发',
        description: '基于React + TypeScript构建响应式前端应用，使用Ant Design组件库，支持主题定制。',
        status: 'active',
        priority: 'high',
        tags: ['React', 'TypeScript', 'Ant Design', '前端'],
        startDaysOffset: -50,
        endDaysOffset: 90,
        subProjects: [
          {
            name: '用户认证模块',
            description: '实现用户登录、注册、密码重置、多因素认证等功能。',
            status: 'completed',
            priority: 'high',
            tags: ['认证', '前端', 'Security'],
            startDaysOffset: -50,
            endDaysOffset: -30,
            tasks: [
              {
                title: '设计登录页面UI',
                description: '设计符合企业品牌的登录页面，包含邮箱登录、第三方登录入口',
                status: 'completed',
                priority: 'high',
                tags: ['UI', '设计'],
                startDaysOffset: -50,
                dueDaysOffset: -45,
                estimatedHours: 8
              },
              {
                title: '实现JWT认证流程',
                description: '实现基于JWT的token认证机制，包含token刷新、过期处理',
                status: 'completed',
                priority: 'high',
                tags: ['认证', 'JWT'],
                startDaysOffset: -45,
                dueDaysOffset: -38,
                estimatedHours: 16
              },
              {
                title: '实现密码重置功能',
                description: '通过邮箱验证实现密码重置，需要安全验证',
                status: 'completed',
                priority: 'medium',
                tags: ['认证', 'Email'],
                startDaysOffset: -38,
                dueDaysOffset: -32,
                estimatedHours: 12
              },
              {
                title: '集成Google OAuth',
                description: '集成Google第三方登录',
                status: 'completed',
                priority: 'medium',
                tags: ['OAuth', 'Google'],
                startDaysOffset: -32,
                dueDaysOffset: -30,
                estimatedHours: 8
              }
            ]
          },
          {
            name: '项目管理模块',
            description: '实现项目创建、编辑、成员管理、权限控制等核心功能。',
            status: 'active',
            priority: 'high',
            tags: ['项目管理', '前端'],
            startDaysOffset: -30,
            endDaysOffset: 30,
            tasks: [
              {
                title: '设计项目列表页面',
                description: '设计项目列表页面，支持筛选、搜索、排序功能',
                status: 'completed',
                priority: 'high',
                tags: ['UI', '设计'],
                startDaysOffset: -30,
                dueDaysOffset: -25,
                estimatedHours: 12
              },
              {
                title: '实现项目创建表单',
                description: '实现项目创建表单，支持项目信息、成员、标签等配置',
                status: 'completed',
                priority: 'high',
                tags: ['表单', 'React'],
                startDaysOffset: -25,
                dueDaysOffset: -18,
                estimatedHours: 16
              },
              {
                title: '实现项目详情页',
                description: '展示项目详细信息、任务列表、成员列表、进度统计',
                status: 'in_progress',
                priority: 'high',
                tags: ['详情页', 'Dashboard'],
                startDaysOffset: -18,
                dueDaysOffset: 5,
                estimatedHours: 24
              },
              {
                title: '实现项目成员管理',
                description: '实现成员邀请、角色分配、权限管理功能',
                status: 'todo',
                priority: 'high',
                tags: ['权限', '成员管理'],
                startDaysOffset: 0,
                dueDaysOffset: 15,
                estimatedHours: 20
              },
              {
                title: '添加项目进度可视化',
                description: '使用图表展示项目进度、任务分布、成员工作量',
                status: 'todo',
                priority: 'medium',
                tags: ['可视化', 'Charts'],
                startDaysOffset: 10,
                dueDaysOffset: 25,
                estimatedHours: 16
              }
            ]
          },
          {
            name: '任务管理模块',
            description: '实现任务的创建、分配、追踪、评论等功能，支持看板视图。',
            status: 'active',
            priority: 'high',
            tags: ['任务管理', '前端', 'Kanban'],
            startDaysOffset: -20,
            endDaysOffset: 40,
            tasks: [
              {
                title: '设计任务卡片组件',
                description: '设计可拖拽的任务卡片组件，显示任务基本信息',
                status: 'completed',
                priority: 'high',
                tags: ['组件', 'UI'],
                startDaysOffset: -20,
                dueDaysOffset: -15,
                estimatedHours: 10
              },
              {
                title: '实现看板视图',
                description: '实现可拖拽的看板视图，支持任务状态切换',
                status: 'in_progress',
                priority: 'high',
                tags: ['Kanban', 'DnD'],
                startDaysOffset: -15,
                dueDaysOffset: 8,
                estimatedHours: 28
              },
              {
                title: '实现任务详情抽屉',
                description: '实现任务详情侧边栏，支持编辑、评论、附件上传',
                status: 'todo',
                priority: 'high',
                tags: ['详情页', 'Form'],
                startDaysOffset: 5,
                dueDaysOffset: 20,
                estimatedHours: 24
              },
              {
                title: '添加任务筛选和搜索',
                description: '实现高级筛选功能，支持多条件组合搜索',
                status: 'todo',
                priority: 'medium',
                tags: ['搜索', '筛选'],
                startDaysOffset: 15,
                dueDaysOffset: 30,
                estimatedHours: 16
              }
            ]
          }
        ]
      },
      {
        name: '后端开发',
        description: '基于Node.js + Express构建RESTful API，使用PostgreSQL数据库，Redis缓存。',
        status: 'active',
        priority: 'high',
        tags: ['Node.js', 'Express', 'PostgreSQL', '后端'],
        startDaysOffset: -55,
        endDaysOffset: 90,
        subProjects: [
          {
            name: '用户服务',
            description: '实现用户认证、授权、个人信息管理等API。',
            status: 'completed',
            priority: 'high',
            tags: ['API', '认证', '后端'],
            startDaysOffset: -55,
            endDaysOffset: -25,
            tasks: [
              {
                title: '设计用户数据库表结构',
                description: '设计users表、user_sessions表、user_profiles表',
                status: 'completed',
                priority: 'high',
                tags: ['数据库', 'Schema'],
                startDaysOffset: -55,
                dueDaysOffset: -50,
                estimatedHours: 8
              },
              {
                title: '实现用户注册API',
                description: '实现注册接口，包含邮箱验证、密码加密',
                status: 'completed',
                priority: 'high',
                tags: ['API', '认证'],
                startDaysOffset: -50,
                dueDaysOffset: -45,
                estimatedHours: 12
              },
              {
                title: '实现JWT中间件',
                description: '实现JWT验证中间件，保护需要认证的接口',
                status: 'completed',
                priority: 'high',
                tags: ['Middleware', 'JWT'],
                startDaysOffset: -45,
                dueDaysOffset: -40,
                estimatedHours: 10
              },
              {
                title: '实现用户个人信息API',
                description: '实现获取、更新用户个人信息的接口',
                status: 'completed',
                priority: 'medium',
                tags: ['API', 'CRUD'],
                startDaysOffset: -40,
                dueDaysOffset: -30,
                estimatedHours: 8
              },
              {
                title: '添加单元测试',
                description: '为用户服务添加完整的单元测试',
                status: 'completed',
                priority: 'medium',
                tags: ['测试', 'Jest'],
                startDaysOffset: -30,
                dueDaysOffset: -25,
                estimatedHours: 16
              }
            ]
          },
          {
            name: '项目服务',
            description: '实现项目CRUD、成员管理、权限控制等API。',
            status: 'active',
            priority: 'high',
            tags: ['API', '项目管理', '后端'],
            startDaysOffset: -35,
            endDaysOffset: 30,
            tasks: [
              {
                title: '设计项目数据库表结构',
                description: '设计projects、project_members、project_roles表',
                status: 'completed',
                priority: 'high',
                tags: ['数据库', 'Schema'],
                startDaysOffset: -35,
                dueDaysOffset: -30,
                estimatedHours: 10
              },
              {
                title: '实现项目CRUD接口',
                description: '实现项目的创建、查询、更新、删除接口',
                status: 'completed',
                priority: 'high',
                tags: ['API', 'CRUD'],
                startDaysOffset: -30,
                dueDaysOffset: -20,
                estimatedHours: 20
              },
              {
                title: '实现权限控制中间件',
                description: '实现基于角色的权限控制（RBAC）',
                status: 'in_progress',
                priority: 'high',
                tags: ['Middleware', 'RBAC'],
                startDaysOffset: -20,
                dueDaysOffset: 5,
                estimatedHours: 24
              },
              {
                title: '实现成员管理API',
                description: '实现成员邀请、角色分配、移除成员接口',
                status: 'todo',
                priority: 'high',
                tags: ['API', '成员管理'],
                startDaysOffset: 0,
                dueDaysOffset: 15,
                estimatedHours: 18
              },
              {
                title: '优化项目查询性能',
                description: '添加数据库索引，优化复杂查询，添加Redis缓存',
                status: 'todo',
                priority: 'medium',
                tags: ['性能优化', 'Redis'],
                startDaysOffset: 10,
                dueDaysOffset: 25,
                estimatedHours: 16
              }
            ]
          },
          {
            name: '任务服务',
            description: '实现任务管理相关的所有API接口。',
            status: 'active',
            priority: 'high',
            tags: ['API', '任务管理', '后端'],
            startDaysOffset: -25,
            endDaysOffset: 45,
            tasks: [
              {
                title: '设计任务数据库表结构',
                description: '设计tasks、task_comments、task_attachments表',
                status: 'completed',
                priority: 'high',
                tags: ['数据库', 'Schema'],
                startDaysOffset: -25,
                dueDaysOffset: -20,
                estimatedHours: 12
              },
              {
                title: '实现任务CRUD接口',
                description: '实现任务的创建、查询、更新、删除接口',
                status: 'completed',
                priority: 'high',
                tags: ['API', 'CRUD'],
                startDaysOffset: -20,
                dueDaysOffset: -10,
                estimatedHours: 20
              },
              {
                title: '实现任务评论功能',
                description: '实现任务评论的增删改查接口',
                status: 'in_progress',
                priority: 'medium',
                tags: ['API', '评论'],
                startDaysOffset: -10,
                dueDaysOffset: 10,
                estimatedHours: 16
              },
              {
                title: '实现任务附件上传',
                description: '集成对象存储，实现文件上传和管理',
                status: 'todo',
                priority: 'medium',
                tags: ['API', '文件上传'],
                startDaysOffset: 5,
                dueDaysOffset: 25,
                estimatedHours: 20
              },
              {
                title: '实现任务依赖关系',
                description: '实现任务依赖、前置任务等功能',
                status: 'todo',
                priority: 'low',
                tags: ['API', '依赖管理'],
                startDaysOffset: 20,
                dueDaysOffset: 40,
                estimatedHours: 18
              }
            ]
          }
        ]
      },
      {
        name: '测试与部署',
        description: '实施全面的测试策略，构建CI/CD流水线，部署到生产环境。',
        status: 'planning',
        priority: 'medium',
        tags: ['测试', 'DevOps', 'CI/CD'],
        startDaysOffset: 30,
        endDaysOffset: 120,
        tasks: [
          {
            title: '编写E2E测试用例',
            description: '使用Cypress编写端到端测试用例',
            status: 'todo',
            priority: 'high',
            tags: ['测试', 'Cypress'],
            startDaysOffset: 30,
            dueDaysOffset: 60,
            estimatedHours: 40
          },
          {
            title: '配置Jenkins CI/CD',
            description: '配置Jenkins流水线，实现自动化构建和部署',
            status: 'todo',
            priority: 'high',
            tags: ['DevOps', 'Jenkins'],
            startDaysOffset: 40,
            dueDaysOffset: 70,
            estimatedHours: 24
          },
          {
            title: '性能测试和优化',
            description: '使用JMeter进行压力测试，优化性能瓶颈',
            status: 'todo',
            priority: 'medium',
            tags: ['测试', '性能优化'],
            startDaysOffset: 60,
            dueDaysOffset: 90,
            estimatedHours: 32
          },
          {
            title: '安全审计',
            description: '进行全面的安全审计，修复安全漏洞',
            status: 'todo',
            priority: 'high',
            tags: ['安全', '审计'],
            startDaysOffset: 70,
            dueDaysOffset: 100,
            estimatedHours: 24
          }
        ]
      }
    ]
  },

  // ==================== 项目2：移动电商App开发 ====================
  {
    name: '移动电商App',
    description: '开发一款跨平台的移动电商应用，支持商品浏览、购物车、支付、订单管理等完整电商流程。使用React Native构建。',
    status: 'active',
    priority: 'high',
    tags: ['移动开发', 'React Native', '电商', 'App'],
    startDaysOffset: -45,
    endDaysOffset: 150,
    subProjects: [
      {
        name: '首页与商品展示',
        description: '实现首页、商品列表、商品详情等展示页面。',
        status: 'completed',
        priority: 'high',
        tags: ['UI', '前端', '商品展示'],
        startDaysOffset: -45,
        endDaysOffset: -10,
        tasks: [
          {
            title: '设计首页轮播图组件',
            description: '实现支持自动播放、手势滑动的轮播图',
            status: 'completed',
            priority: 'high',
            tags: ['组件', 'UI'],
            startDaysOffset: -45,
            dueDaysOffset: -40,
            estimatedHours: 12
          },
          {
            title: '实现商品列表页',
            description: '实现瀑布流商品列表，支持下拉刷新、上拉加载',
            status: 'completed',
            priority: 'high',
            tags: ['列表', 'UI'],
            startDaysOffset: -40,
            dueDaysOffset: -30,
            estimatedHours: 20
          },
          {
            title: '实现商品详情页',
            description: '展示商品详情、规格选择、加入购物车',
            status: 'completed',
            priority: 'high',
            tags: ['详情页', 'UI'],
            startDaysOffset: -30,
            dueDaysOffset: -15,
            estimatedHours: 24
          },
          {
            title: '添加商品搜索功能',
            description: '实现商品搜索、历史记录、热门搜索',
            status: 'completed',
            priority: 'medium',
            tags: ['搜索', 'UI'],
            startDaysOffset: -15,
            dueDaysOffset: -10,
            estimatedHours: 16
          }
        ]
      },
      {
        name: '购物车与订单',
        description: '实现购物车、订单创建、订单管理功能。',
        status: 'active',
        priority: 'high',
        tags: ['购物车', '订单', '前端'],
        startDaysOffset: -15,
        endDaysOffset: 60,
        tasks: [
          {
            title: '实现购物车页面',
            description: '实现购物车商品列表、数量修改、商品删除',
            status: 'completed',
            priority: 'high',
            tags: ['购物车', 'UI'],
            startDaysOffset: -15,
            dueDaysOffset: -5,
            estimatedHours: 18
          },
          {
            title: '实现订单确认页',
            description: '展示订单详情、地址选择、优惠券选择',
            status: 'in_progress',
            priority: 'high',
            tags: ['订单', 'UI'],
            startDaysOffset: -5,
            dueDaysOffset: 10,
            estimatedHours: 20
          },
          {
            title: '集成支付功能',
            description: '集成支付宝、微信支付',
            status: 'todo',
            priority: 'high',
            tags: ['支付', 'SDK'],
            startDaysOffset: 5,
            dueDaysOffset: 25,
            estimatedHours: 32
          },
          {
            title: '实现订单列表和详情',
            description: '展示用户的历史订单、订单详情',
            status: 'todo',
            priority: 'medium',
            tags: ['订单', 'UI'],
            startDaysOffset: 20,
            dueDaysOffset: 40,
            estimatedHours: 16
          },
          {
            title: '实现订单追踪',
            description: '实现物流追踪、订单状态更新',
            status: 'todo',
            priority: 'medium',
            tags: ['订单', '物流'],
            startDaysOffset: 35,
            dueDaysOffset: 55,
            estimatedHours: 20
          }
        ]
      },
      {
        name: '用户中心',
        description: '实现用户登录、个人信息、地址管理等功能。',
        status: 'active',
        priority: 'medium',
        tags: ['用户', '个人中心', '前端'],
        startDaysOffset: -20,
        endDaysOffset: 40,
        tasks: [
          {
            title: '设计登录注册页面',
            description: '设计手机号登录、验证码登录页面',
            status: 'completed',
            priority: 'high',
            tags: ['UI', '认证'],
            startDaysOffset: -20,
            dueDaysOffset: -15,
            estimatedHours: 10
          },
          {
            title: '实现个人中心首页',
            description: '展示用户信息、订单统计、功能入口',
            status: 'completed',
            priority: 'medium',
            tags: ['UI', '个人中心'],
            startDaysOffset: -15,
            dueDaysOffset: -5,
            estimatedHours: 12
          },
          {
            title: '实现收货地址管理',
            description: '实现地址增删改查、默认地址设置',
            status: 'in_progress',
            priority: 'medium',
            tags: ['地址管理', 'CRUD'],
            startDaysOffset: -5,
            dueDaysOffset: 10,
            estimatedHours: 16
          },
          {
            title: '实现个人信息编辑',
            description: '实现昵称、头像、性别等信息的编辑',
            status: 'todo',
            priority: 'low',
            tags: ['个人信息', 'Form'],
            startDaysOffset: 10,
            dueDaysOffset: 30,
            estimatedHours: 12
          }
        ]
      }
    ]
  },

  // ==================== 项目3：AI智能客服系统 ====================
  {
    name: 'AI智能客服系统',
    description: '构建基于大语言模型的智能客服系统，支持多轮对话、知识库检索、人工接入等功能。',
    status: 'active',
    priority: 'high',
    tags: ['AI', 'NLP', '客服', 'Python'],
    startDaysOffset: -30,
    endDaysOffset: 180,
    subProjects: [
      {
        name: '对话引擎',
        description: '实现基于LLM的对话引擎，支持上下文理解和多轮对话。',
        status: 'active',
        priority: 'high',
        tags: ['AI', 'LLM', 'NLP'],
        startDaysOffset: -30,
        endDaysOffset: 60,
        tasks: [
          {
            title: '选型和集成LLM',
            description: '评估GPT-4、Claude等模型，选择合适的LLM',
            status: 'completed',
            priority: 'high',
            tags: ['调研', 'LLM'],
            startDaysOffset: -30,
            dueDaysOffset: -25,
            estimatedHours: 16
          },
          {
            title: '实现对话管理器',
            description: '实现对话历史管理、上下文维护',
            status: 'completed',
            priority: 'high',
            tags: ['对话管理', 'Python'],
            startDaysOffset: -25,
            dueDaysOffset: -15,
            estimatedHours: 24
          },
          {
            title: '实现意图识别',
            description: '使用NLP技术识别用户意图',
            status: 'in_progress',
            priority: 'high',
            tags: ['NLP', '意图识别'],
            startDaysOffset: -15,
            dueDaysOffset: 5,
            estimatedHours: 32
          },
          {
            title: '优化prompt工程',
            description: '优化系统prompt，提升回答质量',
            status: 'todo',
            priority: 'high',
            tags: ['Prompt', 'LLM'],
            startDaysOffset: 5,
            dueDaysOffset: 30,
            estimatedHours: 20
          }
        ]
      },
      {
        name: '知识库系统',
        description: '构建企业知识库，支持向量检索和语义搜索。',
        status: 'active',
        priority: 'high',
        tags: ['知识库', '向量数据库', 'RAG'],
        startDaysOffset: -25,
        endDaysOffset: 90,
        tasks: [
          {
            title: '选型向量数据库',
            description: '评估Pinecone、Weaviate等向量数据库',
            status: 'completed',
            priority: 'high',
            tags: ['调研', '向量数据库'],
            startDaysOffset: -25,
            dueDaysOffset: -20,
            estimatedHours: 12
          },
          {
            title: '实现文档导入功能',
            description: '支持导入PDF、Word、Markdown等格式文档',
            status: 'in_progress',
            priority: 'high',
            tags: ['文档处理', 'Python'],
            startDaysOffset: -20,
            dueDaysOffset: 10,
            estimatedHours: 28
          },
          {
            title: '实现向量化和存储',
            description: '将文档内容向量化并存储到向量数据库',
            status: 'todo',
            priority: 'high',
            tags: ['Embedding', '向量化'],
            startDaysOffset: 5,
            dueDaysOffset: 35,
            estimatedHours: 24
          },
          {
            title: '实现语义搜索',
            description: '基于向量相似度实现语义搜索',
            status: 'todo',
            priority: 'high',
            tags: ['搜索', 'RAG'],
            startDaysOffset: 30,
            dueDaysOffset: 60,
            estimatedHours: 20
          },
          {
            title: '优化检索策略',
            description: '实现混合检索、重排序等优化',
            status: 'todo',
            priority: 'medium',
            tags: ['优化', '检索'],
            startDaysOffset: 60,
            dueDaysOffset: 85,
            estimatedHours: 24
          }
        ]
      },
      {
        name: '人工客服接入',
        description: '实现人工客服接入功能，支持会话转接。',
        status: 'planning',
        priority: 'medium',
        tags: ['人工客服', 'WebSocket'],
        startDaysOffset: 30,
        endDaysOffset: 120,
        tasks: [
          {
            title: '设计客服工作台UI',
            description: '设计客服工作台界面，展示会话列表',
            status: 'todo',
            priority: 'medium',
            tags: ['UI', '设计'],
            startDaysOffset: 30,
            dueDaysOffset: 50,
            estimatedHours: 16
          },
          {
            title: '实现会话转接逻辑',
            description: '实现AI到人工的无缝转接',
            status: 'todo',
            priority: 'high',
            tags: ['转接', '逻辑'],
            startDaysOffset: 50,
            dueDaysOffset: 80,
            estimatedHours: 28
          },
          {
            title: '实现客服负载均衡',
            description: '实现客服会话的智能分配',
            status: 'todo',
            priority: 'medium',
            tags: ['负载均衡', '分配'],
            startDaysOffset: 75,
            dueDaysOffset: 105,
            estimatedHours: 20
          }
        ]
      }
    ]
  },

  // ==================== 项目4：数据分析平台 ====================
  {
    name: '企业数据分析平台',
    description: '构建一个企业级数据分析平台，支持数据接入、数据清洗、可视化分析、报表生成等功能。',
    status: 'active',
    priority: 'medium',
    tags: ['数据分析', 'BI', 'Python', '大数据'],
    startDaysOffset: -40,
    endDaysOffset: 200,
    subProjects: [
      {
        name: '数据接入层',
        description: '支持多种数据源接入，包括数据库、API、文件等。',
        status: 'active',
        priority: 'high',
        tags: ['数据接入', 'ETL'],
        startDaysOffset: -40,
        endDaysOffset: 30,
        tasks: [
          {
            title: '设计数据源配置模型',
            description: '设计通用的数据源配置抽象',
            status: 'completed',
            priority: 'high',
            tags: ['设计', '架构'],
            startDaysOffset: -40,
            dueDaysOffset: -35,
            estimatedHours: 12
          },
          {
            title: '实现MySQL数据源',
            description: '实现MySQL数据库的连接和数据读取',
            status: 'completed',
            priority: 'high',
            tags: ['MySQL', '数据源'],
            startDaysOffset: -35,
            dueDaysOffset: -25,
            estimatedHours: 16
          },
          {
            title: '实现PostgreSQL数据源',
            description: '实现PostgreSQL数据库的连接和数据读取',
            status: 'completed',
            priority: 'high',
            tags: ['PostgreSQL', '数据源'],
            startDaysOffset: -25,
            dueDaysOffset: -15,
            estimatedHours: 14
          },
          {
            title: '实现API数据源',
            description: '实现RESTful API的数据接入',
            status: 'in_progress',
            priority: 'medium',
            tags: ['API', '数据源'],
            startDaysOffset: -15,
            dueDaysOffset: 10,
            estimatedHours: 20
          },
          {
            title: '实现文件数据源',
            description: '支持CSV、Excel、JSON等文件格式',
            status: 'todo',
            priority: 'medium',
            tags: ['文件', '数据源'],
            startDaysOffset: 5,
            dueDaysOffset: 25,
            estimatedHours: 18
          }
        ]
      },
      {
        name: '数据处理层',
        description: '实现数据清洗、转换、聚合等ETL功能。',
        status: 'planning',
        priority: 'medium',
        tags: ['ETL', '数据处理'],
        startDaysOffset: 10,
        endDaysOffset: 100,
        tasks: [
          {
            title: '设计ETL流程引擎',
            description: '设计可配置的ETL流程引擎',
            status: 'todo',
            priority: 'high',
            tags: ['设计', 'ETL'],
            startDaysOffset: 10,
            dueDaysOffset: 30,
            estimatedHours: 24
          },
          {
            title: '实现数据清洗算子',
            description: '实现去重、过滤、格式化等清洗算子',
            status: 'todo',
            priority: 'high',
            tags: ['数据清洗', '算子'],
            startDaysOffset: 30,
            dueDaysOffset: 60,
            estimatedHours: 32
          },
          {
            title: '实现数据转换算子',
            description: '实现字段映射、类型转换等转换算子',
            status: 'todo',
            priority: 'medium',
            tags: ['数据转换', '算子'],
            startDaysOffset: 55,
            dueDaysOffset: 85,
            estimatedHours: 28
          }
        ]
      },
      {
        name: '可视化分析',
        description: '实现数据可视化和交互式分析功能。',
        status: 'planning',
        priority: 'medium',
        tags: ['可视化', 'Charts', '前端'],
        startDaysOffset: 50,
        endDaysOffset: 180,
        tasks: [
          {
            title: '选型图表库',
            description: '评估ECharts、D3.js等图表库',
            status: 'todo',
            priority: 'medium',
            tags: ['调研', '图表'],
            startDaysOffset: 50,
            dueDaysOffset: 65,
            estimatedHours: 12
          },
          {
            title: '实现基础图表组件',
            description: '实现柱状图、折线图、饼图等基础图表',
            status: 'todo',
            priority: 'high',
            tags: ['图表', '组件'],
            startDaysOffset: 65,
            dueDaysOffset: 100,
            estimatedHours: 40
          },
          {
            title: '实现仪表板编辑器',
            description: '实现拖拽式仪表板编辑器',
            status: 'todo',
            priority: 'medium',
            tags: ['编辑器', 'UI'],
            startDaysOffset: 100,
            dueDaysOffset: 150,
            estimatedHours: 48
          }
        ]
      }
    ]
  },

  // ==================== 项目5：物联网监控系统 ====================
  {
    name: '工业物联网监控系统',
    description: '构建工业物联网监控平台，支持设备接入、数据采集、实时监控、告警管理等功能。',
    status: 'planning',
    priority: 'medium',
    tags: ['IoT', '监控', '实时系统', 'MQTT'],
    startDaysOffset: 20,
    endDaysOffset: 250,
    subProjects: [
      {
        name: '设备接入',
        description: '实现设备接入协议，支持MQTT、CoAP等IoT协议。',
        status: 'planning',
        priority: 'high',
        tags: ['设备接入', 'MQTT', 'IoT'],
        startDaysOffset: 20,
        endDaysOffset: 90,
        tasks: [
          {
            title: '搭建MQTT服务器',
            description: '搭建MQTT Broker，配置安全认证',
            status: 'todo',
            priority: 'high',
            tags: ['MQTT', '基础设施'],
            startDaysOffset: 20,
            dueDaysOffset: 40,
            estimatedHours: 20
          },
          {
            title: '实现设备认证',
            description: '实现基于证书的设备认证机制',
            status: 'todo',
            priority: 'high',
            tags: ['认证', '安全'],
            startDaysOffset: 40,
            dueDaysOffset: 65,
            estimatedHours: 24
          },
          {
            title: '实现数据采集服务',
            description: '实现设备数据的接收和解析',
            status: 'todo',
            priority: 'high',
            tags: ['数据采集', '服务'],
            startDaysOffset: 60,
            dueDaysOffset: 85,
            estimatedHours: 28
          }
        ]
      },
      {
        name: '实时监控',
        description: '实现设备状态和数据的实时监控展示。',
        status: 'planning',
        priority: 'medium',
        tags: ['监控', '实时', 'WebSocket'],
        startDaysOffset: 80,
        endDaysOffset: 180,
        tasks: [
          {
            title: '设计监控大屏',
            description: '设计工业风格的监控大屏界面',
            status: 'todo',
            priority: 'medium',
            tags: ['UI', '设计'],
            startDaysOffset: 80,
            dueDaysOffset: 100,
            estimatedHours: 16
          },
          {
            title: '实现实时数据推送',
            description: '使用WebSocket推送实时数据',
            status: 'todo',
            priority: 'high',
            tags: ['WebSocket', '实时'],
            startDaysOffset: 100,
            dueDaysOffset: 130,
            estimatedHours: 24
          },
          {
            title: '实现设备拓扑图',
            description: '展示设备层级和连接关系',
            status: 'todo',
            priority: 'low',
            tags: ['拓扑图', '可视化'],
            startDaysOffset: 130,
            dueDaysOffset: 170,
            estimatedHours: 32
          }
        ]
      }
    ]
  },

  // ==================== 项目6：内部工具集（小项目） ====================
  {
    name: '内部开发工具集',
    description: '开发一些提升团队效率的内部工具。',
    status: 'active',
    priority: 'low',
    tags: ['工具', '效率', '自动化'],
    startDaysOffset: -20,
    endDaysOffset: 60,
    tasks: [
      {
        title: '开发代码生成器',
        description: '开发基于模板的CRUD代码生成器',
        status: 'completed',
        priority: 'medium',
        tags: ['代码生成', '工具'],
        startDaysOffset: -20,
        dueDaysOffset: -5,
        estimatedHours: 24
      },
      {
        title: '开发API文档生成工具',
        description: '从注释自动生成API文档',
        status: 'in_progress',
        priority: 'medium',
        tags: ['文档', '工具'],
        startDaysOffset: -10,
        dueDaysOffset: 15,
        estimatedHours: 20
      },
      {
        title: '开发数据库迁移脚本',
        description: '开发数据库版本管理和迁移工具',
        status: 'todo',
        priority: 'low',
        tags: ['数据库', '迁移'],
        startDaysOffset: 10,
        dueDaysOffset: 40,
        estimatedHours: 16
      },
      {
        title: '优化构建流程',
        description: '优化前端构建速度，减少构建时间',
        status: 'todo',
        priority: 'low',
        tags: ['构建', '优化'],
        startDaysOffset: 30,
        dueDaysOffset: 55,
        estimatedHours: 12
      }
    ]
  }
];

/**
 * 生成测试数据
 */
async function seedProjectData() {
  try {
    console.log('🚀 开始生成测试数据...\n');

    // 1. 获取或创建管理员用户
    console.log('📝 步骤 1/4: 查找管理员账号...');
    const { data: users, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, display_name')
      .limit(1);

    if (userError) {
      throw new Error(`查询用户失败: ${userError.message}`);
    }

    if (!users || users.length === 0) {
      throw new Error('未找到管理员账号，请先注册一个账号');
    }

    const adminUser = users[0];
    console.log(`✅ 找到管理员账号: ${adminUser.email} (${adminUser.display_name || '无昵称'})`);
    console.log(`   用户ID: ${adminUser.id}\n`);

    // 2. 清理现有测试数据（可选）
    console.log('📝 步骤 2/4: 是否清理现有数据？');
    console.log('⚠️  跳过清理，直接添加新数据\n');

    // 3. 创建项目和任务
    console.log('📝 步骤 3/4: 创建项目和任务...');
    let projectCount = 0;
    let taskCount = 0;

    for (const rootProjectData of testProjects) {
      console.log(`\n📦 创建根项目: ${rootProjectData.name}`);
      const rootProject = await createProjectWithChildren(
        rootProjectData,
        adminUser.id,
        null
      );
      
      const stats = countProjectsAndTasks(rootProjectData);
      projectCount += stats.projects;
      taskCount += stats.tasks;
      
      console.log(`   ✅ 完成 (包含 ${stats.projects} 个项目, ${stats.tasks} 个任务)`);
    }

    // 4. 统计信息
    console.log('\n📝 步骤 4/4: 生成完成！\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 数据统计:');
    console.log(`   👤 管理员: ${adminUser.email}`);
    console.log(`   📦 项目总数: ${projectCount}`);
    console.log(`   📋 任务总数: ${taskCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✨ 测试数据生成成功！');
    console.log('\n💡 提示：');
    console.log('   - 可以在项目管理页面查看完整的项目层级');
    console.log('   - 任务包含多种状态：待办、进行中、已完成、已取消');
    console.log('   - 任务包含多种优先级：低、中、高');
    console.log('   - 项目和任务都有标签便于筛选');

  } catch (error: any) {
    console.error('\n❌ 生成测试数据失败:', error.message);
    throw error;
  }
}

/**
 * 递归创建项目及其子项目和任务
 */
async function createProjectWithChildren(
  projectData: TestProject,
  userId: string,
  parentId: string | null
): Promise<string> {
  // 创建项目
  const project = await ProjectModel.create({
    name: projectData.name,
    description: projectData.description,
    owner_id: userId,
    parent_id: parentId || undefined,
    status: projectData.status,
    priority: projectData.priority,
    start_date: getDate(projectData.startDaysOffset),
    end_date: getDate(projectData.endDaysOffset),
    tags: projectData.tags
  });

  // 创建项目的直接任务
  if (projectData.tasks && projectData.tasks.length > 0) {
    for (const taskData of projectData.tasks) {
      await TaskModel.create({
        title: taskData.title,
        description: taskData.description,
        project_id: project.id,
        creator_id: userId,
        assignee_id: userId, // 默认分配给创建者
        status: taskData.status,
        priority: taskData.priority,
        start_date: taskData.startDaysOffset !== undefined 
          ? getDate(taskData.startDaysOffset) 
          : undefined,
        due_date: taskData.dueDaysOffset !== undefined 
          ? getDate(taskData.dueDaysOffset) 
          : undefined,
        estimated_hours: taskData.estimatedHours,
        tags: taskData.tags
      });
    }
  }

  // 递归创建子项目
  if (projectData.subProjects && projectData.subProjects.length > 0) {
    for (const subProjectData of projectData.subProjects) {
      await createProjectWithChildren(subProjectData, userId, project.id);
    }
  }

  return project.id;
}

/**
 * 统计项目和任务数量
 */
function countProjectsAndTasks(projectData: TestProject): { projects: number; tasks: number } {
  let projects = 1; // 当前项目
  let tasks = projectData.tasks?.length || 0;

  if (projectData.subProjects) {
    for (const subProject of projectData.subProjects) {
      const subStats = countProjectsAndTasks(subProject);
      projects += subStats.projects;
      tasks += subStats.tasks;
    }
  }

  return { projects, tasks };
}

// 如果直接运行此文件
if (require.main === module) {
  seedProjectData()
    .then(() => {
      console.log('\n👋 数据生成完成，程序退出');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 发生错误:', error);
      process.exit(1);
    });
}

export default seedProjectData;

