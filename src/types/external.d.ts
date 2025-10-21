// 外部依赖的类型声明
// 这些类型声明用于在没有安装peer dependencies时提供基本的类型支持

declare module "antd" {
   export const Button: any;
   export const Card: any;
   export const Space: any;
   export const Badge: any;
   export const Typography: any;
   export const Row: any;
   export const Col: any;
   export const DatePicker: any;
   export const Modal: any;
   export const Table: any;
   export const message: any;
   export const Spin: any;
   export const Tag: any;
   export const Popconfirm: any;
}

declare module "@ant-design/icons" {
   export const ReloadOutlined: any;
   export const SettingOutlined: any;
   export const DownloadOutlined: any;
   export const DeleteOutlined: any;
   export const DatabaseOutlined: any;
   export const ClockCircleOutlined: any;
   export const RadarChartOutlined: any;
   export const HeartOutlined: any;
   export const ThunderboltOutlined: any;
   export const DisconnectOutlined: any;
   export const LinkOutlined: any;
   export const ClearOutlined: any;
   export const PlayCircleOutlined: any;
   export const PauseCircleOutlined: any;
   export const DownloadOutlined: any;
   export const SettingOutlined: any;
   export const VideoCameraOutlined: any;
   export const StopOutlined: any;
   export const WifiOutlined: any;
}

declare module "echarts-for-react" {
   interface ReactEChartsProps {
      option: any;
      style?: any;
      className?: string;
      theme?: string;
      notMerge?: boolean;
      lazyUpdate?: boolean;
      shouldSetOption?: (prevOption: any, newOption: any) => boolean;
      onEvents?: any;
      opts?: any;
   }

   class ReactECharts extends React.Component<ReactEChartsProps> {
      getEchartsInstance(): any;
   }
   export default ReactECharts;
}

declare module "echarts" {
   export interface EChartsOption {
      [key: string]: any;
   }
}

declare module "dayjs" {
   interface Dayjs {
      format(template?: string): string;
      valueOf(): number;
      unix(): number;
      toDate(): Date;
      toISOString(): string;
      toString(): string;
      isBefore(date: Dayjs): boolean;
      isAfter(date: Dayjs): boolean;
      isSame(date: Dayjs): boolean;
      diff(date: Dayjs, unit?: string): number;
      add(value: number, unit?: string): Dayjs;
      subtract(value: number, unit?: string): Dayjs;
      startOf(unit?: string): Dayjs;
      endOf(unit?: string): Dayjs;
   }

   namespace dayjs {
      interface Dayjs {}
   }

   const dayjs: {
      (date?: any): Dayjs;
      unix(timestamp: number): Dayjs;
      utc(date?: any): Dayjs;
      tz(date?: any, timezone?: string): Dayjs;
      locale(preset?: string, object?: any): string;
      extend(plugin: any, option?: any): void;
      isDayjs(d: any): boolean;
   };

   export default dayjs;
}

// NodeJS 类型声明
declare namespace NodeJS {
   interface Timeout {
      ref(): Timeout;
      unref(): Timeout;
   }
}
