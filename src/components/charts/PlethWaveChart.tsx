import React, { useEffect, useRef } from "react";
import ReactECharts from "echarts-for-react";

interface PlethWaveChartProps {
   data: number[]; // 接收数组数据
   title: string;
}

const PlethWaveChart: React.FC<PlethWaveChartProps> = ({ data, title }) => {
   const chartRef = useRef<ReactECharts>(null);

   const baseOption = {
      grid: {
         top: 20,
         right: 10,
         bottom: 20,
         left: 40,
         containLabel: true,
      },
      xAxis: {
         type: "value",
         show: false,
         boundaryGap: false,
         min: 0,
         max: 60, // 固定x轴刻度为0-60
      },
      yAxis: {
         type: "value",
         axisLine: { show: true },
         splitLine: { show: true },
         min: 0,
         max: 100, // 固定y轴刻度为0-100
      },
      series: [
         {
            type: "line",
            data: data.map((val: number, idx: number) => [idx, val]), // 使用传入的数据
            smooth: true,
            lineStyle: { color: "#1890ff" },
            areaStyle: { color: "rgba(24, 144, 255, 0.1)" },
            symbol: "none",
         },
      ],
      tooltip: {
         trigger: "axis",
         formatter: (params: any) => {
            return `${title}: ${params[0].value[1]}`;
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

export default PlethWaveChart;

