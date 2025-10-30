// 前端枚举中文/英文映射工具（统一提交到后端的英文枚举）

export type ProjectStatusEn = 'planning' | 'active' | 'paused' | 'completed';
export type ProjectPriorityEn = 'low' | 'medium' | 'high';
export type ProjectRoleEn = 'admin' | 'member' | 'observer';

// 项目状态映射（包含常见中文标签与英文别名）
export const mapProjectStatusToEnglish = (value?: string): ProjectStatusEn | undefined => {
  if (!value) return undefined;
  switch (value.trim()) {
    // 英文枚举与同义词
    case 'planning':
      return 'planning';
    case 'active':
      return 'active';
    case 'paused':
      return 'paused';
    case 'completed':
      return 'completed';
    case 'archived':
      // 前端“归档”统一为 completed，保持与后端一致
      return 'completed';

    // 中文标签
    case '规划中':
      return 'planning';
    case '进行中':
      return 'active';
    case '暂停':
    case '已暂停':
      return 'paused';
    case '完成':
    case '已完成':
      return 'completed';
    case '归档':
    case '已归档':
      return 'completed';
    default:
      return undefined;
  }
};

// 项目优先级映射（包含常见中文标签与英文别名）
export const mapProjectPriorityToEnglish = (value?: string): ProjectPriorityEn | undefined => {
  if (!value) return undefined;
  switch (value.trim()) {
    // 英文枚举
    case 'low':
      return 'low';
    case 'medium':
      return 'medium';
    case 'high':
      return 'high';

    // 中文标签
    case '低':
    case '低优先级':
      return 'low';
    case '中':
    case '中优先级':
      return 'medium';
    case '高':
    case '高优先级':
      return 'high';
    default:
      return undefined;
  }
};

// 成员角色映射（包含中文标签）
export const mapRoleToEnglish = (value?: string): ProjectRoleEn | undefined => {
  if (!value) return undefined;
  switch (value.trim()) {
    case 'admin':
      return 'admin';
    case 'member':
      return 'member';
    case 'observer':
      return 'observer';
    case '管理员':
      return 'admin';
    case '成员':
      return 'member';
    case '观察者':
      return 'observer';
    default:
      return undefined;
  }
};