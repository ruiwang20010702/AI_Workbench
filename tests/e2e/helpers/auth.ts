import { Page } from '@playwright/test';

/**
 * 认证辅助工具
 * 提供登录、注册、登出等功能
 */

/**
 * 测试用户信息
 */
export const TEST_USER = {
  email: 'test@example1.com',
  password: 'Test123456!',
  username: 'E2E Test User'
};

/**
 * 登录功能
 * @param page Playwright Page 对象
 * @param email 用户邮箱（可选，默认使用测试用户）
 * @param password 密码（可选，默认使用测试密码）
 */
export async function login(
  page: Page, 
  email: string = TEST_USER.email, 
  password: string = TEST_USER.password
): Promise<void> {
  // 导航到登录页
  await page.goto('/login');
  
  // 等待页面加载
  await page.waitForLoadState('networkidle');
  
  // 填写登录表单
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);
  
  // 点击登录按钮并等待导航
  await Promise.all([
    page.waitForURL(/.*\/(dashboard|projects|tasks|reports)?/, { timeout: 10000 }),
    page.click('button[type="submit"]')
  ]);
  
  // 验证登录成功（检查是否有用户信息或导航栏）
  await page.waitForSelector('[data-testid="user-menu"], .user-profile, nav, h1', { timeout: 5000 });
}

/**
 * 注册新用户
 * @param page Playwright Page 对象
 * @param email 用户邮箱
 * @param password 密码
 * @param username 用户名
 */
export async function register(
  page: Page,
  email: string,
  password: string,
  username: string
): Promise<void> {
  await page.goto('/register');
  await page.waitForLoadState('networkidle');
  
  // 填写注册表单
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);
  
  // 查找用户名输入框（可能是 name 或 username）
  const usernameInput = await page.locator('input[name="name"], input[name="username"], input[placeholder*="名字"], input[placeholder*="用户名"]').first();
  if (await usernameInput.isVisible()) {
    await usernameInput.fill(username);
  }
  
  // 点击注册按钮
  await page.click('button[type="submit"]');
  
  // 等待注册完成
  await page.waitForURL('**/', { timeout: 10000 });
}

/**
 * 登出功能
 * @param page Playwright Page 对象
 */
export async function logout(page: Page): Promise<void> {
  // 查找并点击用户菜单
  const userMenu = page.locator('[data-testid="user-menu"], .user-profile, button:has-text("用户")').first();
  await userMenu.click();
  
  // 点击登出按钮
  await page.click('button:has-text("登出"), button:has-text("退出"), a:has-text("登出")');
  
  // 等待重定向到登录页
  await page.waitForURL('**/login', { timeout: 5000 });
}

/**
 * 检查是否已登录
 * @param page Playwright Page 对象
 * @returns 是否已登录
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    await page.waitForSelector('[data-testid="user-menu"], .user-profile, nav', { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * 确保用户已登录
 * 如果未登录，则执行登录
 * @param page Playwright Page 对象
 */
export async function ensureLoggedIn(page: Page): Promise<void> {
  const loggedIn = await isLoggedIn(page);
  if (!loggedIn) {
    await login(page);
  }
}

