import React from "react";
import { Node, Edge } from "reactflow";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeViewProps {
  nodes: Node[];
  edges: Edge[];
}

const generateCode = (nodes: Node[], edges: Edge[]) => {
  if (nodes.length === 0) return "// 请添加节点以生成代码...";

  let code = `import { fromEvent, of, from, interval, EMPTY, NEVER, merge, race, zip, combineLatest } from 'rxjs';\n`;
  code += `import { map, filter, take, skip, startWith, takeUntil, skipUntil, buffer, switchMapTo, retry, timeout } from 'rxjs/operators';\n\n`;

  const observables = nodes.filter((n) => n.data.type === "observable");
  const operators = nodes.filter((n) => n.data.type === "operator");
  const observers = nodes.filter((n) => n.data.type === "observer");

  if (observables.length === 0) {
    return "// 请至少添加一个 Observable 节点...";
  }

  // 生成所有Observable节点的代码
  observables.forEach((node) => {
    const varName = node.id.split("-")[0];
    switch (node.data.id) {
      case "click":
        code += `// 点击事件\nconst ${varName}$ = fromEvent(document, 'click').pipe(map(e => ({ x: e.clientX, y: e.clientY })));\n`;
        break;
      case "mousemove":
        code += `// 鼠标移动事件\nconst ${varName}$ = fromEvent(document, 'mousemove').pipe(map(e => ({ x: e.clientX, y: e.clientY })));\n`;
        break;
      case "keydown":
        code += `// 键盘按下事件\nconst ${varName}$ = fromEvent(document, 'keydown').pipe(map(e => e.key));\n`;
        break;
      case "interval":
        code += `// 定时器\nconst ${varName}$ = interval(${
          node.data.config?.period || 1000
        });\n`;
        break;
      case "array":
        code += `// 数组\nconst ${varName}$ = from(${
          node.data.config?.values || '["A", "B", "C"]'
        });\n`;
        break;
      case "fetch":
        code += `// HTTP请求\nconst ${varName}$ = from(fetch('${
          node.data.config?.url ||
          "https://jsonplaceholder.typicode.com/todos/1"
        }').then(res => res.json()));\n`;
        break;
      case "empty":
        code += `// 空Observable\nconst ${varName}$ = EMPTY;\n`;
        break;
      case "never":
        code += `// 永不完成的Observable\nconst ${varName}$ = NEVER;\n`;
        break;
      case "merge":
        code += `// 合并Observable\n// merge的实际输入将在后面定义\nlet ${varName}$;\n`;
        break;
      case "race":
        code += `// 竞争Observable\n// race的实际输入将在后面定义\nlet ${varName}$;\n`;
        break;
    }
  });

  code += "\n// 操作符链和数据流组合\n";

  // 构建节点连接关系图
  const nodeConnections = new Map<string, string[]>();
  edges.forEach((edge) => {
    if (!nodeConnections.has(edge.target)) {
      nodeConnections.set(edge.target, []);
    }
    nodeConnections.get(edge.target)!.push(edge.source);
  });

  // 生成操作符链代码
  const processedNodes = new Set<string>();
  const operatorChains = new Map<string, string>();

  // 递归生成操作符链
  const generateOperatorChain = (nodeId: string): string => {
    if (processedNodes.has(nodeId)) {
      return nodeId.split("-")[0] + "$";
    }

    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return "";

    processedNodes.add(nodeId);
    const varName = nodeId.split("-")[0];

    // 如果是Observable节点，直接返回变量名
    if (
      node.data.type === "observable" &&
      node.data.id !== "merge" &&
      node.data.id !== "race"
    ) {
      return varName + "$";
    }

    // 获取输入节点
    const inputs = nodeConnections.get(nodeId) || [];
    if (inputs.length === 0) return "";

    // 处理特殊的merge和race Observable节点
    if (
      node.data.type === "observable" &&
      (node.data.id === "merge" || node.data.id === "race")
    ) {
      const inputStreams = inputs.map((input) => generateOperatorChain(input));
      const mergeCode = `${varName}$ = ${node.data.id}(${inputStreams.join(
        ", "
      )})`;
      operatorChains.set(nodeId, mergeCode);
      return varName + "$";
    }

    // 处理操作符节点
    if (node.data.type === "operator") {
      let operatorCode = "";

      // 处理需要两个输入的操作符
      if (node.data.multipleInputs && inputs.length >= 2) {
        const primaryInput = inputs[0];
        const secondaryInput = inputs[1];
        const primaryStream = generateOperatorChain(primaryInput);
        const secondaryStream = generateOperatorChain(secondaryInput);

        switch (node.data.id) {
          case "takeUntil":
            operatorCode = `${primaryStream}.pipe(takeUntil(${secondaryStream}))`;
            break;
          case "skipUntil":
            operatorCode = `${primaryStream}.pipe(skipUntil(${secondaryStream}))`;
            break;
          case "zip":
            operatorCode = `zip(${primaryStream}, ${secondaryStream})`;
            break;
          case "buffer":
            operatorCode = `${primaryStream}.pipe(buffer(${secondaryStream}))`;
            break;
          case "switchMapTo":
            operatorCode = `${primaryStream}.pipe(switchMapTo(${secondaryStream}))`;
            break;
          default:
            operatorCode = `${primaryStream}`;
        }
      } else {
        // 处理单输入操作符
        const input = inputs[0];
        const inputStream = generateOperatorChain(input);

        switch (node.data.id) {
          case "map":
            operatorCode = `${inputStream}.pipe(map(${
              node.data.config?.func || "x => x"
            }))`;
            break;
          case "filter":
            operatorCode = `${inputStream}.pipe(filter(${
              node.data.config?.func || "x => true"
            }))`;
            break;
          case "take":
            operatorCode = `${inputStream}.pipe(take(${
              node.data.config?.count || 5
            }))`;
            break;
          case "skip":
            operatorCode = `${inputStream}.pipe(skip(${
              node.data.config?.count || 2
            }))`;
            break;
          case "startWith":
            operatorCode = `${inputStream}.pipe(startWith("${
              node.data.config?.value || "初始值"
            }"))`;
            break;
          case "retry":
            operatorCode = `${inputStream}.pipe(retry(${
              node.data.config?.count || 3
            }))`;
            break;
          case "timeout":
            operatorCode = `${inputStream}.pipe(timeout(${
              node.data.config?.time || 5000
            }))`;
            break;
          default:
            operatorCode = inputStream;
        }
      }

      const resultCode = `const ${varName}$ = ${operatorCode}`;
      operatorChains.set(nodeId, resultCode);
      return varName + "$";
    }

    return "";
  };

  // 从订阅者节点开始生成操作符链
  observers.forEach((observer) => {
    const inputs = nodeConnections.get(observer.id) || [];
    if (inputs.length > 0) {
      const input = inputs[0];
      const inputStream = generateOperatorChain(input);
      const observerName = observer.id.split("-")[0];
      operatorChains.set(
        observer.id,
        `// 订阅者\n${observerName}$ = ${inputStream}`
      );
    }
  });

  // 添加所有操作符链到代码中
  Array.from(operatorChains.values()).forEach((chain) => {
    code += chain + ";\n";
  });

  // 添加订阅代码
  code += "\n// 订阅\n";
  observers.forEach((observer) => {
    const observerName = observer.id.split("-")[0];
    code += `${observerName}$.subscribe({\n`;
    code += `  next: value => console.log('${observerName} 收到:', value),\n`;
    code += `  error: err => console.error('${observerName} 错误:', err),\n`;
    code += `  complete: () => console.log('${observerName} 完成')\n`;
    code += `});\n`;
  });

  return code;
};

const CodeView: React.FC<CodeViewProps> = ({ nodes, edges }) => {
  const codeString = generateCode(nodes, edges);

  return (
    <div className="h-full w-full bg-slate-900 text-sm">
      <SyntaxHighlighter
        language="javascript"
        style={vscDarkPlus}
        customStyle={{
          height: "100%",
          width: "100%",
          backgroundColor: "#1E1E1E",
        }}
        showLineNumbers
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodeView;
