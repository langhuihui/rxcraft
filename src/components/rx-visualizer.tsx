import React, { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Play, Pause, Trash2, Code, LayoutGrid } from "lucide-react";
import NodePanel from "./node-panel";
import WorkAreaWrapper from "./work-area";
import { useNodesState, useEdgesState, Node } from "reactflow";
import { NodeData } from "./work-area";
import SampleLibrary from "./sample-library";
import { Sample } from "../lib/samples";
import { ModeToggle } from "./mode-toggle";
import { buildRxStream, NodeStatus, RxEvent } from "../lib/rx-logic";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./ui/resizable";
import MarbleDiagram from "./marble-diagram";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import CodeView from "./code-view";
import { Subject } from "rxjs";

const RxVisualizer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isNodePanelOpen, setIsNodePanelOpen] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // 修改为支持多个订阅状态
  const [nodeSubscriptions, setNodeSubscriptions] = useState<
    Map<string, Map<string, NodeStatus>>
  >(new Map());
  const [activeFlashes, setActiveFlashes] = useState<Set<string>>(new Set());
  const [subscriberLogs, setSubscriberLogs] = useState<Map<string, any[]>>(
    new Map()
  );
  const [dataFlow, setDataFlow] = useState<any[]>([]);

  useEffect(() => {
    if (!isPlaying) {
      setNodeSubscriptions(new Map());
      setActiveFlashes(new Set());
      return;
    }

    setSubscriberLogs(new Map());
    setDataFlow([]);
    // 初始化每个节点的订阅状态映射
    const initialSubscriptions = new Map<string, Map<string, NodeStatus>>();
    nodes.forEach((node) => {
      initialSubscriptions.set(node.id, new Map());
    });
    setNodeSubscriptions(initialSubscriptions);

    const eventObserver = new Subject<RxEvent>();
    const { unsubscribe } = buildRxStream(nodes, edges, eventObserver);
    const flashTimeouts = new Map<string, NodeJS.Timeout>();

    const flashNode = (nodeId: string) => {
      if (flashTimeouts.has(nodeId)) {
        clearTimeout(flashTimeouts.get(nodeId)!);
      }
      setActiveFlashes((prev) => new Set(prev).add(nodeId));
      const timeout = setTimeout(() => {
        setActiveFlashes((prev) => {
          const newSet = new Set(prev);
          newSet.delete(nodeId);
          return newSet;
        });
        flashTimeouts.delete(nodeId);
      }, 300);
      flashTimeouts.set(nodeId, timeout);
    };

    const subscription = eventObserver.subscribe((event: RxEvent) => {
      console.log("RxEvent:", event); // 调试信息
      console.log("Event type:", event.type); // 调试事件类型
      switch (event.type) {
        case "subscribe":
          if (event.subscriptionId) {
            console.log("Subscribe event:", event.nodeId, event.subscriptionId); // 调试信息
            setNodeSubscriptions((prev) => {
              const newMap = new Map(prev);
              const nodeSubs = new Map(newMap.get(event.nodeId) || []);
              nodeSubs.set(event.subscriptionId!, "active");
              newMap.set(event.nodeId, nodeSubs);
              console.log(
                "Updated subscriptions for node:",
                event.nodeId,
                Array.from(nodeSubs.entries())
              ); // 调试信息
              return newMap;
            });
          }
          break;
        case "next":
          flashNode(event.nodeId);
          const now = Date.now();
          setDataFlow((prev) => [
            ...prev.filter((e) => now - e.timestamp < 10000),
            { ...event, timestamp: now },
          ]);

          // 根据订阅ID确定向哪个下游节点发送数据
          const downstreamEdges = edges.filter(
            (edge) => edge.source === event.nodeId
          );

          // 解析订阅ID，确定是第几个订阅
          const subscriptionNumber = parseInt(
            event.subscriptionId?.split("_")[1] || "0"
          );

          // 计算订阅索引（基于订阅者索引）
          const subscriptionIndex = subscriptionNumber % downstreamEdges.length;

          // 只向对应的下游节点发送数据
          if (subscriptionIndex < downstreamEdges.length) {
            const targetEdge = downstreamEdges[subscriptionIndex];
            const targetNode = nodes.find((n) => n.id === targetEdge.target);
            if (targetNode?.data.type === "observer") {
              flashNode(targetNode.id);
              setSubscriberLogs((prev) => {
                const newLogs = new Map(prev);
                const currentLogs = newLogs.get(targetNode.id) || [];
                newLogs.set(targetNode.id, [
                  ...currentLogs.slice(-20),
                  event.value,
                ]);
                return newLogs;
              });
            }
          }
          break;
        case "complete":
          if (event.subscriptionId) {
            setNodeSubscriptions((prev) => {
              const newMap = new Map(prev);
              const nodeSubs = new Map(newMap.get(event.nodeId) || []);
              nodeSubs.set(event.subscriptionId!, "completed");
              newMap.set(event.nodeId, nodeSubs);
              return newMap;
            });
          }
          break;
        case "error":
          if (event.subscriptionId) {
            setNodeSubscriptions((prev) => {
              const newMap = new Map(prev);
              const nodeSubs = new Map(newMap.get(event.nodeId) || []);
              nodeSubs.set(event.subscriptionId!, "errored");
              newMap.set(event.nodeId, nodeSubs);
              return newMap;
            });
          }
          break;
        case "unsubscribe":
          if (event.subscriptionId) {
            setNodeSubscriptions((prev) => {
              const newMap = new Map(prev);
              const nodeSubs = new Map(newMap.get(event.nodeId) || []);
              const currentStatus = nodeSubs.get(event.subscriptionId!);
              // Only mark as cancelled if it was active and not already completed/errored
              if (currentStatus === "active") {
                nodeSubs.set(event.subscriptionId!, "cancelled");
                newMap.set(event.nodeId, nodeSubs);
              }
              return newMap;
            });
          }
          break;
      }
    });

    return () => {
      subscription.unsubscribe();
      unsubscribe();
      flashTimeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, [isPlaying, nodes, edges]);

  const updateNodeConfig = useCallback(
    (nodeId: string, config: any) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            const newConfig = { ...node.data.config, ...config };
            return { ...node, data: { ...node.data, config: newConfig } };
          }
          return node;
        })
      );

      // 如果正在播放状态，重新启动以应用新配置
      if (isPlaying) {
        setIsPlaying(false);
        setTimeout(() => setIsPlaying(true), 50);
      }
    },
    [setNodes, isPlaying]
  );

  const handlePlay = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setNodes([]);
    setEdges([]);
    setSubscriberLogs(new Map());
    setDataFlow([]);
    setNodeSubscriptions(new Map()); // Reset subscriptions on reset
  }, [setNodes, setEdges]);

  const handleSampleSelect = (sample: Sample) => {
    setNodes(sample.nodes);
    setEdges(sample.edges);
  };

  return (
    <div className="h-screen bg-slate-950 text-white overflow-hidden">
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            RxVisualizer
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <SampleLibrary
            onSampleSelect={handleSampleSelect}
            currentNodes={nodes}
            currentEdges={edges}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handlePlay}
            className="bg-slate-800 border-slate-700 hover:bg-slate-700"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isPlaying ? "暂停" : "播放"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="bg-slate-800 border-slate-700 hover:bg-slate-700"
          >
            <Trash2 className="w-4 h-4" />
            清空
          </Button>
          <ModeToggle />
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)] relative">
        <div className="hidden md:block w-80 bg-slate-900 border-r border-slate-800">
          <NodePanel />
        </div>

        {isNodePanelOpen && (
          <div className="md:hidden absolute top-0 left-0 h-full w-80 bg-slate-900 border-r border-slate-800 z-20 shadow-lg">
            <NodePanel />
          </div>
        )}

        <ResizablePanelGroup direction="vertical" className="flex-1">
          <ResizablePanel defaultSize={75}>
            <Tabs defaultValue="canvas" className="h-full w-full flex flex-col">
              <TabsList className="mx-4 mt-2 bg-slate-800">
                <TabsTrigger value="canvas">
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  主画布
                </TabsTrigger>
                <TabsTrigger value="code">
                  <Code className="w-4 h-4 mr-2" />
                  代码视图
                </TabsTrigger>
              </TabsList>
              <TabsContent value="canvas" className="flex-1">
                <WorkAreaWrapper
                  nodes={nodes}
                  connections={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  setNodes={setNodes}
                  setEdges={setEdges}
                  nodeSubscriptions={nodeSubscriptions}
                  activeFlashes={activeFlashes}
                  subscriberLogs={subscriberLogs}
                  onUpdateNodeConfig={updateNodeConfig}
                />
              </TabsContent>
              <TabsContent value="code" className="flex-1">
                <CodeView nodes={nodes} edges={edges} />
              </TabsContent>
            </Tabs>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={25}>
            <MarbleDiagram events={dataFlow} nodes={nodes} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default RxVisualizer;
