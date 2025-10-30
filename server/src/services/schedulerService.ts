import { NotificationService } from './notificationService';

export class SchedulerService {
  private static notificationInterval: NodeJS.Timeout | null = null;
  private static cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * 启动通知调度器
   * 每分钟检查一次待办事项，生成相应的通知
   */
  static startNotificationScheduler(): void {
    if (this.notificationInterval) {
      console.log('Notification scheduler is already running');
      return;
    }

    console.log('Starting notification scheduler...');
    
    // 立即执行一次
    this.generateNotifications();
    
    // 每分钟执行一次
    this.notificationInterval = setInterval(() => {
      this.generateNotifications();
    }, 60 * 1000); // 60秒

    console.log('Notification scheduler started successfully');
  }

  /**
   * 停止通知调度器
   */
  static stopNotificationScheduler(): void {
    if (this.notificationInterval) {
      clearInterval(this.notificationInterval);
      this.notificationInterval = null;
      console.log('Notification scheduler stopped');
    }
  }

  /**
   * 启动清理调度器
   * 每小时清理一次过期通知（已读超过一周的通知）
   */
  static startCleanupScheduler(): void {
    if (this.cleanupInterval) {
      console.log('Cleanup scheduler is already running');
      return;
    }

    console.log('Starting cleanup scheduler...');
    
    // 每小时执行一次清理
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredNotifications();
    }, 60 * 60 * 1000); // 1小时

    console.log('Cleanup scheduler started successfully');
  }

  /**
   * 停止清理调度器
   */
  static stopCleanupScheduler(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('Cleanup scheduler stopped');
    }
  }

  /**
   * 启动所有调度器
   */
  static startAll(): void {
    this.startNotificationScheduler();
    this.startCleanupScheduler();
  }

  /**
   * 停止所有调度器
   */
  static stopAll(): void {
    this.stopNotificationScheduler();
    this.stopCleanupScheduler();
  }

  /**
   * 生成通知的私有方法
   */
  private static async generateNotifications(): Promise<void> {
    try {
      await NotificationService.generateTodoNotifications();
    } catch (error) {
      console.error('Error in notification generation:', error);
    }
  }

  /**
   * 清理过期通知的私有方法
   */
  private static async cleanupExpiredNotifications(): Promise<void> {
    try {
      const deletedCount = await NotificationService.cleanupExpiredNotifications();
      if (deletedCount > 0) {
        console.log(`Cleaned up ${deletedCount} expired notifications`);
      }
    } catch (error) {
      console.error('Error in notification cleanup:', error);
    }
  }

  /**
   * 获取调度器状态
   */
  static getStatus(): {
    notificationScheduler: boolean;
    cleanupScheduler: boolean;
  } {
    return {
      notificationScheduler: this.notificationInterval !== null,
      cleanupScheduler: this.cleanupInterval !== null
    };
  }
}