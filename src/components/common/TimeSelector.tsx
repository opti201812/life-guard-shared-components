import React from "react";
import { Card, Row, Col, DatePicker, Button } from "antd";
import { ReloadOutlined, SettingOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

interface TimeSelectorProps {
   timeRange: [dayjs.Dayjs, dayjs.Dayjs] | null;
   setTimeRange: (value: [dayjs.Dayjs, dayjs.Dayjs] | null) => void;
   loadHistoryData: () => void;
   loadDevices: () => void;
   loading: boolean;
}

const TimeSelector: React.FC<TimeSelectorProps> = ({
   timeRange,
   setTimeRange,
   loadHistoryData,
   loadDevices,
   loading,
}) => {
   return (
      <Card style={{ marginBottom: 24 }}>
         <Row gutter={16} align='middle'>
            <Col span={12}>
               <RangePicker
                  value={timeRange}
                  onChange={(dates: any) => dates && setTimeRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
                  showTime
                  format='YYYY-MM-DD HH:mm:ss'
                  style={{ width: "100%" }}
               />
            </Col>
            <Col span={12}>
               <Button
                  type='primary'
                  icon={<ReloadOutlined />}
                  onClick={loadHistoryData}
                  loading={loading}
                  style={{ marginRight: 8 }}
               >
                  加载历史数据
               </Button>
               <Button icon={<SettingOutlined />} onClick={loadDevices}>
                  刷新设备列表
               </Button>
            </Col>
         </Row>
      </Card>
   );
};

export default TimeSelector;
