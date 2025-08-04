import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  MousePointer,
  Move,
  Keyboard,
  Download,
  CircleSlash,
  Infinity,
  Filter,
  Map,
  Merge,
  Split,
  Timer,
  List,
  Monitor,
  Clock,
  SkipForward,
  Repeat,
  AlarmClock,
  SwitchCamera,
  Flag,
  Zap,
  Layers,
  Combine,
  Hourglass,
  Shuffle,
  Flame,
  Snowflake,
} from "lucide-react";
import { isHotObservable } from "../lib/rx-logic";

interface NodeType {
  id: string;
  name: string;
  type: "observable" | "operator" | "observer";
  icon: React.ReactNode;
  description: string;
  color: string;
  multipleInputs?: boolean; // 是否有多个输入连接点
}

const observableNodes: NodeType[] = [
  {
    id: "mouse",
    name: "鼠标事件",
    type: "observable",
    icon: <MousePointer className="w-4 h-4" />,
    description: "监听鼠标事件，可选择具体事件类型",
    color: "bg-blue-500",
  },
  {
    id: "keydown",
    name: "键盘按键",
    type: "observable",
    icon: <Keyboard className="w-4 h-4" />,
    description: "监听键盘按键，发出键名",
    color: "bg-blue-500",
  },
  {
    id: "interval",
    name: "间隔",
    type: "observable",
    icon: <Timer className="w-4 h-4" />,
    description: "定期发出递增数字",
    color: "bg-blue-500",
  },
  {
    id: "array",
    name: "数组",
    type: "observable",
    icon: <List className="w-4 h-4" />,
    description: "从数组创建Observable",
    color: "bg-blue-500",
  },
  {
    id: "fetch",
    name: "下载内容",
    type: "observable",
    icon: <Download className="w-4 h-4" />,
    description: "通过fetch下载网络内容",
    color: "bg-blue-500",
  },
  {
    id: "empty",
    name: "空",
    type: "observable",
    icon: <CircleSlash className="w-4 h-4" />,
    description: "立即完成，不发任何值",
    color: "bg-gray-500",
  },
  {
    id: "never",
    name: "永不",
    type: "observable",
    icon: <Infinity className="w-4 h-4" />,
    description: "从不发出值，也从不完成",
    color: "bg-gray-500",
  },
  {
    id: "merge",
    name: "Merge",
    type: "observable",
    icon: <Merge className="w-4 h-4" />,
    description: "合并多个Observable的输出",
    color: "bg-blue-500",
    multipleInputs: true,
  },
  {
    id: "race",
    name: "Race",
    type: "observable",
    icon: <Zap className="w-4 h-4" />,
    description: "使用首先发出值的Observable",
    color: "bg-blue-500",
    multipleInputs: true,
  },
  {
    id: "probabilistic",
    name: "概率失败",
    type: "observable",
    icon: <Shuffle className="w-4 h-4" />,
    description: "模拟一定概率失败的异步操作",
    color: "bg-blue-500",
  },
];

const operatorNodes: NodeType[] = [
  {
    id: "map",
    name: "Map",
    type: "operator",
    icon: <Map className="w-4 h-4" />,
    description: "转换每个发出的值",
    color: "bg-purple-500",
  },
  {
    id: "filter",
    name: "Filter",
    type: "operator",
    icon: <Filter className="w-4 h-4" />,
    description: "过滤满足条件的值",
    color: "bg-purple-500",
  },
  {
    id: "take",
    name: "Take",
    type: "operator",
    icon: <Split className="w-4 h-4" />,
    description: "只取前N个值",
    color: "bg-purple-500",
  },
  {
    id: "startWith",
    name: "StartWith",
    type: "operator",
    icon: <Flag className="w-4 h-4" />,
    description: "在源Observable前添加初始值",
    color: "bg-purple-500",
  },
  {
    id: "takeUntil",
    name: "TakeUntil",
    type: "operator",
    icon: <Clock className="w-4 h-4" />,
    description: "发出值直到第二个Observable发出值",
    color: "bg-purple-500",
    multipleInputs: true,
  },
  {
    id: "skipUntil",
    name: "SkipUntil",
    type: "operator",
    icon: <SkipForward className="w-4 h-4" />,
    description: "忽略值直到第二个Observable发出值",
    color: "bg-purple-500",
    multipleInputs: true,
  },
  {
    id: "skip",
    name: "Skip",
    type: "operator",
    icon: <SkipForward className="w-4 h-4" />,
    description: "跳过前N个值",
    color: "bg-purple-500",
  },
  {
    id: "zip",
    name: "Zip",
    type: "operator",
    icon: <Combine className="w-4 h-4" />,
    description: "将多个Observable的值组合成数组",
    color: "bg-purple-500",
    multipleInputs: true,
  },
  {
    id: "buffer",
    name: "Buffer",
    type: "operator",
    icon: <Layers className="w-4 h-4" />,
    description: "缓存值直到第二个Observable发出值",
    color: "bg-purple-500",
    multipleInputs: true,
  },
  {
    id: "switchMapTo",
    name: "SwitchMapTo",
    type: "operator",
    icon: <SwitchCamera className="w-4 h-4" />,
    description: "切换到另一个Observable",
    color: "bg-purple-500",
    multipleInputs: true,
  },
  {
    id: "retry",
    name: "Retry",
    type: "operator",
    icon: <Repeat className="w-4 h-4" />,
    description: "出错时重试指定次数",
    color: "bg-purple-500",
  },
  {
    id: "timeout",
    name: "Timeout",
    type: "operator",
    icon: <AlarmClock className="w-4 h-4" />,
    description: "如果在指定时间内没有发出值则报错",
    color: "bg-purple-500",
  },
];

const observerNodes: NodeType[] = [
  {
    id: "subscriber",
    name: "订阅者",
    type: "observer",
    icon: <Monitor className="w-4 h-4" />,
    description: "订阅数据流并显示结果",
    color: "bg-teal-500",
  },
];

interface NodePanelProps {
  isPlaying?: boolean;
}

const NodePanel = ({ isPlaying = false }: NodePanelProps) => {
  const [activeTab, setActiveTab] = useState<
    "observable" | "operator" | "observer"
  >("observable");

  const handleDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    // 播放状态下禁用拖拽
    if (isPlaying) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData("application/json", JSON.stringify(nodeType));
  };

  const renderNodeList = (nodes: NodeType[]) => (
    <div className="space-y-2">
      {nodes.map((node) => {
        const isHot =
          node.type === "observable" ? isHotObservable(node.id) : false;

        return (
          <Card
            key={node.id}
            className={`${
              isPlaying
                ? "cursor-not-allowed bg-slate-700 border-slate-600 opacity-50"
                : "cursor-grab active:cursor-grabbing bg-slate-800 border-slate-700 hover:bg-slate-750"
            } transition-colors`}
            draggable={!isPlaying}
            onDragStart={(e) => handleDragStart(e, node)}
          >
            <CardContent className="p-3">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${node.color}`}>
                  {node.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-white">{node.name}</h4>
                      {node.type === "observable" && (
                        <div className="flex items-center space-x-1">
                          {isHot ? (
                            <div className="flex items-center space-x-1">
                              <Flame className="w-3 h-3 text-orange-500" />
                              <span className="text-xs text-orange-400">
                                热
                              </span>
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
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        node.type === "observable"
                          ? "bg-blue-900 text-blue-200"
                          : node.type === "operator"
                          ? "bg-purple-900 text-purple-200"
                          : "bg-teal-900 text-teal-200"
                      }`}
                    >
                      {node.multipleInputs
                        ? "多输入"
                        : node.type.charAt(0).toUpperCase() +
                          node.type.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    {node.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">节点库</h2>
          {isPlaying && (
            <div className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">
              🔒 已锁定
            </div>
          )}
        </div>
        <div className="flex space-x-1 bg-slate-800 rounded-lg p-1">
          <Button
            variant={activeTab === "observable" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("observable")}
            className={`flex-1 ${
              activeTab === "observable"
                ? "bg-blue-600 hover:bg-blue-700"
                : "hover:bg-slate-700"
            }`}
          >
            Observable
          </Button>
          <Button
            variant={activeTab === "operator" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("operator")}
            className={`flex-1 ${
              activeTab === "operator"
                ? "bg-purple-600 hover:bg-purple-700"
                : "hover:bg-slate-700"
            }`}
          >
            Operator
          </Button>
          <Button
            variant={activeTab === "observer" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("observer")}
            className={`flex-1 ${
              activeTab === "observer"
                ? "bg-teal-600 hover:bg-teal-700"
                : "hover:bg-slate-700"
            }`}
          >
            Observer
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === "observable" && (
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-3">数据源</h3>
            {renderNodeList(observableNodes)}
          </div>
        )}

        {activeTab === "operator" && (
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-3">操作符</h3>
            {renderNodeList(operatorNodes)}
          </div>
        )}

        {activeTab === "observer" && (
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-3">订阅者</h3>
            {renderNodeList(observerNodes)}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-800">
        <div className="text-xs text-slate-400">
          <p>💡 提示：拖拽节点到工作区开始构建数据流</p>
        </div>
      </div>
    </div>
  );
};

export default NodePanel;
