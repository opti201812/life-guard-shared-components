# Life Guard Shared Components - 组件清单

## 📦 共享组件库概况

**GitHub仓库**: https://github.com/opti201812/life-guard-shared-components.git

### 组件分类

#### 1. 图表组件 (`src/components/charts/`)
- ✅ **MultiDeviceChart** - 多设备实时数据图表
- ✅ **BarGraphChart** - 条形图
- ✅ **PlethWaveChart** - 脉搏波形图
- ✅ **HighPerformanceChart** - 高性能图表组件
- ✅ **LegendControls** - 图例控制组件

#### 2. UI组件 (`src/components/ui/`)
- ✅ **DeviceControlPanel** - 设备控制面板
- ✅ **ExportDataModal** - 数据导出模态框

#### 3. 通用组件 (`src/components/common/`)
- ✅ **TimeSelector** - 时间范围选择器

#### 4. React Hooks (`src/hooks/`)
- ✅ **useLegendState** - 图例状态管理
- ✅ **useIncrementalAppender** - 增量数据追加
- ✅ **useDecimatedSeries** - 数据抽稀处理

#### 5. 工具函数 (`src/utils/`)
- ✅ **chartConfigManager** - 图表配置管理器
- ✅ **buildOption** - ECharts配置构建器
- ✅ **indexedDBManager** - IndexedDB数据管理
- ✅ **CSVExporter** - CSV数据导出
- ✅ **localStorage** - 本地存储工具
- ✅ **seriesDefaults** - 系列默认配置

#### 6. 类型定义 (`src/types/`)
- ✅ **shared.ts** - 共享类型定义
  - RadarData
  - BraceletData
  - OximeterData
  - ChartDataPoint
  - SeriesConfig
  - DeviceConfig
  - ThresholdSettings
  - RecordingSession
  - SessionData
  - IncrementalData

## 📋 使用说明

### 安装依赖

在主项目中，需要确保安装以下peer dependencies：

```bash
npm install react react-dom antd echarts echarts-for-react dayjs @ant-design/icons
```

### 添加为Submodule

```bash
# 在LifeGuard Web项目中
cd "/Users/kingkevin/Project/LifeGuard/develop/code/LifeGuard Web"
git submodule add https://github.com/opti201812/life-guard-shared-components.git src/shared

# 在Collection Service Manager项目中
cd "/Users/kingkevin/Project/LifeGuard/develop/code/Collection Service Manager/react-app"
git submodule add https://github.com/opti201812/life-guard-shared-components.git src/shared
```

### 导入组件示例

```typescript
// 导入图表组件
import { MultiDeviceChart, BarGraphChart, PlethWaveChart } from './shared';

// 导入UI组件
import { DeviceControlPanel, ExportDataModal } from './shared';

// 导入Hooks
import { useLegendState, useIncrementalAppender } from './shared';

// 导入工具函数
import { chartConfigManager, CSVExporter, indexedDBManager } from './shared';

// 导入类型
import type { RadarData, BraceletData, OximeterData } from './shared';
```

## 🔧 TypeScript配置

项目已配置TypeScript支持：
- Target: ES2017
- Library: DOM, ES2017
- JSX: react
- 严格模式已启用

## ⚠️ 注意事项

1. **Peer Dependencies**: 主项目必须安装所有peer dependencies（react, antd, echarts等）
2. **类型支持**: 所有组件都有完整的TypeScript类型定义
3. **Git Submodule**: 使用submodule方式集成，更新时需要`git submodule update`

## 📊 TypeScript检查状态

当前剩余的TypeScript错误主要是：
- peer dependencies的类型声明缺失（在主项目中安装后会自动解决）
- 一些`any`类型的隐式声明（不影响实际使用）

这些错误在将组件集成到主项目后会自动解决。

## 🚀 下一步

1. 在两个主项目中配置 TypeScript 路径映射（如需要）
2. 更新主项目中现有的组件引用为从shared导入
3. 测试所有共享组件在主项目中的正常工作

