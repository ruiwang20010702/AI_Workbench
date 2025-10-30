import pool from '../config/database';

export class ProjectProgressUpdater {
  /**
   * 更新单个项目的进度
   * @param projectId 项目ID
   */
  static async updateProjectProgress(projectId: string): Promise<void> {
    const query = `
      UPDATE projects 
      SET progress = COALESCE(
        CASE 
          WHEN (SELECT COUNT(*) FROM tasks WHERE project_id = $1) = 0 THEN 0
          ELSE ROUND(
            (SELECT COUNT(*) FROM tasks WHERE project_id = $1 AND status = 'completed') * 100.0 / 
            (SELECT COUNT(*) FROM tasks WHERE project_id = $1)
          , 2)
        END, 0
      ),
      updated_at = NOW()
      WHERE id = $1
    `;
    
    await pool.query(query, [projectId]);
  }

  /**
   * 更新所有项目的进度
   */
  static async updateAllProjectsProgress(): Promise<void> {
    const query = `
      UPDATE projects 
      SET progress = COALESCE(
        CASE 
          WHEN task_counts.total_tasks = 0 THEN 0
          ELSE ROUND(
            task_counts.completed_tasks * 100.0 / task_counts.total_tasks, 2
          )
        END, 0
      ),
      updated_at = NOW()
      FROM (
        SELECT 
          p.id,
          COUNT(t.id) as total_tasks,
          COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks
        FROM projects p
        LEFT JOIN tasks t ON p.id = t.project_id
        GROUP BY p.id
      ) as task_counts
      WHERE projects.id = task_counts.id
    `;
    
    await pool.query(query);
  }

  /**
   * 当任务状态更新时，自动更新相关项目的进度
   * @param projectId 项目ID
   */
  static async onTaskStatusChanged(projectId: string): Promise<void> {
    await this.updateProjectProgress(projectId);
  }
}