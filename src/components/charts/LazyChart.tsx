import React, { useRef, useState, useEffect, useCallback } from "react";
import { Spin } from "antd";
import { ChartDataPoint, SeriesConfig } from "../../types/shared";
import { PerformanceConfig } from "../../utils/performanceConfigManager";
import UnifiedChart from "./UnifiedChart";

export interface LazyChartProps {
   data: ChartDataPoint[];
   seriesConfig: SeriesConfig;
   height?: number;
   width?: string | number;
   style?: React.CSSProperties;
   className?: string;
   intersectionThreshold?: number;
   rootMargin?: string;
   performance?: Partial<PerformanceConfig>;
   onVisible?: () => void;
   onHidden?: () => void;
}

/**
 * 懒加载图表组件
 * 使用 Intersection Observer 实现图表懒加载，提升多图表场景性能
 */
const LazyChart: React.FC<LazyChartProps> = ({
   data,
   seriesConfig,
   height = 300,
   width = "100%",
   style,
   className,
   intersectionThreshold = 0.1,
   rootMargin = "50px",
   performance,
   onVisible,
   onHidden,
}) => {
   const ref = useRef<HTMLDivElement>(null);
   const [isVisible, setIsVisible] = useState(false);
   const [hasBeenVisible, setHasBeenVisible] = useState(false);

   // 处理可见性变化
   const handleVisibilityChange = useCallback(
      (isIntersecting: boolean) => {
         setIsVisible(isIntersecting);

         if (isIntersecting && !hasBeenVisible) {
            setHasBeenVisible(true);
            onVisible?.();
         } else if (!isIntersecting && hasBeenVisible) {
            onHidden?.();
         }
      },
      [hasBeenVisible, onVisible, onHidden]
   );

   // 设置 Intersection Observer
   useEffect(() => {
      const element = ref.current;
      if (!element) return;

      const observer = new IntersectionObserver(
         ([entry]) => {
            handleVisibilityChange(entry.isIntersecting);
         },
         {
            threshold: intersectionThreshold,
            rootMargin,
         }
      );

      observer.observe(element);

      return () => {
         observer.disconnect();
      };
   }, [intersectionThreshold, rootMargin, handleVisibilityChange]);

   // 渲染占位符
   const renderPlaceholder = () => (
      <div
         style={{
            height,
            width,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f5f5f5",
            borderRadius: "4px",
            border: "1px dashed #d9d9d9",
            ...style,
         }}
         className={className}
      >
         <div style={{ textAlign: "center" }}>
            <Spin size='small' />
            <div style={{ marginTop: 8, fontSize: 12, color: "#999" }}>图表加载中...</div>
         </div>
      </div>
   );

   // 渲染实际图表
   const renderChart = () => (
      <UnifiedChart
         mode='multi'
         data={data}
         seriesConfig={seriesConfig}
         height={height}
         width={width}
         style={style}
         className={className}
         performance={performance}
      />
   );

   return (
      <div ref={ref} style={{ height, width }}>
         {isVisible ? renderChart() : renderPlaceholder()}
      </div>
   );
};

export default LazyChart;
