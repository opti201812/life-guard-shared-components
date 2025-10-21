import { SeriesConfig } from "../types/shared";

export interface BuildOptionParams {
   seriesConfigs: SeriesConfig[];
   legendVisible: Record<string, boolean>;
   timeRange: number;
   enableIncrementalUpdate?: boolean;
   highFrequencyMode?: boolean;
}

/**
 * 纯函数：根据输入参数构建 ECharts 配置
 */
export function buildOption(params: BuildOptionParams): any {
   const { seriesConfigs, legendVisible, timeRange } = params;

   // 构建 nameToConfig 映射
   const nameToConfig = seriesConfigs.reduce((acc, s) => {
      acc[s.name] = s;
      return acc;
   }, {} as Record<string, SeriesConfig>);

   // 生成markLine数据的通用函数
   const getMarkLinesFor = (cfg: SeriesConfig) => {
      if (!legendVisible[cfg.name]) return [];
      const lines: { yAxis: number; name?: string; lineStyle: any; label: any }[] = [];
      if (cfg.markLines && cfg.markLines.length) {
         cfg.markLines.forEach((m) =>
            lines.push({
               yAxis: m.value,
               name: m.name,
               lineStyle: { color: m.color ?? cfg.color, type: "dashed", width: 1, opacity: 0.8 },
               label: { show: false },
            })
         );
      }
      return lines;
   };

   // 统一的最后一个数据点标签配置方法
   const createLastPointLabel = () => {
      return {
         show: true,
         position: "top",
         fontSize: 10,
         formatter: function (params: any) {
            // 这里不依赖具体数据，由ECharts自动处理
            return params.value[1];
         },
      };
   };

   // 大数据量渲染优化配置
   const createLinePerfProps = (isHighDensity: boolean) => ({
      showSymbol: false,
      emphasis: {
         disabled: true, // 禁用强调效果，提升大数据量性能
      },
      clip: true,
      large: isHighDensity,
      largeThreshold: 2000,
      sampling: "lttb" as const,
      progressive: 15000,
      progressiveThreshold: 3000,
   });

   const series: any[] = [];

   // 预计算 markArea 配置（避免每次渲染重复计算）
   const markAreaConfigs = new Map<string, any>();
   seriesConfigs.forEach((cfg) => {
      if (cfg.normalAreaColor && cfg.markLines && cfg.markLines.length >= 2) {
         const values = cfg.markLines.map((m) => m.value);
         const min = Math.min(...values);
         const max = Math.max(...values);

         markAreaConfigs.set(cfg.name, {
            itemStyle: { color: cfg.normalAreaColor, opacity: 1 },
            data: [[{ yAxis: min }, { yAxis: max }]],
         });
      }
   });

   const createSeriesItem = (cfg: SeriesConfig) => {
      const isHighDensity = !!cfg.highDensity;

      const seriesItem: any = {
         name: cfg.name,
         type: "line",
         yAxisIndex: 0,
         data: [], // 空数据，由其他模块通过appendData填充
         smooth: true,
         lineStyle: { color: cfg.color, width: 2 },
         itemStyle: { color: cfg.color },
         symbol: "none",
         label: createLastPointLabel(),
         show: legendVisible[cfg.name],
         markLine: { silent: true, symbol: "none", data: getMarkLinesFor(cfg) },
         ...createLinePerfProps(isHighDensity),
      };

      // 直接使用预计算的 markArea 配置
      const markAreaConfig = markAreaConfigs.get(cfg.name);
      if (markAreaConfig) {
         seriesItem.markArea = markAreaConfig;
      }

      return seriesItem;
   };

   // 生成所有序列配置（不包含数据）
   seriesConfigs.forEach((cfg) => {
      if (cfg.display === "none") return;
      series.push(createSeriesItem(cfg));
   });

   // visualMap piecewise（动态处理所有带 visualPieces 的序列）
   const visualMap = [] as any[];
   seriesConfigs.forEach((cfg) => {
      if (cfg.visualPieces && cfg.visualPieces.length) {
         const seriesIndex = series.findIndex((s) => s.name === cfg.name);
         if (seriesIndex >= 0) {
            visualMap.push({
               show: false,
               type: "piecewise",
               dimension: 1,
               seriesIndex,
               pieces: cfg.visualPieces,
            });
         }
      }
   });

   return {
      title: {
         show: false,
      },
      tooltip: {
         trigger: "axis",
         axisPointer: {
            type: "cross",
            label: {
               backgroundColor: "#6a7985",
            },
         },
         formatter: function (params: any) {
            let result = `<strong>${params[0].axisValue}</strong><br/>`;
            params.forEach((param: any) => {
               if (param.value !== null && param.value !== undefined && !param.seriesName.includes("阈值")) {
                  const val = Array.isArray(param.value) ? param.value[1] : param.value;
                  const intVal = Math.round(Number(val));
                  // 如果有 visualPieces，附带区段标签
                  const cfg = nameToConfig[param.seriesName];
                  let label = "";
                  if (cfg && cfg.visualPieces && typeof intVal === "number") {
                     const piece = cfg.visualPieces.find((pc) => {
                        const gt = pc.gt ?? (pc.gte !== undefined ? pc.gte - 1e-9 : -Infinity);
                        const lt = pc.lt ?? (pc.lte !== undefined ? pc.lte + 1e-9 : Infinity);
                        const lowerOk = pc.gte !== undefined ? intVal >= pc.gte : intVal > gt;
                        const upperOk = pc.lte !== undefined ? intVal <= pc.lte : intVal < lt;
                        return lowerOk && upperOk;
                     });
                     if (piece?.label) label = ` (${piece.label})`;
                  }
                  result += `${param.marker}${param.seriesName}: ${intVal}${label}<br/>`;
               }
            });
            return result;
         },
      },
      legend: {
         show: true,
         selected: legendVisible,
      },
      grid: {
         left: "8%",
         right: "8%",
         top: "10%",
         bottom: 50,
         containLabel: true,
      },
      xAxis: {
         type: "time",
         boundaryGap: false,
         max: (value: any) => {
            const now = Date.now();
            const timeRangeMs = timeRange * 60 * 1000; // 转换为毫秒
            return now - timeRangeMs;
         },
         min: (value: any) => {
            return Date.now();
         },
         inverse: true,
         axisLabel: {
            fontSize: 9,
            rotate: 0,
         },
         axisLine: {
            show: true,
            lineStyle: {
               color: "#d9d9d9",
               width: 2,
            },
         },
         axisTick: {
            show: true,
            lineStyle: {
               color: "#d9d9d9",
               width: 1,
            },
         },
      },
      yAxis: {
         type: "value",
         name: "",
         position: "left",
         min: 0,
         max: 250,
         axisLabel: {
            formatter: "{value}",
            fontSize: 9,
         },
         nameTextStyle: {
            fontSize: 9,
         },
         splitLine: {
            show: true,
            lineStyle: {
               color: "#e8e8e8",
               width: 1,
               type: "dashed",
            },
         },
         axisLine: {
            show: true,
            lineStyle: {
               color: "#666",
               width: 1,
            },
         },
         axisTick: {
            show: true,
            lineStyle: {
               color: "#666",
               width: 1,
            },
         },
      },
      series: series,
      visualMap,
      animation: false, // 禁用动画，因为数据由其他模块处理
      animationDuration: 0,
      animationEasing: "cubicOut",
   };
}
