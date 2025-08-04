import React, { useCallback, useMemo, useState, useEffect } from "react";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  Handle,
  Position,
  ReactFlowProvider,
  useReactFlow,
  NodeChange,
  EdgeChange,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  NodeProps,
  NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { CheckCircle2, XCircle, Slash, Flame, Snowflake } from "lucide-react";
import { NodeStatus, isHotObservable } from "../lib/rx-logic";

// 定义节点数据类型
export interface NodeData {
  id: string;
  name: string;
  type: "observable" | "operator" | "observer";
  status?: NodeStatus;
  subscriptions?: Map<string, NodeStatus>;
  isFlashing?: boolean;
  config?: Record<string, any>;
  logs?: any[];
  color?: string;
  multipleInputs?: boolean;
}

// 扩展 NodeStatus 类型以包含 "cancelled"
type ExtendedNodeStatus = NodeStatus | "cancelled" | "idle";

// 定义配置组件的Props类型
interface ConfigProps {
  data: NodeData;
  onUpdate: (config: any) => void;
}

// 定义受控输入组件的Props类型
interface ControlledInputProps {
  value: string | number;
  onCommit: (value: string | number) => void;
  type?: string;
  id?: string;
  className?: string;
  min?: string;
  max?: string;
  step?: string;
}

// 定义受控文本域组件的Props类型
interface ControlledTextareaProps {
  value: string;
  onCommit: (value: string) => void;
  id?: string;
  className?: string;
  rows?: number;
}

// 定义状态指示器组件的Props类型
interface StatusIndicatorProps {
  status?: ExtendedNodeStatus;
  isFlashing?: boolean;
  color?: string;
}

// 定义订阅者节点组件的Props类型
interface SubscriberNodeProps {
  data: NodeData;
  id: string;
}

// 定义自定义节点组件的Props类型
interface CustomNodeProps {
  id: string;
  data: NodeData;
  onUpdateNodeConfig: (id: string, config: any) => void;
}

// 定义工作区组件的Props类型
interface WorkAreaProps {
  nodes: Node<NodeData>[];
  connections: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  setNodes: React.Dispatch<React.SetStateAction<Node<NodeData>[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  nodeSubscriptions: Map<string, Map<string, NodeStatus>>;
  activeFlashes: Set<string>;
  subscriberLogs: Map<string, any[]>;
  onUpdateNodeConfig: (id: string, config: Record<string, any>) => void;
  isPlaying?: boolean;
}

// --- 受控输入组件 ---

const ControlledInput = ({
  value: initialValue,
  onCommit,
  type,
  ...props
}: ControlledInputProps) => {
  const [value, setValue] = useState<string | number>(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleCommit = () => {
    if (type === "number") {
      onCommit(parseInt(String(value), 10) || 0);
    } else {
      onCommit(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCommit();
      (e.target as HTMLElement).blur();
    }
  };

  return (
    <Input
      {...props}
      type={type}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleCommit}
      onKeyDown={handleKeyDown}
    />
  );
};

const ControlledTextarea = ({
  value: initialValue,
  onCommit,
  ...props
}: ControlledTextareaProps) => {
  const [value, setValue] = useState<string>(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return (
    <Textarea
      {...props}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onCommit(value)}
    />
  );
};

// --- 不同节点类型的配置面板 ---

const IntervalConfig = ({ data, onUpdate }: ConfigProps) => (
  <div className="space-y-2">
    <Label htmlFor="period">间隔 (ms)</Label>
    <ControlledInput
      id="period"
      type="number"
      value={data.config?.period || 1000}
      onCommit={(val) => onUpdate({ period: val })}
      className="bg-slate-700 border-slate-600 nodrag"
    />
  </div>
);

const ArrayConfig = ({ data, onUpdate }: ConfigProps) => (
  <div className="space-y-2">
    <Label htmlFor="array-values">数组 (JSON格式)</Label>
    <ControlledTextarea
      id="array-values"
      value={data.config?.values || '["A", "B", "C"]'}
      onCommit={(val) => onUpdate({ values: val })}
      className="bg-slate-700 border-slate-600 font-mono nodrag"
      rows={3}
    />
  </div>
);

const MapConfig = ({ data, onUpdate }: ConfigProps) => (
  <div className="space-y-2">
    <Label htmlFor="map-func">转换函数</Label>
    <ControlledTextarea
      id="map-func"
      value={data.config?.func || "x => x + '!'"}
      onCommit={(val) => onUpdate({ func: val })}
      className="bg-slate-700 border-slate-600 font-mono nodrag"
      rows={3}
    />
  </div>
);

const FilterConfig = ({ data, onUpdate }: ConfigProps) => (
  <div className="space-y-2">
    <Label htmlFor="filter-func">过滤函数</Label>
    <ControlledTextarea
      id="filter-func"
      value={data.config?.func || "x => x.length > 1"}
      onCommit={(val) => onUpdate({ func: val })}
      className="bg-slate-700 border-slate-600 font-mono nodrag"
      rows={3}
    />
  </div>
);

const TakeConfig = ({ data, onUpdate }: ConfigProps) => (
  <div className="space-y-2">
    <Label htmlFor="take-count">数量</Label>
    <ControlledInput
      id="take-count"
      type="number"
      value={data.config?.count || 5}
      onCommit={(val) => onUpdate({ count: val })}
      className="bg-slate-700 border-slate-600 nodrag"
    />
  </div>
);

const FetchConfig = ({ data, onUpdate }: ConfigProps) => (
  <div className="space-y-2">
    <Label htmlFor="fetch-url">URL</Label>
    <ControlledInput
      id="fetch-url"
      type="text"
      value={data.config?.url || "https://jsonplaceholder.typicode.com/todos/1"}
      onCommit={(val) => onUpdate({ url: val })}
      className="bg-slate-700 border-slate-600 nodrag"
    />
  </div>
);

// 新增配置面板组件
const StartWithConfig = ({ data, onUpdate }: ConfigProps) => (
  <div className="space-y-2">
    <Label htmlFor="startWith-value">初始值</Label>
    <ControlledInput
      id="startWith-value"
      type="text"
      value={data.config?.value || "初始值"}
      onCommit={(val) => onUpdate({ value: val })}
      className="bg-slate-700 border-slate-600 nodrag"
    />
  </div>
);

const SkipConfig = ({ data, onUpdate }: ConfigProps) => (
  <div className="space-y-2">
    <Label htmlFor="skip-count">跳过数量</Label>
    <ControlledInput
      id="skip-count"
      type="number"
      value={data.config?.count || 2}
      onCommit={(val) => onUpdate({ count: val })}
      className="bg-slate-700 border-slate-600 nodrag"
    />
  </div>
);

const RetryConfig = ({ data, onUpdate }: ConfigProps) => (
  <div className="space-y-2">
    <Label htmlFor="retry-count">重试次数</Label>
    <ControlledInput
      id="retry-count"
      type="number"
      value={data.config?.count || 3}
      onCommit={(val) => onUpdate({ count: val })}
      className="bg-slate-700 border-slate-600 nodrag"
    />
  </div>
);

const TimeoutConfig = ({ data, onUpdate }: ConfigProps) => (
  <div className="space-y-2">
    <Label htmlFor="timeout-time">超时时间 (ms)</Label>
    <ControlledInput
      id="timeout-time"
      type="number"
      value={data.config?.time || 5000}
      onCommit={(val) => onUpdate({ time: val })}
      className="bg-slate-700 border-slate-600 nodrag"
    />
  </div>
);

// 新增：鼠标事件配置组件
const MouseEventConfig = ({ data, onUpdate }: ConfigProps) => (
  <div className="space-y-2">
    <Label htmlFor="mouse-event-type">事件类型</Label>
    <select
      id="mouse-event-type"
      value={data.config?.eventType || "click"}
      onChange={(e) => onUpdate({ eventType: e.target.value })}
      className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white nodrag"
      aria-label="选择鼠标事件类型"
    >
      <option value="click">点击 (click)</option>
      <option value="dblclick">双击 (dblclick)</option>
      <option value="mousedown">按下 (mousedown)</option>
      <option value="mouseup">抬起 (mouseup)</option>
      <option value="mousemove">移动 (mousemove)</option>
      <option value="mouseenter">进入 (mouseenter)</option>
      <option value="mouseleave">离开 (mouseleave)</option>
      <option value="mouseover">悬停 (mouseover)</option>
      <option value="mouseout">移出 (mouseout)</option>
    </select>
  </div>
);

const ProbabilisticConfig = ({ data, onUpdate }: ConfigProps) => (
  <div className="space-y-2">
    <Label htmlFor="probabilistic-delay">延迟时间 (ms)</Label>
    <ControlledInput
      id="probabilistic-delay"
      type="number"
      value={data.config?.delay || 1000}
      onCommit={(val) => onUpdate({ delay: val })}
      className="bg-slate-700 border-slate-600 nodrag"
    />
    <Label htmlFor="probabilistic-successRate">成功概率 (0-1)</Label>
    <ControlledInput
      id="probabilistic-successRate"
      type="number"
      min="0"
      max="1"
      step="0.1"
      value={data.config?.successRate || 0.8}
      onCommit={(val) => onUpdate({ successRate: val })}
      className="bg-slate-700 border-slate-600 nodrag"
    />
  </div>
);

const CONFIG_MAP: Record<string, React.FC<ConfigProps>> = {
  interval: IntervalConfig,
  array: ArrayConfig,
  map: MapConfig,
  filter: FilterConfig,
  take: TakeConfig,
  skip: SkipConfig,
  startWith: StartWithConfig,
  retry: RetryConfig,
  timeout: TimeoutConfig,
  fetch: FetchConfig,
  probabilistic: ProbabilisticConfig,
  mouse: MouseEventConfig, // 新增鼠标事件配置
};

// --- 自定义节点组件 ---

const StatusIndicator = ({
  status,
  isFlashing,
  color = "yellow",
}: StatusIndicatorProps) => {
  if (status === "completed") {
    return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  }
  if (status === "errored") {
    return <XCircle className="w-4 h-4 text-red-500" />;
  }

  // 根据颜色和状态确定样式
  const getColorClasses = () => {
    if (!isFlashing) return "bg-slate-600";

    switch (color) {
      case "yellow":
        return "bg-yellow-400 scale-150 shadow-[0_0_12px_4px] shadow-yellow-400/50";
      case "teal":
        return "bg-teal-400 scale-150 shadow-[0_0_12px_4px] shadow-teal-400/50";
      case "blue":
        return "bg-blue-400 scale-150 shadow-[0_0_12px_4px] shadow-blue-400/50";
      default:
        return "bg-yellow-400 scale-150 shadow-[0_0_12px_4px] shadow-yellow-400/50";
    }
  };

  return (
    <div
      className={`w-3 h-3 rounded-full transition-all duration-300 ease-out ${getColorClasses()}`}
    ></div>
  );
};

// 新增：多订阅状态指示器组件
const MultiSubscriptionIndicator = ({
  subscriptions,
  isFlashing,
  color = "yellow",
}: {
  subscriptions?: Map<string, NodeStatus>;
  isFlashing?: boolean;
  color?: string;
}) => {
  if (!subscriptions || subscriptions.size === 0) {
    return (
      <div className="flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-slate-600"></div>
      </div>
    );
  }

  const subscriptionArray = Array.from(subscriptions.entries());

  return (
    <div className="flex items-center gap-1">
      {subscriptionArray.map(([subscriptionId, status]) => (
        <div
          key={subscriptionId}
          className="flex items-center justify-center"
          title={`${subscriptionId}: ${status}`}
        >
          <StatusIndicator
            status={status}
            isFlashing={isFlashing}
            color={color}
          />
        </div>
      ))}
    </div>
  );
};

const SubscriberNode = React.memo(({ data }: SubscriberNodeProps) => {
  const logContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [data.logs]);

  // 检查是否有活跃的订阅来确定边框颜色
  const hasActiveSubscriptions =
    data.subscriptions &&
    Array.from(data.subscriptions.values()).some(
      (status) => status === "active"
    );
  const hasCompletedSubscriptions =
    data.subscriptions &&
    Array.from(data.subscriptions.values()).some(
      (status) => status === "completed"
    );
  const hasErroredSubscriptions =
    data.subscriptions &&
    Array.from(data.subscriptions.values()).some(
      (status) => status === "errored"
    );
  // 订阅者节点：如果有日志数据，说明正在接收数据
  const hasLogs = data.logs && data.logs.length > 0;

  const borderColor = hasErroredSubscriptions
    ? "border-red-500"
    : hasCompletedSubscriptions
    ? "border-green-500"
    : hasActiveSubscriptions
    ? "border-teal-500"
    : hasLogs
    ? "border-teal-500" // 如果有日志数据，显示活跃状态
    : "border-slate-600";

  return (
    <div
      className={`bg-slate-800 border-2 ${borderColor} rounded-lg shadow-lg w-64`}
    >
      <div className="p-2 bg-slate-700 rounded-t-md flex items-center justify-between">
        <div className="font-bold text-teal-300">{data.name}</div>
        <div className="status-indicator flex items-center justify-center">
          {hasLogs ? (
            // 如果有日志数据，显示活跃状态指示器
            <div className="w-3 h-3 rounded-full bg-teal-400 scale-150 shadow-[0_0_12px_4px] shadow-teal-400/50"></div>
          ) : (
            <MultiSubscriptionIndicator
              subscriptions={data.subscriptions}
              isFlashing={data.isFlashing}
              color="teal"
            />
          )}
        </div>
      </div>
      <div
        ref={logContainerRef}
        className="p-2 h-40 overflow-y-auto bg-black bg-opacity-50 font-mono text-xs text-green-400"
      >
        {data.logs &&
          data.logs.map((log: any, index: number) => (
            <div key={index} className="whitespace-pre-wrap break-all">
              {typeof log === "object" ? JSON.stringify(log) : String(log)}
            </div>
          ))}
      </div>
      <Handle type="target" position={Position.Left} className="!bg-teal-400" />
    </div>
  );
});

const CustomNode = React.memo(
  ({ id, data, onUpdateNodeConfig }: CustomNodeProps) => {
    const ConfigComponent = CONFIG_MAP[data.id];
    const hasConfig = !!ConfigComponent;

    const handleUpdate = (config: Record<string, any>) => {
      onUpdateNodeConfig(id, config);
    };

    // 检查订阅状态来确定边框颜色
    const hasActiveSubscriptions =
      data.subscriptions &&
      Array.from(data.subscriptions.values()).some(
        (status) => status === "active"
      );
    const hasCompletedSubscriptions =
      data.subscriptions &&
      Array.from(data.subscriptions.values()).some(
        (status) => status === "completed"
      );
    const hasErroredSubscriptions =
      data.subscriptions &&
      Array.from(data.subscriptions.values()).some(
        (status) => status === "errored"
      );
    const hasCancelledSubscriptions =
      data.subscriptions &&
      Array.from(data.subscriptions.values()).some(
        (status) => status === "cancelled"
      );

    const borderColor = hasErroredSubscriptions
      ? "border-red-500"
      : hasCompletedSubscriptions
      ? "border-green-500"
      : hasCancelledSubscriptions
      ? "border-orange-500"
      : hasActiveSubscriptions
      ? "border-blue-500"
      : data.type === "observable"
      ? "border-blue-500"
      : "border-purple-500";

    // 检查是否是多输入节点
    const isMultiInput = data.multipleInputs === true;

    // 检查是否为热 Observable
    const isHot = data.type === "observable" ? isHotObservable(data.id) : false;

    return (
      <div
        className={`px-4 py-2 shadow-md rounded-md border-2 ${borderColor} bg-slate-800 text-white w-64`}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="font-bold">{data.name}</div>
            {data.type === "observable" && (
              <div className="flex items-center space-x-1">
                {isHot ? (
                  <div className="flex items-center space-x-1">
                    <Flame className="w-3 h-3 text-orange-500" />
                    <span className="text-xs text-orange-400">热</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <Snowflake className="w-3 h-3 text-cyan-500" />
                    <span className="text-xs text-cyan-400">冷</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="status-indicator flex items-center justify-center">
            <MultiSubscriptionIndicator
              subscriptions={data.subscriptions}
              isFlashing={data.isFlashing}
              color="yellow"
            />
          </div>
        </div>
        {data.config?.func && (
          <div className="mt-1 text-xs text-slate-400 bg-slate-900 p-1 rounded font-mono truncate">
            {data.config.func}
          </div>
        )}
        {hasConfig && (
          <div className="mt-2 pt-2 border-t border-slate-700">
            <ConfigComponent data={data} onUpdate={handleUpdate} />
          </div>
        )}

        {/* 为多输入节点显示两个输入连接点 */}
        {isMultiInput && (
          <>
            <Handle
              type="target"
              position={Position.Left}
              id={data.type === "operator" ? "primary" : "input-1"}
              className="w-2 h-2 !bg-slate-400"
              style={{ top: data.type === "operator" ? "50%" : "30%" }}
            />
            <Handle
              type="target"
              position={data.type === "operator" ? Position.Top : Position.Left}
              id={data.type === "operator" ? "secondary" : "input-2"}
              className="w-2 h-2 !bg-slate-400"
              style={
                data.type === "operator" ? { left: "50%" } : { top: "70%" }
              }
            />
          </>
        )}

        {/* 为非Observable且非多输入的节点显示单个输入连接点 */}
        {data.type !== "observable" && !isMultiInput && (
          <Handle
            type="target"
            position={Position.Left}
            className="w-2 h-2 !bg-slate-400"
          />
        )}

        <Handle
          type="source"
          position={Position.Right}
          className="w-2 h-2 !bg-slate-400"
        />
      </div>
    );
  }
);

// 定义 nodeTypes 对象，移到组件外部以避免重新创建
const createNodeTypes = (
  onUpdateNodeConfig: (id: string, config: any) => void
): NodeTypes => ({
  custom: (props: NodeProps) => (
    <CustomNode
      id={props.id}
      data={props.data as NodeData}
      onUpdateNodeConfig={onUpdateNodeConfig}
    />
  ),
  subscriber: SubscriberNode as any,
});

// --- 主工作区组件 ---

const WorkArea = ({
  nodes,
  connections,
  onNodesChange,
  onEdgesChange,
  setNodes,
  setEdges,
  nodeSubscriptions,
  activeFlashes,
  subscriberLogs,
  onUpdateNodeConfig,
  isPlaying = false,
}: WorkAreaProps) => {
  const reactFlowInstance = useReactFlow();

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds: Edge[]) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      // 播放状态下禁用拖拽悬停效果
      if (isPlaying) {
        event.dataTransfer.dropEffect = "none";
        return;
      }

      event.dataTransfer.dropEffect = "move";
    },
    [isPlaying]
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      // 播放状态下禁用拖放功能
      if (isPlaying) {
        return;
      }

      const typeData = event.dataTransfer.getData("application/json");
      if (!typeData) return;

      const data = JSON.parse(typeData);
      const flowPosition = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // 初始位置设置为鼠标位置，稍后会精确调整
      const position = flowPosition;

      // 调试信息
      console.log("Mouse position:", { x: event.clientX, y: event.clientY });
      console.log("Flow position:", flowPosition);
      console.log("Node position:", position);

      // 为不同类型的节点设置默认配置
      let defaultConfig: Record<string, any> = {};
      switch (data.id) {
        case "mouse":
          defaultConfig = { eventType: "click" };
          break;
        case "interval":
          defaultConfig = { period: 1000 };
          break;
        case "array":
          defaultConfig = { values: '["A", "B", "C"]' };
          break;
        case "map":
          defaultConfig = { func: "x => x + '!'" };
          break;
        case "filter":
          defaultConfig = { func: "x => x.length > 1" };
          break;
        case "take":
          defaultConfig = { count: 5 };
          break;
        case "skip":
          defaultConfig = { count: 2 };
          break;
        case "startWith":
          defaultConfig = { value: "初始值" };
          break;
        case "retry":
          defaultConfig = { count: 3 };
          break;
        case "timeout":
          defaultConfig = { time: 5000 };
          break;
        case "fetch":
          defaultConfig = {
            url: "https://jsonplaceholder.typicode.com/todos/1",
          };
          break;
        case "probabilistic":
          defaultConfig = { delay: 1000, successRate: 0.5 };
          break;
      }

      const newNode = {
        id: `${data.id}-${+new Date()}`,
        type: data.type === "observer" ? "subscriber" : "custom",
        position,
        data: { ...data, config: defaultConfig },
      };

      setNodes((nds: Node<NodeData>[]) =>
        nds.concat(newNode as Node<NodeData>)
      );

      // 在下一个 tick 中调整节点位置，确保节点已经渲染
      setTimeout(() => {
        const nodeElement = document.querySelector(
          `[data-id="${newNode.id}"]`
        ) as HTMLElement;
        if (nodeElement) {
          const rect = nodeElement.getBoundingClientRect();
          const nodeCenter = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          };

          const mousePosition = {
            x: event.clientX,
            y: event.clientY,
          };

          // 计算需要移动的距离（屏幕坐标）
          const offsetX = mousePosition.x - nodeCenter.x;
          const offsetY = mousePosition.y - nodeCenter.y;

          // 将屏幕偏移转换为流坐标偏移
          const flowOffset = reactFlowInstance.screenToFlowPosition({
            x: mousePosition.x + offsetX,
            y: mousePosition.y + offsetY,
          });

          const originalFlowPosition = reactFlowInstance.screenToFlowPosition({
            x: mousePosition.x,
            y: mousePosition.y,
          });

          const finalOffset = {
            x: flowOffset.x - originalFlowPosition.x,
            y: flowOffset.y - originalFlowPosition.y,
          };

          setNodes((nds: Node<NodeData>[]) =>
            nds.map((node) =>
              node.id === newNode.id
                ? {
                    ...node,
                    position: {
                      x: node.position.x + finalOffset.x,
                      y: node.position.y + finalOffset.y,
                    },
                  }
                : node
            )
          );
        }
      }, 0);
    },
    [reactFlowInstance, setNodes]
  );

  const enrichedNodes = useMemo(() => {
    return nodes.map((node: Node<NodeData>) => {
      // 获取节点的所有订阅状态
      const nodeSubs = nodeSubscriptions.get(node.id);
      const hasActiveSubscriptions =
        nodeSubs &&
        Array.from(nodeSubs.values()).some((status) => status === "active");

      return {
        ...node,
        data: {
          ...node.data,
          subscriptions: nodeSubs || new Map(),
          isFlashing: activeFlashes.has(node.id),
          logs:
            node.data.type === "observer"
              ? subscriberLogs.get(node.id) || []
              : [],
        },
      };
    });
  }, [nodes, nodeSubscriptions, activeFlashes, subscriberLogs]);

  // 为活跃节点的连接线添加动画效果
  const animatedEdges = useMemo(() => {
    return connections.map((edge: Edge) => {
      const sourceNodeSubs = nodeSubscriptions.get(edge.source);
      // 如果源节点有任何活跃的订阅，则为连接线添加动画
      const isActive =
        sourceNodeSubs &&
        Array.from(sourceNodeSubs.values()).some(
          (status) => status === "active"
        );

      // 强制设置动画属性，确保动画效果显示
      return {
        ...edge,
        animated: true, // 始终启用动画
        style: {
          stroke: isActive ? "#3b82f6" : "#64748b", // 活跃时蓝色，否则灰色
          strokeWidth: isActive ? 3 : 1.5, // 活跃时线条更粗
        },
        // 使用贝塞尔曲线，动画效果更明显
        type: "default",
        // 移除标签，专注于线条动画
      };
    });
  }, [connections, nodeSubscriptions]);

  // 使用 useMemo 来缓存 nodeTypes，避免重复创建
  const nodeTypes = useMemo(
    () => createNodeTypes(onUpdateNodeConfig),
    [onUpdateNodeConfig]
  );

  return (
    <div
      className="h-full w-full relative"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      {isPlaying && (
        <>
          <div className="absolute top-4 right-4 z-10 pointer-events-none">
            <div className="bg-slate-800/90 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-xs font-medium shadow-lg">
              🔒 画布已锁定
            </div>
          </div>
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/30 z-10 pointer-events-none"></div>
        </>
      )}
      <ReactFlow
        nodes={enrichedNodes}
        edges={animatedEdges}
        onNodesChange={isPlaying ? undefined : onNodesChange}
        onEdgesChange={isPlaying ? undefined : onEdgesChange}
        onConnect={isPlaying ? undefined : onConnect}
        nodeTypes={nodeTypes}
        fitView
        defaultViewport={{ x: 0, y: 0, zoom: 0.7 }} // 设置初始缩放比例为0.7
        className="bg-slate-950"
        defaultEdgeOptions={{
          animated: true,
          type: "default",
          style: { strokeWidth: 1.5 },
        }}
        nodesDraggable={!isPlaying}
        nodesConnectable={!isPlaying}
        elementsSelectable={!isPlaying}
        panOnDrag={!isPlaying}
        zoomOnScroll={!isPlaying}
        zoomOnPinch={!isPlaying}
      >
        <Background color="#4a5568" gap={16} />
        <MiniMap
          nodeColor={(n) => {
            const color = n.data.color;
            if (!color) return "#888";

            // 颜色映射表，将CSS类名转换为十六进制颜色
            const colorMap: { [key: string]: string } = {
              "bg-blue-500": "#3b82f6",
              "bg-purple-500": "#8b5cf6",
              "bg-purple-600": "#7c3aed",
              "bg-purple-700": "#6d28d9",
              "bg-green-500": "#22c55e",
              "bg-green-600": "#16a34a",
              "bg-green-700": "#15803d",
              "bg-yellow-500": "#eab308",
              "bg-yellow-600": "#ca8a04",
              "bg-yellow-700": "#a16207",
              "bg-cyan-500": "#06b6d4",
              "bg-red-500": "#ef4444",
              "bg-pink-500": "#ec4899",
              "bg-gray-500": "#6b7280",
              "bg-gray-600": "#4b5563",
            };

            return colorMap[color] || color;
          }}
          style={{
            backgroundColor: "#0f172a", // 深色背景
            border: "1px solid #334155",
          }}
          className="bg-slate-900 border-slate-700"
        />
        <Controls />
      </ReactFlow>
    </div>
  );
};

// --- 带Provider的包装组件 ---

const WorkAreaWrapper = (props: WorkAreaProps) => (
  <ReactFlowProvider>
    <WorkArea {...props} />
  </ReactFlowProvider>
);

export default WorkAreaWrapper;
