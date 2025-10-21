import React, { useEffect, useRef } from "react";
import ReactECharts from "echarts-for-react";

interface BarGraphChartProps {
   data: number; // 接收最新的一个数据值
   title: string;
}

const BarGraphChart: React.FC<BarGraphChartProps> = ({ data, title }) => {
   const chartRef = useRef<ReactECharts>(null);

   const baseOption = {
      grid: {
         top: 20,
         right: 10,
         bottom: 20,
         left: 60, // 增加左边距，给y轴标签留出更多空间
         containLabel: true,
      },
      xAxis: {
         type: "value",
         show: false,
         boundaryGap: false,
         min: 0,
         max: 1, // 固定范围0-1
         interval: 0.2, // 固定刻度间隔为0.2
      },
      yAxis: {
         type: "value",
         axisLine: { show: true },
         splitLine: { show: true },
         min: 0,
         max: 10, // 确保y轴有合适的范围，即使没有数据也显示
         interval: 2, // 设置刻度间隔，确保y轴有足够的空间
         axisLabel: {
            show: true,
            margin: 8, // 给标签留出足够空间
         },
      },
      series: [
         {
            type: "bar",
            data: [[0.4, data || 0]], // 使用传入的数据值，位置固定在0.4
            itemStyle: { color: "#52c41a" },
            barWidth: "60%",
            coordinateSystem: "cartesian2d",
         },
      ],
      tooltip: {
         trigger: "axis",
         formatter: (params: any) => {
            return `${title}: ${params[0]?.value[1] || 0}`;
         },
      },
   };

   return (
      <div style={{ height: 120 }}>
         <div style={{ textAlign: "center", marginTop: 8 }}>{title}</div>
         <ReactECharts ref={chartRef} option={baseOption} style={{ height: "100%" }} notMerge={true} />
      </div>
   );
};

export default BarGraphChart;
