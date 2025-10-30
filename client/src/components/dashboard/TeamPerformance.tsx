import React from 'react';
import { Users, TrendingUp, Award, Clock, Target } from 'lucide-react';
import { cn } from '../../utils/cn';

interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  tasksCompleted: number;
  tasksTotal: number;
  hoursWorked: number;
  efficiency: number; // 0-100
  projects: string[];
}

interface TeamPerformanceProps {
  teamMembers: TeamMember[];
  title?: string;
  showDetails?: boolean;
}

export const TeamPerformance: React.FC<TeamPerformanceProps> = ({
  teamMembers,
  title = "团队绩效",
  showDetails = true
}) => {
  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-green-600 bg-green-100';
    if (efficiency >= 75) return 'text-blue-600 bg-blue-100';
    if (efficiency >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getEfficiencyLabel = (efficiency: number) => {
    if (efficiency >= 90) return '优秀';
    if (efficiency >= 75) return '良好';
    if (efficiency >= 60) return '一般';
    return '需改进';
  };

  const sortedMembers = [...teamMembers].sort((a, b) => b.efficiency - a.efficiency);
  
  const teamStats = {
    totalTasks: teamMembers.reduce((sum, member) => sum + member.tasksTotal, 0),
    completedTasks: teamMembers.reduce((sum, member) => sum + member.tasksCompleted, 0),
    totalHours: teamMembers.reduce((sum, member) => sum + member.hoursWorked, 0),
    avgEfficiency: teamMembers.length > 0 
      ? Math.round(teamMembers.reduce((sum, member) => sum + member.efficiency, 0) / teamMembers.length)
      : 0
  };

  const completionRate = teamStats.totalTasks > 0 
    ? Math.round((teamStats.completedTasks / teamStats.totalTasks) * 100)
    : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <TrendingUp className="w-4 h-4" />
          <span>{teamMembers.length} 名成员</span>
        </div>
      </div>

      {/* Team Overview Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Target className="w-4 h-4 text-blue-600 mr-1" />
            <span className="text-2xl font-bold text-blue-600">{completionRate}%</span>
          </div>
          <p className="text-xs text-gray-600">完成率</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Award className="w-4 h-4 text-green-600 mr-1" />
            <span className="text-2xl font-bold text-green-600">{teamStats.avgEfficiency}%</span>
          </div>
          <p className="text-xs text-gray-600">平均效率</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Clock className="w-4 h-4 text-purple-600 mr-1" />
            <span className="text-2xl font-bold text-purple-600">{teamStats.totalHours}</span>
          </div>
          <p className="text-xs text-gray-600">总工时</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Users className="w-4 h-4 text-orange-600 mr-1" />
            <span className="text-2xl font-bold text-orange-600">{teamStats.completedTasks}</span>
          </div>
          <p className="text-xs text-gray-600">已完成任务</p>
        </div>
      </div>

      {/* Team Members List */}
      <div className="space-y-4">
        {sortedMembers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3" />
            <p>暂无团队成员数据</p>
          </div>
        ) : (
          sortedMembers.map((member, index) => (
            <div
              key={member.id}
              className="flex items-center space-x-4 p-4 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow"
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-8 text-center">
                {index < 3 ? (
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white",
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    'bg-orange-500'
                  )}>
                    {index + 1}
                  </div>
                ) : (
                  <span className="text-sm text-gray-500 font-medium">{index + 1}</span>
                )}
              </div>

              {/* Avatar */}
              <div className="flex-shrink-0">
                {member.avatar ? (
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {member.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Member Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-medium text-gray-900 truncate">{member.name}</h4>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    {member.role}
                  </span>
                </div>
                {showDetails && (
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>任务: {member.tasksCompleted}/{member.tasksTotal}</span>
                    <span>工时: {member.hoursWorked}h</span>
                    <span>项目: {member.projects.length}</span>
                  </div>
                )}
              </div>

              {/* Performance Metrics */}
              <div className="flex items-center space-x-4">
                {/* Task Completion */}
                <div className="text-center">
                  <div className="text-sm font-bold text-gray-900">
                    {member.tasksTotal > 0 
                      ? Math.round((member.tasksCompleted / member.tasksTotal) * 100)
                      : 0}%
                  </div>
                  <div className="text-xs text-gray-500">完成率</div>
                </div>

                {/* Efficiency */}
                <div className="text-center">
                  <div className={cn(
                    "px-3 py-1 rounded-full text-sm font-medium",
                    getEfficiencyColor(member.efficiency)
                  )}>
                    {member.efficiency}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {getEfficiencyLabel(member.efficiency)}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {showDetails && (
                <div className="w-24">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${member.tasksTotal > 0 
                          ? (member.tasksCompleted / member.tasksTotal) * 100 
                          : 0}%` 
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Performance Insights */}
      {teamMembers.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">绩效洞察</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2 text-green-600">
              <Award className="w-4 h-4" />
              <span>
                最佳表现: {sortedMembers[0]?.name} ({sortedMembers[0]?.efficiency}% 效率)
              </span>
            </div>
            <div className="flex items-center space-x-2 text-blue-600">
              <Target className="w-4 h-4" />
              <span>
                团队目标完成率: {completionRate}%
              </span>
            </div>
            <div className="flex items-center space-x-2 text-purple-600">
              <Clock className="w-4 h-4" />
              <span>
                平均工时: {teamMembers.length > 0 
                  ? Math.round(teamStats.totalHours / teamMembers.length) 
                  : 0}h/人
              </span>
            </div>
            <div className="flex items-center space-x-2 text-orange-600">
              <TrendingUp className="w-4 h-4" />
              <span>
                高效成员: {teamMembers.filter(m => m.efficiency >= 75).length}/{teamMembers.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};