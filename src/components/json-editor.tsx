import React, { useState, useCallback } from "react";
import { Node, Edge } from "reactflow";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import { Eye, Edit3, Save, X, Copy, Check } from "lucide-react";
import { toast } from "../hooks/use-toast";

interface JsonEditorProps {
  nodes: Node[];
  edges: Edge[];
  onUpdateNodeConfig: (nodeId: string, updates: any) => void;
}

interface NodeData {
  id: string;
  type: string;
  label: string;
  config?: any;
  position: { x: number; y: number };
}

const JsonEditor: React.FC<JsonEditorProps> = ({
  nodes,
  edges,
  onUpdateNodeConfig,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<"json" | "form">("json");
  const [jsonText, setJsonText] = useState("");
  const [copied, setCopied] = useState(false);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const editingNode = nodes.find((n) => n.id === editingNodeId);

  const getNodeConnections = (nodeId: string) => {
    const inputs = edges
      .filter((e) => e.target === nodeId)
      .map((e) => e.source);
    const outputs = edges
      .filter((e) => e.source === nodeId)
      .map((e) => e.target);
    return { inputs, outputs };
  };

  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    setEditingNodeId(null);
    setEditMode("json");
  }, []);

  const handleEditNode = useCallback(
    (nodeId: string) => {
      setEditingNodeId(nodeId);
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        // 编辑完整的节点信息，包括position等
        const fullNodeData = {
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data,
        };
        setJsonText(JSON.stringify(fullNodeData, null, 2));
      }
    },
    [nodes]
  );

  const handleSaveNode = useCallback(() => {
    if (!editingNodeId) return;

    try {
      const newData = JSON.parse(jsonText);
      // 更新完整的节点数据
      const updates: any = {};

      if (newData.position) {
        updates.position = newData.position;
      }
      if (newData.type) {
        updates.type = newData.type;
      }
      if (newData.data) {
        updates.data = newData.data;
      }

      onUpdateNodeConfig(editingNodeId, updates);
      setEditingNodeId(null);
      toast({
        title: "保存成功",
        description: "节点配置已更新",
      });
    } catch (error) {
      toast({
        title: "保存失败",
        description: "JSON格式错误，请检查语法",
        variant: "destructive",
      });
    }
  }, [editingNodeId, jsonText, onUpdateNodeConfig]);

  const handleCopyNodeData = useCallback(() => {
    if (!selectedNode) return;

    const nodeData = {
      ...selectedNode.data,
      position: selectedNode.position,
      connections: getNodeConnections(selectedNode.id),
    };

    navigator.clipboard.writeText(JSON.stringify(nodeData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    toast({
      title: "已复制",
      description: "节点数据已复制到剪贴板",
    });
  }, [selectedNode]);

  const handleFormConfigChange = useCallback(
    (key: string, value: any) => {
      if (!editingNodeId) return;

      const node = nodes.find((n) => n.id === editingNodeId);
      if (!node) return;

      const newConfig = {
        ...node.data.config,
        [key]: value,
      };

      onUpdateNodeConfig(editingNodeId, {
        data: { ...node.data, config: newConfig },
      });
    },
    [editingNodeId, nodes, onUpdateNodeConfig]
  );

  const renderFormEditor = () => {
    if (!editingNode) return null;

    const { id, type, config = {} } = editingNode.data;

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>节点类型</Label>
          <Input value={type} disabled />
        </div>

        <div className="space-y-2">
          <Label>节点ID</Label>
          <Input value={id} disabled />
        </div>

        {type === "observable" && (
          <>
            {id === "interval" && (
              <div className="space-y-2">
                <Label>间隔时间 (ms)</Label>
                <Input
                  type="number"
                  value={config.period || 1000}
                  onChange={(e) =>
                    handleFormConfigChange("period", parseInt(e.target.value))
                  }
                />
              </div>
            )}

            {id === "array" && (
              <div className="space-y-2">
                <Label>数组值 (JSON格式)</Label>
                <Textarea
                  value={config.values || '["A", "B", "C"]'}
                  onChange={(e) =>
                    handleFormConfigChange("values", e.target.value)
                  }
                  placeholder='["A", "B", "C"]'
                />
              </div>
            )}

            {id === "fetch" && (
              <div className="space-y-2">
                <Label>请求URL</Label>
                <Input
                  value={
                    config.url || "https://jsonplaceholder.typicode.com/todos/1"
                  }
                  onChange={(e) =>
                    handleFormConfigChange("url", e.target.value)
                  }
                />
              </div>
            )}

            {id === "of" && (
              <div className="space-y-2">
                <Label>值</Label>
                <Input
                  value={config.value || "hello"}
                  onChange={(e) =>
                    handleFormConfigChange("value", e.target.value)
                  }
                />
              </div>
            )}
          </>
        )}

        {type === "operator" && (
          <>
            {id === "map" && (
              <div className="space-y-2">
                <Label>映射函数</Label>
                <Textarea
                  value={config.func || "x => x"}
                  onChange={(e) =>
                    handleFormConfigChange("func", e.target.value)
                  }
                  placeholder="x => x"
                />
              </div>
            )}

            {id === "filter" && (
              <div className="space-y-2">
                <Label>过滤函数</Label>
                <Textarea
                  value={config.func || "x => true"}
                  onChange={(e) =>
                    handleFormConfigChange("func", e.target.value)
                  }
                  placeholder="x => true"
                />
              </div>
            )}

            {["take", "skip"].includes(id) && (
              <div className="space-y-2">
                <Label>数量</Label>
                <Input
                  type="number"
                  value={config.count || (id === "take" ? 5 : 2)}
                  onChange={(e) =>
                    handleFormConfigChange("count", parseInt(e.target.value))
                  }
                />
              </div>
            )}

            {id === "startWith" && (
              <div className="space-y-2">
                <Label>初始值</Label>
                <Input
                  value={config.value || "初始值"}
                  onChange={(e) =>
                    handleFormConfigChange("value", e.target.value)
                  }
                />
              </div>
            )}

            {id === "retry" && (
              <div className="space-y-2">
                <Label>重试次数</Label>
                <Input
                  type="number"
                  value={config.count || 3}
                  onChange={(e) =>
                    handleFormConfigChange("count", parseInt(e.target.value))
                  }
                />
              </div>
            )}

            {id === "timeout" && (
              <div className="space-y-2">
                <Label>超时时间 (ms)</Label>
                <Input
                  type="number"
                  value={config.time || 5000}
                  onChange={(e) =>
                    handleFormConfigChange("time", parseInt(e.target.value))
                  }
                />
              </div>
            )}

            {["tap", "catchError", "finalize"].includes(id) && (
              <div className="space-y-2">
                <Label>函数</Label>
                <Textarea
                  value={config.func || getDefaultFunc(id)}
                  onChange={(e) =>
                    handleFormConfigChange("func", e.target.value)
                  }
                  placeholder={getDefaultFunc(id)}
                />
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const getDefaultFunc = (id: string) => {
    switch (id) {
      case "tap":
        return "x => console.log('tap:', x)";
      case "catchError":
        return "err => of('error handled')";
      case "finalize":
        return "() => console.log('finalized')";
      default:
        return "";
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900">
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-lg font-semibold text-white">节点JSON编辑器</h2>
        <p className="text-sm text-slate-400 mt-1">
          查看和编辑节点的详细配置信息
        </p>
      </div>

      <div className="flex-1 flex">
        {/* 节点列表 */}
        <div className="w-1/3 border-r border-slate-800">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {nodes.map((node) => {
                const connections = getNodeConnections(node.id);
                const isSelected = selectedNodeId === node.id;
                const isEditing = editingNodeId === node.id;

                return (
                  <Card
                    key={node.id}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-blue-600/20 border-blue-500"
                        : "bg-slate-800/50"
                    }`}
                    onClick={() => handleNodeSelect(node.id)}
                  >
                    <CardHeader className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={
                              node.data.type === "observable"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {node.data.type}
                          </Badge>
                          <span className="text-sm font-medium text-white">
                            {node.data.label}
                          </span>
                        </div>
                        {isEditing && (
                          <Edit3 className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="text-xs text-slate-400 space-y-1">
                        <div>ID: {node.id}</div>
                        <div>输入: {connections.inputs.length}</div>
                        <div>输出: {connections.outputs.length}</div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* 编辑区域 */}
        <div className="flex-1 flex flex-col">
          {selectedNode ? (
            <>
              {/* 工具栏 */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditMode("json")}
                    className={editMode === "json" ? "bg-blue-600" : ""}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    JSON视图
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditMode("form")}
                    className={editMode === "form" ? "bg-blue-600" : ""}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    表单编辑
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyNodeData}
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  {!editingNodeId ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditNode(selectedNode.id)}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      编辑
                    </Button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSaveNode}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        保存
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingNodeId(null)}
                      >
                        <X className="w-4 h-4 mr-2" />
                        取消
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* 内容区域 */}
              <div className="flex-1 p-4">
                {editMode === "json" ? (
                  <div className="h-full">
                    {editingNodeId ? (
                      <Textarea
                        value={jsonText}
                        onChange={(e) => setJsonText(e.target.value)}
                        className="h-full font-mono text-sm"
                        placeholder="输入JSON配置..."
                      />
                    ) : (
                      <div className="h-full bg-slate-800 rounded-md p-4">
                        <pre className="text-sm text-slate-300 overflow-auto h-full">
                          {JSON.stringify(
                            {
                              ...selectedNode.data,
                              position: selectedNode.position,
                              connections: getNodeConnections(selectedNode.id),
                            },
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <ScrollArea className="h-full">
                    <div className="space-y-4">{renderFormEditor()}</div>
                  </ScrollArea>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              请选择一个节点进行编辑
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JsonEditor;
