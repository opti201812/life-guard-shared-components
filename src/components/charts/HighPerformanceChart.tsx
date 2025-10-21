import React, { useRef, useEffect, useCallback, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { EChartsOption } from "echarts";
import { ChartDataPoint, SeriesConfig } from "../../types/shared";

interface HighPerformanceChartProps {
   baseOption: EChartsOption;
   data: ChartDataPoint[];
   seriesConfigs: SeriesConfig[];
   onLegendSelectChanged: (e: any) => void;
   maxDataPoints?: number;
   enableLazyUpdate?: boolean;
   style?: React.CSSProperties;
}

interface SeriesAppendInfo {
   seriesIndex: number;
   seriesName: string;
   fieldKey: string;
   lastDataLength: number;
}

/**
 * 高性能图表组件
 * 使用 ECharts 的 appendData 和 lazyUpdate 优化高频数据更新
 * 只更新数据，不影响图例、缩放等交互功能
 */
export const HighPerformanceChart: React.FC<HighPerformanceChartProps> = ({
   baseOption,
   data,
   seriesConfigs,
   onLegendSelectChanged,
   maxDataPoints = 36000,
   enableLazyUpdate = true,
   style,
}) => {
   const echartsRef = useRef<ReactECharts>(null);
   const lastDataLengthRef = useRef<number>(0);
   const initializedRef = useRef<boolean>(false);
   const pendingDataRef = useRef<ChartDataPoint[]>([]);

   // 构建系列信息映射 - 基于实际的 baseOption.series 数组
   const seriesInfoMap = useMemo(() => {
      const infoMap: SeriesAppendInfo[] = [];

      // 从 baseOption 中获取实际的 series 数组
      const actualSeries = Array.isArray(baseOption.series) ? baseOption.series : [baseOption.series];

      actualSeries.forEach((series: any, index: number) => {
         if (series && series.name) {
            // 根据 series.name 找到对应的配置
            const config = seriesConfigs.find((cfg) => cfg.name === series.name);
            if (config && config.display === "series-and-realtime") {
               infoMap.push({
                  seriesIndex: index,
                  seriesName: config.name,
                  fieldKey: config.key,
                  lastDataLength: 0,
               });
            }
         }
      });

      return infoMap;
   }, [seriesConfigs, baseOption.series]);

   // 转换数据点为ECharts格式
   const convertDataForECharts = useCallback(
      (dataPoints: ChartDataPoint[]) => {
         const seriesData: Array<Array<[number, number]>> = [];

         // 初始化每个系列的数据数组
         seriesInfoMap.forEach(() => {
            seriesData.push([]);
         });

         // 填充数据
         dataPoints.forEach((point) => {
            seriesInfoMap.forEach((info, index) => {
               const value = point[info.fieldKey as keyof ChartDataPoint];
               if (typeof value === "number" && !isNaN(value)) {
                  seriesData[index].push([point.timestamp, value]);
               }
            });
         });

         return seriesData;
      },
      [seriesInfoMap]
   );

   // 获取新增的数据
   const getNewDataPoints = useCallback((allData: ChartDataPoint[]) => {
      const currentLength = allData.length;
      const lastLength = lastDataLengthRef.current;

      if (currentLength <= lastLength) {
         return []; // 没有新数据
      }

      return allData.slice(lastLength);
   }, []);

   // 使用 appendData 追加新数据
   const appendNewData = useCallback(
      (newDataPoints: ChartDataPoint[], isProcessingPending: boolean = false) => {
         // 获取图表实例；未就绪则缓存数据并退出
         const chartInstance = echartsRef.current?.getEchartsInstance();
         if (!chartInstance || newDataPoints.length === 0) {
            pendingDataRef.current.push(...newDataPoints);
            return;
         }

         // 检查图表是否已初始化且appendData方法存在
         if (!initializedRef.current || typeof chartInstance.appendData !== "function") {
            pendingDataRef.current.push(...newDataPoints);
            return;
         }

         // 直接追加数据到图表
         const newSeriesData = convertDataForECharts(newDataPoints);

         // 为每个系列追加数据
         seriesInfoMap.forEach((info, index) => {
            const newData = newSeriesData[index];
            if (newData.length > 0) {
               try {
                  const option = chartInstance.getOption() as any;

                  // 防御性检查：确保 series 存在且有效
                  if (
                     !option ||
                     !option.series ||
                     !Array.isArray(option.series) ||
                     !option.series[info.seriesIndex] ||
                     typeof option.series[info.seriesIndex] !== "object"
                  ) {
                     console.warn(
                        `[HighPerformanceChart] 系列 ${info.seriesName} (索引 ${info.seriesIndex}) 不存在或无效，跳过追加数据`
                     );
                     return;
                  }

                  chartInstance.appendData({
                     seriesIndex: info.seriesIndex,
                     data: newData,
                  });
               } catch (error) {
                  console.error(`[HighPerformanceChart] 系列 ${info.seriesName} appendData 调用失败:`, error);
                  pendingDataRef.current.push(...newDataPoints);
               }
            }
         });

         // 强制重绘以确保数据可见
         try {
            chartInstance.resize();
         } catch (error) {
            console.error("[HighPerformanceChart] resize 调用失败:", error);
         }
      },
      [seriesInfoMap, convertDataForECharts]
   );

   // 初始化图表 - 只负责创建空白图表
   const initializeChart = useCallback(() => {
      const chartInstance = echartsRef.current?.getEchartsInstance();
      if (!chartInstance) {
         return;
      }

      // 计算固定时间范围：当前时间到1小时前
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000; // 1小时 = 60分钟 * 60秒 * 1000毫秒

      // 设置初始option，包含完整的配置但数据为空
      const series = Array.isArray(baseOption.series) ? baseOption.series : [baseOption.series];
      const initialOption = {
         ...baseOption,
         xAxis: {
            ...baseOption.xAxis,
            // 反转x轴：最左为当前时刻，右侧为以往时刻
            min: (Array.isArray(baseOption.xAxis) ? baseOption.xAxis[0]?.min : baseOption.xAxis?.min) || now,
            max: (Array.isArray(baseOption.xAxis) ? baseOption.xAxis[0]?.max : baseOption.xAxis?.max) || oneHourAgo,
            inverse: true, // 反转x轴方向
         },
         series: series
            ?.map((series: any) => ({
               ...series,
               data: [], // 初始化为空数据
               datasetIndex: undefined, // 确保使用data而不是dataset
            }))
            .filter(Boolean),
      };

      chartInstance.setOption(initialOption, true); // 强制重新初始化

      // 强制重绘确保图表可见
      try {
         chartInstance.resize();
      } catch (error) {
         console.error("[HighPerformanceChart] 初始化resize失败:", error);
      }

      initializedRef.current = true;
   }, [baseOption]);

   // 初始化图表 - 只在组件挂载时执行一次
   useEffect(() => {
      initializeChart();
   }, [initializeChart]);

   // 处理数据更新 - 只处理数据变化
   useEffect(() => {
      if (!initializedRef.current) {
         return;
      }

      const newDataPoints = getNewDataPoints(data);
      if (newDataPoints.length > 0) {
         appendNewData(newDataPoints);
         lastDataLengthRef.current = data.length;
      } else if (data.length === 0) {
         // 数据被清除时，清空图表数据
         const chartInstance = echartsRef.current?.getEchartsInstance();
         if (chartInstance) {
            // 清空所有系列的数据
            seriesInfoMap.forEach((info) => {
               try {
                  chartInstance.setOption(
                     {
                        series: [
                           {
                              seriesIndex: info.seriesIndex,
                              data: [],
                           },
                        ],
                     },
                     false
                  );
               } catch (error) {
                  console.error(`[HighPerformanceChart] 清空系列 ${info.seriesName} 数据失败:`, error);
               }
            });
         }
         lastDataLengthRef.current = 0;
      }
   }, [data, getNewDataPoints, appendNewData, seriesInfoMap]);

   // 处理配置变化（需要重新初始化）
   useEffect(() => {
      if (initializedRef.current) {
         initializedRef.current = false;
         lastDataLengthRef.current = 0;
         // 重新初始化图表
         initializeChart();
      }
   }, [seriesConfigs, initializeChart]);

   // 定时更新x轴范围，保持"1小时前到当前时间"
   useEffect(() => {
      if (!initializedRef.current) return;

      const updateXAxisRange = () => {
         const chartInstance = echartsRef.current?.getEchartsInstance();
         if (!chartInstance) return;

         const now = Date.now();
         // 从baseOption中获取当前的时间范围配置
         const xAxisConfig = Array.isArray(baseOption.xAxis) ? baseOption.xAxis[0] : baseOption.xAxis;

         // 计算时间范围：优先使用xAxisConfig中的配置，否则使用默认的1小时
         let timeRangeMs = 60 * 60 * 1000; // 默认1小时
         if (xAxisConfig?.min) {
            if (typeof xAxisConfig.min === "function") {
               // 如果min是函数，调用它来获取实际的时间范围
               timeRangeMs = now - (xAxisConfig.min({ min: now - timeRangeMs, max: now }) as number);
            } else {
               // 如果min是静态值，直接计算
               timeRangeMs = now - (xAxisConfig.min as number);
            }
         }

         // 只更新x轴范围，不影响数据（反转后：min为当前时间，max为过去时间）
         chartInstance.setOption(
            {
               xAxis: {
                  min: (xAxisConfig?.min as any)({ min: now, max: now }) as number,
                  max: (xAxisConfig?.max as any)({ min: now, max: now }) as number,
                  // inverse: true, // 保持反转状态
               },
            },
            false
         ); // 不合并，只更新x轴
      };

      // 先立即刷新一次，确保首屏就是当前时刻
      updateXAxisRange();

      // 每秒更新一次x轴范围，确保即使没有数据变化也能正确显示当前时间
      const interval = setInterval(updateXAxisRange, 1000);

      return () => clearInterval(interval);
   }, [baseOption]); // 依赖于整个baseOption，而不是只依赖baseOption.xAxis

   return (
      <div
         style={{
            height: "92%",
            ...style,
            position: "relative",
         }}
      >
         <ReactECharts
            ref={echartsRef}
            option={baseOption}
            style={{ height: "100%", width: "100%" }}
            opts={{
               renderer: "canvas",
               devicePixelRatio: window.devicePixelRatio || 1,
            }}
            onEvents={{
               legendselectchanged: onLegendSelectChanged,
            }}
            notMerge={false} // 允许合并，保持交互状态
            lazyUpdate={enableLazyUpdate}
            shouldSetOption={(prevOption: any, newOption: any) => {
               // 完全禁用 setOption，避免意外重置图表
               return false;
            }}
         />
      </div>
   );
};
