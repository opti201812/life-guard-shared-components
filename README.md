# LifeGuard Shared Components

LifeGuard 项目的共享组件库，包含图表组件、UI 组件、工具函数和类型定义。

## 安装

```bash
# 作为Git submodule使用
git submodule add https://github.com/your-org/life-guard-shared-components.git src/shared
```

## 使用

```typescript
import { MultiDeviceChart, DeviceControlPanel } from "./shared";

// 使用组件
<MultiDeviceChart chartData={data} seriesConfigs={configs} onDataAppended={handleDataAppended} />;
```

## 组件列表

### 图表组件

-  `MultiDeviceChart` - 多设备图表组件
-  `BarGraphChart` - 柱状图组件
-  `PlethWaveChart` - 脉搏波图表组件
-  `HighPerformanceChart` - 高性能图表组件
-  `LegendControls` - 图例控制组件

### UI 组件

-  `DeviceControlPanel` - 设备控制面板
-  `ExportDataModal` - 数据导出模态框

### 通用组件

-  `TimeSelector` - 时间选择器

### Hooks

-  `useLegendState` - 图例状态管理

### 工具函数

-  `chartConfigManager` - 图表配置管理器
-  本地存储工具函数

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 代码检查
npm run lint
```

## 许可证

ISC
