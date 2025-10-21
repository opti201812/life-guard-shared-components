// 导出录制数据模态框

import React, { useState, useEffect } from "react";
import { Modal, Table, Button, message, Space, Typography, Spin, Tag, Popconfirm } from "antd";
import { DownloadOutlined, DeleteOutlined, DatabaseOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { indexedDBManager, RecordingSession, IndexedDBManager } from "../../utils/indexedDBManager";
import { CSVExporter } from "../../utils/csvExporter";

const { Text, Title } = Typography;

interface ExportDataModalProps {
   visible: boolean;
   onCancel: () => void;
   mode?: "export" | "manage";
}

const ExportDataModal: React.FC<ExportDataModalProps> = ({ visible, onCancel, mode = "export" }) => {
   const [sessions, setSessions] = useState<RecordingSession[]>([]);
   const [loading, setLoading] = useState(false);
   const [exporting, setExporting] = useState<string | null>(null);

   // 加载录制会话列表
   const loadSessions = async () => {
      try {
         setLoading(true);

         // 检查 IndexedDB 支持
         if (!IndexedDBManager.isSupported()) {
            message.warning("浏览器不支持 IndexedDB");
            return;
         }

         await indexedDBManager.initialize();
         const allSessions = await indexedDBManager.getAllSessions();
         setSessions(allSessions);
      } catch (error) {
         console.error("加载录制会话失败:", error);
         message.error("加载录制会话失败");
      } finally {
         setLoading(false);
      }
   };

   // 导出会话数据
   const handleExport = async (session: RecordingSession) => {
      try {
         setExporting(session.id);

         // 获取会话数据
         const sessionData = await indexedDBManager.getSessionData(session.id);

         if (!sessionData || sessionData.length === 0) {
            message.warning("该会话没有数据可导出");
            return;
         }

         // 导出为CSV
         await CSVExporter.exportSessionToCSV(sessionData, session.name);

         message.success(`会话 "${session.name}" 导出成功`);
      } catch (error) {
         console.error("导出失败:", error);
         message.error("导出失败");
      } finally {
         setExporting(null);
      }
   };

   // 删除会话
   const handleDelete = async (sessionId: string) => {
      try {
         await indexedDBManager.deleteSession(sessionId);
         setSessions((prev) => prev.filter((session) => session.id !== sessionId));
         message.success("会话删除成功");
      } catch (error) {
         console.error("删除失败:", error);
         message.error("删除失败");
      }
   };

   // 清理过期会话
   const handleCleanup = async () => {
      try {
         const deletedCount = await indexedDBManager.cleanupExpiredSessions();
         if (deletedCount > 0) {
            message.success(`已清理 ${deletedCount} 个过期会话`);
            loadSessions(); // 重新加载列表
         } else {
            message.info("没有找到过期会话");
         }
      } catch (error) {
         console.error("清理失败:", error);
         message.error("清理失败");
      }
   };

   // 格式化持续时间
   const formatDuration = (seconds: number): string => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;

      if (hours > 0) {
         return `${hours}小时${minutes}分钟`;
      } else if (minutes > 0) {
         return `${minutes}分钟${secs}秒`;
      } else {
         return `${secs}秒`;
      }
   };

   // 格式化文件大小
   const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
   };

   // 表格列定义
   const columns = [
      {
         title: "会话名称",
         dataIndex: "name",
         key: "name",
         render: (text: string) => <Text strong>{text}</Text>,
      },
      {
         title: "开始时间",
         dataIndex: "startTime",
         key: "startTime",
         render: (time: number) => new Date(time).toLocaleString(),
      },
      {
         title: "持续时间",
         dataIndex: "duration",
         key: "duration",
         render: (duration: number) => formatDuration(duration),
      },
      {
         title: "数据点数",
         dataIndex: "dataCount",
         key: "dataCount",
         render: (count: number) => <Tag color='blue'>{count.toLocaleString()}</Tag>,
      },
      {
         title: "操作",
         key: "actions",
         render: (_: any, record: RecordingSession) => (
            <Space>
               <Button
                  type='primary'
                  icon={<DownloadOutlined />}
                  size='small'
                  loading={exporting === record.id}
                  onClick={() => handleExport(record)}
               >
                  导出
               </Button>
               {mode === "manage" && (
                  <Popconfirm
                     title='确定要删除这个会话吗？'
                     description='删除后无法恢复'
                     onConfirm={() => handleDelete(record.id)}
                     okText='确定'
                     cancelText='取消'
                  >
                     <Button type='text' danger icon={<DeleteOutlined />} size='small'>
                        删除
                     </Button>
                  </Popconfirm>
               )}
            </Space>
         ),
      },
   ];

   // 模态框打开时加载数据
   useEffect(() => {
      if (visible) {
         loadSessions();
      }
   }, [visible]);

   return (
      <Modal
         title={
            <Space>
               <DatabaseOutlined />
               <span>{mode === "export" ? "导出录制数据" : "管理录制数据"}</span>
            </Space>
         }
         open={visible}
         onCancel={onCancel}
         width={800}
         footer={[
            <Button key='cleanup' onClick={handleCleanup}>
               清理过期会话
            </Button>,
            <Button key='close' onClick={onCancel}>
               关闭
            </Button>,
         ]}
      >
         <Spin spinning={loading}>
            {sessions.length === 0 ? (
               <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <DatabaseOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />
                  <div style={{ marginTop: 16, color: "#666" }}>暂无录制会话</div>
               </div>
            ) : (
               <Table
                  columns={columns}
                  dataSource={sessions}
                  rowKey='id'
                  pagination={{
                     pageSize: 10,
                     showSizeChanger: true,
                     showQuickJumper: true,
                     showTotal: (total: number) => `共 ${total} 个会话`,
                  }}
                  size='small'
               />
            )}
         </Spin>
      </Modal>
   );
};

export default ExportDataModal;
