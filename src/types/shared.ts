// 多设备监控系统的类型定义

export interface RadarData {
   deviceId: string;
   timestamp: number;
   // V3协议基础数据
   distance: number; // 距离
   reflection: number; // 反射强度
   environmentInterference: number; // 环境干扰
   breathRate: number; // 呼吸率 (对应旧版本的 breathing)
   heartRate: number; // 心率

   // V3协议呼吸监测数据
   breathAlarmStatus: number; // 呼吸中断报警状态
   breathInterruptCount: number; // 呼吸中断次数
   breathInterruptMaxDuration: number; // 呼吸中断最长时长
   breathRateVariabilitySD: number; // 呼吸频率变异性SD
   breathAmplitudeVariabilityCV: number; // 呼吸幅度变异系数CV

   // V3协议心率变异性指标
   sdnn: number; // SDNN
   sdann: number; // SDANN
   rmssd: number; // RMSSD
   pnn50: number; // pNN50

   // V3协议频域指标
   lfPower: number; // LF功率
   hfPower: number; // HF功率
   lfHfRatio: number; // LF/HF比值

   // V3协议健康评估
   stressEmotion: number; // 压力情绪
   fatigueTolerance: number; // 疲劳耐受指标
   sleepQuality: number; // 睡眠质量指标

   // V3协议状态信息
   posture: number; // 姿态
   sleepStatus: number; // 睡眠状态

   // V3协议睡眠时长
   awakeDuration: number; // 清醒时长
   lightSleepDuration: number; // 浅睡时长
   deepSleepDuration: number; // 深睡时长
   maxContinuousDeepSleep: number; // 连续深睡最长时间
   remDuration: number; // 眼动时长
   totalSleepDuration: number; // 睡眠总时

   // V3协议环境数据
   environmentTemperature: number; // 环境温度
   environmentHumidity: number; // 环境湿度

   // V3协议报警信息
   emergencyAlarmStatus: number; // 紧急报警状态
   heartAttackRisk: number; // 心梗风险值

   // 连接状态
   isConnected: boolean;

   // 兼容性字段（用于向后兼容旧版本）
   breathing?: number; // 兼容旧版本，映射到 breathRate
   lowHeartRateCount?: number; // 兼容旧版本
   signalNoiseRatio?: number; // 兼容旧版本，映射到 reflection 或 environmentInterference
   stableTime?: number; // 兼容旧版本
   vitalSignFlag?: number; // 兼容旧版本
}

export interface BraceletData {
   deviceId: string;
   timestamp: number;
   heartRate: number; // 真值心率 (0-250) - 对应 braceletHeartRate
   steps?: number; // 步数 (V1版本字段)
   batteryLevel?: number; // 电量 (V1版本字段)
   // V2.0新增字段
   systolicPressure?: number | null; // 收缩压
   diastolicPressure?: number | null; // 舒张压
   bloodOxygen?: number | null; // 血氧饱和度 - 对应 bloodOxygen
   bodyTemperature?: number | null; // 体温 - 对应 bodyTemperature
   batteryVoltage?: number; // 电池电压
   tamperStatus?: number; // 防拆状态
   buttonStatus?: number; // 按键状态
   isConnected: boolean;
}

export interface OximeterData {
   deviceId?: string;
   timestamp: number;
   type?: string; // 设备类型
   deviceType?: string; // 设备类型
   protocolVersion?: string; // 协议版本
   spo2: number | null; // 血氧饱和度 (0-100) - 与WebSocket数据格式一致
   heartRate: number | null; // 心率 (0-250) - 对应 oximeterHeartRate
   batteryLevel?: number; // 电量 (0-100)
   signalQuality: number | null; // 信号质量 (0-100) - 对应 signalQuality
   // 其他字段
   plethWave?: number | null; // 脉搏波形
   barGraph?: number | null; // 条形图
   fingerOut?: boolean; // 手指是否脱离
   searchingPulse?: boolean; // 搜索脉搏中
   searchTooLong?: boolean; // 搜索时间过长
   probeNotConnected?: boolean; // 探头未连接
   pulseSound?: boolean; // 脉搏声音
   isConnected?: boolean;
}

export interface Device {
   id: string;
   name: string;
   type: "radar" | "bracelet" | "oximeter";
   isConnected: boolean;
   // 扩展属性
   lastUpdate?: number;
   batteryLevel?: number;
   signalQuality?: number;
   protocolVersion?: string;
}

export interface DeviceConfig {
   radar: Device | null;
   bracelet: Device | null;
   oximeter: Device | null;
}

export interface ThresholdSettings {
   // 可修改的限制值
   heartRateLimits: number[]; // 心跳限制直线 [100, 60]
   breathingLimits: number[]; // 呼吸限制直线 [30, 6]
   bloodPressureLimits: number[]; // 血压限值直线 [140, 90, 60]
   spO2Limits: number[]; // 血氧限制直线 [95]
   temperatureLimits: number[]; // 体温限制直线 [37.5]

   // 只读的限制值
   sdnnLimits: number[]; // SDNN(SDANN) [10, 90]
   rmssdLimits: number[]; // RMSSD [10, 90]
   pnn50Limits: number[]; // pNN50 [10, 90]
   lfLimits: number[]; // LF [10, 90]
   hfLimits: number[]; // HF [10, 90]
   lfHfRatioLimits: number[]; // LF/HF [10, 90]
   sdLimits: number[]; // SD [10, 90]
   cvLimits: number[]; // CV [10, 90]
   pressureLimits: number[]; // 限值直线 [70, 90]
   fatigueLimits: number[]; // 疲劳耐受限值直线 [70, 90]
   sleepQualityLimits: number[]; // 睡眠质量限制直线 [70, 90]
   infarctionRiskLimits: number[]; // 心梗风险 [30, 50]

   // 设备配置
   duration: number; // 时长(秒)，默认60秒
   distance: number; // 距离(cm)，默认2cm，只读
}

export interface RealtimeStats {
   distance: number;
   breathRate: number; // 呼吸频率（统一命名）
   heartRate: number; // 雷达心率
   braceletHeartRate: number; // 手环心率（统一命名）
   oximeterHeartRate: number; // 血氧仪心率（统一命名）
   lowHeartRate: number;
   signalNoiseRatio: number;
   stableTime: number;
   vitalSignFlag: number;
   spO2: number; // 来自血氧仪的血氧值

   // 手环额外字段
   systolicPressure: number; // 收缩压
   diastolicPressure: number; // 舒张压
   bloodOxygen: number; // 手环血氧
   bodyTemperature: number; // 体温

   // 雷达心率变异性指标
   sdnn: number; // SDNN
   rmssd: number; // RMSSD
   pnn50: number; // pNN50
   lfPower: number; // LF功率
   hfPower: number; // HF功率
   lfHfRatio: number; // LF/HF比值

   // 睡眠监测相关字段
   posture?: number; // 姿态
   sleepStatus?: number; // 睡眠状态
   totalSleepDuration?: number; // 睡眠总时长
   lightSleepDuration?: number; // 浅睡时长
   deepSleepDuration?: number; // 深睡时长
   remDuration?: number; // 眼动时长
   awakeDuration?: number; // 清醒时长
   maxContinuousDeepSleep?: number; // 连续深睡最长时间
   sleepQuality?: number; // 睡眠质量指标
   stressEmotion?: number; // 压力情绪
   fatigueTolerance?: number; // 疲劳耐受指标
}

export interface ChartDataPoint {
   timestamp: number;
   // Radar V3 Protocol fields
   distance?: number; // 距离
   reflection?: number; // 反射强度
   environmentInterference?: number; // 环境干扰
   breathRate?: number; // 雷达呼吸频率
   heartRate?: number; // 雷达心率

   // V3协议呼吸监测数据
   breathAlarmStatus?: number; // 呼吸中断报警状态
   breathInterruptCount?: number; // 呼吸中断次数
   breathInterruptMaxDuration?: number; // 呼吸中断最长时长
   breathRateVariabilitySD?: number; // 呼吸频率变异性SD
   breathAmplitudeVariabilityCV?: number; // 呼吸幅度变异系数CV

   // V3协议心率变异性指标
   sdnn?: number; // SDNN
   sdann?: number; // SDANN
   rmssd?: number; // RMSSD
   pnn50?: number; // pNN50

   // V3协议频域指标
   lfPower?: number; // LF功率
   hfPower?: number; // HF功率
   lfHfRatio?: number; // LF/HF比值

   // V3协议健康评估
   stressEmotion?: number; // 压力情绪
   fatigueTolerance?: number; // 疲劳耐受指标
   sleepQuality?: number; // 睡眠质量指标

   // V3协议状态信息
   posture?: number; // 姿态
   sleepStatus?: number; // 睡眠状态

   // V3协议睡眠时长
   awakeDuration?: number; // 清醒时长
   lightSleepDuration?: number; // 浅睡时长
   deepSleepDuration?: number; // 深睡时长
   maxContinuousDeepSleep?: number; // 连续深睡最长时间
   remDuration?: number; // 眼动时长
   totalSleepDuration?: number; // 睡眠总时

   // V3协议环境数据
   environmentTemperature?: number; // 环境温度
   environmentHumidity?: number; // 环境湿度

   // V3协议报警信息
   emergencyAlarmStatus?: number; // 紧急报警状态
   heartAttackRisk?: number; // 心梗风险值

   // 向后兼容字段
   lowHeartRateCount?: number; // 雷达低心率计数（兼容）
   confidence?: number; // 雷达信心度/信噪比（兼容）
   vitalSign?: number; // 雷达生命体征标志（兼容）

   // Bracelet fields
   braceletHeartRate?: number; // 手环心率（真值心率）
   systolicPressure?: number; // 收缩压
   diastolicPressure?: number; // 舒张压
   bloodOxygen?: number; // 手环血氧
   bodyTemperature?: number; // 体温
   // Oximeter fields
   spo2?: number; // 血氧仪血氧饱和度
   oximeterHeartRate?: number; // 血氧仪心率
   signalQuality?: number; // 血氧仪信号质量
}

// 图表序列配置
export type SeriesDisplayMode = "series-and-realtime" | "realtime-only" | "none";

export interface VisualPiece {
   gt?: number;
   gte?: number;
   lt?: number;
   lte?: number;
   color: string;
   label?: string;
}

export interface SeriesConfig {
   key: keyof ChartDataPoint; // 字段名，对应 ChartDataPoint 的键
   name: string; // 图例/显示名称
   group: string; // 分组名，如 "basicVitals"、"vitalAnalysis"
   color: string; // 线条颜色
   display: SeriesDisplayMode; // 是否显示曲线
   highDensity?: boolean; // 是否高密度数据
   // 直接给出 markLine 值（优先使用）
   markLines?: { value: number; name?: string; color?: string }[];
   // 正常区背景色（当有两条阈值线时，在二者之间渲染）
   normalAreaColor?: string;
   // 分段着色（visualMap piecewise）
   visualPieces?: VisualPiece[];
}

// 增量数据接口
export interface IncrementalData {
   timestamp: number;
   seriesUpdates: Array<{
      seriesName: string;
      value: number;
   }>;
}

// 录制会话接口
export interface RecordingSession {
   id: string;
   startTime: number;
   endTime: number;
   name: string; // 格式：开始时刻～停止时刻
   dataCount: number;
   duration: number; // 持续时间(秒)
   createdAt: number;
}

export interface SessionData {
   sessionId: string;
   timestamp: number;
   type: "radar" | "bracelet" | "oximeter";
   data: RadarData | BraceletData | OximeterData;
}
