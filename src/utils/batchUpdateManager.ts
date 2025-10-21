import { ChartDataPoint } from "../types/shared";

export interface ChartUpdate {
   chartId: string;
   data: ChartDataPoint[];
   timestamp: number;
}

export interface BatchUpdateConfig {
   maxBatchSize: number;
   throttleMs: number;
   enableBatching: boolean;
}

/**
 * 批量更新管理器
 * 用于优化多图表场景下的数据更新性能
 */
export class BatchUpdateManager {
   private updateQueue: ChartUpdate[] = [];
   private isProcessing = false;
   private config: BatchUpdateConfig;
   private updateCallbacks: Map<string, (data: ChartDataPoint[]) => void> = new Map();

   constructor(config: Partial<BatchUpdateConfig> = {}) {
      this.config = {
         maxBatchSize: 10,
         throttleMs: 50,
         enableBatching: true,
         ...config,
      };
   }

   /**
    * 注册图表更新回调
    */
   registerChart(chartId: string, callback: (data: ChartDataPoint[]) => void) {
      this.updateCallbacks.set(chartId, callback);
   }

   /**
    * 注销图表
    */
   unregisterChart(chartId: string) {
      this.updateCallbacks.delete(chartId);
   }

   /**
    * 调度图表更新
    */
   scheduleUpdate(chartId: string, data: ChartDataPoint[]) {
      if (!this.config.enableBatching) {
         // 直接更新
         const callback = this.updateCallbacks.get(chartId);
         if (callback) {
            callback(data);
         }
         return;
      }

      // 添加到更新队列
      const update: ChartUpdate = {
         chartId,
         data,
         timestamp: Date.now(),
      };

      this.updateQueue.push(update);

      // 如果队列达到最大大小，立即处理
      if (this.updateQueue.length >= this.config.maxBatchSize) {
         this.processBatch();
      } else {
         // 延迟处理
         setTimeout(() => {
            this.processBatch();
         }, this.config.throttleMs);
      }
   }

   /**
    * 处理批量更新
    */
   private processBatch() {
      if (this.isProcessing || this.updateQueue.length === 0) {
         return;
      }

      this.isProcessing = true;

      // 使用 requestAnimationFrame 确保在下一帧处理
      requestAnimationFrame(() => {
         const updates = [...this.updateQueue];
         this.updateQueue = [];

         // 按图表ID分组更新
         const groupedUpdates = this.groupUpdatesByChart(updates);

         // 批量执行更新
         groupedUpdates.forEach((latestUpdate, chartId) => {
            const callback = this.updateCallbacks.get(chartId);
            if (callback) {
               callback(latestUpdate.data);
            }
         });

         this.isProcessing = false;

         // 如果处理期间又有新更新，继续处理
         if (this.updateQueue.length > 0) {
            this.processBatch();
         }
      });
   }

   /**
    * 按图表ID分组更新，只保留最新的更新
    */
   private groupUpdatesByChart(updates: ChartUpdate[]): Map<string, ChartUpdate> {
      const grouped = new Map<string, ChartUpdate>();

      updates.forEach((update) => {
         const existing = grouped.get(update.chartId);
         if (!existing || update.timestamp > existing.timestamp) {
            grouped.set(update.chartId, update);
         }
      });

      return grouped;
   }

   /**
    * 强制处理所有待处理的更新
    */
   flush() {
      this.processBatch();
   }

   /**
    * 清空更新队列
    */
   clear() {
      this.updateQueue = [];
   }

   /**
    * 获取队列状态
    */
   getQueueStatus() {
      return {
         queueLength: this.updateQueue.length,
         isProcessing: this.isProcessing,
         registeredCharts: this.updateCallbacks.size,
      };
   }

   /**
    * 更新配置
    */
   updateConfig(newConfig: Partial<BatchUpdateConfig>) {
      this.config = { ...this.config, ...newConfig };
   }
}

// 全局批量更新管理器实例
export const globalBatchUpdateManager = new BatchUpdateManager();

export default BatchUpdateManager;
