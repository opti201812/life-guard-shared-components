import React, { useMemo, useEffect, useState, useRef } from "react";
import { Card, Button, Space, Spin } from "antd";
import { ChartDataPoint, SeriesConfig } from "../../types/shared";
import { useLegendState } from "../../hooks/useLegendState";
import { useIncrementalAppender } from "../../hooks/useIncrementalAppender";
// import { useDecimatedSeries } from "../../hooks/useDecimatedSeries";
import { buildOption } from "../../utils/buildOption";
import { LegendControls } from "./LegendControls";
import { HighPerformanceChart } from "./HighPerformanceChart";
import { PerformanceConfigManager, PerformanceConfig, ChartMode } from "../../utils/performanceConfigManager";
// import { useRenderDebugger } from "../../hooks/useRenderDebugger";

// 增量数据接口
export interface IncrementalData {
   timestamp: number;
   seriesUpdates: Array<{
      seriesName: string;
      value: number;
   }>;
}

// 基础图表属性
interface BaseChartProps {
   data: ChartDataPoint[];
   seriesConfig: SeriesConfig;
   height?: number;
   width?: string | number;
   style?: React.CSSProperties;
   className?: string;
}

// 单图表模式属性
interface SingleChartProps extends BaseChartProps {
   mode: "single";
   // 单图表特有属性
   enableInteractions?: boolean;
   enableLegend?: boolean;
   enableZoom?: boolean;
   enableTimeRangeSelector?: boolean;
   title?: string;
   titleExtra?: React.ReactNode;
   maxDataPoints?: number;
   chartConfigManager?: any;
   incrementalData?: IncrementalData[];
   onDataAppended?: (dataCount: number) => void;
   performance?: Partial<PerformanceConfig>;
}

// 多图表模式属性
interface MultiChartProps extends BaseChartProps {
   mode: "multi";
   // 🔥 支持多个系列配置（向后兼容：如果只传 seriesConfig，则使用单个系列）
   seriesConfigs?: SeriesConfig[]; // 多个系列配置
   // 多图表特有属性
   enableLazyLoading?: boolean;
   enableVirtualization?: boolean;
   chartCount?: number;
   hideLegend?: boolean; // 隐藏图例（用于嵌入式场景）
   performance?: Partial<PerformanceConfig>;
}

// 懒加载图表属性
interface LazyChartProps extends MultiChartProps {
   enableLazyLoading: true;
   intersectionThreshold?: number;
   rootMargin?: string;
}

// 虚拟化图表属性
interface VirtualChartProps extends MultiChartProps {
   enableVirtualization: true;
   isVisible?: boolean;
   itemHeight?: number;
}

// 联合类型
type UnifiedChartProps = (SingleChartProps | MultiChartProps | LazyChartProps | VirtualChartProps) & {
   onChartReady?: (chartInstance: any) => void;
};

/**
 * 统一图表组件
 * 支持单图表模式（CSM）和多图表模式（LG-Web）
 */
const UnifiedChart: React.FC<UnifiedChartProps> = (props) => {
   const { mode } = props;

   // 根据模式确定图表数量
   const chartCount = "chartCount" in props ? props.chartCount || 12 : 1;
   const chartMode: ChartMode = { mode, chartCount };

   const customPerformance = (props as any).performance;

   const performanceConfig = useMemo(() => {
      const baseConfig = PerformanceConfigManager.getConfigForMode(chartMode);
      return customPerformance ? { ...baseConfig, ...customPerformance } : baseConfig;
   }, [chartMode.mode, chartMode.chartCount, customPerformance]);

   // 检查是否需要特殊处理
   const shouldUseLazyLoading =
      PerformanceConfigManager.shouldUseLazyLoading(chartMode) &&
      "enableLazyLoading" in props &&
      props.enableLazyLoading;

   const shouldUseVirtualization =
      PerformanceConfigManager.shouldUseVirtualization(chartMode) &&
      "enableVirtualization" in props &&
      props.enableVirtualization;

   // 懒加载处理
   if (shouldUseLazyLoading) {
      return <LazyChart {...(props as LazyChartProps)} performanceConfig={performanceConfig} />;
   }

   // 虚拟化处理
   if (shouldUseVirtualization) {
      return <VirtualChart {...(props as VirtualChartProps)} performanceConfig={performanceConfig} />;
   }

   // 单图表模式
   if (mode === "single") {
      return <SingleChart {...(props as SingleChartProps)} performanceConfig={performanceConfig} />;
   }

   // 多图表模式
   return (
      <MultiChart
         {...(props as MultiChartProps)}
         seriesConfigs={seriesConfigs}
         performanceConfig={performanceConfig}
         onChartReady={onChartReady}
      />
   );
};

/**
 * 单图表模式组件（CSM 场景）
 */
const SingleChart: React.FC<SingleChartProps & { performanceConfig: PerformanceConfig }> = ({
   data,
   seriesConfig,
   style,
   className,
   enableLegend = true,
   enableTimeRangeSelector = true,
   title = "设备实时曲线",
   titleExtra,
   maxDataPoints,
   chartConfigManager,
   incrementalData = [],
   onDataAppended,
   performance,
   performanceConfig,
}) => {
   const [internalData, setInternalData] = useState<ChartDataPoint[]>(data);
   const [timeRange, setTimeRange] = useState<number>(60);

   const effectiveSeriesConfigs = useMemo(
      () => chartConfigManager?.getSeriesConfig([seriesConfig]) || [seriesConfig],
      [seriesConfig, chartConfigManager],
   );

   // 合并性能配置
   const effectivePerformanceConfig = useMemo(() => {
      return { ...performanceConfig, ...performance };
   }, [performanceConfig, performance]);

   // 使用 hooks
   const legendState = useLegendState(effectiveSeriesConfigs);
   const incrementalAppender = useIncrementalAppender(effectiveSeriesConfigs, {
      enableIncrementalUpdate: effectivePerformanceConfig.enableIncrementalUpdate,
      highFrequencyMode: true,
      onDataAppended,
      maxBatchSize: maxDataPoints || effectivePerformanceConfig.maxDataPoints,
   });

   // const decimatedSeriesData = useDecimatedSeries(internalData, effectiveSeriesConfigs, timeRange, {
   //    maxPoints: maxDataPoints || effectivePerformanceConfig.maxDataPoints,
   //    enableDecimation: true,
   // });

   // 处理数据更新
   useEffect(() => {
      setInternalData(data);
   }, [data]);

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
         enableIncrementalUpdate: effectivePerformanceConfig.enableIncrementalUpdate,
         highFrequencyMode: true,
      });
   }, [effectiveSeriesConfigs, legendState.legendVisible, timeRange, effectivePerformanceConfig]);

   // 事件处理
   const handleLegendSelectChanged = (e: any) => {
      if (e && e.selected) {
         legendState.updateLegendVisible(e.selected);
      }
   };

   const handleTimeRangeChange = (minutes: number) => {
      setTimeRange(minutes);
   };

   return (
      <Card
         title={title}
         extra={titleExtra}
         size='small'
         style={{ height: "100%", ...style }}
         className={className}
         styles={{ body: { height: "calc(100% - 47px)", padding: "4px" } }}
      >
         {/* 图例控制 */}
         {enableLegend && <LegendControls legendState={legendState} />}

         {/* 高性能图表渲染器 */}
         <HighPerformanceChart
            baseOption={chartOption}
            data={internalData}
            seriesConfigs={effectiveSeriesConfigs}
            onLegendSelectChanged={handleLegendSelectChanged}
            maxDataPoints={maxDataPoints || effectivePerformanceConfig.maxDataPoints}
            enableLazyUpdate={effectivePerformanceConfig.enableLazyUpdate}
         />

         {/* 时间范围选择按钮 */}
         {enableTimeRangeSelector && (
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
         )}
      </Card>
   );
};

/**
 * 多图表模式组件（LG-Web 场景）
 * 🔥 支持多个系列配置
 */
const MultiChart: React.FC<
   MultiChartProps & { performanceConfig: PerformanceConfig; onChartReady?: (chartInstance: any) => void }
> = ({
   data,
   seriesConfig,
   seriesConfigs, // 🔥 支持多个系列配置
   height,
   width,
   style,
   className,
   hideLegend = false,
   performanceConfig,
   onChartReady,
}) => {
   // 🔥 确定要使用的系列配置：优先使用 seriesConfigs，否则使用单个 seriesConfig
   const effectiveSeriesConfigs = useMemo(() => {
      if (seriesConfigs && seriesConfigs.length > 0) {
         return seriesConfigs;
      }
      return seriesConfig ? [seriesConfig] : [];
   }, [seriesConfigs, seriesConfig]);

   // 构建简化的图表配置
   // 多系列小图表：强制隐藏内置图例
   const forceHideLegend = true;

   // 🔥 构建图例可见性映射（所有系列都可见）
   const legendVisibleMap = useMemo(() => {
      const map: Record<string, boolean> = {};
      effectiveSeriesConfigs.forEach((config) => {
         map[config.name] = true;
      });
      return map;
   }, [effectiveSeriesConfigs]);

   const chartOption = useMemo(() => {
      return buildOption({
         seriesConfigs: effectiveSeriesConfigs,
         legendVisible: legendVisibleMap,
         timeRange: 60,
         enableIncrementalUpdate: false,
         highFrequencyMode: false,
         hideLegend: hideLegend || forceHideLegend,
      });
   }, [effectiveSeriesConfigs, legendVisibleMap, hideLegend]);

   return (
      <div style={{ height: height || "100%", width: width || "100%", ...style }} className={className}>
         <HighPerformanceChart
            baseOption={chartOption}
            data={data} // 使用原始数据（多系列）
            seriesConfigs={effectiveSeriesConfigs} // 🔥 传递多个系列配置
            onLegendSelectChanged={() => {}}
            maxDataPoints={performanceConfig.maxDataPoints}
            enableLazyUpdate={false}
            hideLegend={hideLegend || forceHideLegend}
            onChartReady={onChartReady}
         />
      </div>
   );
};

/**
 * 懒加载图表组件
 */
const LazyChart: React.FC<LazyChartProps & { performanceConfig: PerformanceConfig }> = ({
   data,
   seriesConfig,
   height,
   width,
   style,
   className,
   hideLegend,
   intersectionThreshold = 0.1,
   rootMargin = "50px",
   performanceConfig,
}) => {
   const ref = useRef<HTMLDivElement>(null);
   const [isVisible, setIsVisible] = useState(false);

   useEffect(() => {
      const observer = new IntersectionObserver(
         ([entry]) => {
            setIsVisible(entry.isIntersecting);
         },
         {
            threshold: intersectionThreshold,
            rootMargin,
         },
      );

      if (ref.current) {
         observer.observe(ref.current);
      }

      return () => observer.disconnect();
   }, [intersectionThreshold, rootMargin]);

   return (
      <div ref={ref} style={{ height: height || "100%", width: width || "100%", ...style }} className={className}>
         {isVisible ? (
            <MultiChart
               mode='multi'
               data={data}
               seriesConfig={seriesConfig}
               performanceConfig={performanceConfig}
               hideLegend={hideLegend}
            />
         ) : (
            <div
               style={{
                  height: height || "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#f5f5f5",
                  borderRadius: "4px",
               }}
            >
               <Spin size='small' />
            </div>
         )}
      </div>
   );
};

/**
 * 虚拟化图表组件
 */
const VirtualChart: React.FC<VirtualChartProps & { performanceConfig: PerformanceConfig }> = ({
   data,
   seriesConfig,
   height,
   width,
   style,
   className,
   isVisible = true,
   hideLegend,
   performanceConfig,
}) => {
   if (!isVisible) {
      return (
         <div
            style={{
               height: height || "100%",
               width: width || "100%",
               display: "flex",
               alignItems: "center",
               justifyContent: "center",
               background: "#f5f5f5",
               borderRadius: "4px",
               ...style,
            }}
            className={className}
         >
            <Spin size='small' />
         </div>
      );
   }

   return (
      <MultiChart
         mode='multi'
         data={data}
         seriesConfig={seriesConfig}
         style={style}
         className={className}
         hideLegend={hideLegend}
         performanceConfig={performanceConfig}
      />
   );
};

export default UnifiedChart;
export type { UnifiedChartProps, SingleChartProps, MultiChartProps, LazyChartProps, VirtualChartProps };
