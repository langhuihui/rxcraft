import React, {
  useMemo,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { Node } from "reactflow";

interface MarbleEvent {
  nodeId: string;
  value: any;
  timestamp: number;
}

interface MarbleDiagramProps {
  events: MarbleEvent[];
  nodes: Node[];
  performanceMode?: "high" | "balanced" | "quality";
  debugMode?: boolean;
}

const TIMELINE_DURATION = 10000; // 10 seconds

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

interface CanvasMarble {
  x: number;
  y: number;
  color: string;
  value: any;
  timestamp: number;
  nodeId: string;
}

const MarbleDiagram: React.FC<MarbleDiagramProps> = ({
  events,
  nodes,
  performanceMode = "balanced",
  debugMode = false,
}) => {
  const [now, setNow] = useState(Date.now());
  const [fps, setFps] = useState(0);
  const [marbleCount, setMarbleCount] = useState(0);
  const [renderTime, setRenderTime] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const renderedMarbles = useRef<Set<string>>(new Set());
  const marblesRef = useRef<CanvasMarble[]>([]);
  const resizeObserverRef = useRef<ResizeObserver>();
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(0);
  const lastRenderTimeRef = useRef(0);
  const canvasSizeRef = useRef({ width: 0, height: 0 });
  const isRenderingRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 50);
    return () => clearInterval(timer);
  }, []);

  // FPS 计算 - 重新设计统计逻辑
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();

    const countFrame = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(countFrame);
    };

    const animationId = requestAnimationFrame(countFrame);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // 监听 Canvas 大小变化
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      // 强制重新渲染以适配新尺寸
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      renderCanvas();
    };

    // 使用 ResizeObserver 监听 Canvas 大小变化
    if (window.ResizeObserver) {
      resizeObserverRef.current = new ResizeObserver(handleResize);
      resizeObserverRef.current.observe(canvas);
    } else {
      // 降级方案：监听窗口大小变化
      window.addEventListener("resize", handleResize);
    }

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      } else {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  const visibleEvents = useMemo(() => {
    const visibleStartTime = now - TIMELINE_DURATION;
    return events.filter((event) => event.timestamp >= visibleStartTime);
  }, [events, now]);

  const nodeTimelines = useMemo(() => {
    const timelines = new Map<string, { node: Node; events: MarbleEvent[] }>();
    nodes.forEach((node) => {
      if (node.data.type !== "observer") {
        timelines.set(node.id, { node, events: [] });
      }
    });
    visibleEvents.forEach((event) => {
      if (timelines.has(event.nodeId)) {
        timelines.get(event.nodeId)!.events.push(event);
      }
    });
    return Array.from(timelines.values());
  }, [visibleEvents, nodes]);

  // 更新弹珠数据
  useEffect(() => {
    const visibleStartTime = now - TIMELINE_DURATION;
    const currentKeys = new Set<string>();
    const newMarbles: CanvasMarble[] = [];

    nodeTimelines.forEach(({ node, events: nodeEvents }, nodeIndex) => {
      const nodeY = (nodeIndex / nodeTimelines.length) * 100;
      const nodeHeight = (1 / nodeTimelines.length) * 100;
      const centerY = nodeY + nodeHeight / 2;

      nodeEvents.forEach((event, eventIndex) => {
        const timeOffset = event.timestamp - visibleStartTime;
        const x = (timeOffset / TIMELINE_DURATION) * 100;
        const marbleColor = colorMap[node.data.color] || "#6b7280";

        const eventSignature = `${event.nodeId}-${
          event.timestamp
        }-${JSON.stringify(event.value)}`;
        const key = `${eventSignature}-${eventIndex}`;
        currentKeys.add(key);

        // 检查是否为新弹珠，但只在弹珠首次出现时标记
        const isNewMarble = !renderedMarbles.current.has(key);
        if (isNewMarble) {
          renderedMarbles.current.add(key);
        }

        // 检查是否已经存在相同的弹珠
        const existingMarble = marblesRef.current.find(
          (m) =>
            m.nodeId === event.nodeId &&
            m.timestamp === event.timestamp &&
            JSON.stringify(m.value) === JSON.stringify(event.value)
        );

        // 如果存在相同的弹珠，保持其所有状态
        if (existingMarble) {
          newMarbles.push({
            ...existingMarble,
            x, // 更新位置
            y: centerY, // 更新位置
          });
        } else {
          newMarbles.push({
            x,
            y: centerY,
            color: marbleColor,
            value: event.value,
            timestamp: event.timestamp,
            nodeId: event.nodeId,
          });
        }
      });
    });

    // 清理过期的弹珠记录
    renderedMarbles.current.forEach((key) => {
      if (!currentKeys.has(key)) {
        renderedMarbles.current.delete(key);
      }
    });

    marblesRef.current = newMarbles;
    setMarbleCount(newMarbles.length);
  }, [nodeTimelines, now]);

  // Canvas 渲染函数 - 修复渲染循环
  const renderCanvas = useCallback(() => {
    if (isRenderingRef.current) return; // 防止重复渲染
    isRenderingRef.current = true;

    const startTime = performance.now();

    const canvas = canvasRef.current;
    if (!canvas) {
      isRenderingRef.current = false;
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      isRenderingRef.current = false;
      return;
    }

    const rect = canvas.getBoundingClientRect();

    // 只在尺寸变化时重新设置 Canvas
    const newWidth = rect.width * window.devicePixelRatio;
    const newHeight = rect.height * window.devicePixelRatio;

    if (canvas.width !== newWidth || canvas.height !== newHeight) {
      canvas.width = newWidth;
      canvas.height = newHeight;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      canvasSizeRef.current = { width: rect.width, height: rect.height };
    }

    // 清空画布
    ctx.clearRect(0, 0, rect.width, rect.height);

    // 绘制背景
    ctx.fillStyle = "#0f172a"; // slate-900
    ctx.fillRect(0, 0, rect.width, rect.height);

    // 设置视口裁剪以提高性能
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, rect.width, rect.height);
    ctx.clip();

    // 渲染开始

    // 绘制时间线
    nodeTimelines.forEach(({ node }, nodeIndex) => {
      const nodeY = (nodeIndex / nodeTimelines.length) * rect.height;
      const nodeHeight = (1 / nodeTimelines.length) * rect.height;
      const centerY = nodeY + nodeHeight / 2;

      // 绘制节点名称
      ctx.fillStyle = "#94a3b8"; // slate-400
      ctx.font = "12px system-ui";
      ctx.textAlign = "right";
      ctx.fillText(node.data.name, 160, centerY + 4);

      // 绘制时间线
      ctx.strokeStyle = "#334155"; // slate-700
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(160, centerY);
      ctx.lineTo(rect.width - 16, centerY);
      ctx.stroke();
    });

    // 批量绘制弹珠以提高性能
    const margin =
      performanceMode === "high"
        ? 50
        : performanceMode === "balanced"
        ? 20
        : 10;
    const timelineWidth = rect.width - 176;

    // 预计算可见弹珠
    const visibleMarbles = marblesRef.current.filter((marble) => {
      const x = (marble.x / 100) * timelineWidth + 160;
      return x >= -margin && x <= rect.width + margin;
    });

    // 批量绘制弹珠，减少状态切换
    visibleMarbles.forEach((marble) => {
      const x = (marble.x / 100) * timelineWidth + 160;
      const y = (marble.y / 100) * rect.height;

      // 绘制弹珠阴影
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.beginPath();
      ctx.arc(x + 1, y + 1, 8, 0, 2 * Math.PI);
      ctx.fill();

      // 绘制弹珠边框
      ctx.strokeStyle = marble.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.stroke();

      // 绘制弹珠填充
      ctx.fillStyle = marble.color;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();

      // 绘制弹珠高光
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.beginPath();
      ctx.arc(x - 2, y - 2, 2, 0, 2 * Math.PI);
      ctx.fill();
    });

    ctx.restore();

    // 记录渲染时间
    const endTime = performance.now();
    const renderDuration = endTime - startTime;
    setRenderTime(renderDuration);
    lastRenderTimeRef.current = endTime;

    // 使用标准的 requestAnimationFrame 循环
    isRenderingRef.current = false;
    animationRef.current = requestAnimationFrame(renderCanvas);
  }, [nodeTimelines, now, performanceMode]);

  // 启动渲染循环
  useEffect(() => {
    const startRender = () => {
      renderCanvas();
    };

    startRender();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      isRenderingRef.current = false;

      // 清理 Canvas 上下文
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    };
  }, [renderCanvas]);

  // 处理 Canvas 点击事件
  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // 检查是否点击了弹珠
      marblesRef.current.forEach((marble) => {
        const marbleX = (marble.x / 100) * (rect.width - 176) + 160;
        const marbleY = (marble.y / 100) * rect.height;
        const distance = Math.sqrt((x - marbleX) ** 2 + (y - marbleY) ** 2);

        if (distance <= 8) {
          const valueStr =
            typeof marble.value === "object"
              ? JSON.stringify(marble.value, null, 2)
              : String(marble.value);
          console.log(`弹珠值: ${valueStr}`);
          // 这里可以添加弹珠点击的交互逻辑
        }
      });
    },
    []
  );

  if (nodeTimelines.length === 0) {
    return (
      <div className="h-full w-full bg-slate-900 flex items-center justify-center text-slate-500">
        <p>弹珠图 (点击播放开始...)</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-slate-900 p-4 overflow-hidden text-white relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-pointer"
        onClick={handleCanvasClick}
        style={{ display: "block" }}
      />

      {/* 性能监控面板 */}
      <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 text-xs">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-slate-400">FPS: </span>
            <span
              className={`font-mono ${
                fps >= 50
                  ? "text-green-400"
                  : fps >= 30
                  ? "text-yellow-400"
                  : "text-red-400"
              }`}
            >
              {Math.min(fps, 120)}
            </span>
          </div>
          <div>
            <span className="text-slate-400">弹珠: </span>
            <span className="font-mono text-white">{marbleCount}</span>
          </div>
          <div>
            <span className="text-slate-400">模式: </span>
            <span className="font-mono text-white">{performanceMode}</span>
          </div>
          <div>
            <span className="text-slate-400">渲染: </span>
            <span className="font-mono text-white">
              {renderTime.toFixed(1)}ms
            </span>
          </div>
          {debugMode && (
            <div className="mt-2 pt-2 border-t border-slate-600">
              <div className="text-xs text-slate-300">调试信息:</div>
              <div className="text-xs text-slate-400">
                总弹珠: {marblesRef.current.length}
              </div>
              <div className="text-xs text-slate-400">
                可见区域:{" "}
                {
                  marblesRef.current.filter((m) => m.x >= -10 && m.x <= 110)
                    .length
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarbleDiagram;
