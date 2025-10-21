import React from "react";
import { Button } from "antd";
import { LegendState } from "../../hooks/useLegendState";

interface LegendControlsProps {
   legendState: LegendState;
}

/**
 * 图例控制组件
 * 负责显示和控制图例分组的可见性
 */
export const LegendControls: React.FC<LegendControlsProps> = ({ legendState }) => {
   const { legendGroups, toggleGroup } = legendState;

   return (
      <div
         style={{
            padding: "8px",
            borderBottom: "1px solid #f0f0f0",
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            alignItems: "center",
            justifyContent: "center",
         }}
      >
         {Object.entries(legendGroups).map(([groupKey, isVisible]) => (
            <div key={groupKey} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
               <Button
                  size='small'
                  type={isVisible ? "primary" : "default"}
                  onClick={() => toggleGroup(groupKey)}
                  style={{ fontSize: "11px", height: "22px", padding: "0 8px" }}
               >
                  {groupKey === "basicVitals"
                     ? "基础体征"
                     : groupKey === "vitalAnalysis"
                     ? "体征分析"
                     : groupKey === "sleepMonitoring"
                     ? "睡眠监测"
                     : groupKey}
               </Button>
            </div>
         ))}
      </div>
   );
};

