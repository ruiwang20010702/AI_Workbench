import React from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { ProjectMember } from '../../services/projectService';
import { cn } from '../../utils/cn';
import { Mail, Shield, Calendar, Crown, Eye } from 'lucide-react';

interface ProjectMemberCardProps {
  member: ProjectMember;
  onUpdateRole?: (member: ProjectMember, role: ProjectMember['role']) => void;
  onRemove?: (member: ProjectMember) => void;
  currentUserRole?: ProjectMember['role'];
  className?: string;
}

const roleColors: Record<ProjectMember['role'], string> = {
  admin: 'bg-red-100 text-red-800',
  member: 'bg-blue-100 text-blue-800',
  observer: 'bg-gray-100 text-gray-800'
};

const roleLabels: Record<ProjectMember['role'], string> = {
  admin: '管理员',
  member: '成员',
  observer: '观察者'
};

const roleIcons: Record<ProjectMember['role'], React.ElementType> = {
  admin: Crown,
  member: Shield,
  observer: Eye
};

export const ProjectMemberCard: React.FC<ProjectMemberCardProps> = ({
  member,
  onUpdateRole,
  onRemove,
  currentUserRole = 'member',
  className
}) => {
  const [showRoleDropdown, setShowRoleDropdown] = React.useState(false);
  const canManageMembers = currentUserRole === 'admin';
  const RoleIcon = roleIcons[member.role];

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {/* 头像 */}
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
              {member.user.avatar ? (
                <img 
                  src={member.user.avatar} 
                  alt={member.user.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                member.user.name.charAt(0).toUpperCase()
              )}
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {member.user.name}
              </h3>
              <div className="flex items-center text-sm text-gray-600 mt-1">
                <Mail className="w-4 h-4 mr-1" />
                {member.user.email}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={cn(
              'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full',
              roleColors[member.role]
            )}>
              <RoleIcon className="w-3 h-3 mr-1" />
              {roleLabels[member.role]}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* 加入时间 */}
        <div className="flex items-center text-sm text-gray-600 mb-4">
          <Calendar className="w-4 h-4 mr-2" />
          <span>加入时间: {new Date(member.joined_at).toLocaleDateString()}</span>
        </div>

        {/* 操作按钮 */}
        {canManageMembers && member.role !== 'admin' && (
          <div className="flex items-center justify-between">
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              >
                更改角色
              </Button>
              
              {showRoleDropdown && (
                <div className="absolute left-0 top-8 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="py-1">
                    {(Object.keys(roleLabels) as ProjectMember['role'][]).map((role) => (
                      <button
                        key={role}
                        onClick={() => {
                          if (onUpdateRole && role !== member.role) {
                            onUpdateRole(member, role);
                          }
                          setShowRoleDropdown(false);
                        }}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm hover:bg-gray-100',
                          role === member.role ? 'bg-gray-50 text-gray-400' : 'text-gray-700'
                        )}
                        disabled={role === member.role}
                      >
                        <div className="flex items-center">
                          {React.createElement(roleIcons[role], { 
                            className: "w-3 h-3 mr-2" 
                          })}
                          {roleLabels[role]}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {onRemove && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRemove(member)}
                className="text-red-600 hover:text-red-700 hover:border-red-300"
              >
                移除
              </Button>
            )}
          </div>
        )}

        {/* 管理员不显示操作按钮 */}
        {member.role === 'admin' && (
          <div className="text-sm text-gray-500 italic">
            项目管理员
          </div>
        )}

        {/* 非管理员用户不显示操作按钮 */}
        {!canManageMembers && (
          <div className="text-sm text-gray-500">
            {member.role === 'admin' ? '项目管理员' : '项目成员'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};