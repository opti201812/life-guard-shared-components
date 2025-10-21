import React, { useMemo, useEffect, useState } from "react";
import { Card, Button, Space } from "antd";
import { ChartDataPoint, SeriesConfig } from "../../types/shared";
import { useLegendState } from "../../hooks/useLegendState";
import { useIncrementalAppender } from "../../hooks/useIncrementalAppender";
import { useDecimatedSeries } from "../../hooks/useDecimatedSeries";
import { buildOption } from "../../utils/buildOption";
import { LegendControls } from "./LegendControls";
import { HighPerformanceChart } from "./HighPerformanceChart";

// 增量数据接口
export interface IncrementalData {
   timestamp: number;
   seriesUpdates: Array<{
      seriesName: string;
      value: number;
   }>;
}

interface MultiDeviceChartProps {
   chartData?: ChartDataPoint[]; // 初始化数据（可选）
   incrementalData?: IncrementalData[]; // 增量数据
   onDataAppended?: (dataCount: number) => void; // 数据追加回调
   titleExtra?: React.ReactNode;
   seriesConfigs?: SeriesConfig[]; // 覆盖默认序列配置
   maxDataPoints?: number; // 最大数据点数，默认36000
   chartConfigManager?: any; // 图表配置管理器（从主项目传入）
}

const MultiDeviceChart: React.FC<MultiDeviceChartProps> = ({
   chartData = [],
   incrementalData = [],
   onDataAppended,
   titleExtra,
   seriesConfigs: seriesConfigsProp,
   maxDataPoints = 36000,
   chartConfigManager,
}) => {
   // 状态管理
   const [internalData, setInternalData] = useState<ChartDataPoint[]>(chartData);
   const [timeRange, setTimeRange] = useState<number>(60); // 默认60分钟

   // 获取统一配置
   const effectiveSeriesConfigs = useMemo(
      () => chartConfigManager?.getSeriesConfig(seriesConfigsProp) || seriesConfigsProp || [],
      [seriesConfigsProp, chartConfigManager]
   );

   // 使用内部数据作为有效数据（移除节流）
   const effectiveChartData = internalData;

   // 使用自定义 hooks
   const legendState = useLegendState(effectiveSeriesConfigs);

   const incrementalAppender = useIncrementalAppender(effectiveSeriesConfigs, {
      enableIncrementalUpdate: true,
      highFrequencyMode: true,
      onDataAppended,
      maxBatchSize: maxDataPoints,
   });

   const decimatedSeriesData = useDecimatedSeries(effectiveChartData, effectiveSeriesConfigs, 60, {
      maxPoints: maxDataPoints,
      enableDecimation: true,
   });

   // 效果处理
   useEffect(() => {
      // 修复：无论数据长度如何都要更新内部数据，包括数据清除的情况
      setInternalData(chartData || []);
   }, [chartData]);

   // 处理增量数据
   useEffect(() => {
      if (incrementalData.length > 0) {
         incrementalAppender.processIncrementalData(incrementalData);
      }
   }, [incrementalData, incrementalAppender]);

   // 构建图表配置
   const chartOption = useMemo(() => {
      return buildOption({
         seriesConfigs: effectiveSeriesConfigs,
         legendVisible: legendState.legendVisible,
         timeRange,
         enableIncrementalUpdate: true,
         highFrequencyMode: true,
      });
   }, [effectiveSeriesConfigs, legendState.legendVisible, timeRange]);

   // 事件处理
   const handleLegendSelectChanged = (e: any) => {
      if (e && e.selected) {
         legendState.updateLegendVisible(e.selected);
      }
   };

   // 时间范围选择处理
   const handleTimeRangeChange = (minutes: number) => {
      setTimeRange(minutes);
   };

   // 渲染组件
   return (
      <Card
         title='设备实时曲线'
         extra={titleExtra}
         size='small'
         style={{ height: "100%" }}
         styles={{ body: { height: "calc(100% - 47px)", padding: "4px" } }}
      >
         {/* 图例控制 */}
         <LegendControls legendState={legendState} />

         {/* 高性能图表渲染器 */}
         <HighPerformanceChart
            baseOption={chartOption}
            data={effectiveChartData}
            seriesConfigs={effectiveSeriesConfigs}
            onLegendSelectChanged={handleLegendSelectChanged}
            maxDataPoints={maxDataPoints}
            enableLazyUpdate={true}
         />

         {/* 时间范围选择按钮 */}
         <div style={{ marginTop: 0, textAlign: "center" }}>
            <Space size='small'>
               <span style={{ fontSize: 12, color: "#666" }}>时间范围：</span>
               {[5, 10, 20, 30, 60].map((minutes) => (
                  <Button
                     key={minutes}
                     type={timeRange === minutes ? "primary" : "link"}
                     size='small'
                     onClick={() => handleTimeRangeChange(minutes)}
                     style={{
                        padding: "2px 8px",
                        height: "24px",
                        fontSize: "12px",
                        minWidth: "32px",
                     }}
                  >
                     {minutes}分钟
                  </Button>
               ))}
            </Space>
         </div>
      </Card>
   );
};

export default MultiDeviceChart;
