/**
 * 数据源统一导出文件
 */

export * from './IDataSource';
export * from './InternalDataSource';
export * from './GitDataSource';

import { IDataSource, DataSourceConfig } from './IDataSource';
import { InternalDataSource } from './InternalDataSource';
import { GitDataSource } from './GitDataSource';

/**
 * 数据源工厂
 * 用于创建和管理不同类型的数据源
 */
export class DataSourceFactory {
  private static dataSources: Map<string, IDataSource> = new Map();

  /**
   * 注册数据源
   * @param dataSource 数据源实例
   */
  static register(dataSource: IDataSource): void {
    this.dataSources.set(dataSource.name, dataSource);
    console.log(`[DataSourceFactory] Registered data source: ${dataSource.name}`);
  }

  /**
   * 获取数据源
   * @param name 数据源名称
   * @returns 数据源实例或undefined
   */
  static get(name: string): IDataSource | undefined {
    return this.dataSources.get(name);
  }

  /**
   * 获取所有已注册的数据源
   * @returns 数据源列表
   */
  static getAll(): IDataSource[] {
    return Array.from(this.dataSources.values());
  }

  /**
   * 获取所有启用的数据源
   * @returns 启用的数据源列表
   */
  static getEnabled(): IDataSource[] {
    return this.getAll().filter((ds) => ds.isEnabled());
  }

  /**
   * 初始化默认数据源
   * @param config 数据源配置
   */
  static initializeDefaults(config?: { git?: DataSourceConfig }): void {
    // 注册内部数据源（始终启用）
    this.register(new InternalDataSource());

    // 注册Git数据源（需要配置）
    if (config?.git) {
      this.register(new GitDataSource(config.git as any));
    }

    console.log(`[DataSourceFactory] Initialized ${this.dataSources.size} data sources`);
  }

  /**
   * 清空所有数据源
   */
  static clear(): void {
    this.dataSources.clear();
  }
}

// 自动初始化默认数据源
DataSourceFactory.initializeDefaults();

