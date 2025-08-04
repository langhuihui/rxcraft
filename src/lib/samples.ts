import { Node, Edge } from "reactflow";

export interface Sample {
  id: string;
  name: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
}

export const defaultSamples: Sample[] = [
  {
    id: "multi-subscription",
    name: "多订阅示例",
    description: "演示一个Observable被多个订阅者订阅的情况，每个订阅都有独立的状态指示器。",
    nodes: [
      {
        id: "interval-1",
        type: "custom",
        position: { x: 100, y: 100 },
        data: {
          id: "interval",
          name: "间隔",
          type: "observable",
          description: "定期发出递增数字",
          color: "bg-blue-500",
          config: { period: 1000 }
        },
      },
      {
        id: "map-1",
        type: "custom",
        position: { x: 400, y: 100 },
        data: {
          id: "map",
          name: "Map",
          type: "operator",
          description: "转换每个发出的值",
          color: "bg-purple-500",
          config: { func: "x => x * 2" }
        },
      },
      {
        id: "subscriber-1",
        type: "subscriber",
        position: { x: 700, y: 50 },
        data: {
          id: "subscriber",
          name: "订阅者1",
          type: "observer",
          description: "第一个订阅者",
          color: "bg-teal-500"
        },
      },
      {
        id: "subscriber-2",
        type: "subscriber",
        position: { x: 700, y: 150 },
        data: {
          id: "subscriber",
          name: "订阅者2",
          type: "observer",
          description: "第二个订阅者",
          color: "bg-teal-500"
        },
      }
    ],
    edges: [
      {
        id: "e1-2",
        source: "interval-1",
        target: "map-1",
        animated: true,
      },
      {
        id: "e2-3",
        source: "map-1",
        target: "subscriber-1",
        animated: true,
      },
      {
        id: "e2-4",
        source: "map-1",
        target: "subscriber-2",
        animated: true,
      }
    ],
  },
  {
    id: "basic-map",
    name: "基础 Map 示例",
    description: "演示如何使用 map 操作符将一个数字流乘以2。",
    nodes: [
      {
        id: "interval-1",
        type: "custom",
        position: { x: 100, y: 100 },
        data: {
          id: "interval",
          name: "间隔",
          type: "observable",
          description: "定期发出递增数字",
          color: "bg-blue-500",
          config: { period: 1000 }
        },
      },
      {
        id: "map-1",
        type: "custom",
        position: { x: 400, y: 100 },
        data: {
          id: "map",
          name: "Map",
          type: "operator",
          description: "转换每个发出的值",
          color: "bg-purple-500",
          config: { func: "x => x * 2" }
        },
      },
      {
        id: "subscriber-1",
        type: "subscriber",
        position: { x: 700, y: 100 },
        data: {
          id: "subscriber",
          name: "订阅者",
          type: "observer",
          description: "显示接收到的值",
          color: "bg-teal-500"
        },
      }
    ],
    edges: [
      {
        id: "e1-2",
        source: "interval-1",
        target: "map-1",
        animated: true,
      },
      {
        id: "e2-3",
        source: "map-1",
        target: "subscriber-1",
        animated: true,
      }
    ],
  },
  {
    id: "filter-and-take",
    name: "Filter 和 Take",
    description: "演示如何过滤偶数，并只取前5个结果。",
    nodes: [
      {
        id: "interval-2",
        type: "custom",
        position: { x: 50, y: 150 },
        data: {
          id: "interval",
          name: "间隔",
          type: "observable",
          description: "定期发出递增数字",
          color: "bg-blue-500",
          config: { period: 500 }
        },
      },
      {
        id: "filter-1",
        type: "custom",
        position: { x: 300, y: 100 },
        data: {
          id: "filter",
          name: "Filter",
          type: "operator",
          description: "过滤满足条件的值",
          color: "bg-purple-500",
          config: { func: "x => x % 2 === 0" }
        },
      },
      {
        id: "take-1",
        type: "custom",
        position: { x: 550, y: 150 },
        data: {
          id: "take",
          name: "Take",
          type: "operator",
          description: "只取前N个值",
          color: "bg-purple-500",
          config: { count: 5 }
        },
      },
      {
        id: "subscriber-2",
        type: "subscriber",
        position: { x: 800, y: 150 },
        data: {
          id: "subscriber",
          name: "订阅者",
          type: "observer",
          description: "显示接收到的值",
          color: "bg-teal-500"
        },
      }
    ],
    edges: [
      { id: "e2-1", source: "interval-2", target: "filter-1", animated: true },
      { id: "e2-2", source: "filter-1", target: "take-1", animated: true },
      { id: "e2-3", source: "take-1", target: "subscriber-2", animated: true }
    ],
  },
  {
    id: "merge-example",
    name: "合并多个流",
    description: "演示如何使用 merge 操作符合并多个数据流。",
    nodes: [
      {
        id: "interval-3",
        type: "custom",
        position: { x: 100, y: 100 },
        data: {
          id: "interval",
          name: "间隔 (1s)",
          type: "observable",
          description: "定期发出递增数字",
          color: "bg-blue-500",
          config: { period: 1000 }
        },
      },
      {
        id: "interval-4",
        type: "custom",
        position: { x: 100, y: 250 },
        data: {
          id: "interval",
          name: "间隔 (2s)",
          type: "observable",
          description: "定期发出递增数字",
          color: "bg-blue-500",
          config: { period: 2000 }
        },
      },
      {
        id: "merge-1",
        type: "custom",
        position: { x: 400, y: 175 },
        data: {
          id: "merge",
          name: "Merge",
          type: "observable",
          description: "合并多个Observable",
          color: "bg-blue-500",
          multipleInputs: true
        },
      },
      {
        id: "map-2",
        type: "custom",
        position: { x: 650, y: 175 },
        data: {
          id: "map",
          name: "Map",
          type: "operator",
          description: "转换每个发出的值",
          color: "bg-purple-500",
          config: { func: "x => `值: ${x}`" }
        },
      },
      {
        id: "subscriber-3",
        type: "subscriber",
        position: { x: 900, y: 175 },
        data: {
          id: "subscriber",
          name: "订阅者",
          type: "observer",
          description: "显示接收到的值",
          color: "bg-teal-500"
        },
      }
    ],
    edges: [
      { id: "e3-1", source: "interval-3", target: "merge-1", animated: true, targetHandle: "primary" },
      { id: "e3-2", source: "interval-4", target: "merge-1", animated: true, targetHandle: "secondary" },
      { id: "e3-3", source: "merge-1", target: "map-2", animated: true },
      { id: "e3-4", source: "map-2", target: "subscriber-3", animated: true }
    ],
  },
  {
    id: "takeuntil-example",
    name: "TakeUntil 示例",
    description: "演示如何使用 takeUntil 操作符在特定条件下停止数据流。",
    nodes: [
      {
        id: "interval-5",
        type: "custom",
        position: { x: 100, y: 100 },
        data: {
          id: "interval",
          name: "主数据流",
          type: "observable",
          description: "定期发出递增数字",
          color: "bg-blue-500",
          config: { period: 500 }
        },
      },
      {
        id: "interval-6",
        type: "custom",
        position: { x: 100, y: 250 },
        data: {
          id: "interval",
          name: "定时器 (5s)",
          type: "observable",
          description: "5秒后发出信号",
          color: "bg-blue-500",
          config: { period: 5000 }
        },
      },
      {
        id: "take-2",
        type: "custom",
        position: { x: 350, y: 250 },
        data: {
          id: "take",
          name: "Take(1)",
          type: "operator",
          description: "只取第一个值",
          color: "bg-purple-500",
          config: { count: 1 }
        },
      },
      {
        id: "takeuntil-1",
        type: "custom",
        position: { x: 400, y: 100 },
        data: {
          id: "takeUntil",
          name: "TakeUntil",
          type: "operator",
          description: "直到第二个Observable发出值才停止",
          color: "bg-purple-500",
          multipleInputs: true
        },
      },
      {
        id: "subscriber-4",
        type: "subscriber",
        position: { x: 700, y: 100 },
        data: {
          id: "subscriber",
          name: "订阅者",
          type: "observer",
          description: "显示接收到的值",
          color: "bg-teal-500"
        },
      }
    ],
    edges: [
      { id: "e4-1", source: "interval-5", target: "takeuntil-1", animated: true, targetHandle: "primary" },
      { id: "e4-2", source: "interval-6", target: "take-2", animated: true },
      { id: "e4-3", source: "take-2", target: "takeuntil-1", animated: true, targetHandle: "secondary" },
      { id: "e4-4", source: "takeuntil-1", target: "subscriber-4", animated: true }
    ],
  },
  {
    id: "zip-example",
    name: "Zip 组合示例",
    description: "演示如何使用 zip 操作符将多个流的值组合在一起。",
    nodes: [
      {
        id: "array-1",
        type: "custom",
        position: { x: 100, y: 100 },
        data: {
          id: "array",
          name: "字母数组",
          type: "observable",
          description: "发出数组中的每个值",
          color: "bg-blue-500",
          config: { values: '["A", "B", "C", "D"]' }
        },
      },
      {
        id: "array-2",
        type: "custom",
        position: { x: 100, y: 250 },
        data: {
          id: "array",
          name: "数字数组",
          type: "observable",
          description: "发出数组中的每个值",
          color: "bg-blue-500",
          config: { values: '[1, 2, 3, 4]' }
        },
      },
      {
        id: "zip-1",
        type: "custom",
        position: { x: 400, y: 175 },
        data: {
          id: "zip",
          name: "Zip",
          type: "operator",
          description: "将多个流的值组合在一起",
          color: "bg-purple-500",
          multipleInputs: true
        },
      },
      {
        id: "map-3",
        type: "custom",
        position: { x: 650, y: 175 },
        data: {
          id: "map",
          name: "Map",
          type: "operator",
          description: "转换每个发出的值",
          color: "bg-purple-500",
          config: { func: "([letter, number]) => `${letter}${number}`" }
        },
      },
      {
        id: "subscriber-5",
        type: "subscriber",
        position: { x: 900, y: 175 },
        data: {
          id: "subscriber",
          name: "订阅者",
          type: "observer",
          description: "显示接收到的值",
          color: "bg-teal-500"
        },
      }
    ],
    edges: [
      { id: "e5-1", source: "array-1", target: "zip-1", animated: true, targetHandle: "primary" },
      { id: "e5-2", source: "array-2", target: "zip-1", animated: true, targetHandle: "secondary" },
      { id: "e5-3", source: "zip-1", target: "map-3", animated: true },
      { id: "e5-4", source: "map-3", target: "subscriber-5", animated: true }
    ],
  },
  {
    id: "buffer-example",
    name: "Buffer 缓冲示例",
    description: "演示如何使用 buffer 操作符收集值，直到另一个 Observable 发出信号。",
    nodes: [
      {
        id: "interval-7",
        type: "custom",
        position: { x: 100, y: 100 },
        data: {
          id: "interval",
          name: "快速间隔 (200ms)",
          type: "observable",
          description: "定期发出递增数字",
          color: "bg-blue-500",
          config: { period: 200 }
        },
      },
      {
        id: "interval-8",
        type: "custom",
        position: { x: 100, y: 250 },
        data: {
          id: "interval",
          name: "缓慢间隔 (2s)",
          type: "observable",
          description: "定期发出递增数字",
          color: "bg-blue-500",
          config: { period: 2000 }
        },
      },
      {
        id: "buffer-1",
        type: "custom",
        position: { x: 400, y: 100 },
        data: {
          id: "buffer",
          name: "Buffer",
          type: "operator",
          description: "收集值，直到另一个Observable发出信号",
          color: "bg-purple-500",
          multipleInputs: true
        },
      },
      {
        id: "subscriber-6",
        type: "subscriber",
        position: { x: 700, y: 100 },
        data: {
          id: "subscriber",
          name: "订阅者",
          type: "observer",
          description: "显示接收到的值",
          color: "bg-teal-500"
        },
      }
    ],
    edges: [
      { id: "e6-1", source: "interval-7", target: "buffer-1", animated: true, targetHandle: "primary" },
      { id: "e6-2", source: "interval-8", target: "buffer-1", animated: true, targetHandle: "secondary" },
      { id: "e6-3", source: "buffer-1", target: "subscriber-6", animated: true }
    ],
  },
  {
    id: "retry-example",
    name: "Retry 重试示例",
    description: "演示如何使用 retry 操作符在发生错误时重试。",
    nodes: [
      {
        id: "array-3",
        type: "custom",
        position: { x: 100, y: 150 },
        data: {
          id: "array",
          name: "数组",
          type: "observable",
          description: "发出数组中的每个值",
          color: "bg-blue-500",
          config: { values: '[1, 2, "error", 4, 5]' }
        },
      },
      {
        id: "map-4",
        type: "custom",
        position: { x: 350, y: 150 },
        data: {
          id: "map",
          name: "Map (可能出错)",
          type: "operator",
          description: "转换每个发出的值",
          color: "bg-purple-500",
          config: { func: "x => { if (x === 'error') throw new Error('模拟错误'); return x * 10; }" }
        },
      },
      {
        id: "retry-1",
        type: "custom",
        position: { x: 600, y: 150 },
        data: {
          id: "retry",
          name: "Retry(2)",
          type: "operator",
          description: "在发生错误时重试",
          color: "bg-purple-500",
          config: { count: 2 }
        },
      },
      {
        id: "subscriber-7",
        type: "subscriber",
        position: { x: 850, y: 150 },
        data: {
          id: "subscriber",
          name: "订阅者",
          type: "observer",
          description: "显示接收到的值",
          color: "bg-teal-500"
        },
      }
    ],
    edges: [
      { id: "e7-1", source: "array-3", target: "map-4", animated: true },
      { id: "e7-2", source: "map-4", target: "retry-1", animated: true },
      { id: "e7-3", source: "retry-1", target: "subscriber-7", animated: true }
    ],
  },
  {
    id: "timeout-example",
    name: "Timeout 超时示例",
    description: "演示如何使用 timeout 操作符在指定时间内没有收到值时发出错误。",
    nodes: [
      {
        id: "interval-9",
        type: "custom",
        position: { x: 100, y: 150 },
        data: {
          id: "interval",
          name: "变速间隔",
          type: "observable",
          description: "定期发出递增数字",
          color: "bg-blue-500",
          config: { period: 1000 }
        },
      },
      {
        id: "map-5",
        type: "custom",
        position: { x: 350, y: 150 },
        data: {
          id: "map",
          name: "Map (延迟)",
          type: "operator",
          description: "转换每个发出的值",
          color: "bg-purple-500",
          config: { func: "x => { if (x > 3) return new Promise(resolve => setTimeout(() => resolve(x), 3000)); return x; }" }
        },
      },
      {
        id: "timeout-1",
        type: "custom",
        position: { x: 600, y: 150 },
        data: {
          id: "timeout",
          name: "Timeout(2000)",
          type: "operator",
          description: "在指定时间内没有收到值时发出错误",
          color: "bg-purple-500",
          config: { time: 2000 }
        },
      },
      {
        id: "subscriber-8",
        type: "subscriber",
        position: { x: 850, y: 150 },
        data: {
          id: "subscriber",
          name: "订阅者",
          type: "observer",
          description: "显示接收到的值",
          color: "bg-teal-500"
        },
      }
    ],
    edges: [
      { id: "e8-1", source: "interval-9", target: "map-5", animated: true },
      { id: "e8-2", source: "map-5", target: "timeout-1", animated: true },
      { id: "e8-3", source: "timeout-1", target: "subscriber-8", animated: true }
    ],
  },
  {
    id: "probabilistic-example",
    name: "概率失败 Observable",
    description: "演示自定义的概率失败 Observable，可以配置延迟时间和成功概率。",
    nodes: [
      {
        id: "probabilistic-1",
        type: "custom",
        position: { x: 100, y: 150 },
        data: {
          id: "probabilistic",
          name: "概率失败",
          type: "observable",
          description: "模拟一定概率失败的异步操作",
          color: "bg-blue-500",
          config: { delay: 2000, successRate: 0.7 }
        },
      },
      {
        id: "retry-2",
        type: "custom",
        position: { x: 400, y: 150 },
        data: {
          id: "retry",
          name: "Retry(3)",
          type: "operator",
          description: "在发生错误时重试",
          color: "bg-purple-500",
          config: { count: 3 }
        },
      },
      {
        id: "subscriber-10",
        type: "subscriber",
        position: { x: 700, y: 150 },
        data: {
          id: "subscriber",
          name: "订阅者",
          type: "observer",
          description: "显示接收到的值",
          color: "bg-teal-500"
        },
      }
    ],
    edges: [
      { id: "e10-1", source: "probabilistic-1", target: "retry-2", animated: true },
      { id: "e10-2", source: "retry-2", target: "subscriber-10", animated: true }
    ],
  },
  {
    id: "race-example",
    name: "Race 竞争示例",
    description: "演示如何使用 race 操作符，只发出最先发出值的 Observable 的所有值。",
    nodes: [
      {
        id: "interval-10",
        type: "custom",
        position: { x: 100, y: 100 },
        data: {
          id: "interval",
          name: "间隔 (1s)",
          type: "observable",
          description: "定期发出递增数字",
          color: "bg-blue-500",
          config: { period: 1000 }
        },
      },
      {
        id: "interval-11",
        type: "custom",
        position: { x: 100, y: 250 },
        data: {
          id: "interval",
          name: "间隔 (1.5s)",
          type: "observable",
          description: "定期发出递增数字",
          color: "bg-blue-500",
          config: { period: 1500 }
        },
      },
      {
        id: "race-1",
        type: "custom",
        position: { x: 400, y: 175 },
        data: {
          id: "race",
          name: "Race",
          type: "observable",
          description: "只发出最先发出值的Observable的所有值",
          color: "bg-blue-500",
          multipleInputs: true
        },
      },
      {
        id: "map-6",
        type: "custom",
        position: { x: 650, y: 175 },
        data: {
          id: "map",
          name: "Map",
          type: "operator",
          description: "转换每个发出的值",
          color: "bg-purple-500",
          config: { func: "x => `赢家值: ${x}`" }
        },
      },
      {
        id: "subscriber-9",
        type: "subscriber",
        position: { x: 900, y: 175 },
        data: {
          id: "subscriber",
          name: "订阅者",
          type: "observer",
          description: "显示接收到的值",
          color: "bg-teal-500"
        },
      }
    ],
    edges: [
      { id: "e9-1", source: "interval-10", target: "race-1", animated: true, targetHandle: "primary" },
      { id: "e9-2", source: "interval-11", target: "race-1", animated: true, targetHandle: "secondary" },
      { id: "e9-3", source: "race-1", target: "map-6", animated: true },
      { id: "e9-4", source: "map-6", target: "subscriber-9", animated: true }
    ],
  },
  {
    id: "hot-cold-observable-demo",
    name: "冷热 Observable 演示",
    description: "演示冷热 Observable 的区别：热 Observable（如 interval）不依赖订阅者，冷 Observable（如 array）依赖订阅者。",
    nodes: [
      {
        id: "interval-hot",
        type: "custom",
        position: { x: 100, y: 100 },
        data: {
          id: "interval",
          name: "热 Observable (Interval)",
          type: "observable",
          description: "定期发出递增数字",
          color: "bg-blue-500",
          config: { period: 1000 }
        },
      },
      {
        id: "array-cold",
        type: "custom",
        position: { x: 100, y: 300 },
        data: {
          id: "array",
          name: "冷 Observable (Array)",
          type: "observable",
          description: "发出数组中的每个值",
          color: "bg-blue-500",
          config: { values: '["A", "B", "C", "D", "E"]' }
        },
      },
      {
        id: "subscriber-hot-1",
        type: "subscriber",
        position: { x: 400, y: 50 },
        data: {
          id: "subscriber",
          name: "订阅者1 (热)",
          type: "observer",
          description: "第一个订阅者",
          color: "bg-teal-500"
        },
      },
      {
        id: "subscriber-hot-2",
        type: "subscriber",
        position: { x: 400, y: 150 },
        data: {
          id: "subscriber",
          name: "订阅者2 (热)",
          type: "observer",
          description: "第二个订阅者",
          color: "bg-teal-500"
        },
      },
      {
        id: "subscriber-cold-1",
        type: "subscriber",
        position: { x: 400, y: 250 },
        data: {
          id: "subscriber",
          name: "订阅者1 (冷)",
          type: "observer",
          description: "第一个订阅者",
          color: "bg-teal-500"
        },
      },
      {
        id: "subscriber-cold-2",
        type: "subscriber",
        position: { x: 400, y: 350 },
        data: {
          id: "subscriber",
          name: "订阅者2 (冷)",
          type: "observer",
          description: "第二个订阅者",
          color: "bg-teal-500"
        },
      }
    ],
    edges: [
      { id: "e-hot-1", source: "interval-hot", target: "subscriber-hot-1", animated: true },
      { id: "e-hot-2", source: "interval-hot", target: "subscriber-hot-2", animated: true },
      { id: "e-cold-1", source: "array-cold", target: "subscriber-cold-1", animated: true },
      { id: "e-cold-2", source: "array-cold", target: "subscriber-cold-2", animated: true }
    ],
  },
  {
    id: "mouse-events-demo",
    name: "鼠标事件演示",
    description: "演示新的统一鼠标事件 Observable，可以选择不同的鼠标事件类型。",
    nodes: [
      {
        id: "mouse-click",
        type: "custom",
        position: { x: 100, y: 100 },
        data: {
          id: "mouse",
          name: "点击事件",
          type: "observable",
          description: "监听鼠标点击事件",
          color: "bg-blue-500",
          config: { eventType: "click" }
        },
      },
      {
        id: "mouse-move",
        type: "custom",
        position: { x: 100, y: 250 },
        data: {
          id: "mouse",
          name: "鼠标移动",
          type: "observable",
          description: "监听鼠标移动事件",
          color: "bg-blue-500",
          config: { eventType: "mousemove" }
        },
      },
      {
        id: "mouse-down",
        type: "custom",
        position: { x: 100, y: 400 },
        data: {
          id: "mouse",
          name: "鼠标按下",
          type: "observable",
          description: "监听鼠标按下事件",
          color: "bg-blue-500",
          config: { eventType: "mousedown" }
        },
      },
      {
        id: "map-click",
        type: "custom",
        position: { x: 400, y: 100 },
        data: {
          id: "map",
          name: "Map",
          type: "operator",
          description: "转换点击事件",
          color: "bg-purple-500",
          config: { func: "e => `点击位置: (${e.x}, ${e.y})`" }
        },
      },
      {
        id: "map-move",
        type: "custom",
        position: { x: 400, y: 250 },
        data: {
          id: "map",
          name: "Map",
          type: "operator",
          description: "转换移动事件",
          color: "bg-purple-500",
          config: { func: "e => `移动位置: (${e.x}, ${e.y})`" }
        },
      },
      {
        id: "map-down",
        type: "custom",
        position: { x: 400, y: 400 },
        data: {
          id: "map",
          name: "Map",
          type: "operator",
          description: "转换按下事件",
          color: "bg-purple-500",
          config: { func: "e => `按下位置: (${e.x}, ${e.y}), 按钮: ${e.button}`" }
        },
      },
      {
        id: "subscriber-click",
        type: "subscriber",
        position: { x: 700, y: 100 },
        data: {
          id: "subscriber",
          name: "点击订阅者",
          type: "observer",
          description: "显示点击事件",
          color: "bg-teal-500"
        },
      },
      {
        id: "subscriber-move",
        type: "subscriber",
        position: { x: 700, y: 250 },
        data: {
          id: "subscriber",
          name: "移动订阅者",
          type: "observer",
          description: "显示移动事件",
          color: "bg-teal-500"
        },
      },
      {
        id: "subscriber-down",
        type: "subscriber",
        position: { x: 700, y: 400 },
        data: {
          id: "subscriber",
          name: "按下订阅者",
          type: "observer",
          description: "显示按下事件",
          color: "bg-teal-500"
        },
      }
    ],
    edges: [
      { id: "e-mouse-1", source: "mouse-click", target: "map-click", animated: true },
      { id: "e-mouse-2", source: "map-click", target: "subscriber-click", animated: true },
      { id: "e-mouse-3", source: "mouse-move", target: "map-move", animated: true },
      { id: "e-mouse-4", source: "map-move", target: "subscriber-move", animated: true },
      { id: "e-mouse-5", source: "mouse-down", target: "map-down", animated: true },
      { id: "e-mouse-6", source: "map-down", target: "subscriber-down", animated: true }
    ],
  },
  {
    id: "switchmapto-example",
    name: "SwitchMapTo 示例",
    description: "演示 SwitchMapTo 操作符如何在新事件到达时取消之前的订阅并重新订阅。",
    nodes: [
      {
        id: "interval-primary",
        type: "custom",
        position: { x: 100, y: 100 },
        data: {
          id: "interval",
          name: "主数据流 (1s)",
          type: "observable",
          description: "定期发出递增数字",
          color: "bg-blue-500",
          config: { period: 1000 }
        },
      },
      {
        id: "interval-secondary",
        type: "custom",
        position: { x: 100, y: 250 },
        data: {
          id: "interval",
          name: "次要数据流 (500ms)",
          type: "observable",
          description: "快速发出递增数字",
          color: "bg-blue-500",
          config: { period: 500 }
        },
      },
      {
        id: "switchmapto-1",
        type: "custom",
        position: { x: 400, y: 175 },
        data: {
          id: "switchMapTo",
          name: "SwitchMapTo",
          type: "operator",
          description: "切换到另一个Observable，取消之前的订阅",
          color: "bg-purple-500",
          multipleInputs: true
        },
      },
      {
        id: "map-switch",
        type: "custom",
        position: { x: 650, y: 175 },
        data: {
          id: "map",
          name: "Map",
          type: "operator",
          description: "转换每个发出的值",
          color: "bg-purple-500",
          config: { func: "x => `SwitchMapTo值: ${x}`" }
        },
      },
      {
        id: "subscriber-switch",
        type: "subscriber",
        position: { x: 900, y: 175 },
        data: {
          id: "subscriber",
          name: "订阅者",
          type: "observer",
          description: "显示接收到的值",
          color: "bg-teal-500"
        },
      }
    ],
    edges: [
      { id: "e-switch-1", source: "interval-primary", target: "switchmapto-1", animated: true, targetHandle: "primary" },
      { id: "e-switch-2", source: "interval-secondary", target: "switchmapto-1", animated: true, targetHandle: "secondary" },
      { id: "e-switch-3", source: "switchmapto-1", target: "map-switch", animated: true },
      { id: "e-switch-4", source: "map-switch", target: "subscriber-switch", animated: true }
    ],
  },
  {
    id: "switchmapto-takeuntil-example",
    name: "SwitchMapTo + Take 示例",
    description: "演示 SwitchMapTo 操作符如何与 Take 组合，确保次要输入在完成后仍能重新订阅。",
    nodes: [
      {
        id: "interval-primary",
        type: "custom",
        position: { x: 100, y: 100 },
        data: {
          id: "interval",
          name: "主数据流 (2s)",
          type: "observable",
          description: "定期发出递增数字",
          color: "bg-blue-500",
          config: { period: 2000 }
        },
      },
      {
        id: "interval-secondary",
        type: "custom",
        position: { x: 100, y: 250 },
        data: {
          id: "interval",
          name: "次要数据流 (500ms)",
          type: "observable",
          description: "快速发出递增数字",
          color: "bg-blue-500",
          config: { period: 500 }
        },
      },
      {
        id: "take-until",
        type: "custom",
        position: { x: 350, y: 250 },
        data: {
          id: "take",
          name: "Take(3)",
          type: "operator",
          description: "只取前3个值",
          color: "bg-purple-500",
          config: { count: 3 }
        },
      },
      {
        id: "switchmapto-1",
        type: "custom",
        position: { x: 600, y: 175 },
        data: {
          id: "switchMapTo",
          name: "SwitchMapTo",
          type: "operator",
          description: "切换到另一个Observable，取消之前的订阅",
          color: "bg-purple-500",
          multipleInputs: true
        },
      },
      {
        id: "map-switch",
        type: "custom",
        position: { x: 850, y: 175 },
        data: {
          id: "map",
          name: "Map",
          type: "operator",
          description: "转换每个发出的值",
          color: "bg-purple-500",
          config: { func: "x => `SwitchMapTo值: ${x}`" }
        },
      },
      {
        id: "subscriber-switch",
        type: "subscriber",
        position: { x: 1100, y: 175 },
        data: {
          id: "subscriber",
          name: "订阅者",
          type: "observer",
          description: "显示接收到的值",
          color: "bg-teal-500"
        },
      }
    ],
    edges: [
      { id: "e-switch-1", source: "interval-primary", target: "switchmapto-1", animated: true, targetHandle: "primary" },
      { id: "e-switch-2", source: "interval-secondary", target: "take-until", animated: true },
      { id: "e-switch-3", source: "take-until", target: "switchmapto-1", animated: true, targetHandle: "secondary" },
      { id: "e-switch-4", source: "switchmapto-1", target: "map-switch", animated: true },
      { id: "e-switch-5", source: "map-switch", target: "subscriber-switch", animated: true }
    ],
  },
  {
    id: "drag-example",
    name: "拖动",
    description: "演示鼠标拖拽的完整流程：按下鼠标开始拖动，移动鼠标跟踪位置，抬起鼠标结束拖动。使用 TakeUntil 和 SwitchMapTo 操作符实现。",
    nodes: [
      {
        id: "mouse-down",
        type: "custom",
        position: { x: -30, y: -90 },
        data: {
          id: "mouse",
          name: "鼠标按下",
          type: "observable",
          description: "监听鼠标按下事件",
          color: "bg-blue-500",
          config: { eventType: "mousedown" }
        },
      },
      {
        id: "mouse-move",
        type: "custom",
        position: { x: -201, y: -249 },
        data: {
          id: "mouse",
          name: "鼠标移动",
          type: "observable",
          description: "监听鼠标移动事件",
          color: "bg-blue-500",
          config: { eventType: "mousemove" }
        },
      },
      {
        id: "mouse-up",
        type: "custom",
        position: { x: -69, y: -432 },
        data: {
          id: "mouse",
          name: "鼠标抬起",
          type: "observable",
          description: "监听鼠标抬起事件",
          color: "bg-blue-500",
          config: { eventType: "mouseup" }
        },
      },
      {
        id: "takeuntil-1",
        type: "custom",
        position: { x: 123, y: -204 },
        data: {
          id: "takeUntil",
          name: "TakeUntil",
          type: "operator",
          description: "发出值直到第二个Observable发出值",
          color: "bg-purple-500",
          multipleInputs: true
        },
      },
      {
        id: "switchmapto-1",
        type: "custom",
        position: { x: 347, y: -45 },
        data: {
          id: "switchMapTo",
          name: "SwitchMapTo",
          type: "operator",
          description: "切换到另一个Observable",
          color: "bg-purple-500",
          multipleInputs: true
        },
      },
      {
        id: "subscriber-1",
        type: "subscriber",
        position: { x: 723, y: -124 },
        data: {
          id: "subscriber",
          name: "订阅者",
          type: "observer",
          description: "订阅数据流并显示结果",
          color: "bg-teal-500"
        },
      }
    ],
    edges: [
      { id: "e-drag-1", source: "mouse-down", target: "switchmapto-1", animated: true, targetHandle: "primary" },
      { id: "e-drag-2", source: "mouse-move", target: "takeuntil-1", animated: true, targetHandle: "primary" },
      { id: "e-drag-3", source: "takeuntil-1", target: "switchmapto-1", animated: true, targetHandle: "secondary" },
      { id: "e-drag-4", source: "mouse-up", target: "takeuntil-1", animated: true, targetHandle: "secondary" },
      { id: "e-drag-5", source: "switchmapto-1", target: "subscriber-1", animated: true }
    ],
  }
];

// 从localStorage加载用户保存的示例
export const loadUserSamples = (): Sample[] => {
  try {
    const savedSamples = localStorage.getItem('rxcraft-user-samples');
    return savedSamples ? JSON.parse(savedSamples) : [];
  } catch (e) {
    console.error('加载用户示例失败:', e);
    return [];
  }
};

// 保存用户示例到localStorage
export const saveUserSample = (sample: Sample): void => {
  try {
    const userSamples = loadUserSamples();
    // 检查是否已存在同ID的示例，如果存在则更新
    const existingIndex = userSamples.findIndex(s => s.id === sample.id);
    if (existingIndex >= 0) {
      userSamples[existingIndex] = sample;
    } else {
      userSamples.push(sample);
    }
    localStorage.setItem('rxcraft-user-samples', JSON.stringify(userSamples));
  } catch (e) {
    console.error('保存用户示例失败:', e);
  }
};

// 删除用户示例
export const deleteUserSample = (sampleId: string): void => {
  try {
    const userSamples = loadUserSamples();
    const updatedSamples = userSamples.filter(s => s.id !== sampleId);
    localStorage.setItem('rxcraft-user-samples', JSON.stringify(updatedSamples));
  } catch (e) {
    console.error('删除用户示例失败:', e);
  }
};

// 合并默认示例和用户示例
export const samples = (): Sample[] => {
  return [...defaultSamples, ...loadUserSamples()];
};