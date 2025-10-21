import { SeriesConfig } from "../types/shared";
import { defaultSeriesConfigs, legendGroupsDefault } from "./seriesDefaults";

export interface PerformanceConfig {
   // 雷达数据配置（高密度）
   radar: {
      decimation: "LTTB" | "BUCKET" | "STRIDE";
      maxPoints: number;
      batchSize: number;
      throttleMs: number;
   };
   // 手环数据配置（低密度）
   bracelet: {
      decimation: "NONE" | "STRIDE";
      maxPoints: number;
      batchSize: number;
      throttleMs: number;
   };
   // 通用配置
   general: {
      maxDataPoints: number;
      animationThreshold: number;
      progressiveThreshold: number;
   };
}

export interface ChartConfig {
   series: SeriesConfig[];
   legendGroups: Record<string, { name: string; items: string[] }>;
   performance: PerformanceConfig;
}

/**
 * 图表配置管理器
 * 统一管理图表的所有配置，包括系列配置、性能配置等
 */
export class ChartConfigManager {
   private static instance: ChartConfigManager;
   private config: ChartConfig;

   private constructor() {
      this.config = {
         series: defaultSeriesConfigs,
         legendGroups: legendGroupsDefault,
         performance: this.getDefaultPerformanceConfig(),
      };
   }

   static getInstance(): ChartConfigManager {
      if (!ChartConfigManager.instance) {
         ChartConfigManager.instance = new ChartConfigManager();
      }
      return ChartConfigManager.instance;
   }

   getSeriesConfig(overrides?: Partial<SeriesConfig>[]): SeriesConfig[] {
      if (!overrides || overrides.length === 0) {
         return this.config.series;
      }

      return this.config.series.map((config) => {
         const override = overrides.find((o) => o.key === config.key);
         return override ? { ...config, ...override } : config;
      });
   }

   getLegendGroups(): Record<string, { name: string; items: string[] }> {
      return this.config.legendGroups;
   }

   getPerformanceConfig(): PerformanceConfig {
      return this.config.performance;
   }

   getFieldMapping(seriesConfigs?: SeriesConfig[]): Record<string, string> {
      const configs = seriesConfigs || this.config.series;
      const mapping: Record<string, string> = {};

      configs.forEach((config) => {
         mapping[config.key] = config.name;
      });

      return mapping;
   }

   getReverseFieldMapping(seriesConfigs?: SeriesConfig[]): Record<string, string> {
      const configs = seriesConfigs || this.config.series;
      const mapping: Record<string, string> = {};

      configs.forEach((config) => {
         mapping[config.name] = config.key;
      });

      return mapping;
   }

   getSeriesConfigByName(name: string, seriesConfigs?: SeriesConfig[]): SeriesConfig | undefined {
      const configs = seriesConfigs || this.config.series;
      return configs.find((config) => config.name === name);
   }

   getSeriesConfigByKey(key: string, seriesConfigs?: SeriesConfig[]): SeriesConfig | undefined {
      const configs = seriesConfigs || this.config.series;
      return configs.find((config) => config.key === key);
   }

   getHighDensitySeries(seriesConfigs?: SeriesConfig[]): SeriesConfig[] {
      const configs = seriesConfigs || this.config.series;
      return configs.filter((config) => config.highDensity === true);
   }

   getLowDensitySeries(seriesConfigs?: SeriesConfig[]): SeriesConfig[] {
      const configs = seriesConfigs || this.config.series;
      return configs.filter((config) => config.highDensity !== true);
   }

   updateConfig(updates: Partial<ChartConfig>): void {
      this.config = { ...this.config, ...updates };
   }

   private getDefaultPerformanceConfig(): PerformanceConfig {
      return {
         radar: {
            decimation: "LTTB",
            maxPoints: 10000,
            batchSize: 100,
            throttleMs: 100,
         },
         bracelet: {
            decimation: "NONE",
            maxPoints: 1000,
            batchSize: 50,
            throttleMs: 200,
         },
         general: {
            maxDataPoints: 36000,
            animationThreshold: 1000,
            progressiveThreshold: 5000,
         },
      };
   }
}

// 导出单例实例
export const chartConfigManager = ChartConfigManager.getInstance();

