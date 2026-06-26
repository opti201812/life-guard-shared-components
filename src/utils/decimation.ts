/**
 * 数据抽稀工具函数
 * 提供多种抽稀算法：LTTB、STRIDE、BUCKET
 */

export type DecimationStrategy = 'LTTB' | 'STRIDE' | 'BUCKET' | 'NONE';

export interface DecimationConfig {
   maxPoints: number;
   strategy: DecimationStrategy;
}

/**
 * LTTB (Largest Triangle Three Bucket) 算法
 * 保持数据趋势的同时减少数据点
 * 算法原理：将数据分成多个桶，在每个桶中选择能形成最大三角形的点
 * points: [timestamp, value][] 格式的数据
 */
export function lttbDecimation(points: [number, number][], threshold: number): [number, number][] {
   if (points.length <= threshold || threshold < 2) {
      return points;
   }

   const data = points.slice();
   const sampled = new Array(threshold);

   // Bucket size. Leave room for start and end data points
   const every = (data.length - 2) / (threshold - 2);

   // Always add the first point
   sampled[0] = data[0];
   // Always add the last point
   sampled[threshold - 1] = data[data.length - 1];

   for (let i = 0; i < threshold - 2; i++) {
      const bucketStart = Math.floor((i + 1) * every) + 1;
      const bucketEnd = Math.min(Math.floor((i + 2) * every) + 1, data.length - 1);
      let maxArea = -1;
      let maxAreaIndex = bucketStart;

      // Calculate average of bucket start and end points
      // data format: [timestamp, value]
      const avgX = (data[bucketStart][0] + data[bucketEnd][0]) / 2; // timestamp average
      const avgY = (data[bucketStart][1] + data[bucketEnd][1]) / 2; // value average

      for (let j = bucketStart; j < bucketEnd; j++) {
         // Calculate the area of triangle formed by points: (avgX, avgY), bucketEnd, and point j
         // Using the standard triangle area formula: Area = |Ax(By - Cy) + Bx(Cy - Ay) + Cx(Ay - By)| / 2
         // Where A = (avgX, avgY), B = bucketEnd, C = point j
         const Ax = avgX,
            Ay = avgY;
         const Bx = data[bucketEnd][0],
            By = data[bucketEnd][1];
         const Cx = data[j][0],
            Cy = data[j][1];

         const triangleArea = Math.abs(Ax * (By - Cy) + Bx * (Cy - Ay) + Cx * (Ay - By)) / 2;

         if (triangleArea > maxArea) {
            maxArea = triangleArea;
            maxAreaIndex = j;
         }
      }

      sampled[i + 1] = data[maxAreaIndex];
   }

   return sampled;
}

/**
 * STRIDE 步进抽样算法
 * 简单的均匀采样，每隔 step 个点取一个
 */
export function strideDecimation(points: [number, number][], step: number): [number, number][] {
   if (step <= 1) return points;

   const result: [number, number][] = [];
   for (let i = 0; i < points.length; i += step) {
      result.push(points[i]);
   }

   // 确保包含最后一个点
   if (result[result.length - 1] !== points[points.length - 1]) {
      result.push(points[points.length - 1]);
   }

   return result;
}

/**
 * BUCKET 时间分桶抽稀算法
 * 将数据按时间分桶，取每桶内的最大值和最小值
 */
export function bucketDecimation(points: [number, number][], bucketSizeMs: number): [number, number][] {
   if (points.length === 0) return points;

   const result: [number, number][] = [];
   const buckets = new Map<number, [number, number][]>();

   // 按时间分桶
   points.forEach((point) => {
      const bucketKey = Math.floor(point[0] / bucketSizeMs);
      if (!buckets.has(bucketKey)) {
         buckets.set(bucketKey, []);
      }
      buckets.get(bucketKey)!.push(point);
   });

   // 每个桶取最大值和最小值
   buckets.forEach((bucketPoints) => {
      if (bucketPoints.length === 0) return;

      // 按值排序
      bucketPoints.sort((a, b) => a[1] - b[1]);

      // 添加最小值和最大值
      result.push(bucketPoints[0]);
      if (bucketPoints.length > 1 && bucketPoints[bucketPoints.length - 1] !== bucketPoints[0]) {
         result.push(bucketPoints[bucketPoints.length - 1]);
      }
   });

   // 按时间排序
   result.sort((a, b) => a[0] - b[0]);

   return result;
}

/**
 * 根据策略执行抽稀
 */
export function applyDecimation(
   points: [number, number][],
   config: DecimationConfig
): [number, number][] {
   if (points.length <= config.maxPoints || config.strategy === 'NONE') {
      return points;
   }

   switch (config.strategy) {
      case 'LTTB':
         return lttbDecimation(points, config.maxPoints);

      case 'STRIDE': {
         const step = Math.ceil(points.length / config.maxPoints);
         return strideDecimation(points, step);
      }

      case 'BUCKET': {
         // 计算合适的分桶大小（基于时间范围）
         if (points.length < 2) return points;
         const timeRange = points[points.length - 1][0] - points[0][0];
         const bucketSizeMs = Math.max(timeRange / config.maxPoints, 1000); // 至少1秒
         return bucketDecimation(points, bucketSizeMs);
      }

      default:
         return points;
   }
}

