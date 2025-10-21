// CSV 数据导出工具

import { SessionData, RadarData, BraceletData, OximeterData } from "../types/shared";

/**
 * 将会话数据导出为CSV格式
 */
export class CSVExporter {
   /**
    * 导出会话数据为CSV文件
    */
   static async exportSessionToCSV(sessionData: SessionData[], sessionName: string): Promise<void> {
      if (sessionData.length === 0) {
         throw new Error("没有数据可导出");
      }

      // 准备CSV数据
      const csvContent = this.generateCSVContent(sessionData);

      // 创建Blob并下载
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");

      if (link.download !== undefined) {
         const url = URL.createObjectURL(blob);
         link.setAttribute("href", url);
         link.setAttribute("download", `录制数据_${sessionName}.csv`);
         link.style.visibility = "hidden";
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
         URL.revokeObjectURL(url);
      } else {
         throw new Error("浏览器不支持文件下载");
      }
   }

   /**
    * 生成CSV内容
    */
   private static generateCSVContent(sessionData: SessionData[]): string {
      // 定义CSV列头
      const headers = [
         "时间戳",
         "设备类型",
         "时间",
         // 雷达数据列
         "距离(cm)",
         "反射强度",
         "环境干扰",
         "呼吸频率",
         "心率",
         "SDNN",
         "SDANN",
         "RMSSD",
         "pNN50",
         "LF功率",
         "HF功率",
         "LF/HF比值",
         "压力情绪",
         "疲劳耐受",
         "睡眠质量",
         "姿态",
         "睡眠状态",
         "清醒时长",
         "浅睡时长",
         "深睡时长",
         "最长连续深睡",
         "REM时长",
         "总睡眠时长",
         "环境温度",
         "环境湿度",
         "紧急报警状态",
         "心梗风险",
         // 手环数据列
         "手环心率",
         "收缩压",
         "舒张压",
         "手环血氧",
         "体温",
         "电池电压",
         "防拆状态",
         "按键状态",
         // 血氧仪数据列
         "血氧饱和度",
         "血氧仪心率",
         "信号质量",
         "电量",
         "脉搏波形",
         "条形图",
         "手指脱离",
         "搜索脉搏",
         "搜索过长",
         "探头未连接",
         "脉搏声音",
      ];

      const rows = [headers.join(",")];

      // 转换数据行
      sessionData.forEach((item) => {
         const row = this.convertDataToRow(item);
         rows.push(row.join(","));
      });

      return rows.join("\n");
   }

   /**
    * 将数据项转换为CSV行
    */
   private static convertDataToRow(item: SessionData): string[] {
      const timestamp = item.timestamp;
      const deviceType = item.type;
      const timeStr = new Date(timestamp).toLocaleString("zh-CN");

      // 初始化所有列为空值
      const row = new Array(49).fill(""); // 根据列头数量调整（3基础+27雷达+8手环+11血氧仪=49）

      // 基础信息
      row[0] = timestamp.toString();
      row[1] = deviceType;
      row[2] = `"${timeStr}"`;

      if (item.type === "radar") {
         const data = item.data as RadarData;
         row[3] = this.formatValue(data.distance);
         row[4] = this.formatValue(data.reflection);
         row[5] = this.formatValue(data.environmentInterference);
         row[6] = this.formatValue(data.breathRate);
         row[7] = this.formatValue(data.heartRate);
         row[8] = this.formatValue(data.sdnn);
         row[9] = this.formatValue(data.sdann);
         row[10] = this.formatValue(data.rmssd);
         row[11] = this.formatValue(data.pnn50);
         row[12] = this.formatValue(data.lfPower);
         row[13] = this.formatValue(data.hfPower);
         row[14] = this.formatValue(data.lfHfRatio);
         row[15] = this.formatValue(data.stressEmotion);
         row[16] = this.formatValue(data.fatigueTolerance);
         row[17] = this.formatValue(data.sleepQuality);
         row[18] = this.formatValue(data.posture);
         row[19] = this.formatValue(data.sleepStatus);
         row[20] = this.formatValue(data.awakeDuration);
         row[21] = this.formatValue(data.lightSleepDuration);
         row[22] = this.formatValue(data.deepSleepDuration);
         row[23] = this.formatValue(data.maxContinuousDeepSleep);
         row[24] = this.formatValue(data.remDuration);
         row[25] = this.formatValue(data.totalSleepDuration);
         row[26] = this.formatValue(data.environmentTemperature);
         row[27] = this.formatValue(data.environmentHumidity);
         row[28] = this.formatValue(data.emergencyAlarmStatus);
         row[29] = this.formatValue(data.heartAttackRisk);
      } else if (item.type === "bracelet") {
         const data = item.data as BraceletData;
         row[30] = this.formatValue(data.heartRate);
         row[31] = this.formatValue(data.systolicPressure);
         row[32] = this.formatValue(data.diastolicPressure);
         row[33] = this.formatValue(data.bloodOxygen);
         row[34] = this.formatValue(data.bodyTemperature);
         row[35] = this.formatValue(data.batteryVoltage);
         row[36] = this.formatValue(data.tamperStatus);
         row[37] = this.formatValue(data.buttonStatus);
      } else if (item.type === "oximeter") {
         const data = item.data as OximeterData;
         row[38] = this.formatValue(data.spo2);
         row[39] = this.formatValue(data.heartRate);
         row[40] = this.formatValue(data.signalQuality);
         row[41] = this.formatValue(data.batteryLevel);
         row[42] = this.formatValue(data.plethWave);
         row[43] = this.formatValue(data.barGraph);
         row[44] = this.formatValue(data.fingerOut ? 1 : 0);
         row[45] = this.formatValue(data.searchingPulse ? 1 : 0);
         row[46] = this.formatValue(data.searchTooLong ? 1 : 0);
         row[47] = this.formatValue(data.probeNotConnected ? 1 : 0);
         row[48] = this.formatValue(data.pulseSound ? 1 : 0);
      }

      return row;
   }

   /**
    * 格式化数值，处理null/undefined
    */
   private static formatValue(value: any): string {
      if (value === null || value === undefined) {
         return "";
      }
      if (typeof value === "number") {
         return value.toString();
      }
      if (typeof value === "string") {
         // 处理包含逗号的字符串
         return value.includes(",") ? `"${value}"` : value;
      }
      return value.toString();
   }

   /**
    * 生成导出统计报告
    */
   static generateExportSummary(sessionData: SessionData[]): string {
      const radarCount = sessionData.filter((item) => item.type === "radar").length;
      const braceletCount = sessionData.filter((item) => item.type === "bracelet").length;
      const oximeterCount = sessionData.filter((item) => item.type === "oximeter").length;

      const startTime = Math.min(...sessionData.map((item) => item.timestamp));
      const endTime = Math.max(...sessionData.map((item) => item.timestamp));
      const duration = Math.floor((endTime - startTime) / 1000 / 60); // 分钟

      return `导出完成！
数据统计：
- 雷达数据：${radarCount} 条
- 手环数据：${braceletCount} 条  
- 血氧仪数据：${oximeterCount} 条
- 录制时长：${duration} 分钟
- 总数据量：${sessionData.length} 条`;
   }
}

