import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  samples,
  Sample,
  saveUserSample,
  deleteUserSample,
} from "../lib/samples";
import { BookOpen, Save, Download, Upload, Trash2, Plus } from "lucide-react";
import { Node, Edge } from "reactflow";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

interface SampleLibraryProps {
  onSampleSelect: (sample: Sample) => void;
  currentNodes: Node[];
  currentEdges: Edge[];
  currentSample: Sample | null;
}

const SampleLibrary: React.FC<SampleLibraryProps> = ({
  onSampleSelect,
  currentNodes,
  currentEdges,
  currentSample,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [sampleName, setSampleName] = useState("");
  const [sampleDescription, setSampleDescription] = useState("");
  const [allSamples, setAllSamples] = useState<Sample[]>([]);
  const [activeTab, setActiveTab] = useState("default");
  const [importData, setImportData] = useState("");
  const [importError, setImportError] = useState("");
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [sampleToDelete, setSampleToDelete] = useState<string | null>(null);
  const [isOverwriteMode, setIsOverwriteMode] = useState(false);

  // 加载所有示例
  useEffect(() => {
    setAllSamples(samples());
  }, [isOpen]);

  // 当打开保存对话框时，检测是否可以覆盖
  const handleOpenSaveDialog = () => {
    if (currentSample && currentSample.id.startsWith("user-")) {
      // 当前打开的是用户保存的示例，可以覆盖
      setSampleName(currentSample.name);
      setSampleDescription(currentSample.description || "");
      setIsOverwriteMode(true);
    } else {
      // 当前打开的是默认示例或没有示例，创建新的
      setSampleName("");
      setSampleDescription("");
      setIsOverwriteMode(false);
    }
    setIsSaveDialogOpen(true);
    setIsOpen(false);
  };

  const handleSelect = (sample: Sample) => {
    onSampleSelect(sample);
    setIsOpen(false);
  };

  const handleSaveSample = () => {
    if (!sampleName.trim()) {
      alert("请输入示例名称");
      return;
    }

    const newSample: Sample = {
      id:
        isOverwriteMode && currentSample
          ? currentSample.id
          : `user-${Date.now()}`,
      name: sampleName,
      description: sampleDescription || "用户保存的示例",
      nodes: currentNodes,
      edges: currentEdges,
    };

    saveUserSample(newSample);
    setIsSaveDialogOpen(false);
    setSampleName("");
    setSampleDescription("");
    setIsOverwriteMode(false);
    setAllSamples(samples());
  };

  const handleDeleteSample = (sampleId: string) => {
    deleteUserSample(sampleId);
    setSampleToDelete(null);
    setAllSamples(samples());
  };

  const handleExport = () => {
    const data = {
      nodes: currentNodes,
      edges: currentEdges,
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(
      dataStr
    )}`;

    const exportFileDefaultName = `rxcraft-export-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = () => {
    try {
      setImportError("");
      const data = JSON.parse(importData);

      if (
        !data.nodes ||
        !data.edges ||
        !Array.isArray(data.nodes) ||
        !Array.isArray(data.edges)
      ) {
        throw new Error("导入的数据格式不正确");
      }

      onSampleSelect({
        id: "imported",
        name: "导入的示例",
        description: "从文件导入的示例",
        nodes: data.nodes,
        edges: data.edges,
      });

      setIsImportDialogOpen(false);
      setImportData("");
      setIsOpen(false);
    } catch (e) {
      setImportError(`导入失败: ${(e as Error).message}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImportData(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  // 过滤默认示例和用户示例
  const defaultSamplesList = allSamples.filter(
    (s) => !s.id.startsWith("user-")
  );
  const userSamplesList = allSamples.filter((s) => s.id.startsWith("user-"));

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="bg-slate-800 border-slate-700 hover:bg-slate-700"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            示例库
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[800px] bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>示例库</DialogTitle>
            <DialogDescription>
              从预设的示例中选择一个来快速开始，或者管理您保存的示例。
            </DialogDescription>
          </DialogHeader>

          <Tabs
            defaultValue="default"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="default">预设示例</TabsTrigger>
              <TabsTrigger value="user">我的示例</TabsTrigger>
            </TabsList>

            <TabsContent
              value="default"
              className="max-h-[60vh] overflow-y-auto"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
                {defaultSamplesList.map((sample) => (
                  <Card
                    key={sample.id}
                    className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors"
                  >
                    <CardHeader>
                      <CardTitle>{sample.name}</CardTitle>
                      <CardDescription className="text-slate-400">
                        {sample.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        className="w-full"
                        onClick={() => handleSelect(sample)}
                      >
                        加载示例
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="user" className="max-h-[60vh] overflow-y-auto">
              {userSamplesList.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p>您还没有保存任何示例</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={handleOpenSaveDialog}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    保存当前画布
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
                  {userSamplesList.map((sample) => (
                    <Card
                      key={sample.id}
                      className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors"
                    >
                      <CardHeader>
                        <CardTitle>{sample.name}</CardTitle>
                        <CardDescription className="text-slate-400">
                          {sample.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          className="w-full mb-2"
                          onClick={() => handleSelect(sample)}
                        >
                          加载示例
                        </Button>
                      </CardContent>
                      <CardFooter className="flex justify-end">
                        <AlertDialog
                          open={sampleToDelete === sample.id}
                          onOpenChange={(open) =>
                            !open && setSampleToDelete(null)
                          }
                        >
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSampleToDelete(sample.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
                            <AlertDialogHeader>
                              <AlertDialogTitle>确认删除</AlertDialogTitle>
                              <AlertDialogDescription>
                                您确定要删除示例 "{sample.name}"
                                吗？此操作无法撤销。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-slate-800 border-slate-700 hover:bg-slate-700">
                                取消
                              </AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => handleDeleteSample(sample.id)}
                              >
                                删除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleOpenSaveDialog}>
                <Save className="w-4 h-4 mr-2" />
                保存当前画布
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                导出
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsImportDialogOpen(true);
                  setIsOpen(false);
                }}
              >
                <Upload className="w-4 h-4 mr-2" />
                导入
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 保存示例对话框 */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>
              {isOverwriteMode ? "覆盖示例" : "保存示例"}
            </DialogTitle>
            <DialogDescription>
              {isOverwriteMode
                ? "将当前画布覆盖到当前打开的示例。"
                : "将当前画布保存为示例，以便日后使用。"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {isOverwriteMode && (
              <div className="p-3 bg-blue-900/20 border border-blue-700 rounded-md">
                <p className="text-blue-300 text-sm">
                  将覆盖当前打开的示例：{currentSample?.name}
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="sample-name">示例名称</Label>
              <Input
                id="sample-name"
                value={sampleName}
                onChange={(e) => setSampleName(e.target.value)}
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <div>
              <Label htmlFor="sample-description">描述（可选）</Label>
              <Textarea
                id="sample-description"
                value={sampleDescription}
                onChange={(e) => setSampleDescription(e.target.value)}
                className="bg-slate-800 border-slate-700"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSaveDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleSaveSample}
              className={
                isOverwriteMode ? "bg-orange-600 hover:bg-orange-700" : ""
              }
            >
              {isOverwriteMode ? "覆盖" : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 导入对话框 */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>导入示例</DialogTitle>
            <DialogDescription>
              从JSON文件导入示例，或者粘贴JSON数据。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload">选择文件</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <div>
              <Label htmlFor="import-data">或粘贴JSON数据</Label>
              <Textarea
                id="import-data"
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                className="bg-slate-800 border-slate-700"
                rows={10}
              />
            </div>
            {importError && (
              <div className="text-red-500 text-sm">{importError}</div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsImportDialogOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleImport}>导入</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SampleLibrary;
