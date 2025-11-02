-- 创建待定成员表
-- 用于存储尚未注册的用户邮箱，当用户注册时自动转换为正式成员

CREATE TABLE IF NOT EXISTS pending_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'observer')),
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 唯一约束：同一项目中同一邮箱只能有一个待定成员记录
  CONSTRAINT unique_project_email UNIQUE(project_id, email)
);

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_pending_members_email ON pending_members(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_pending_members_project ON pending_members(project_id);
CREATE INDEX IF NOT EXISTS idx_pending_members_invited_by ON pending_members(invited_by);
CREATE INDEX IF NOT EXISTS idx_pending_members_created_at ON pending_members(created_at DESC);

-- 添加更新时间触发器
CREATE TRIGGER update_pending_members_updated_at 
  BEFORE UPDATE ON pending_members 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 添加注释
COMMENT ON TABLE pending_members IS '待定成员表：存储未注册用户的邮箱邀请';
COMMENT ON COLUMN pending_members.id IS '主键ID';
COMMENT ON COLUMN pending_members.project_id IS '项目ID';
COMMENT ON COLUMN pending_members.email IS '待定用户的邮箱地址';
COMMENT ON COLUMN pending_members.role IS '预设角色：admin=管理员, member=成员, observer=观察者';
COMMENT ON COLUMN pending_members.invited_by IS '邀请人的用户ID';
COMMENT ON COLUMN pending_members.created_at IS '创建时间';
COMMENT ON COLUMN pending_members.updated_at IS '更新时间';

