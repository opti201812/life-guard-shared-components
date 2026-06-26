// 外部依赖的类型声明
// 依赖主项目提供完整的类型定义，这里只声明必要的类型

// NodeJS 类型声明
declare namespace NodeJS {
   interface Timeout {
      ref(): Timeout;
      unref(): Timeout;
   }
}

// CSS 模块声明
declare module "*.css";
