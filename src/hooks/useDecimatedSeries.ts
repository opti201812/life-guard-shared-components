import { useMemo } from "react";
import { ChartDataPoint, SeriesConfig } from "../types/shared";

export interface DecimatedSeriesData {
   // 按序列 key 返回的抽稀后数据
   seriesData: Record<string, [number, number][]>;
   // 原始数据点数统计
   originalCounts: Record<string, number>;
   // 抽稀后数据点数统计
   decimatedCounts: Record<string, number>;
}

/**
 * 数据抽稀系列管理 Hook
 * 负责对不同密度的数据应用合适的抽稀策略
 */
export function useDecimatedSeries(
   chartData: ChartDataPoint[],
   seriesConfigs: SeriesConfig[],
   timeRange: number,
   options: {
      maxPoints?: number;
      enableDecimation?: boolean;
   } = {}
): DecimatedSeriesData {
   const { maxPoints = 2000, enableDecimation = true } = options;

   const result = useMemo(() => {
      const seriesData: Record<string, [number, number][]> = {};
      const originalCounts: Record<string, number> = {};
      const decimatedCounts: Record<string, number> = {};

      // 按时间范围过滤数据
      const nowTs = Date.now();
      const windowStart = nowTs - timeRange * 60 * 1000;
      const windowData = chartData.filter((p) => p.timestamp >= windowStart);

      seriesConfigs.forEach((config) => {
         if (config.display === "none") return;

         // 动态提取数据：根据配置的 key 从 ChartDataPoint 中获取对应字段
         let rawData: [number, number][] = windowData
            .filter((p) => (p as any)[config.key] !== undefined && (p as any)[config.key] !== null)
            .map((p) => [p.timestamp, Math.round(Number((p as any)[config.key]))] as [number, number]);

         originalCounts[config.key] = rawData.length;

         // 简化版抽稀：如果数据点超过最大值，进行均匀采样
         if (enableDecimation && rawData.length > maxPoints) {
            const step = Math.ceil(rawData.length / maxPoints);
            rawData = rawData.filter((_, index) => index % step === 0);
         }

         decimatedCounts[config.key] = rawData.length;
         seriesData[config.key] = rawData;
      });

      return {
         seriesData,
         originalCounts,
         decimatedCounts,
      };
   }, [chartData, seriesConfigs, timeRange, maxPoints, enableDecimation]);

   return result;
}
