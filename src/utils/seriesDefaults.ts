import { SeriesConfig } from "../types/shared";

// 默认系列配置
export const defaultSeriesConfigs: SeriesConfig[] = [
   // 基础体征
   {
      key: "heartRate",
      name: "心率",
      group: "basicVitals",
      color: "#ff4d4f",
      display: "series-and-realtime",
      highDensity: true,
      markLines: [{ value: 100, name: "正常上限", color: "#52c41a" }],
   },
   {
      key: "breathRate",
      name: "呼吸率",
      group: "basicVitals",
      color: "#1890ff",
      display: "series-and-realtime",
      highDensity: true,
      markLines: [{ value: 20, name: "正常上限", color: "#52c41a" }],
   },
   {
      key: "distance",
      name: "距离",
      group: "basicVitals",
      color: "#722ed1",
      display: "series-and-realtime",
      highDensity: true,
   },
   // 体征分析
   {
      key: "sdnn",
      name: "SDNN",
      group: "vitalAnalysis",
      color: "#fa8c16",
      display: "series-and-realtime",
      highDensity: false,
   },
   {
      key: "rmssd",
      name: "RMSSD",
      group: "vitalAnalysis",
      color: "#13c2c2",
      display: "series-and-realtime",
      highDensity: false,
   },
   // 睡眠监测
   {
      key: "sleepQuality",
      name: "睡眠质量",
      group: "sleepMonitoring",
      color: "#eb2f96",
      display: "series-and-realtime",
      highDensity: false,
   },
];

// 默认图例分组
export const legendGroupsDefault = {
   basicVitals: {
      name: "基础体征",
      items: ["心率", "呼吸率", "距离"],
   },
   vitalAnalysis: {
      name: "体征分析",
      items: ["SDNN", "RMSSD", "pNN50", "LF功率", "HF功率"],
   },
   sleepMonitoring: {
      name: "睡眠监测",
      items: ["睡眠质量", "压力情绪", "疲劳耐受"],
   },
};

