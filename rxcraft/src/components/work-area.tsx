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
import { CheckCircle2, XCircle, Slash } from "lucide-react";
import { NodeStatus } from "../lib/rx-logic";

// 定义节点数据类型
interface NodeData {
  id: string;
  name: string;
  type: "observable" | "operator" | "observer";
  status?: NodeStatus;
  isFlashing?: boolean;
  config?: Record<string, any>;
  logs?: any[];
  color?: string;
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
  nodeStatuses: Map<string, ExtendedNodeStatus>;
  activeFlashes: Set<string>;
  subscriberLogs: Map<string, any[]>;
  onUpdateNodeConfig: (id: string, config: Record<string, any>) => void;
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
  // 使用类型断言确保类型安全
  if (status === ("cancelled" as ExtendedNodeStatus)) {
    return <Slash className="w-4 h-4 text-orange-500" />;
  }
  return (
    <div
      className={`w-3 h-3 rounded-full transition-all duration-300 ease-out
        ${
          isFlashing
            ? `bg-${color}-400 scale-150 shadow-[0_0_12px_4px] shadow-${color}-400/50`
            : "bg-slate-600"
        }`}
    ></div>
  );
};

const SubscriberNode = React.memo(({ data }: SubscriberNodeProps) => {
  const logContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [data.logs]);

  // 使用类型断言确保类型安全
  const status = data.status as ExtendedNodeStatus;
  const borderColor =
    status === "completed"
      ? "border-green-500"
      : status === "errored"
      ? "border-red-500"
      : status === "cancelled"
      ? "border-orange-500"
      : "border-teal-500";

  return (
    <div
      className={`bg-slate-800 border-2 ${borderColor} rounded-lg shadow-lg w-64`}
    >
      <div className="p-2 bg-slate-700 rounded-t-md flex items-center justify-between">
        <div className="font-bold text-teal-300">{data.name}</div>
        <div className="status-indicator w-4 h-4 flex items-center justify-center">
          <StatusIndicator
            status={data.status}
            isFlashing={data.isFlashing}
            color="teal"
          />
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

    // 使用类型断言确保类型安全
    const status = data.status as ExtendedNodeStatus;
    const borderColor =
      status === "completed"
        ? "border-green-500"
        : status === "errored"
        ? "border-red-500"
        : status === "cancelled"
        ? "border-orange-500"
        : data.type === "observable"
        ? "border-blue-500"
        : "border-purple-500";

    // 检查是否是多输入节点
    const isMultiInput = data.multipleInputs === true;

    return (
      <div
        className={`px-4 py-2 shadow-md rounded-md border-2 ${borderColor} bg-slate-800 text-white w-64`}
      >
        <div className="flex justify-between items-center">
          <div className="font-bold">{data.name}</div>
          <div className="status-indicator w-4 h-4 flex items-center justify-center">
            <StatusIndicator
              status={data.status}
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
              id="input-1"
              className="w-2 h-2 !bg-slate-400"
              style={{ top: "30%" }}
            />
            <Handle
              type="target"
              position={Position.Left}
              id="input-2"
              className="w-2 h-2 !bg-slate-400"
              style={{ top: "70%" }}
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

// --- 主工作区组件 ---

const WorkArea = ({
  nodes,
  connections,
  onNodesChange,
  onEdgesChange,
  setNodes,
  setEdges,
  nodeStatuses,
  activeFlashes,
  subscriberLogs,
  onUpdateNodeConfig,
}: WorkAreaProps) => {
  const reactFlowInstance = useReactFlow();

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds: Edge[]) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const typeData = event.dataTransfer.getData("application/json");
      if (!typeData) return;

      const data = JSON.parse(typeData);
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // 为不同类型的节点设置默认配置
      let defaultConfig: Record<string, any> = {};
      switch (data.id) {
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
    },
    [reactFlowInstance, setNodes]
  );

  const enrichedNodes = useMemo(() => {
    return nodes.map((node: Node<NodeData>) => ({
      ...node,
      data: {
        ...node.data,
        status: (nodeStatuses.get(node.id) || "idle") as ExtendedNodeStatus,
        isFlashing: activeFlashes.has(node.id),
        logs:
          node.data.type === "observer"
            ? subscriberLogs.get(node.id) || []
            : [],
      },
    }));
  }, [nodes, nodeStatuses, activeFlashes, subscriberLogs]);

  // 为活跃节点的连接线添加动画效果
  const animatedEdges = useMemo(() => {
    return connections.map((edge: Edge) => {
      const sourceNodeStatus = nodeStatuses.get(edge.source);
      // 如果源节点是活跃的，则为连接线添加动画
      const isActive = sourceNodeStatus === "active";

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
  }, [connections, nodeStatuses]);

  // 创建一个符合 ReactFlow 要求的 nodeTypes 对象
  const nodeTypes = useMemo<NodeTypes>(
    () => ({
      custom: (props: NodeProps) => (
        <CustomNode
          id={props.id}
          data={props.data as NodeData}
          onUpdateNodeConfig={onUpdateNodeConfig}
        />
      ),
      subscriber: SubscriberNode as any,
    }),
    [onUpdateNodeConfig]
  );

  return (
    <div className="h-full w-full" onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={enrichedNodes}
        edges={animatedEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        defaultViewport={{ x: 0, y: 0, zoom: 0.7 }} // 设置初始缩放比例为0.7
        className="bg-slate-950"
        defaultEdgeOptions={{
          animated: true,
          type: "default",
          style: { strokeWidth: 1.5 },
        }}
      >
        <Background color="#4a5568" gap={16} />
        <MiniMap nodeColor={(n) => n.data.color || "#888"} />
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
