import { Page, Locator } from '@playwright/test';

/**
 * 通用测试辅助工具
 */

/**
 * 等待并点击元素
 * @param page Playwright Page 对象
 * @param selector 选择器
 * @param options 选项
 */
export async function waitAndClick(
  page: Page,
  selector: string,
  options?: { timeout?: number }
): Promise<void> {
  await page.waitForSelector(selector, { timeout: options?.timeout || 5000 });
  await page.click(selector);
}

/**
 * 等待并填写输入框
 * @param page Playwright Page 对象
 * @param selector 选择器
 * @param value 值
 * @param options 选项
 */
export async function waitAndFill(
  page: Page,
  selector: string,
  value: string,
  options?: { timeout?: number; clear?: boolean }
): Promise<void> {
  await page.waitForSelector(selector, { timeout: options?.timeout || 5000 });
  
  if (options?.clear) {
    await page.fill(selector, '');
  }
  
  await page.fill(selector, value);
}

/**
 * 等待元素消失
 * @param page Playwright Page 对象
 * @param selector 选择器
 * @param timeout 超时时间
 */
export async function waitForElementToDisappear(
  page: Page,
  selector: string,
  timeout: number = 5000
): Promise<void> {
  await page.waitForSelector(selector, { state: 'hidden', timeout });
}

/**
 * 等待文本出现
 * @param page Playwright Page 对象
 * @param text 文本内容
 * @param timeout 超时时间
 */
export async function waitForText(
  page: Page,
  text: string,
  timeout: number = 5000
): Promise<void> {
  await page.waitForSelector(`text=${text}`, { timeout });
}

/**
 * 获取元素文本内容
 * @param locator 元素定位器
 * @returns 文本内容
 */
export async function getTextContent(locator: Locator): Promise<string> {
  return (await locator.textContent()) || '';
}

/**
 * 检查元素是否可见
 * @param page Playwright Page 对象
 * @param selector 选择器
 * @returns 是否可见
 */
export async function isElementVisible(
  page: Page,
  selector: string
): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { state: 'visible', timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * 等待 API 请求完成
 * @param page Playwright Page 对象
 * @param urlPattern URL 模式
 * @param callback 执行的操作
 */
export async function waitForApiResponse<T>(
  page: Page,
  urlPattern: string | RegExp,
  callback: () => Promise<T>
): Promise<T> {
  const responsePromise = page.waitForResponse(
    response => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout: 10000 }
  );
  
  const result = await callback();
  await responsePromise;
  
  return result;
}

/**
 * 等待加载完成
 * @param page Playwright Page 对象
 */
export async function waitForLoadingToFinish(page: Page): Promise<void> {
  // 等待常见的加载指示器消失
  const loadingSelectors = [
    '.loading',
    '.spinner',
    '[data-testid="loading"]',
    'text=加载中',
    'text=Loading'
  ];
  
  for (const selector of loadingSelectors) {
    try {
      await page.waitForSelector(selector, { state: 'hidden', timeout: 1000 });
    } catch {
      // 如果没有找到该选择器，继续下一个
    }
  }
  
  // 等待网络空闲 (增加超时时间，并提供降级方案)
  try {
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  } catch {
    // 如果网络一直不空闲，等待domcontentloaded就行
    await page.waitForLoadState('domcontentloaded');
  }
}

/**
 * 截图（用于调试）
 * @param page Playwright Page 对象
 * @param name 截图名称
 */
export async function takeDebugScreenshot(
  page: Page,
  name: string
): Promise<void> {
  const timestamp = Date.now();
  await page.screenshot({ 
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true 
  });
}

/**
 * 生成随机字符串
 * @param length 长度
 * @returns 随机字符串
 */
export function randomString(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 生成测试项目名称
 * @param prefix 前缀
 * @returns 项目名称
 */
export function generateProjectName(prefix: string = 'Test Project'): string {
  return `${prefix} ${randomString(6)}`;
}

/**
 * 生成测试任务名称
 * @param prefix 前缀
 * @returns 任务名称
 */
export function generateTaskName(prefix: string = 'Test Task'): string {
  return `${prefix} ${randomString(6)}`;
}

/**
 * 延迟执行
 * @param ms 毫秒数
 */
export async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

