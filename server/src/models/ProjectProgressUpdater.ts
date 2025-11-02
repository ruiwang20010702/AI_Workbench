import { supabaseAdmin } from '../config/database';

export class ProjectProgressUpdater {
  /**
   * 更新单个项目的进度
   * @param projectId 项目ID
   */
  static async updateProjectProgress(projectId: string): Promise<void> {
    // 获取项目的所有任务
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('tasks')
      .select('status')
      .eq('project_id', projectId);

    if (tasksError) {
      console.error('Error fetching tasks for progress update:', tasksError);
      throw tasksError;
    }

    // 计算进度
    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
    const progress = totalTasks === 0 ? 0 : Math.round((completedTasks * 100) / totalTasks * 100) / 100;

    // 更新项目进度
    const { error: updateError } = await supabaseAdmin
      .from('projects')
      .update({ 
        progress,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    if (updateError) {
      console.error('Error updating project progress:', updateError);
      throw updateError;
    }
  }

  /**
   * 更新所有项目的进度
   */
  static async updateAllProjectsProgress(): Promise<void> {
    // 获取所有项目
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('id');

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      throw projectsError;
    }

    // 批量更新每个项目的进度
    if (projects) {
      for (const project of projects) {
        try {
          await this.updateProjectProgress(project.id);
        } catch (error) {
          console.error(`Error updating progress for project ${project.id}:`, error);
          // 继续处理其他项目
        }
      }
    }
  }

  /**
   * 当任务状态更新时，自动更新相关项目的进度
   * @param projectId 项目ID
   */
  static async onTaskStatusChanged(projectId: string): Promise<void> {
    await this.updateProjectProgress(projectId);
  }
}
