import React, { useState, useEffect, useRef, useCallback } from "react";
import { Row, Col, Card, Spin } from "antd";
import { ChartDataPoint, SeriesConfig } from "../../types/shared";
import { PerformanceConfigManager, PerformanceConfig } from "../../utils/performanceConfigManager";
import UnifiedChart from "./UnifiedChart";

export interface ChartConfig {
  id: string;
  data: ChartDataPoint[];
  seriesConfig: SeriesConfig;
  title?: string;
  height?: number;
  width?: string | number;
  style?: React.CSSProperties;
  className?: string;
}

export interface VirtualizedChartGridProps {
  charts: ChartConfig[];
  containerHeight: number;
  itemHeight: number;
  columns?: number;
  gutter?: [number, number];
  enableLazyLoading?: boolean;
  enableVirtualization?: boolean;
  onScroll?: (scrollTop: number) => void;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * 虚拟化图表网格组件
 * 用于高效渲染大量图表，支持懒加载和虚拟化
 */
const VirtualizedChartGrid: React.FC<VirtualizedChartGridProps> = ({
  charts,
  containerHeight,
  itemHeight,
  columns = 4,
  gutter = [16, 16],
  enableLazyLoading = true,
  enableVirtualization = true,
  onScroll,
  style,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });
  const [scrollTop, setScrollTop] = useState(0);

  // 计算可见范围
  const calculateVisibleRange = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    
    // 计算可见的起始和结束索引
    const itemsPerRow = columns;
    const rowHeight = itemHeight + gutter[1];
    const startRow = Math.floor(scrollTop / rowHeight);
    const endRow = Math.ceil((scrollTop + containerHeight) / rowHeight);
    
    const start = Math.max(0, startRow * itemsPerRow);
    const end = Math.min(charts.length, (endRow + 1) * itemsPerRow);
    
    setVisibleRange({ start, end });
    setScrollTop(scrollTop);
    
    if (onScroll) {
      onScroll(scrollTop);
    }
  }, [charts.length, columns, itemHeight, gutter, containerHeight, onScroll]);

  // 监听滚动事件
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      calculateVisibleRange();
    };

    container.addEventListener('scroll', handleScroll);
    
    // 初始计算
    calculateVisibleRange();

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [calculateVisibleRange]);

  // 获取性能配置
  const performanceConfig = PerformanceConfigManager.getConfigForMode({
    mode: 'multi',
    chartCount: charts.length,
  });

  // 渲染可见的图表
  const renderVisibleCharts = () => {
    const visibleCharts = charts.slice(visibleRange.start, visibleRange.end);
    
    return visibleCharts.map((chart, index) => {
      const actualIndex = visibleRange.start + index;
      const row = Math.floor(actualIndex / columns);
      const col = actualIndex % columns;
      
      return (
        <Col span={24 / columns} key={chart.id}>
          <Card
            title={chart.title}
            size="small"
            style={{
              height: itemHeight,
              marginBottom: gutter[1],
              ...chart.style,
            }}
            className={chart.className}
          >
            <UnifiedChart
              mode="multi"
              data={chart.data}
              seriesConfig={chart.seriesConfig}
              height={chart.height || itemHeight - 60} // 减去 Card 头部高度
              width={chart.width || "100%"}
              enableLazyLoading={enableLazyLoading}
              enableVirtualization={enableVirtualization}
              performance={performanceConfig}
            />
          </Card>
        </Col>
      );
    });
  };

  // 渲染占位符
  const renderPlaceholders = () => {
    const totalRows = Math.ceil(charts.length / columns);
    const visibleStartRow = Math.floor(visibleRange.start / columns);
    const visibleEndRow = Math.ceil(visibleRange.end / columns);
    
    const placeholders = [];
    
    // 上方占位符
    if (visibleStartRow > 0) {
      placeholders.push(
        <div
          key="top-placeholder"
          style={{
            height: visibleStartRow * (itemHeight + gutter[1]),
          }}
        />
      );
    }
    
    // 下方占位符
    if (visibleEndRow < totalRows) {
      placeholders.push(
        <div
          key="bottom-placeholder"
          style={{
            height: (totalRows - visibleEndRow) * (itemHeight + gutter[1]),
          }}
        />
      );
    }
    
    return placeholders;
  };

  return (
    <div
      ref={containerRef}
      style={{
        height: containerHeight,
        overflow: 'auto',
        ...style,
      }}
      className={className}
    >
      {/* 上方占位符 */}
      {renderPlaceholders()}
      
      {/* 可见图表 */}
      <Row gutter={gutter}>
        {renderVisibleCharts()}
      </Row>
      
      {/* 下方占位符 */}
      {renderPlaceholders()}
    </div>
  );
};

export default VirtualizedChartGrid;
export type { VirtualizedChartGridProps, ChartConfig };
