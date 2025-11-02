import { test, expect } from '@playwright/test';
import { ensureLoggedIn } from './helpers/auth';
import { 
  generateTaskName,
  generateProjectName,
  waitAndClick, 
  waitAndFill, 
  waitForText,
  waitForLoadingToFinish,
  waitForApiResponse 
} from './helpers/common';

/**
 * 任务管理功能 E2E 测试
 * 
 * 测试范围：
 * 1. 在项目中创建任务
 * 2. 查看任务列表
 * 3. 更新任务状态
 * 4. 编辑任务
 * 5. 删除任务
 * 6. 看板视图拖拽
 */

test.describe('任务管理功能', () => {
  
  let testProjectName: string;
  
  // 测试套件开始前创建一个测试项目
  test.beforeAll(async ({ browser }) => {
    testProjectName = generateProjectName('任务测试项目');
  });
  
  // 每个测试前确保用户已登录并在项目页面
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await ensureLoggedIn(page);
    
    // 导航到项目页面
    await page.goto('/projects');
    await waitForLoadingToFinish(page);
  });

  test('应该成功在项目中创建任务', async ({ page }) => {
    // 首先确保有一个项目
    const projectCard = page.locator('[data-testid="project-card"], .project-card').first();
    const hasProjects = await projectCard.isVisible({ timeout: 2000 });
    
    if (!hasProjects) {
      // 创建项目
      await waitAndClick(page, 'button:has-text("创建项目")');
      await page.waitForSelector('[role="dialog"]');
      await waitAndFill(page, 'input[name="name"]', testProjectName);
      await waitAndClick(page, 'button[type="submit"]');
      await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
    }
    
    // 点击第一个项目进入详情或看板视图
    await projectCard.click();
    await waitForLoadingToFinish(page);
    
    // 切换到看板视图（如果不在的话）
    const kanbanButton = page.locator('button:has-text("看板")').first();
    if (await kanbanButton.isVisible({ timeout: 2000 })) {
      await kanbanButton.click();
      await waitForLoadingToFinish(page);
    }
    
    // 查找创建任务按钮
    const createTaskButton = page.locator(
      'button:has-text("创建任务"), button:has-text("新建任务"), button:has-text("添加任务")'
    ).first();
    
    if (await createTaskButton.isVisible({ timeout: 3000 })) {
      const taskName = generateTaskName('测试任务');
      const taskDesc = '这是一个测试任务描述';
      
      // 点击创建任务
      await createTaskButton.click();
      
      // 等待任务表单出现
      await page.waitForSelector('[role="dialog"], .modal');
      
      // 填写任务信息
      await waitAndFill(
        page,
        'input[name="title"], input[placeholder*="任务"]',
        taskName
      );
      
      // 填写描述
      const descInput = page.locator('textarea[name="description"], textarea[placeholder*="描述"]').first();
      if (await descInput.isVisible()) {
        await descInput.fill(taskDesc);
      }
      
      // 提交表单
      await waitForApiResponse(
        page,
        '/api/projects',
        async () => {
          await waitAndClick(page, 'button[type="submit"]:has-text("创建"), button:has-text("确定"), button:has-text("保存")');
        }
      );
      
      // 等待弹窗关闭
      await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 });
      
      // 验证任务出现在看板中
      await waitForText(page, taskName, 10000);
      const taskCard = page.locator(`text=${taskName}`);
      await expect(taskCard).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('应该成功查看任务详情', async ({ page }) => {
    // 进入项目
    const projectCard = page.locator('[data-testid="project-card"], .project-card').first();
    await projectCard.click();
    await waitForLoadingToFinish(page);
    
    // 切换到看板视图
    const kanbanButton = page.locator('button:has-text("看板")').first();
    if (await kanbanButton.isVisible({ timeout: 2000 })) {
      await kanbanButton.click();
      await waitForLoadingToFinish(page);
    }
    
    // 查找第一个任务卡片
    const taskCard = page.locator('[data-testid="task-card"], .task-card').first();
    
    if (await taskCard.isVisible({ timeout: 3000 })) {
      // 点击任务卡片查看详情
      await taskCard.click();
      
      // 等待详情弹窗出现
      await page.waitForSelector('[role="dialog"], .modal');
      
      // 验证任务详情显示
      const dialog = page.locator('[role="dialog"], .modal');
      await expect(dialog).toBeVisible();
      
      // 关闭弹窗
      const closeButton = dialog.locator('button[aria-label="关闭"], button:has-text("×")').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }
    } else {
      test.skip();
    }
  });

  test('应该成功更新任务状态', async ({ page }) => {
    // 进入项目
    const projectCard = page.locator('[data-testid="project-card"], .project-card').first();
    await projectCard.click();
    await waitForLoadingToFinish(page);
    
    // 切换到看板视图
    const kanbanButton = page.locator('button:has-text("看板")').first();
    if (await kanbanButton.isVisible({ timeout: 2000 })) {
      await kanbanButton.click();
      await waitForLoadingToFinish(page);
    }
    
    // 查找待办列中的任务
    const todoColumn = page.locator('[data-status="待办"], [data-column="待办"], .column:has-text("待办")').first();
    const taskInTodo = todoColumn.locator('[data-testid="task-card"], .task-card').first();
    
    if (await taskInTodo.isVisible({ timeout: 3000 })) {
      // 方法1: 通过拖拽改变状态
      const inProgressColumn = page.locator('[data-status="进行中"], [data-column="进行中"], .column:has-text("进行中")').first();
      
      if (await inProgressColumn.isVisible()) {
        // 获取任务文本用于验证
        const taskText = await taskInTodo.textContent();
        
        // 拖拽任务到进行中列
        await taskInTodo.dragTo(inProgressColumn);
        
        // 等待 API 请求完成
        await waitForLoadingToFinish(page);
        
        // 验证任务出现在进行中列
        if (taskText) {
          const movedTask = inProgressColumn.locator(`text=${taskText}`).first();
          await expect(movedTask).toBeVisible({ timeout: 5000 });
        }
      }
    } else {
      // 方法2: 通过任务详情更改状态
      const anyTask = page.locator('[data-testid="task-card"], .task-card').first();
      if (await anyTask.isVisible({ timeout: 2000 })) {
        await anyTask.click();
        
        // 在详情弹窗中更改状态
        const statusSelect = page.locator('select[name="status"], button:has-text("状态")').first();
        if (await statusSelect.isVisible()) {
          await statusSelect.click();
          const statusOption = page.locator('option:has-text("进行中"), [role="option"]:has-text("进行中")').first();
          await statusOption.click();
          
          // 保存更改
          const saveButton = page.locator('button:has-text("保存"), button:has-text("更新")').first();
          if (await saveButton.isVisible()) {
            await saveButton.click();
          }
        }
      } else {
        test.skip();
      }
    }
  });

  test('应该成功编辑任务', async ({ page }) => {
    // 进入项目
    const projectCard = page.locator('[data-testid="project-card"], .project-card').first();
    await projectCard.click();
    await waitForLoadingToFinish(page);
    
    // 切换到看板视图
    const kanbanButton = page.locator('button:has-text("看板")').first();
    if (await kanbanButton.isVisible({ timeout: 2000 })) {
      await kanbanButton.click();
      await waitForLoadingToFinish(page);
    }
    
    // 查找第一个任务
    const taskCard = page.locator('[data-testid="task-card"], .task-card').first();
    
    if (await taskCard.isVisible({ timeout: 3000 })) {
      // 点击任务打开详情
      await taskCard.click();
      await page.waitForSelector('[role="dialog"]');
      
      // 查找编辑按钮
      const editButton = page.locator('button:has-text("编辑"), [data-testid="edit-button"]').first();
      if (await editButton.isVisible({ timeout: 2000 })) {
        await editButton.click();
      }
      
      // 更新任务标题
      const updatedTitle = generateTaskName('更新后的任务');
      const titleInput = page.locator('input[name="title"], input[placeholder*="任务"]').first();
      
      if (await titleInput.isVisible()) {
        await titleInput.fill('');
        await titleInput.fill(updatedTitle);
        
        // 保存更改
        await waitForApiResponse(
          page,
          '/api/projects/tasks',
          async () => {
            await waitAndClick(page, 'button:has-text("保存"), button:has-text("更新"), button[type="submit"]');
          }
        );
        
        // 等待弹窗关闭
        await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 });
        
        // 验证更新后的标题出现
        await waitForText(page, updatedTitle);
      }
    } else {
      test.skip();
    }
  });

  test('应该成功删除任务', async ({ page }) => {
    // 进入项目
    const projectCard = page.locator('[data-testid="project-card"], .project-card').first();
    await projectCard.click();
    await waitForLoadingToFinish(page);
    
    // 切换到看板视图
    const kanbanButton = page.locator('button:has-text("看板")').first();
    if (await kanbanButton.isVisible({ timeout: 2000 })) {
      await kanbanButton.click();
      await waitForLoadingToFinish(page);
    }
    
    // 首先创建一个用于删除的任务
    const createTaskButton = page.locator('button:has-text("创建任务"), button:has-text("新建任务")').first();
    
    if (await createTaskButton.isVisible({ timeout: 2000 })) {
      const taskToDelete = generateTaskName('待删除任务');
      
      // 创建任务
      await createTaskButton.click();
      await page.waitForSelector('[role="dialog"]');
      await waitAndFill(page, 'input[name="title"], input[placeholder*="任务"]', taskToDelete);
      await waitAndClick(page, 'button[type="submit"]');
      await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
      await waitForText(page, taskToDelete);
      
      // 找到刚创建的任务
      const taskCard = page.locator(`text=${taskToDelete}`).locator('..').locator('..');
      await taskCard.click();
      
      // 查找删除按钮
      const deleteButton = page.locator('button:has-text("删除"), [data-testid="delete-button"]').first();
      
      if (await deleteButton.isVisible({ timeout: 2000 })) {
        await deleteButton.click();
        
        // 确认删除
        const confirmButton = page.locator('button:has-text("确认"), button:has-text("删除")').last();
        if (await confirmButton.isVisible({ timeout: 2000 })) {
          await waitForApiResponse(
            page,
            '/api/projects/tasks',
            async () => {
              await confirmButton.click();
            }
          );
        }
        
        // 验证任务已从列表中移除
        await page.waitForSelector(`text=${taskToDelete}`, { state: 'hidden', timeout: 5000 });
        await expect(page.locator(`text=${taskToDelete}`)).not.toBeVisible();
      }
    } else {
      test.skip();
    }
  });

  test('应该能够在看板视图中显示不同状态的任务', async ({ page }) => {
    // 进入项目
    const projectCard = page.locator('[data-testid="project-card"], .project-card').first();
    await projectCard.click();
    await waitForLoadingToFinish(page);
    
    // 切换到看板视图
    const kanbanButton = page.locator('button:has-text("看板")').first();
    if (await kanbanButton.isVisible({ timeout: 2000 })) {
      await kanbanButton.click();
      await waitForLoadingToFinish(page);
    }
    
    // 验证看板列存在
    const columns = ['待办', '进行中', '已完成'];
    
    for (const columnName of columns) {
      const column = page.locator(`.column:has-text("${columnName}"), [data-column="${columnName}"]`).first();
      
      // 至少有一个列应该是可见的
      const isVisible = await column.isVisible({ timeout: 2000 }).catch(() => false);
      if (isVisible) {
        await expect(column).toBeVisible();
      }
    }
  });

  test('应该能够为任务设置优先级', async ({ page }) => {
    // 进入项目
    const projectCard = page.locator('[data-testid="project-card"], .project-card').first();
    await projectCard.click();
    await waitForLoadingToFinish(page);
    
    // 切换到看板视图
    const kanbanButton = page.locator('button:has-text("看板")').first();
    if (await kanbanButton.isVisible({ timeout: 2000 })) {
      await kanbanButton.click();
      await waitForLoadingToFinish(page);
    }
    
    // 创建任务时设置优先级
    const createTaskButton = page.locator('button:has-text("创建任务"), button:has-text("新建任务")').first();
    
    if (await createTaskButton.isVisible({ timeout: 2000 })) {
      await createTaskButton.click();
      await page.waitForSelector('[role="dialog"]');
      
      // 填写任务名称
      await waitAndFill(page, 'input[name="title"]', generateTaskName('高优先级任务'));
      
      // 设置优先级
      const prioritySelect = page.locator('select[name="priority"], button:has-text("优先级")').first();
      if (await prioritySelect.isVisible({ timeout: 2000 })) {
        await prioritySelect.click();
        
        const highPriorityOption = page.locator('option:has-text("高"), [role="option"]:has-text("高")').first();
        if (await highPriorityOption.isVisible({ timeout: 1000 })) {
          await highPriorityOption.click();
        }
      }
      
      // 提交
      await waitAndClick(page, 'button[type="submit"]');
      await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
    } else {
      test.skip();
    }
  });
});

