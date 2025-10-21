import React, { useState } from "react";
import { Card, Button, Space, Badge, Typography } from "antd";
import {
   SettingOutlined,
   ClearOutlined,
   VideoCameraOutlined,
   StopOutlined,
   WifiOutlined,
   DisconnectOutlined,
   DownloadOutlined,
} from "@ant-design/icons";
import { DeviceConfig } from "../../types/shared";

const { Text } = Typography;

interface DeviceControlPanelProps {
   deviceConfig: DeviceConfig;
   isConnected: boolean;
   isRecording: boolean;
   isProcessing?: boolean; // 新增：处理状态
   onDeviceConfigClick: () => void;
   onThresholdSettingsClick: () => void;
   onToggleConnection: () => void;
   onClearData: () => void;
   onToggleRecording: () => void;
   onExportDataClick: () => void;
   onClearRecordingDB: () => void; // 新增：清除录制数据库
}

const DeviceControlPanel: React.FC<DeviceControlPanelProps> = ({
   deviceConfig,
   isConnected,
   isRecording,
   isProcessing = false, // 默认值
   onDeviceConfigClick,
   onThresholdSettingsClick,
   onToggleConnection,
   onClearData,
   onToggleRecording,
   onExportDataClick,
   onClearRecordingDB,
}) => {
   const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

   const handleButtonClick = async (action: string, callback: () => void) => {
      setLoading((prev) => ({ ...prev, [action]: true }));

      if (action === "connection") {
         // 连接操作：等待异步操作完成
         try {
            await callback();
         } catch (error) {
            console.error("连接操作失败:", error);
         } finally {
            setLoading((prev) => ({ ...prev, [action]: false }));
         }
      } else {
         // 其他操作：同步执行
         try {
            callback();
         } finally {
            setLoading((prev) => ({ ...prev, [action]: false }));
         }
      }
   };

   // 获取设备连接状态
   const getDeviceStatus = () => {
      const connected = [
         deviceConfig.radar?.isConnected,
         deviceConfig.bracelet?.isConnected,
         deviceConfig.oximeter?.isConnected,
      ].filter(Boolean).length;

      const total = [deviceConfig.radar, deviceConfig.bracelet, deviceConfig.oximeter].filter(Boolean).length;

      return { connected, total };
   };

   // 获取设备连接状态（考虑实时状态）
   const getDeviceConnectionStatus = (device: any) => {
      if (!device) return "default";
      return device.isConnected ? "success" : "default";
   };

   const { connected, total } = getDeviceStatus();

   return (
      <Card
         title={
            <Space>
               <SettingOutlined />
               <span>设备控制</span>
            </Space>
         }
         size='small'
         style={{ height: "100%" }}
      >
         <Space direction='vertical' style={{ width: "100%" }} size='small'>
            {/* 设备配置区域 */}
            <div>
               <Button
                  type='default'
                  icon={<SettingOutlined />}
                  onClick={onDeviceConfigClick}
                  block
                  disabled={isConnected} // 连接时禁用设备选择
                  style={{ marginBottom: 8 }}
               >
                  设备选择 {isConnected && "(连接中禁用)"}
               </Button>

               <div style={{ fontSize: "11px", color: "#666", marginBottom: 8 }}>
                  <div
                     style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}
                  >
                     <Text>🎯 雷达:</Text>
                     <Badge
                        status={getDeviceConnectionStatus(deviceConfig.radar)}
                        text={deviceConfig.radar?.name || "未选择"}
                        style={{ fontSize: "10px" }}
                     />
                  </div>
                  <div
                     style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}
                  >
                     <Text>⌚ 手环:</Text>
                     <Badge
                        status={getDeviceConnectionStatus(deviceConfig.bracelet)}
                        text={deviceConfig.bracelet?.name || "未选择"}
                        style={{ fontSize: "10px" }}
                     />
                  </div>
                  <div
                     style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}
                  >
                     <Text>🩺 血氧仪:</Text>
                     <Badge
                        status={getDeviceConnectionStatus(deviceConfig.oximeter)}
                        text={deviceConfig.oximeter?.name || "未选择"}
                        style={{ fontSize: "10px" }}
                     />
                  </div>
               </div>
            </div>

            {/* 连接控制 */}
            <div>
               <Button
                  type='primary'
                  danger={isConnected}
                  icon={isConnected ? <DisconnectOutlined /> : <WifiOutlined />}
                  onClick={() => handleButtonClick("connection", onToggleConnection)}
                  loading={loading.connection}
                  block
                  disabled={total === 0}
                  style={{ marginBottom: 4 }}
               >
                  {isConnected ? "断开设备" : "连接设备"} ({connected}/{total})
               </Button>
            </div>

            {/* 数值设置 */}
            <div>
               <Button type='default' icon={<SettingOutlined />} onClick={onThresholdSettingsClick} block>
                  阈值配置
               </Button>
            </div>

            {/* 数据管理 */}
            <div>
               <Space direction='vertical' style={{ width: "100%" }} size='small'>
                  <Button
                     type='default'
                     icon={<ClearOutlined />}
                     onClick={() => handleButtonClick("clear", onClearData)}
                     loading={loading.clear}
                     block
                  >
                     清除数据
                  </Button>

                  <Button
                     type='primary'
                     danger={isRecording}
                     icon={isRecording ? <StopOutlined /> : <VideoCameraOutlined />}
                     onClick={() => handleButtonClick("recording", onToggleRecording)}
                     loading={loading.recording || isProcessing}
                     disabled={isProcessing}
                     block
                  >
                     {isProcessing
                        ? isRecording
                           ? "正在停止..."
                           : "正在开始..."
                        : isRecording
                        ? "停止录制"
                        : "开始录制"}
                  </Button>

                  <Button
                     type='default'
                     icon={<DownloadOutlined />}
                     onClick={() => handleButtonClick("export", onExportDataClick)}
                     loading={loading.export}
                     block
                  >
                     导出录制数据
                  </Button>

                  <Button
                     type='default'
                     danger
                     icon={<ClearOutlined />}
                     onClick={() =>
                        handleButtonClick("clearDB", () => {
                           if (window.confirm("确定要清除所有录制数据吗？此操作不可恢复！")) {
                              onClearRecordingDB();
                           }
                        })
                     }
                     loading={loading.clearDB}
                     block
                  >
                     清除录制数据
                  </Button>
               </Space>

               {isRecording && (
                  <div style={{ fontSize: "12px", color: "#ff4d4f", marginTop: 4 }}>
                     <Badge status='processing' text='正在录制数据...' />
                  </div>
               )}
            </div>
         </Space>
      </Card>
   );
};

export default DeviceControlPanel;

