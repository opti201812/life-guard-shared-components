import React, { useState, useEffect, useRef } from "react";
import { Card, Statistic, Row, Col, Progress, Tag } from "antd";
import { PerformanceConfig } from "../../utils/performanceConfigManager";
import { globalBatchUpdateManager } from "../../utils/batchUpdateManager";

export interface PerformanceMetrics {
   renderTime: number;
   memoryUsage: number;
   fps: number;
   chartCount: number;
   updateQueueLength: number;
   isProcessing: boolean;
}

export interface PerformanceMonitorProps {
   visible?: boolean;
   position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
   style?: React.CSSProperties;
   className?: string;
   onMetricsChange?: (metrics: PerformanceMetrics) => void;
}

/**
 * 性能监控组件
 * 用于监控多图表场景下的性能指标
 */
const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
   visible = true,
   position = "top-right",
   style,
   className,
   onMetricsChange,
}) => {
   const [metrics, setMetrics] = useState<PerformanceMetrics>({
      renderTime: 0,
      memoryUsage: 0,
      fps: 0,
      chartCount: 0,
      updateQueueLength: 0,
      isProcessing: false,
   });

   const frameCount = useRef(0);
   const lastTime = useRef(performance.now());
   const animationId = useRef<number>();

   // 监控性能指标
   const updateMetrics = () => {
      const now = performance.now();
      frameCount.current++;

      // 计算 FPS
      if (now - lastTime.current >= 1000) {
         const fps = Math.round((frameCount.current * 1000) / (now - lastTime.current));
         frameCount.current = 0;
         lastTime.current = now;

         // 获取内存使用情况
         const memoryUsage = "memory" in performance ? (performance as any).memory.usedJSHeapSize / 1024 / 1024 : 0;

         // 获取批量更新管理器状态
         const queueStatus = globalBatchUpdateManager.getQueueStatus();

         const newMetrics: PerformanceMetrics = {
            renderTime: 0, // 这个需要在实际渲染时测量
            memoryUsage,
            fps,
            chartCount: queueStatus.registeredCharts,
            updateQueueLength: queueStatus.queueLength,
            isProcessing: queueStatus.isProcessing,
         };

         setMetrics(newMetrics);
         onMetricsChange?.(newMetrics);
      }

      animationId.current = requestAnimationFrame(updateMetrics);
   };

   useEffect(() => {
      if (visible) {
         updateMetrics();
      }

      return () => {
         if (animationId.current) {
            cancelAnimationFrame(animationId.current);
         }
      };
   }, [visible]);

   // 测量渲染时间
   const measureRenderTime = (callback: () => void) => {
      const startTime = performance.now();
      callback();
      const endTime = performance.now();

      setMetrics((prev) => ({
         ...prev,
         renderTime: endTime - startTime,
      }));
   };

   // 获取性能状态颜色
   const getPerformanceColor = (fps: number) => {
      if (fps >= 50) return "green";
      if (fps >= 30) return "orange";
      return "red";
   };

   // 获取内存状态颜色
   const getMemoryColor = (memory: number) => {
      if (memory < 50) return "green";
      if (memory < 100) return "orange";
      return "red";
   };

   if (!visible) return null;

   const positionStyle = {
      position: "fixed" as const,
      zIndex: 1000,
      ...(position.includes("top") ? { top: 10 } : { bottom: 10 }),
      ...(position.includes("left") ? { left: 10 } : { right: 10 }),
   };

   return (
      <Card
         title='性能监控'
         size='small'
         style={{
            width: 300,
            ...positionStyle,
            ...style,
         }}
         className={className}
      >
         <Row gutter={[8, 8]}>
            <Col span={12}>
               <Statistic
                  title='FPS'
                  value={metrics.fps}
                  suffix='fps'
                  valueStyle={{
                     color: getPerformanceColor(metrics.fps),
                     fontSize: 14,
                  }}
               />
            </Col>
            <Col span={12}>
               <Statistic
                  title='内存'
                  value={metrics.memoryUsage.toFixed(1)}
                  suffix='MB'
                  valueStyle={{
                     color: getMemoryColor(metrics.memoryUsage),
                     fontSize: 14,
                  }}
               />
            </Col>
            <Col span={12}>
               <Statistic title='图表数' value={metrics.chartCount} valueStyle={{ fontSize: 14 }} />
            </Col>
            <Col span={12}>
               <Statistic
                  title='渲染时间'
                  value={metrics.renderTime.toFixed(1)}
                  suffix='ms'
                  valueStyle={{ fontSize: 14 }}
               />
            </Col>
            <Col span={24}>
               <div style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: "#666" }}>更新队列: </span>
                  <Tag color={metrics.updateQueueLength > 0 ? "orange" : "green"}>{metrics.updateQueueLength}</Tag>
                  {metrics.isProcessing && (
                     <Tag color='blue' style={{ marginLeft: 8 }}>
                        处理中
                     </Tag>
                  )}
               </div>
            </Col>
            <Col span={24}>
               <div style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: "#666" }}>性能状态: </span>
                  <Tag color={getPerformanceColor(metrics.fps)}>
                     {metrics.fps >= 50 ? "优秀" : metrics.fps >= 30 ? "良好" : "需要优化"}
                  </Tag>
               </div>
            </Col>
         </Row>
      </Card>
   );
};

export default PerformanceMonitor;
export type { PerformanceMonitorProps, PerformanceMetrics };
