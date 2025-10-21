import React, { useState, useCallback, useEffect } from "react";
import { SeriesConfig } from "../types/shared";
import { legendGroupsDefault } from "../utils/seriesDefaults";
import { getLegendGroups, getLegendSelected, saveLegendGroups, saveLegendSelected } from "../utils/localStorage";

export interface LegendState {
   // 图例分组可见状态
   legendGroups: Record<string, boolean>;
   // 单个图例可见状态
   legendVisible: Record<string, boolean>;
   // 切换分组可见性
   toggleGroup: (groupKey: string) => void;
   // 更新单个图例可见性
   updateLegendVisible: (updates: Record<string, boolean>) => void;
   // 重置为默认状态
   resetLegendState: () => void;
}

/**
 * 图例状态管理 Hook
 * 负责管理图例分组和单个图例的可见性状态，以及持久化
 */
export function useLegendState(seriesConfigs: SeriesConfig[]): LegendState {
   // 初始化分组状态
   const [legendGroups, setLegendGroups] = useState(() => {
      const saved = getLegendGroups();
      return Object.keys(legendGroupsDefault).reduce(
         (acc, key) => ({
            ...acc,
            [key]: saved[key] !== undefined ? saved[key] : key === "sleepMonitoring" ? false : true,
         }),
         {} as Record<string, boolean>
      );
   });

   // 初始化单个图例状态
   const [legendVisible, setLegendVisible] = useState(() => {
      const saved = getLegendSelected();
      // 使用配置的名称作为初始 key
      const base = seriesConfigs.reduce((acc, sc) => {
         acc[sc.name] = true;
         return acc;
      }, {} as Record<string, boolean>);
      return { ...base, ...saved };
   });

   // 切换分组可见性
   const toggleGroup = useCallback(
      (groupKey: string) => {
         const newVisible = !legendGroups[groupKey];
         setLegendGroups((prev) => ({ ...prev, [groupKey]: newVisible }));

         // 同时更新该分组下所有图例的可见性
         const groupItems = legendGroupsDefault[groupKey as keyof typeof legendGroupsDefault]?.items || [];
         setLegendVisible((prev) => {
            const updated = { ...prev };
            groupItems.forEach((item: string) => {
               updated[item] = newVisible;
            });
            return updated;
         });
      },
      [legendGroups]
   );

   // 更新单个图例可见性
   const updateLegendVisible = useCallback((updates: Record<string, boolean>) => {
      setLegendVisible((prev) => ({ ...prev, ...updates }));
   }, []);

   // 重置为默认状态
   const resetLegendState = useCallback(() => {
      // 重置分组状态
      const defaultGroups = Object.keys(legendGroupsDefault).reduce(
         (acc, key) => ({ ...acc, [key]: key === "sleepMonitoring" ? false : true }),
         {} as Record<string, boolean>
      );
      setLegendGroups(defaultGroups);

      // 重置单个图例状态
      const defaultVisible = seriesConfigs.reduce((acc, sc) => {
         acc[sc.name] = true;
         return acc;
      }, {} as Record<string, boolean>);
      setLegendVisible(defaultVisible);
   }, [seriesConfigs]);

   // 持久化状态变更
   useEffect(() => {
      saveLegendGroups(legendGroups);
   }, [legendGroups]);

   useEffect(() => {
      saveLegendSelected(legendVisible);
   }, [legendVisible]);

   return {
      legendGroups,
      legendVisible,
      toggleGroup,
      updateLegendVisible,
      resetLegendState,
   };
}
