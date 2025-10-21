import { useRef, useCallback, useEffect } from "react";
import { SeriesConfig, IncrementalData } from "../types/shared";

export interface IncrementalAppenderState {
   // 处理增量数据
   processIncrementalData: (data: IncrementalData[]) => void;
   // 批处理更新计数
   batchUpdateCount: number;
   // 是否正在处理
   isProcessing: boolean;
}

/**
 * 增量数据追加管理 Hook
 * 负责批量处理增量数据，节流更新，避免高频渲染
 */
export function useIncrementalAppender(
   seriesConfigs: SeriesConfig[],
   options: {
      enableIncrementalUpdate?: boolean;
      highFrequencyMode?: boolean;
      onDataAppended?: (count: number) => void;
      maxBatchSize?: number;
   } = {}
): IncrementalAppenderState {
   const { enableIncrementalUpdate = true, highFrequencyMode = false, onDataAppended, maxBatchSize = 1000 } = options;

   const echartsRef = useRef<any>(null);
   const dataBufferRef = useRef<IncrementalData[]>([]);
   const updateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
   const batchUpdateCountRef = useRef(0);
   const isProcessingRef = useRef(false);

   // 预构建系列名到索引的映射，提高查找性能
   const seriesNameToIndexMap = useRef<Map<string, number>>(new Map());

   // 更新系列映射
   const updateSeriesMap = useCallback(() => {
      if (!echartsRef.current) return;

      try {
         const chart = echartsRef.current.getEchartsInstance();
         if (chart) {
            const option = chart.getOption() as any;
            if (option.series && Array.isArray(option.series)) {
               const newMap = new Map<string, number>();
               option.series.forEach((series: any, index: number) => {
                  if (series.name) {
                     newMap.set(series.name, index);
                  }
               });
               seriesNameToIndexMap.current = newMap;
            }
         }
      } catch (error) {
         // 静默处理错误
      }
   }, []);

   // 批量处理增量数据
   const processBatchUpdates = useCallback(() => {
      if (dataBufferRef.current.length === 0 || isProcessingRef.current) return;

      isProcessingRef.current = true;
      const batchData = [...dataBufferRef.current];
      dataBufferRef.current = [];

      if (enableIncrementalUpdate && echartsRef.current) {
         const chart = echartsRef.current.getEchartsInstance();
         if (chart) {
            const option = chart.getOption() as any;
            const hasValidSeries = option.series && option.series.length > 0;

            if (hasValidSeries) {
               // 更新系列映射
               updateSeriesMap();

               // 使用ECharts增量更新
               let appendSuccessCount = 0;

               batchData.forEach((incrementalItem) => {
                  incrementalItem.seriesUpdates.forEach((update) => {
                     const seriesIndex = seriesNameToIndexMap.current.get(update.seriesName);
                     if (seriesIndex !== undefined) {
                        try {
                           chart.appendData({
                              seriesIndex,
                              data: [[incrementalItem.timestamp, update.value]],
                           });
                           appendSuccessCount++;
                        } catch (error) {
                           // 静默处理错误，避免控制台噪音
                        }
                     }
                  });
               });

               batchUpdateCountRef.current += batchData.length;
               onDataAppended?.(batchData.length);
               isProcessingRef.current = false;
               return; // 成功使用增量更新，直接返回
            }
         }
      }

      // 如果增量更新失败，回退到全量更新模式
      // 这里只更新计数，实际的全量更新由父组件处理
      batchUpdateCountRef.current += batchData.length;
      onDataAppended?.(batchData.length);
      isProcessingRef.current = false;
   }, [enableIncrementalUpdate, onDataAppended, updateSeriesMap]);

   // 处理增量数据输入
   const processIncrementalData = useCallback(
      (incrementalData: IncrementalData[]) => {
         if (!incrementalData.length) return;

         dataBufferRef.current.push(...incrementalData);

         // 限制缓冲区大小，避免内存溢出
         if (dataBufferRef.current.length > maxBatchSize) {
            dataBufferRef.current = dataBufferRef.current.slice(-maxBatchSize);
         }

         // 清除之前的定时器
         if (updateTimerRef.current) {
            clearTimeout(updateTimerRef.current);
         }

         // 根据模式调整批量处理间隔
         const batchInterval = highFrequencyMode ? 20 : 50; // 高频模式20ms，普通模式50ms
         updateTimerRef.current = setTimeout(() => {
            processBatchUpdates();
         }, batchInterval);
      },
      [processBatchUpdates, highFrequencyMode, maxBatchSize]
   );

   // 清理定时器
   useEffect(() => {
      return () => {
         if (updateTimerRef.current) {
            clearTimeout(updateTimerRef.current);
         }
      };
   }, []);

   return {
      processIncrementalData,
      batchUpdateCount: batchUpdateCountRef.current,
      isProcessing: isProcessingRef.current,
   };
}
