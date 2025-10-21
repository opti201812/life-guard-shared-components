// 本地存储工具函数

export const saveLegendGroups = (groups: Record<string, boolean>) => {
   try {
      localStorage.setItem("legendGroups", JSON.stringify(groups));
   } catch (error) {
      console.error("保存图例分组失败:", error);
   }
};

export const getLegendGroups = (): Record<string, boolean> => {
   try {
      const saved = localStorage.getItem("legendGroups");
      return saved ? JSON.parse(saved) : {};
   } catch (error) {
      console.error("获取图例分组失败:", error);
      return {};
   }
};

export const saveLegendSelected = (selected: Record<string, boolean>) => {
   try {
      localStorage.setItem("legendSelected", JSON.stringify(selected));
   } catch (error) {
      console.error("保存图例选择失败:", error);
   }
};

export const getLegendSelected = (): Record<string, boolean> => {
   try {
      const saved = localStorage.getItem("legendSelected");
      return saved ? JSON.parse(saved) : {};
   } catch (error) {
      console.error("获取图例选择失败:", error);
      return {};
   }
};
