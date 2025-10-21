import { SeriesConfig } from "../types/shared";

export interface PerformanceConfig {
  // 数据配置
  maxDataPoints: number;
  enableIncrementalUpdate: boolean;
  enableLazyUpdate: boolean;
  throttleMs: number;
  batchSize: number;
  
  // 渲染配置
  enableAnimation: boolean;
  enableProgressive: boolean;
  enableVirtualization: boolean;
  
  // 多图表特殊配置
  enableIntersectionObserver: boolean;
  renderThreshold: number; // 只渲染可见的图表
  maxConcurrentCharts: number; // 最大并发图表数
}

export interface ChartMode {
  mode: 'single' | 'multi';
  chartCount?: number;
}

/**
 * 性能配置管理器
 * 根据图表模式（单图表 vs 多图表）提供不同的性能配置
 */
export class PerformanceConfigManager {
  /**
   * 获取单图表模式配置（CSM 场景）
   */
  static getSingleModeConfig(): PerformanceConfig {
    return {
      // 数据配置 - 高性能
      maxDataPoints: 36000,
      enableIncrementalUpdate: true,
      enableLazyUpdate: true,
      throttleMs: 20,
      batchSize: 100,
      
      // 渲染配置 - 全功能
      enableAnimation: true,
      enableProgressive: true,
      enableVirtualization: false,
      
      // 单图表配置
      enableIntersectionObserver: false,
      renderThreshold: 1.0,
      maxConcurrentCharts: 1,
    };
  }

  /**
   * 获取多图表模式配置（LG-Web 场景）
   */
  static getMultiModeConfig(chartCount: number = 12): PerformanceConfig {
    // 根据图表数量调整配置
    const isHighDensity = chartCount > 8;
    const isMediumDensity = chartCount > 4;
    
    return {
      // 数据配置 - 轻量化
      maxDataPoints: isHighDensity ? 200 : isMediumDensity ? 500 : 1000,
      enableIncrementalUpdate: false,
      enableLazyUpdate: false,
      throttleMs: isHighDensity ? 200 : 100,
      batchSize: isHighDensity ? 25 : 50,
      
      // 渲染配置 - 简化
      enableAnimation: false,
      enableProgressive: false,
      enableVirtualization: isHighDensity,
      
      // 多图表配置
      enableIntersectionObserver: true,
      renderThreshold: isHighDensity ? 0.1 : 0.3,
      maxConcurrentCharts: isHighDensity ? 6 : 8,
    };
  }

  /**
   * 根据模式获取配置
   */
  static getConfigForMode(mode: ChartMode): PerformanceConfig {
    if (mode.mode === 'single') {
      return this.getSingleModeConfig();
    } else {
      return this.getMultiModeConfig(mode.chartCount);
    }
  }

  /**
   * 获取数据抽稀配置
   */
  static getDecimationConfig(mode: ChartMode): {
    maxPoints: number;
    strategy: 'LTTB' | 'BUCKET' | 'STRIDE' | 'NONE';
    timeRange: number;
  } {
    if (mode.mode === 'single') {
      return {
        maxPoints: 36000,
        strategy: 'LTTB',
        timeRange: 60 * 60 * 1000, // 1小时
      };
    } else {
      const chartCount = mode.chartCount || 12;
      if (chartCount > 8) {
        return {
          maxPoints: 100,
          strategy: 'LTTB',
          timeRange: 30 * 60 * 1000, // 30分钟
        };
      } else if (chartCount > 4) {
        return {
          maxPoints: 200,
          strategy: 'BUCKET',
          timeRange: 60 * 60 * 1000, // 1小时
        };
      } else {
        return {
          maxPoints: 500,
          strategy: 'STRIDE',
          timeRange: 2 * 60 * 60 * 1000, // 2小时
        };
      }
    }
  }

  /**
   * 检查是否需要虚拟化
   */
  static shouldUseVirtualization(mode: ChartMode): boolean {
    return mode.mode === 'multi' && (mode.chartCount || 0) > 8;
  }

  /**
   * 检查是否需要懒加载
   */
  static shouldUseLazyLoading(mode: ChartMode): boolean {
    return mode.mode === 'multi' && (mode.chartCount || 0) > 4;
  }
}

export default PerformanceConfigManager;
