// IndexedDB 数据存储管理器

import { RadarData, BraceletData, OximeterData, RecordingSession, SessionData } from "../types/shared";

export class IndexedDBManager {
   private dbName = "LifeGuardRecordings";
   private dbVersion = 2; // 增加版本号以支持新的表结构
   private db: IDBDatabase | null = null;

   /**
    * 检查浏览器是否支持 IndexedDB
    */
   static isSupported(): boolean {
      return "indexedDB" in window && indexedDB !== null;
   }

   /**
    * 强制清除数据库并重新创建
    */
   async clearAndRecreate(): Promise<void> {
      if (!IndexedDBManager.isSupported()) {
         throw new Error("浏览器不支持 IndexedDB");
      }

      return new Promise((resolve, reject) => {
         // 先关闭现有连接
         if (this.db) {
            this.db.close();
            this.db = null;
         }

         // 删除现有数据库
         const deleteRequest = indexedDB.deleteDatabase(this.dbName);

         deleteRequest.onsuccess = () => {
            console.log("数据库已删除，正在重新创建...");
            // 重新初始化
            this.initialize().then(resolve).catch(reject);
         };

         deleteRequest.onerror = () => {
            console.error("删除数据库失败:", deleteRequest.error);
            reject(new Error("删除数据库失败"));
         };
      });
   }

   /**
    * 初始化数据库
    */
   async initialize(): Promise<void> {
      if (!IndexedDBManager.isSupported()) {
         throw new Error("浏览器不支持 IndexedDB");
      }

      return new Promise((resolve, reject) => {
         const request = indexedDB.open(this.dbName, this.dbVersion);

         request.onerror = () => {
            reject(new Error("无法打开 IndexedDB"));
         };

         request.onsuccess = () => {
            this.db = request.result;
            resolve();
         };

         request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const oldVersion = event.oldVersion;

            // 创建会话表
            if (!db.objectStoreNames.contains("sessions")) {
               const sessionStore = db.createObjectStore("sessions", { keyPath: "id" });
               sessionStore.createIndex("startTime", "startTime");
               sessionStore.createIndex("createdAt", "createdAt");
            }

            // 处理sessionData表的升级
            if (oldVersion < 2) {
               // 如果存在旧版本的sessionData表，删除并重新创建
               if (db.objectStoreNames.contains("sessionData")) {
                  db.deleteObjectStore("sessionData");
               }

               // 创建新版本的sessionData表
               const dataStore = db.createObjectStore("sessionData", { autoIncrement: true });
               dataStore.createIndex("sessionId", "sessionId");
               dataStore.createIndex("timestamp", "timestamp");
               dataStore.createIndex("type", "type");
               dataStore.createIndex("sessionId_timestamp", ["sessionId", "timestamp"]);
            } else if (!db.objectStoreNames.contains("sessionData")) {
               // 如果不存在sessionData表，创建它
               const dataStore = db.createObjectStore("sessionData", { autoIncrement: true });
               dataStore.createIndex("sessionId", "sessionId");
               dataStore.createIndex("timestamp", "timestamp");
               dataStore.createIndex("type", "type");
               dataStore.createIndex("sessionId_timestamp", ["sessionId", "timestamp"]);
            }
         };
      });
   }

   /**
    * 创建新的录制会话
    */
   async createSession(startTime: number): Promise<string> {
      if (!this.db) throw new Error("数据库未初始化");

      const sessionId = `session_${startTime}_${Date.now()}`;
      const session: RecordingSession = {
         id: sessionId,
         startTime,
         endTime: 0,
         name: "",
         dataCount: 0,
         duration: 0,
         createdAt: Date.now(),
      };

      return new Promise((resolve, reject) => {
         const transaction = this.db!.transaction(["sessions"], "readwrite");
         const store = transaction.objectStore("sessions");
         const request = store.add(session);

         request.onsuccess = () => resolve(sessionId);
         request.onerror = () => reject(new Error("创建会话失败"));
      });
   }

   /**
    * 添加数据到会话
    */
   async addDataToSession(
      sessionId: string,
      type: "radar" | "bracelet" | "oximeter",
      data: RadarData | BraceletData | OximeterData
   ): Promise<void> {
      if (!this.db) throw new Error("数据库未初始化");

      const sessionData: SessionData = {
         sessionId,
         timestamp: data.timestamp,
         type,
         data,
      };

      return new Promise((resolve, reject) => {
         const transaction = this.db!.transaction(["sessionData"], "readwrite");
         const store = transaction.objectStore("sessionData");
         const request = store.add(sessionData);

         request.onsuccess = () => resolve();
         request.onerror = () => {
            console.error("IndexedDB添加数据失败:", {
               error: request.error,
               sessionId,
               type,
               timestamp: data.timestamp,
               dataSize: JSON.stringify(data).length,
            });
            reject(new Error(`添加数据失败: ${request.error?.message || "未知错误"}`));
         };

         transaction.onerror = () => {
            console.error("IndexedDB事务失败:", transaction.error);
            reject(new Error(`事务失败: ${transaction.error?.message || "未知错误"}`));
         };
      });
   }

   /**
    * 完成录制会话
    */
   async finishSession(sessionId: string, endTime: number): Promise<void> {
      if (!this.db) throw new Error("数据库未初始化");

      return new Promise((resolve, reject) => {
         const transaction = this.db!.transaction(["sessions", "sessionData"], "readwrite");

         // 获取会话信息
         const sessionStore = transaction.objectStore("sessions");
         const getRequest = sessionStore.get(sessionId);

         getRequest.onsuccess = () => {
            const session: RecordingSession = getRequest.result;
            if (!session) {
               reject(new Error("会话不存在"));
               return;
            }

            // 计算数据量
            const dataStore = transaction.objectStore("sessionData");
            const countRequest = dataStore.index("sessionId").count(sessionId);

            countRequest.onsuccess = () => {
               const dataCount = countRequest.result;
               const duration = Math.floor((endTime - session.startTime) / 1000);

               // 生成会话名称
               const startDate = new Date(session.startTime);
               const endDate = new Date(endTime);
               const formatTime = (date: Date) =>
                  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
                     date.getDate()
                  ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(
                     2,
                     "0"
                  )}:${String(date.getSeconds()).padStart(2, "0")}`;

               session.endTime = endTime;
               session.name = `${formatTime(startDate)} ～ ${formatTime(endDate)}`;
               session.dataCount = dataCount;
               session.duration = duration;

               // 更新会话
               const updateRequest = sessionStore.put(session);
               updateRequest.onsuccess = () => resolve();
               updateRequest.onerror = () => reject(new Error("更新会话失败"));
            };
         };

         getRequest.onerror = () => reject(new Error("获取会话失败"));
      });
   }

   /**
    * 获取所有录制会话
    */
   async getAllSessions(): Promise<RecordingSession[]> {
      if (!this.db) throw new Error("数据库未初始化");

      return new Promise(async (resolve, reject) => {
         try {
            const transaction = this.db!.transaction(["sessions"], "readonly");
            const store = transaction.objectStore("sessions");
            const request = store.index("startTime").getAll();

            request.onsuccess = async () => {
               try {
                  const sessions = request.result;

                  // 为每个会话计算实际数据条数
                  const sessionsWithCount = await Promise.all(
                     sessions.map(async (session) => {
                        const dataCount = await this.getSessionDataCount(session.id);
                        return {
                           ...session,
                           dataCount,
                        };
                     })
                  );

                  // 按开始时间倒序排列
                  sessionsWithCount.sort((a, b) => b.startTime - a.startTime);
                  resolve(sessionsWithCount);
               } catch (error) {
                  reject(error);
               }
            };

            request.onerror = () => reject(new Error("获取会话列表失败"));
         } catch (error) {
            reject(error);
         }
      });
   }

   /**
    * 获取会话数据条数
    */
   async getSessionDataCount(sessionId: string): Promise<number> {
      if (!this.db) throw new Error("数据库未初始化");

      return new Promise((resolve, reject) => {
         const transaction = this.db!.transaction(["sessionData"], "readonly");
         const store = transaction.objectStore("sessionData");
         const index = store.index("sessionId");
         const request = index.count(sessionId);

         request.onsuccess = () => resolve(request.result);
         request.onerror = () => reject(new Error("获取会话数据条数失败"));
      });
   }

   /**
    * 获取会话数据
    */
   async getSessionData(sessionId: string): Promise<SessionData[]> {
      if (!this.db) throw new Error("数据库未初始化");

      return new Promise((resolve, reject) => {
         const transaction = this.db!.transaction(["sessionData"], "readonly");
         const store = transaction.objectStore("sessionData");
         const request = store.index("sessionId").getAll(sessionId);

         request.onsuccess = () => {
            const data = request.result;
            // 按时间戳排序
            data.sort((a, b) => a.timestamp - b.timestamp);
            resolve(data);
         };

         request.onerror = () => reject(new Error("获取会话数据失败"));
      });
   }

   /**
    * 删除会话及其数据
    */
   async deleteSession(sessionId: string): Promise<void> {
      if (!this.db) throw new Error("数据库未初始化");

      return new Promise((resolve, reject) => {
         const transaction = this.db!.transaction(["sessions", "sessionData"], "readwrite");

         // 删除会话数据
         const dataStore = transaction.objectStore("sessionData");
         const dataIndex = dataStore.index("sessionId");
         const dataRequest = dataIndex.openCursor(sessionId);

         dataRequest.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result;
            if (cursor) {
               cursor.delete();
               cursor.continue();
            } else {
               // 删除会话记录
               const sessionStore = transaction.objectStore("sessions");
               const sessionRequest = sessionStore.delete(sessionId);

               sessionRequest.onsuccess = () => resolve();
               sessionRequest.onerror = () => reject(new Error("删除会话失败"));
            }
         };

         dataRequest.onerror = () => reject(new Error("删除会话数据失败"));
      });
   }

   /**
    * 获取数据库使用情况
    */
   async getStorageInfo(): Promise<{ quota: number; usage: number }> {
      if ("storage" in navigator && "estimate" in navigator.storage) {
         const estimate = await navigator.storage.estimate();
         return {
            quota: estimate.quota || 0,
            usage: estimate.usage || 0,
         };
      }
      return { quota: 0, usage: 0 };
   }

   /**
    * 清理过期数据（超过30天的会话）
    */
   async cleanupExpiredSessions(): Promise<number> {
      if (!this.db) throw new Error("数据库未初始化");

      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      let deletedCount = 0;

      return new Promise((resolve, reject) => {
         const transaction = this.db!.transaction(["sessions"], "readonly");
         const store = transaction.objectStore("sessions");
         const request = store.index("createdAt").openCursor(IDBKeyRange.upperBound(thirtyDaysAgo));

         const sessionsToDelete: string[] = [];

         request.onsuccess = async (event) => {
            const cursor = (event.target as IDBRequest).result;
            if (cursor) {
               sessionsToDelete.push(cursor.value.id);
               cursor.continue();
            } else {
               // 删除过期会话
               try {
                  for (const sessionId of sessionsToDelete) {
                     await this.deleteSession(sessionId);
                     deletedCount++;
                  }
                  resolve(deletedCount);
               } catch (error) {
                  reject(error);
               }
            }
         };

         request.onerror = () => reject(new Error("清理过期数据失败"));
      });
   }
}

export const indexedDBManager = new IndexedDBManager();

// 导出类型供外部使用
export type { RecordingSession, SessionData };

