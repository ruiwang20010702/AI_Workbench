// @ts-nocheck
import { IDataSource, WeeklyData, DataSourceConfig } from './IDataSource';
import axios from 'axios';

/**
 * Git数据源配置接口
 */
export interface GitDataSourceConfig extends DataSourceConfig {
  options?: {
    provider?: 'github' | 'gitlab' | 'gitee' | 'local'; // Git服务提供商
    access_token?: string; // 访问令牌
    username?: string; // 用户名
    repositories?: string[]; // 仓库列表
    base_url?: string; // API基础URL（用于自建GitLab等）
  };
}

/**
 * Git数据源实现
 * 从Git仓库（GitHub/GitLab/Gitee）获取提交统计数据
 * 注意：需要配置访问令牌和仓库信息
 */
export class GitDataSource implements IDataSource {
  readonly name = 'git';
  readonly description = 'Git代码仓库统计数据源';

  private config?: GitDataSourceConfig;

  constructor(config?: GitDataSourceConfig) {
    this.config = config || undefined;
  }

  /**
   * 检查数据源是否启用
   */
  isEnabled(): boolean {
    // 只有配置了访问令牌才启用
    return !!(this.config?.enabled && this.config?.options?.access_token);
  }

  /**
   * 获取指定周期的Git数据
   * @param userId 用户ID
   * @param startDate 开始日期（ISO格式：YYYY-MM-DD）
   * @param endDate 结束日期（ISO格式：YYYY-MM-DD）
   * @param config 配置选项
   * @returns Git统计数据
   */
  async fetchData(
    userId: string,
    startDate: string,
    endDate: string,
    config?: DataSourceConfig
  ): Promise<Partial<WeeklyData>> {
    if (!this.isEnabled()) {
      console.log('[GitDataSource] Data source is disabled or not configured');
      return {};
    }

    try {
      console.log(`[GitDataSource] Fetching Git data for user ${userId} from ${startDate} to ${endDate}`);

      const gitConfig = (config as GitDataSourceConfig) || this.config;
      const provider = gitConfig?.options?.provider || 'github';

      let gitData;
      switch (provider) {
        case 'github':
          gitData = await this.fetchGitHubData(startDate, endDate, gitConfig);
          break;
        case 'gitlab':
          gitData = await this.fetchGitLabData(startDate, endDate, gitConfig);
          break;
        case 'gitee':
          gitData = await this.fetchGiteeData(startDate, endDate, gitConfig);
          break;
        default:
          console.warn(`[GitDataSource] Unsupported provider: ${provider}`);
          return {};
      }

      return {
        git: gitData,
        metadata: {
          data_source: this.name,
          generated_at: new Date().toISOString(),
          week_start: startDate,
          week_end: endDate,
          provider,
        },
      };
    } catch (error) {
      console.error('[GitDataSource] Error fetching Git data:', error);
      // Git数据源失败不应该阻止整个周报生成，返回空数据
      return {};
    }
  }

  /**
   * 从GitHub获取数据
   */
  private async fetchGitHubData(
    startDate: string,
    endDate: string,
    config?: GitDataSourceConfig
  ): Promise<any> {
    const token = config?.options?.access_token;
    const username = config?.options?.username;
    const repositories = config?.options?.repositories || [];

    if (!token || !username) {
      console.warn('[GitDataSource] GitHub token or username not configured');
      return this.getEmptyGitData();
    }

    try {
      const headers = {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      };

      let totalCommits = 0;
      let totalAdditions = 0;
      let totalDeletions = 0;
      const repoNames: string[] = [];
      const topFiles: Array<{ file: string; changes: number }> = [];

      // 如果没有指定仓库，获取用户的所有仓库
      let reposToFetch = repositories;
      if (reposToFetch.length === 0) {
        const reposResponse = await axios.get(
          `https://api.github.com/users/${username}/repos`,
          { headers, params: { per_page: 100, sort: 'updated' } }
        );
        reposToFetch = reposResponse.data.map((repo: any) => repo.full_name);
      }

      // 遍历仓库获取提交数据
      for (const repo of reposToFetch.slice(0, 10)) { // 最多查询10个仓库
        try {
          const commitsResponse = await axios.get(
            `https://api.github.com/repos/${repo}/commits`,
            {
              headers,
              params: {
                author: username,
                since: `${startDate}T00:00:00Z`,
                until: `${endDate}T23:59:59Z`,
                per_page: 100,
              },
            }
          );

          const commits = commitsResponse.data;
          totalCommits += commits.length;

          if (commits.length > 0) {
            repoNames.push(repo);
          }

          // 获取每个提交的详细信息（包含代码变更量）
          // 注意：为避免API限流，这里限制只获取前几个提交的详情
          for (const commit of commits.slice(0, 5)) {
            try {
              const commitDetail = await axios.get(commit.url, { headers });
              const stats = commitDetail.data.stats;
              if (stats) {
                totalAdditions += stats.additions || 0;
                totalDeletions += stats.deletions || 0;
              }
            } catch (err) {
              // 忽略单个提交详情获取失败
              console.warn(`[GitDataSource] Failed to fetch commit detail: ${commit.sha}`);
            }
          }
        } catch (err) {
          console.warn(`[GitDataSource] Failed to fetch commits for repo: ${repo}`);
        }
      }

      return {
        commits: totalCommits,
        additions: totalAdditions,
        deletions: totalDeletions,
        repositories: repoNames,
        top_files: topFiles, // GitHub API不直接提供文件级统计，需要额外处理
      };
    } catch (error) {
      console.error('[GitDataSource] GitHub API error:', error);
      return this.getEmptyGitData();
    }
  }

  /**
   * 从GitLab获取数据（占位实现）
   */
  private async fetchGitLabData(
    startDate: string,
    endDate: string,
    config?: GitDataSourceConfig
  ): Promise<any> {
    // TODO: 实现GitLab API调用
    console.warn('[GitDataSource] GitLab integration not yet implemented');
    return this.getEmptyGitData();
  }

  /**
   * 从Gitee获取数据（占位实现）
   */
  private async fetchGiteeData(
    startDate: string,
    endDate: string,
    config?: GitDataSourceConfig
  ): Promise<any> {
    // TODO: 实现Gitee API调用
    console.warn('[GitDataSource] Gitee integration not yet implemented');
    return this.getEmptyGitData();
  }

  /**
   * 返回空的Git数据
   */
  private getEmptyGitData() {
    return {
      commits: 0,
      additions: 0,
      deletions: 0,
      repositories: [],
      top_files: [],
    };
  }

  /**
   * 验证配置
   */
  async validateConfig(config?: DataSourceConfig): Promise<boolean> {
    const gitConfig = (config as GitDataSourceConfig) || this.config;

    if (!gitConfig?.options?.access_token) {
      console.warn('[GitDataSource] Access token not configured');
      return false;
    }

    // 验证provider是否支持
    const supportedProviders = ['github', 'gitlab', 'gitee'];
    const provider = gitConfig?.options?.provider || 'github';
    if (!supportedProviders.includes(provider)) {
      console.warn(`[GitDataSource] Unsupported provider: ${provider}`);
      return false;
    }

    return true;
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    if (!this.isEnabled()) {
      return false;
    }

    try {
      const token = this.config?.options?.access_token;
      const provider = this.config?.options?.provider || 'github';

      switch (provider) {
        case 'github':
          const response = await axios.get('https://api.github.com/user', {
            headers: {
              Authorization: `token ${token}`,
              Accept: 'application/vnd.github.v3+json',
            },
          });
          return response.status === 200;

        case 'gitlab':
          // TODO: 实现GitLab连接测试
          return false;

        case 'gitee':
          // TODO: 实现Gitee连接测试
          return false;

        default:
          return false;
      }
    } catch (error) {
      console.error('[GitDataSource] Connection test failed:', error);
      return false;
    }
  }
}

