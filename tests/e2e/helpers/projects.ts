import { Page } from '@playwright/test';
import { waitAndFill, waitAndClick } from './common';

/**
 * 生成唯一的项目名称（用于测试）
 */
export function generateProjectName(prefix: string = '测试项目'): string {
  return `${prefix}_${Date.now()}`;
}

/**
 * 创建测试项目（使用4步向导）
 * @param page Playwright Page 对象
 * @param projectData 项目数据
 */
export async function createTestProject(
  page: Page,
  projectData: {
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    priority?: string;
  }
): Promise<void> {
  // 点击"创建项目"按钮
  await waitAndClick(page, 'button:has-text("创建项目")');

  // 等待弹窗出现
  await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

  // 第1步：基本信息
  await waitAndFill(page, 'input[placeholder*="项目名称"]', projectData.name);
  
  // 填写描述（如果字段存在且提供了值）
  if (projectData.description) {
    const descField = page.locator('textarea[placeholder*="项目描述"], textarea[name="description"]').first();
    const isDescVisible = await descField.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (isDescVisible) {
      await descField.fill(projectData.description);
    }
  }
  
  // 填写日期（必填字段，在第1步）
  const today = new Date().toISOString().split('T')[0];
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const startDateInputs = page.locator('input[type="date"]');
  await startDateInputs.first().fill(projectData.startDate || today);
  
  const endDateInputs = page.locator('input[type="date"]');
  await endDateInputs.last().fill(projectData.endDate || nextMonth);

  // 点击"下一步" - 进入第2步（设置）
  await waitAndClick(page, 'button:has-text("下一步")');
  await page.waitForTimeout(500);

  // 第2步：设置

  if (projectData.status) {
    await page.selectOption('select:has-option("进行中")', projectData.status);
  }

  if (projectData.priority) {
    await page.selectOption('select:has-option("中")', projectData.priority);
  }

  // 点击"下一步" - 进入第3步（团队成员）
  await waitAndClick(page, 'button:has-text("下一步")');
  await page.waitForTimeout(500);

  // 第3步：团队成员（最后一步，可以跳过）
  // 点击"创建项目"按钮提交表单
  const submitButton = page.locator('button[type="submit"]:has-text("创建项目")');
  await submitButton.waitFor({ state: 'visible', timeout: 5000 });
  
  // 点击提交按钮并等待API响应
  await Promise.all([
    // 等待API响应（可能是POST创建或PUT更新）
    page.waitForResponse(
      response => {
        const url = response.url();
        const method = response.request().method();
        return url.includes('/api/projects') && (method === 'POST' || method === 'PUT');
      },
      { timeout: 15000 }
    ),
    submitButton.click(),
  ]);

  // 等待弹窗关闭或项目出现在列表中（两者之一即可）
  await Promise.race([
    page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 10000 }),
    page.waitForSelector(`[data-testid="project-card"]:has-text("${projectData.name}")`, { timeout: 10000 })
  ]).catch(async () => {
    // 如果弹窗没有自动关闭，手动按ESC关闭
    console.warn('弹窗没有自动关闭，手动关闭');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  // 等待UI更新
  await page.waitForTimeout(1000);
}

/**
 * 打开项目的"更多"菜单
 * @param page Playwright Page 对象
 * @param projectName 项目名称
 */
export async function openProjectMenu(
  page: Page,
  projectName: string
): Promise<void> {
  // 查找包含项目名称的项目卡片
  const projectCard = page
    .locator('[data-testid="project-card"]')
    .filter({ hasText: projectName });

  // 点击"更多"按钮
  const moreButton = projectCard.locator('button[aria-label="更多操作"]');
  await moreButton.click();

  // 等待菜单出现
  await page.waitForTimeout(300);
}

/**
 * 查看项目详情
 * @param page Playwright Page 对象
 * @param projectName 项目名称
 */
export async function viewProjectDetails(
  page: Page,
  projectName: string
): Promise<void> {
  await openProjectMenu(page, projectName);
  await waitAndClick(page, 'text=查看详情');
  
  // 等待详情弹窗出现
  await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
}

/**
 * 编辑项目
 * @param page Playwright Page 对象
 * @param projectName 项目名称
 */
export async function editProject(
  page: Page,
  projectName: string
): Promise<void> {
  await openProjectMenu(page, projectName);
  await waitAndClick(page, 'text=编辑项目');
  
  // 等待编辑弹窗出现
  await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
}

/**
 * 删除项目
 * @param page Playwright Page 对象
 * @param projectName 项目名称
 * @param confirm 是否确认删除（默认true）
 */
export async function deleteProject(
  page: Page,
  projectName: string,
  confirm: boolean = true
): Promise<void> {
  await openProjectMenu(page, projectName);
  
  // 设置对话框处理器
  page.once('dialog', async (dialog) => {
    if (confirm) {
      await dialog.accept();
    } else {
      await dialog.dismiss();
    }
  });
  
  await waitAndClick(page, 'text=删除项目');
  
  // 等待删除完成
  await page.waitForTimeout(2000);
  
  if (confirm) {
    // 验证项目已从列表中移除
    await page.waitForSelector(`text=${projectName}`, { 
      state: 'hidden', 
      timeout: 5000 
    });
  }
}

/**
 * 更新项目信息（在编辑模式下）
 * @param page Playwright Page 对象
 * @param updates 要更新的字段
 */
export async function updateProjectInModal(
  page: Page,
  updates: {
    name?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    priority?: string;
  }
): Promise<void> {
  // 如果需要更新基本信息（第1步）
  if (updates.name || updates.description) {
    if (updates.name) {
      await waitAndFill(page, 'input[placeholder*="项目名称"]', updates.name, {
        clear: true,
      });
    }

    if (updates.description) {
      await waitAndFill(
        page,
        'textarea[placeholder*="项目描述"]',
        updates.description,
        { clear: true }
      );
    }
  }

  // 导航到第2步（设置）
  await waitAndClick(page, 'button:has-text("下一步")');
  await page.waitForTimeout(500);

  // 如果需要更新设置（第2步）
  if (updates.startDate) {
    const startDateInputs = page.locator('input[type="date"]');
    await startDateInputs.first().fill(updates.startDate);
  }

  if (updates.endDate) {
    const endDateInputs = page.locator('input[type="date"]');
    await endDateInputs.last().fill(updates.endDate);
  }

  if (updates.status) {
    await page.selectOption('select:has-option("进行中")', updates.status);
  }

  if (updates.priority) {
    await page.selectOption('select:has-option("中")', updates.priority);
  }

  // 导航到第3步（团队成员）
  await waitAndClick(page, 'button:has-text("下一步")');
  await page.waitForTimeout(500);

  // 导航到第4步（审核）
  await waitAndClick(page, 'button:has-text("下一步")');
  await page.waitForTimeout(500);

  // 提交更改
  await waitAndClick(page, 'button[type="submit"]');

  // 等待弹窗关闭
  await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 10000 });

  // 等待更新生效
  await page.waitForTimeout(2000);
}

/**
 * 在项目列表中查找项目
 * @param page Playwright Page 对象
 * @param projectName 项目名称
 * @returns 项目是否存在
 */
export async function projectExists(
  page: Page,
  projectName: string
): Promise<boolean> {
  try {
    await page.waitForSelector(`text=${projectName}`, { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * 切换视图模式
 * @param page Playwright Page 对象
 * @param viewMode 视图模式名称
 */
export async function switchViewMode(
  page: Page,
  viewMode: '看板视图' | '甘特图' | '层级视图' | '仪表盘'
): Promise<void> {
  const button = page.locator(`button:has-text("${viewMode}")`).first();
  await button.click();
  await page.waitForTimeout(500);
}

/**
 * 搜索项目
 * @param page Playwright Page 对象
 * @param keyword 搜索关键词
 */
export async function searchProjects(
  page: Page,
  keyword: string
): Promise<void> {
  await waitAndFill(page, 'input[placeholder*="搜索"]', keyword);
  await page.waitForTimeout(1000);
}

/**
 * 筛选项目状态
 * @param page Playwright Page 对象
 * @param status 状态
 */
export async function filterByStatus(
  page: Page,
  status: string
): Promise<void> {
  await page.selectOption('select[aria-label*="状态"]', status);
  await page.waitForTimeout(1000);
}

