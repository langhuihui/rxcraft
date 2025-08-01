import React, { useMemo, useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Node } from "reactflow";

interface MarbleEvent {
  nodeId: string;
  value: any;
  timestamp: number;
}

interface MarbleDiagramProps {
  events: MarbleEvent[];
  nodes: Node[];
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

const MarbleDiagram: React.FC<MarbleDiagramProps> = ({ events, nodes }) => {
  const [now, setNow] = useState(Date.now());
  const renderedMarbles = useRef<Set<string>>(new Set());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 50);
    return () => clearInterval(timer);
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

  // 清理过期的弹珠记录
  useEffect(() => {
    const visibleStartTime = now - TIMELINE_DURATION;
    const currentKeys = new Set<string>();

    nodeTimelines.forEach(({ node, events: nodeEvents }) => {
      nodeEvents.forEach((event, eventIndex) => {
        const eventSignature = `${event.nodeId}-${
          event.timestamp
        }-${JSON.stringify(event.value)}`;
        const key = `${eventSignature}-${eventIndex}`;
        currentKeys.add(key);
      });
    });

    // 移除不再可见的弹珠记录
    renderedMarbles.current.forEach((key) => {
      if (!currentKeys.has(key)) {
        renderedMarbles.current.delete(key);
      }
    });
  }, [nodeTimelines, now]);

  if (nodeTimelines.length === 0) {
    return (
      <div className="h-full w-full bg-slate-900 flex items-center justify-center text-slate-500">
        <p>弹珠图 (点击播放开始...)</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-slate-900 p-4 overflow-hidden text-white">
      <div className="relative h-full w-full">
        {nodeTimelines.map(({ node, events: nodeEvents }, index) => {
          const top = `${(index / nodeTimelines.length) * 100}%`;
          const height = `${(1 / nodeTimelines.length) * 100}%`;

          return (
            <div
              key={node.id}
              className="absolute w-full"
              style={{ top, height }}
            >
              <div className="flex items-center h-full">
                <div
                  className="w-40 pr-4 text-right text-xs text-slate-400 truncate"
                  title={node.data.name}
                >
                  {node.data.name}
                </div>
                <div className="flex-1 h-0.5 bg-slate-700 relative">
                  {nodeEvents.map((event, eventIndex) => {
                    const timeOffset =
                      event.timestamp - (now - TIMELINE_DURATION);
                    const left = `${(timeOffset / TIMELINE_DURATION) * 100}%`;
                    const marbleColor = colorMap[node.data.color] || "#6b7280";

                    // 为每个事件创建唯一标识符
                    const eventSignature = `${event.nodeId}-${
                      event.timestamp
                    }-${JSON.stringify(event.value)}`;
                    const key = `${eventSignature}-${eventIndex}`;

                    // 检查这个弹珠是否已经渲染过
                    const isNewMarble = !renderedMarbles.current.has(key);
                    if (isNewMarble) {
                      renderedMarbles.current.add(key);
                    }

                    return (
                      <motion.div
                        key={key}
                        className="absolute -top-2 w-4 h-4 rounded-full border-2 flex items-center justify-center"
                        style={{
                          borderColor: marbleColor,
                          backgroundColor: marbleColor,
                          left,
                        }}
                        initial={
                          isNewMarble
                            ? { scale: 0, y: -10 }
                            : { scale: 1, y: 0 }
                        }
                        animate={{ scale: 1, y: 0 }}
                        transition={{
                          duration: isNewMarble ? 0.2 : 0,
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        }}
                        title={
                          typeof event.value === "object"
                            ? JSON.stringify(event.value, null, 2)
                            : String(event.value)
                        }
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MarbleDiagram;
