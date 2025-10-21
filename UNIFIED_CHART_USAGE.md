# UnifiedChart 统一图表组件使用指南

## 📋 概述

`UnifiedChart` 是共享组件库中的核心图表组件，专门设计用于支持两种不同的使用场景：

1. **单图表模式 (CSM 场景)**: 一个大型、高性能的 ECharts 图表，支持复杂的交互和实时数据更新
2. **多图表模式 (LG-Web 场景)**: 12-16 个小型图表同时显示，优化渲染性能

## 🚀 快速开始

### 基本用法

```typescript
import { UnifiedChart, SeriesConfig } from '@life-guard/shared-components';

// 单图表模式
<UnifiedChart
  mode="single"
  data={chartData}
  seriesConfig={seriesConfig}
  height={600}
  enableInteractions={true}
  enableLegend={true}
  enableZoom={true}
/>

// 多图表模式
<UnifiedChart
  mode="multi"
  data={chartData}
  seriesConfig={seriesConfig}
  height={200}
  enableLazyLoading={true}
  enableVirtualization={true}
/>
```

## 📊 使用场景

### 1. 单图表模式 (CSM 场景)

适用于 `Collection Service Manager` 项目，特点：

- **高性能渲染**: 支持 36,000 个数据点
- **增量更新**: 实时数据追加，不重新渲染整个图表
- **丰富交互**: 图例控制、时间范围选择、缩放等
- **动画效果**: 流畅的动画过渡

```typescript
// CSM 项目中的使用示例
<UnifiedChart
  mode="single"
  data={dataProcessor.chartData}
  seriesConfig={heartRateConfig}
  height={600}
  enableInteractions={true}
  enableLegend={true}
  enableZoom={true}
  enableTimeRangeSelector={true}
  title="设备实时曲线"
  maxDataPoints={36000}
  incrementalData={dataProcessor.incrementalData}
  onDataAppended={handleDataAppended}
  chartConfigManager={chartConfigManager}
/>
```

### 2. 多图表模式 (LG-Web 场景)

适用于 `LifeGuard Web` 项目，特点：

- **轻量级渲染**: 每个图表最多 1,000 个数据点
- **懒加载**: 只渲染可见区域的图表
- **虚拟化**: 大量图表时的性能优化
- **批量更新**: 统一管理多个图表的数据更新

```typescript
// LG-Web 项目中的使用示例
<VirtualizedChartGrid
  charts={chartConfigs.map(config => ({
    id: config.id,
    data: chartData.get(config.id) || [],
    seriesConfig: config.seriesConfig,
    title: config.title,
  }))}
  containerHeight={600}
  itemHeight={220}
  columns={4}
  enableLazyLoading={true}
  enableVirtualization={true}
/>
```

## ⚙️ 性能配置

### 自动性能配置

组件会根据模式自动选择最佳性能配置：

```typescript
// 单图表模式配置
const singleConfig = PerformanceConfigManager.getConfigForMode({
  mode: 'single',
  chartCount: 1
});
// 结果: 高性能配置，支持大量数据点和复杂交互

// 多图表模式配置
const multiConfig = PerformanceConfigManager.getConfigForMode({
  mode: 'multi',
  chartCount: 16
});
// 结果: 轻量级配置，优化多图表渲染性能
```

### 自定义性能配置

```typescript
<UnifiedChart
  mode="multi"
  data={data}
  seriesConfig={config}
  performance={{
    maxDataPoints: 2000,        // 自定义最大数据点
    enableLazyUpdate: false,    // 禁用懒更新
    throttleMs: 100,            // 自定义节流时间
    enableAnimation: false,     // 禁用动画
  }}
/>
```

## 🎯 高级功能

### 1. 懒加载图表

```typescript
import { LazyChart } from '@life-guard/shared-components';

<LazyChart
  data={data}
  seriesConfig={config}
  height={200}
  intersectionThreshold={0.1}  // 10% 可见时开始加载
  rootMargin="50px"            // 提前 50px 开始加载
  onVisible={() => console.log('图表可见')}
  onHidden={() => console.log('图表隐藏')}
/>
```

### 2. 虚拟化图表网格

```typescript
import { VirtualizedChartGrid } from '@life-guard/shared-components';

<VirtualizedChartGrid
  charts={charts}
  containerHeight={600}
  itemHeight={220}
  columns={4}
  enableLazyLoading={true}
  enableVirtualization={true}
/>
```

### 3. 批量更新管理

```typescript
import { globalBatchUpdateManager } from '@life-guard/shared-components';

// 注册图表
globalBatchUpdateManager.registerChart('chart-1', (data) => {
  updateChart('chart-1', data);
});

// 调度更新
globalBatchUpdateManager.scheduleUpdate('chart-1', newData);

// 获取状态
const status = globalBatchUpdateManager.getQueueStatus();
console.log('队列长度:', status.queueLength);
```

### 4. 性能监控

```typescript
import { PerformanceMonitor } from '@life-guard/shared-components';

<PerformanceMonitor
  visible={true}
  position="bottom-right"
  onMetricsChange={(metrics) => {
    console.log('FPS:', metrics.fps);
    console.log('内存使用:', metrics.memoryUsage);
    console.log('图表数量:', metrics.chartCount);
  }}
/>
```

## 📈 性能优化策略

### 单图表模式优化

1. **增量更新**: 使用 `appendData` 而不是重新渲染
2. **数据抽稀**: 自动减少数据点数量
3. **懒更新**: 批量处理数据更新
4. **动画优化**: 智能启用/禁用动画

### 多图表模式优化

1. **懒加载**: 只渲染可见图表
2. **虚拟化**: 大量图表时的视口渲染
3. **批量更新**: 统一管理数据更新
4. **内存管理**: 及时清理不可见图表

## 🔧 配置选项

### UnifiedChart Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `mode` | `'single' \| 'multi'` | - | 图表模式 |
| `data` | `ChartDataPoint[]` | - | 图表数据 |
| `seriesConfig` | `SeriesConfig` | - | 系列配置 |
| `height` | `number` | `300` | 图表高度 |
| `width` | `string \| number` | `"100%"` | 图表宽度 |

### 单图表模式特有属性

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `enableInteractions` | `boolean` | `true` | 启用交互 |
| `enableLegend` | `boolean` | `true` | 启用图例 |
| `enableZoom` | `boolean` | `true` | 启用缩放 |
| `enableTimeRangeSelector` | `boolean` | `true` | 启用时间范围选择 |
| `title` | `string` | - | 图表标题 |
| `maxDataPoints` | `number` | - | 最大数据点数 |

### 多图表模式特有属性

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `enableLazyLoading` | `boolean` | `false` | 启用懒加载 |
| `enableVirtualization` | `boolean` | `false` | 启用虚拟化 |
| `chartCount` | `number` | `1` | 图表数量 |
| `performance` | `Partial<PerformanceConfig>` | - | 性能配置覆盖 |

## 🚨 注意事项

1. **内存管理**: 多图表模式下注意及时清理数据
2. **性能监控**: 使用 `PerformanceMonitor` 监控性能指标
3. **数据量控制**: 根据模式合理设置数据点数量
4. **懒加载**: 多图表场景建议启用懒加载
5. **批量更新**: 大量图表时使用批量更新管理器

## 📚 相关文档

- [共享组件库 README](./README.md)
- [组件清单](./COMPONENTS_CHECKLIST.md)
- [独立性检查报告](./INDEPENDENCE_CHECK.md)
- [测试项目文档](../test-lgsc/README_TEST.md)
