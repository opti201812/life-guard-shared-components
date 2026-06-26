import { SeriesConfig } from "../types/shared";

// 🔥 颜色工具函数：生成更淡的颜色（用于markLines）
// baseColor: 基础颜色（hex格式，如 "#ff4d4f"）
// lightness: 亮度增加量（0-1，值越大越淡）
const lightenColor = (baseColor: string, lightness: number): string => {
   // 移除 # 号
   const hex = baseColor.replace("#", "");
   // 转换为RGB
   const r = parseInt(hex.substring(0, 2), 16);
   const g = parseInt(hex.substring(2, 4), 16);
   const b = parseInt(hex.substring(4, 6), 16);
   // 增加亮度（混合白色）
   const newR = Math.round(r + (255 - r) * lightness);
   const newG = Math.round(g + (255 - g) * lightness);
   const newB = Math.round(b + (255 - b) * lightness);
   // 转换回hex
   return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB
      .toString(16)
      .padStart(2, "0")}`;
};

// 默认系列配置
export const defaultSeriesConfigs: SeriesConfig[] = [
   // ========== 基础体征 ==========
   // 心率相关（曲线一）
   {
      key: "heartRate",
      name: "雷达心率",
      group: "basicVitals",
      color: "#ff4d4f",
      display: "series-and-realtime",
      highDensity: true,
      markLines: [
         { value: 100, name: "正常上限", color: lightenColor("#ff4d4f", 0.3) },
         { value: 60, name: "正常下限", color: lightenColor("#ff4d4f", 0.5) },
      ],
   },
   {
      key: "braceletHeartRate",
      name: "手环心率",
      group: "basicVitals",
      color: "#ff7875",
      display: "series-and-realtime",
      highDensity: true,
      markLines: [
         { value: 100, name: "正常上限", color: lightenColor("#ff7875", 0.3) },
         { value: 60, name: "正常下限", color: lightenColor("#ff7875", 0.5) },
      ],
   },
   {
      key: "oximeterHeartRate",
      name: "血氧仪心率",
      group: "basicVitals",
      color: "#ff9c9c",
      display: "series-and-realtime",
      highDensity: true,
      markLines: [
         { value: 100, name: "正常上限", color: lightenColor("#ff9c9c", 0.3) },
         { value: 60, name: "正常下限", color: lightenColor("#ff9c9c", 0.5) },
      ],
   },
   // 呼吸相关（曲线二）
   {
      key: "breathRate",
      name: "雷达呼吸",
      group: "basicVitals",
      color: "#1890ff",
      display: "series-and-realtime",
      highDensity: true,
      markLines: [
         { value: 30, name: "正常上限", color: lightenColor("#1890ff", 0.3) },
         { value: 6, name: "正常下限", color: lightenColor("#1890ff", 0.5) },
      ],
   },
   {
      key: "posture",
      name: "雷达姿态",
      group: "basicVitals",
      color: "#722ed1",
      display: "series-and-realtime",
      highDensity: false,
      // 姿态值：1=离开, 2=坐姿, 3=平卧, 4=侧卧
   },
   {
      key: "breathAlarmStatus",
      name: "呼吸状态",
      group: "basicVitals",
      color: "#eb2f96",
      display: "series-and-realtime",
      highDensity: false,
      // 0=报警, 1=正常
   },
   {
      key: "breathInterruptCount",
      name: "呼吸中断次数",
      group: "basicVitals",
      color: "#13c2c2",
      display: "series-and-realtime",
      highDensity: false,
   },
   {
      key: "breathInterruptMaxDuration",
      name: "呼吸中断最长时长",
      group: "basicVitals",
      color: "#2f54eb",
      display: "series-and-realtime",
      highDensity: false,
   },
   // 血压相关（曲线三）
   {
      key: "systolicPressure",
      name: "手环收缩压",
      group: "basicVitals",
      color: "#fa8c16",
      display: "series-and-realtime",
      highDensity: true,
      markLines: [
         { value: 140, name: "高血压上限", color: lightenColor("#fa8c16", 0.2) },
         { value: 90, name: "正常上限", color: lightenColor("#fa8c16", 0.3) },
         { value: 60, name: "低血压下限", color: lightenColor("#fa8c16", 0.5) },
      ],
   },
   {
      key: "diastolicPressure",
      name: "手环舒张压",
      group: "basicVitals",
      color: "#faad14",
      display: "series-and-realtime",
      highDensity: true,
      markLines: [
         { value: 140, name: "高血压上限", color: lightenColor("#faad14", 0.2) },
         { value: 90, name: "正常上限", color: lightenColor("#faad14", 0.3) },
         { value: 60, name: "低血压下限", color: lightenColor("#faad14", 0.5) },
      ],
   },
   // 血氧相关（曲线四）
   {
      key: "spo2",
      name: "血氧仪血氧",
      group: "basicVitals",
      color: "#52c41a",
      display: "series-and-realtime",
      highDensity: true,
      markLines: [{ value: 95, name: "正常下限", color: lightenColor("#52c41a", 0.5) }],
   },
   {
      key: "bloodOxygen",
      name: "手环血氧",
      group: "basicVitals",
      color: "#73d13d",
      display: "series-and-realtime",
      highDensity: true,
      markLines: [{ value: 95, name: "正常下限", color: lightenColor("#73d13d", 0.5) }],
   },
   // 体温相关（曲线五）
   {
      key: "bodyTemperature",
      name: "手环体温",
      group: "basicVitals",
      color: "#ff7a45",
      display: "series-and-realtime",
      highDensity: true,
      markLines: [{ value: 35, name: "正常下限", color: lightenColor("#ff7a45", 0.5) }],
   },
   // 距离
   {
      key: "distance",
      name: "距离",
      group: "basicVitals",
      color: "#722ed1",
      display: "series-and-realtime",
      highDensity: true,
   },

   // ========== 心率分析 ==========
   {
      key: "sdnn",
      name: "SDNN",
      group: "vitalAnalysis",
      color: "#fa8c16",
      display: "series-and-realtime",
      highDensity: false,
   },
   {
      key: "sdann",
      name: "SDANN",
      group: "vitalAnalysis",
      color: "#ffa940",
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
   {
      key: "pnn50",
      name: "pNN50",
      group: "vitalAnalysis",
      color: "#36cfc9",
      display: "series-and-realtime",
      highDensity: false,
   },
   {
      key: "lfPower",
      name: "LF功率",
      group: "vitalAnalysis",
      color: "#9254de",
      display: "series-and-realtime",
      highDensity: false,
   },
   {
      key: "hfPower",
      name: "HF功率",
      group: "vitalAnalysis",
      color: "#b37feb",
      display: "series-and-realtime",
      highDensity: false,
   },
   {
      key: "lfHfRatio",
      name: "LF/HF",
      group: "vitalAnalysis",
      color: "#d3adf7",
      display: "series-and-realtime",
      highDensity: false,
   },
   {
      key: "breathRateVariabilitySD",
      name: "呼吸SD",
      group: "vitalAnalysis",
      color: "#40a9ff",
      display: "series-and-realtime",
      highDensity: false,
   },
   {
      key: "breathAmplitudeVariabilityCV",
      name: "呼吸CV",
      group: "vitalAnalysis",
      color: "#69c0ff",
      display: "series-and-realtime",
      highDensity: false,
   },

   // ========== 综合评测 ==========
   {
      key: "stressEmotion",
      name: "压力值",
      group: "comprehensiveEvaluation",
      color: "#ff4d4f",
      display: "series-and-realtime",
      highDensity: false,
      // 压力值范围：0-100，百分之一
      // 0-69低压力、70-89中压力、90-100高压力
      markLines: [
         { value: 90, name: "高压力下限", color: lightenColor("#ff4d4f", 0.3) },
         { value: 70, name: "中压力下限", color: lightenColor("#ff4d4f", 0.5) },
      ],
   },
   {
      key: "fatigueTolerance",
      name: "疲劳耐受值",
      group: "comprehensiveEvaluation",
      color: "#fa8c16",
      display: "series-and-realtime",
      highDensity: false,
      // 疲劳耐受值范围：0-100，百分之一
      markLines: [
         { value: 90, name: "上限", color: lightenColor("#fa8c16", 0.3) },
         { value: 70, name: "下限", color: lightenColor("#fa8c16", 0.5) },
      ],
   },
   {
      key: "sleepQuality",
      name: "睡眠质量分数",
      group: "comprehensiveEvaluation",
      color: "#eb2f96",
      display: "series-and-realtime",
      highDensity: false,
      // 睡眠质量分数范围：0-100
      markLines: [
         { value: 90, name: "优秀下限", color: lightenColor("#eb2f96", 0.3) },
         { value: 70, name: "良好下限", color: lightenColor("#eb2f96", 0.5) },
      ],
   },
   {
      key: "heartAttackRisk",
      name: "心梗风险值",
      group: "comprehensiveEvaluation",
      color: "#cf1322",
      display: "series-and-realtime",
      highDensity: false,
      // 心梗风险值：万分之一
      markLines: [
         { value: 50, name: "高风险下限", color: lightenColor("#cf1322", 0.3) },
         { value: 30, name: "中风险下限", color: lightenColor("#cf1322", 0.5) },
      ],
   },

   // ========== 睡眠监测（用于睡眠状态图，特殊处理）==========
   {
      key: "sleepStatus",
      name: "睡眠状态",
      group: "sleepMonitoring",
      color: "#722ed1",
      display: "series-and-realtime",
      highDensity: false,
      // 睡眠状态：1=清醒, 2=浅睡, 3=深睡, 4=快速眼动
   },
   {
      key: "posture",
      name: "睡眠姿态",
      group: "sleepMonitoring",
      color: "#9254de",
      display: "series-and-realtime",
      highDensity: false,
      // 姿态：1=离开, 2=坐姿, 3=平卧, 4=侧卧
   },
   // 睡眠时长统计（用于显示，不绘制曲线）
   {
      key: "awakeDuration",
      name: "清醒总时长",
      group: "sleepMonitoring",
      color: "#ff4d4f",
      display: "realtime-only",
      highDensity: false,
   },
   {
      key: "lightSleepDuration",
      name: "浅睡总时长",
      group: "sleepMonitoring",
      color: "#1890ff",
      display: "realtime-only",
      highDensity: false,
   },
   {
      key: "deepSleepDuration",
      name: "深睡总时长",
      group: "sleepMonitoring",
      color: "#52c41a",
      display: "realtime-only",
      highDensity: false,
   },
   {
      key: "maxContinuousDeepSleep",
      name: "连续深睡时长",
      group: "sleepMonitoring",
      color: "#13c2c2",
      display: "realtime-only",
      highDensity: false,
   },
   {
      key: "remDuration",
      name: "快速眼动时长",
      group: "sleepMonitoring",
      color: "#eb2f96",
      display: "realtime-only",
      highDensity: false,
   },
   {
      key: "totalSleepDuration",
      name: "睡眠总时长",
      group: "sleepMonitoring",
      color: "#722ed1",
      display: "realtime-only",
      highDensity: false,
   },
];

// 默认图例分组
export const legendGroupsDefault = {
   basicVitals: {
      name: "基础体征",
      items: [
         "雷达心率",
         "手环心率",
         "血氧仪心率",
         "雷达呼吸",
         "雷达姿态",
         "呼吸状态",
         "呼吸中断次数",
         "呼吸中断最长时长",
         "手环收缩压",
         "手环舒张压",
         "血氧仪血氧",
         "手环血氧",
         "手环体温",
         "距离",
      ],
   },
   vitalAnalysis: {
      name: "心率分析",
      items: ["SDNN", "SDANN", "RMSSD", "pNN50", "LF功率", "HF功率", "LF/HF", "呼吸SD", "呼吸CV"],
   },
   comprehensiveEvaluation: {
      name: "综合评测",
      items: ["压力值", "疲劳耐受值", "睡眠质量分数", "心梗风险值"],
   },
   sleepMonitoring: {
      name: "睡眠监测",
      items: [
         "睡眠状态",
         "睡眠姿态",
         "清醒总时长",
         "浅睡总时长",
         "深睡总时长",
         "连续深睡时长",
         "快速眼动时长",
         "睡眠总时长",
      ],
   },
};
