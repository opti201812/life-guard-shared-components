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
   timeRange?: number;
   hideLegend?: boolean; // 隐藏图例（用于嵌入式场景）
   style?: React.CSSProperties;
   onChartReady?: (chartInstance: any) => void; // 图表初始化完成回调
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
   timeRange,
   hideLegend = false,
   style,
   onChartReady,
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

   // 基于 baseOption.legend 判断是否显示图例
   const hasLegend = useMemo(() => {
      // 如果明确指定hideLegend，则强制返回false
      if (hideLegend) return false;

      const legend: any = (baseOption as any)?.legend;
      if (!legend) return false;
      const legends = Array.isArray(legend) ? legend : [legend];
      return legends.some((l: any) => l?.show !== false && (Array.isArray(l?.data) ? l.data.length > 0 : true));
   }, [baseOption, hideLegend]);

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
         if (!chartInstance) {
            pendingDataRef.current.push(...newDataPoints);
            return;
         }

         if (newDataPoints.length === 0) {
            return;
         }

         // 检查图表是否已初始化且appendData方法存在
         if (!initializedRef.current) {
            pendingDataRef.current.push(...newDataPoints);
            return;
         }

         if (typeof chartInstance.appendData !== "function") {
            pendingDataRef.current.push(...newDataPoints);
            return;
         }

         // 直接追加数据到图表
         const newSeriesData = convertDataForECharts(newDataPoints);
         let successCount = 0;
         let failCount = 0;

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
                     failCount++;
                     return;
                  }

                  chartInstance.appendData({
                     seriesIndex: info.seriesIndex,
                     data: newData,
                  });
                  successCount++;
               } catch (error) {
                  failCount++;
                  pendingDataRef.current.push(...newDataPoints);
               }
            }
         });

         // 强制重绘以确保数据可见
         try {
            chartInstance.resize();
         } catch (error) {
            // 静默处理resize错误
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
         // 静默处理resize错误
      }

      initializedRef.current = true;
   }, [baseOption]);

   // 图表初始化完成回调
   useEffect(() => {
      if (onChartReady) {
         const timer = setTimeout(() => {
            if (initializedRef.current) {
               try {
                  onChartReady({
                     appendData: (newDataPoints: ChartDataPoint[]) => {
                        // 提供 appendData 方法供外部调用
                        if (!initializedRef.current) {
                           return;
                        }

                        if (newDataPoints.length === 0) {
                           return;
                        }

                        const chartInstance = echartsRef.current?.getEchartsInstance();
                        if (!chartInstance) {
                           return;
                        }

                        try {
                           // 直接追加新数据，不需要与现有数据合并（因为已经通过时间戳去重）
                           appendNewData(newDataPoints);
                           lastDataLengthRef.current += newDataPoints.length;
                        } catch (error) {
                           // 静默处理错误
                        }
                     },
                  });
               } catch (error) {
                  // 静默处理错误
               }
            }
         }, 200); // 等待图表完全初始化

         return () => clearTimeout(timer);
      }
   }, [onChartReady, getNewDataPoints, appendNewData, data]);

   // 🔥 修复：初始化完成后，处理初始数据
   useEffect(() => {
      // 使用 setTimeout 确保在初始化完成后执行
      const timer = setTimeout(() => {
         if (!initializedRef.current || !data || data.length === 0) {
            return;
         }

         // 如果已经有数据但还没有设置到图表中，直接设置
         if (lastDataLengthRef.current === 0 && data.length > 0) {
            const chartInstance = echartsRef.current?.getEchartsInstance();
            if (chartInstance) {
               const seriesData = convertDataForECharts(data);
               const series = Array.isArray(baseOption.series) ? baseOption.series : [baseOption.series];
               const updatedSeries = series.map((s: any, index: number) => {
                  const info = seriesInfoMap.find((info) => info.seriesIndex === index);
                  if (info) {
                     const dataIndex = seriesInfoMap.indexOf(info);
                     if (dataIndex >= 0 && seriesData[dataIndex] && seriesData[dataIndex].length > 0) {
                        return {
                           ...s,
                           data: seriesData[dataIndex],
                        };
                     }
                  }
                  return s;
               });
               chartInstance.setOption({ series: updatedSeries }, false);
               lastDataLengthRef.current = data.length;
            }
         }
      }, 100); // 延迟100ms确保初始化完成

      return () => clearTimeout(timer);
   }, [data, baseOption, seriesInfoMap, convertDataForECharts]);

   // 初始化图表 - 只在组件挂载时执行一次
   useEffect(() => {
      initializeChart();
   }, [initializeChart]);

   // 🔥 组件内维护时间窗口（1小时）
   const cleanupExpiredData = useCallback(() => {
      if (!initializedRef.current) return;

      const chartInstance = echartsRef.current?.getEchartsInstance();
      if (!chartInstance) return;

      const now = Date.now();
      const cutoffTime = now - 3600000; // 1小时前

      // 获取当前图表数据
      const option = chartInstance.getOption();
      if (!option || !option.series) return;

      const seriesArray = Array.isArray(option.series) ? option.series : [option.series];

      // 清理每个系列的过期数据
      const updatedSeries: any[] = [];
      let hasChanges = false;

      seriesArray.forEach((series, index) => {
         if (series && series.data && Array.isArray(series.data)) {
            const filteredData = series.data.filter((point: any) => {
               return point && point[0] >= cutoffTime; // point[0] 是时间戳
            });

            if (filteredData.length !== series.data.length) {
               hasChanges = true;
               updatedSeries.push({
                  seriesIndex: index,
                  data: filteredData,
               });
            }
         }
      });

      // 批量更新过期数据清理
      if (hasChanges && updatedSeries.length > 0) {
         try {
            chartInstance.setOption({ series: updatedSeries }, false);
         } catch (error) {
            // 静默处理错误
         }
      }
   }, []);

   // 处理数据更新 - 只处理数据变化
   useEffect(() => {
      if (!initializedRef.current) {
         return;
      }

      const newDataPoints = getNewDataPoints(data);
      if (newDataPoints.length > 0) {
         appendNewData(newDataPoints);
         lastDataLengthRef.current = data.length;

         // 每次添加新数据后，清理过期数据
         cleanupExpiredData();
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
                  // 静默处理错误
               }
            });
         }
         lastDataLengthRef.current = 0;
      }
   }, [data, getNewDataPoints, appendNewData, seriesInfoMap, cleanupExpiredData]);

   // 处理配置变化（需要重新初始化）
   useEffect(() => {
      if (initializedRef.current) {
         initializedRef.current = false;
         lastDataLengthRef.current = 0;
         // 重新初始化图表
         initializeChart();
      }
   }, [seriesConfigs, initializeChart]);

   // 🔥 定时清理过期数据（每分钟执行一次）
   useEffect(() => {
      if (!initializedRef.current) return;

      const cleanupInterval = setInterval(() => {
         cleanupExpiredData();
      }, 60000); // 每分钟清理一次

      return () => clearInterval(cleanupInterval);
   }, [cleanupExpiredData]);

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
            height: hideLegend ? "100%" : "calc(100% - 60px)", // 隐藏图例时占满；否则为图例和时间选择器留出空间
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
