import { useRef, useEffect } from "react";

/**
 * 专门用于排查组件更新原因的 Debug Hook
 * @param componentName 组件名称
 * @param props 想要监控的 props 或 state 对象
 */
export function useRenderDebugger(componentName: string, props: Record<string, any>) {
   const prevProps = useRef<Record<string, any>>(props);
   const renderCount = useRef(0);
   const lastRenderTime = useRef(Date.now());

   renderCount.current++;

   useEffect(() => {
      const currentTime = Date.now();
      const duration = currentTime - lastRenderTime.current;

      // 找出变化的 key
      const changedProps = Object.entries(props).reduce(
         (acc, [key, value]) => {
            const prevValue = prevProps.current[key];

            if (prevValue !== value) {
               // 进一步判断是值变了，还是仅仅是引用变了（针对对象/数组）
               const isDeepEqual = JSON.stringify(prevValue) === JSON.stringify(value);

               acc[key] = {
                  before: prevValue,
                  after: value,
                  type: typeof value,
                  reason: isDeepEqual ? "引用地址改变 (内容未变)" : "内容已改变",
               };
            }
            return acc;
         },
         {} as Record<string, any>,
      );

      if (Object.keys(changedProps).length > 0) {
         console.group(
            `%c[Render Debug] ${componentName} #渲染第 ${renderCount.current} 次`,
            "color: #faad14; font-weight: bold;",
         );
         console.log(`距离上次渲染间隔: ${duration}ms`);
         console.table(changedProps);
         console.groupEnd();
      } else if (renderCount.current > 1) {
         console.log(`%c[Render Debug] ${componentName} 触发了强制重绘，但监控的 Props 未改变`, "color: #ff4d4f;");
      }

      // 更新引用
      prevProps.current = props;
      lastRenderTime.current = currentTime;
   });
}
