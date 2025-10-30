import React, { useMemo, useState } from 'react';
import type { Task } from '../../services/taskService.ts';

interface ProjectGanttChartProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onCreateTask: (startDate: string, dueDate: string) => void;
}

// 将日期字符串转为 Date（兼容 ISO）
const toDate = (val?: string): Date | null => {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

// 计算两个日期之间的天数差（包含端点）
const diffDaysInclusive = (start: Date, end: Date) => {
  const msPerDay = 24 * 60 * 60 * 1000;
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  return Math.max(0, Math.round((e - s) / msPerDay)) + 1;
};

const formatYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const ProjectGanttChart: React.FC<ProjectGanttChartProps> = ({ tasks, onEdit, onCreateTask }) => {
  const now = new Date();

  // 计算时间范围：若有任务日期则用任务最早开始到最晚结束，否则用今天起 21 天
  const { startDate, endDate } = useMemo(() => {
    let min: Date | null = null;
    let max: Date | null = null;
    tasks.forEach(t => {
      const s = toDate(t.start_date || t.due_date);
      const e = toDate(t.due_date || t.start_date);
      if (s && (!min || s < min)) min = s;
      if (e && (!max || e > max)) max = e;
    });
    if (!min || !max) {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(start.getTime() + 20 * 24 * 60 * 60 * 1000);
      return { startDate: start, endDate: end };
    }
    return { startDate: min!, endDate: max! };
  }, [tasks]);

  const totalDays = useMemo(() => diffDaysInclusive(startDate, endDate), [startDate, endDate]);

  // 生成日期列
  const days = useMemo(() => {
    const out: Date[] = [];
    for (let i = 0; i < totalDays; i++) {
      out.push(new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000));
    }
    return out;
  }, [startDate, totalDays]);

  const [newStart, setNewStart] = useState<string>(formatYMD(startDate));
  const [newEnd, setNewEnd] = useState<string>(formatYMD(endDate));

  const statusColor = (s: Task['status']) => {
    if (s === 'completed') return 'bg-green-500';
    if (s === 'in_progress') return 'bg-blue-500';
    return 'bg-gray-500';
  };

  return (
    <div className="space-y-4">
      {/* 创建任务区域 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">开始日期</label>
          <input
            type="date"
            value={newStart}
            onChange={(e) => setNewStart(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded-md text-sm"
          />
          <label className="text-sm text-gray-600">结束日期</label>
          <input
            type="date"
            value={newEnd}
            onChange={(e) => setNewEnd(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded-md text-sm"
          />
          <button
            onClick={() => onCreateTask(newStart, newEnd)}
            className="ml-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            创建任务（选定日期）
          </button>
        </div>
        <div className="text-xs text-gray-500">
          共 {totalDays} 天，范围 {formatYMD(startDate)} ~ {formatYMD(endDate)}
        </div>
      </div>

      {/* 时间刻度头 */}
      <div className="grid" style={{ gridTemplateColumns: `200px 1fr` }}>
        <div className="px-2 py-1 text-xs font-medium text-gray-500">任务</div>
        <div className="flex">
          {days.map((d, i) => (
            <div key={i} className="flex-1 border-l border-gray-200 text-center text-xs text-gray-500 py-1">
              {d.getMonth() + 1}/{d.getDate()}
            </div>
          ))}
        </div>
      </div>

      {/* 任务行 */}
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">暂无任务，使用上方日期快速创建</div>
        ) : (
          tasks.map((t) => {
            const s = toDate(t.start_date || t.due_date);
            const e = toDate(t.due_date || t.start_date);
            let leftPct = 0;
            let widthPct = 0;
            if (s && e) {
              const startOffset = diffDaysInclusive(startDate, s) - 1; // 从 0 开始
              const span = diffDaysInclusive(s, e);
              leftPct = (startOffset / totalDays) * 100;
              widthPct = Math.max(1, (span / totalDays) * 100);
            }
            return (
              <div key={t.id} className="grid items-center" style={{ gridTemplateColumns: `200px 1fr` }}>
                <div className="px-2 py-2">
                  <div className="text-sm font-medium text-gray-900">{t.title}</div>
                  <div className="text-xs text-gray-500">{t.assignee_name || '未指定负责人'} · {t.status === 'pending' ? '待处理' : t.status === 'in_progress' ? '进行中' : '已完成'}</div>
                </div>
                <div className="relative h-8">
                  {/* 背景网格 */}
                  <div className="absolute inset-0 flex">
                    {days.map((_, i) => (
                      <div key={i} className="flex-1 border-l border-gray-200" />
                    ))}
                  </div>
                  {/* 任务条 */}
                  {s && e ? (
                    <div
                      className={`${statusColor(t.status)} absolute top-1 bottom-1 rounded-md opacity-90 hover:opacity-100 cursor-pointer`}
                      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      title={`${formatYMD(s)} ~ ${formatYMD(e)}`}
                      onClick={() => onEdit(t)}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center">
                      <span className="text-xs text-gray-400">无日期</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};