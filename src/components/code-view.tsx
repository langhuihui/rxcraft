import React from "react";
import { Node, Edge } from "reactflow";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeViewProps {
  nodes: Node[];
  edges: Edge[];
}

interface NodeConnection {
  nodeId: string;
  inputs: string[];
  outputs: string[];
}

const generateCode = (nodes: Node[], edges: Edge[]) => {
  if (nodes.length === 0) return "// 请添加节点以生成代码...";

  let code = `import { fromEvent, of, from, interval, EMPTY, NEVER, merge, race, zip, combineLatest } from 'rxjs';\n`;
  code += `import { map, filter, take, skip, startWith, takeUntil, skipUntil, buffer, switchMapTo, retry, timeout, tap, catchError, finalize } from 'rxjs/operators';\n\n`;

  const observables = nodes.filter((n) => n.data.type === "observable");
  const operators = nodes.filter((n) => n.data.type === "operator");
  const observers = nodes.filter((n) => n.data.type === "observer");

  if (observables.length === 0) {
    return "// 请至少添加一个 Observable 节点...";
  }

  // 构建节点连接关系图
  const nodeConnections = new Map<string, NodeConnection>();

  // 初始化所有节点的连接信息
  nodes.forEach((node) => {
    nodeConnections.set(node.id, {
      nodeId: node.id,
      inputs: [],
      outputs: [],
    });
  });

  // 填充连接信息
  edges.forEach((edge) => {
    const sourceConn = nodeConnections.get(edge.source);
    const targetConn = nodeConnections.get(edge.target);

    if (sourceConn) {
      sourceConn.outputs.push(edge.target);
    }
    if (targetConn) {
      targetConn.inputs.push(edge.source);
    }
  });

  // 生成Observable声明
  code += "// Observable 声明\n";
  observables.forEach((node) => {
    const varName = node.id.split("-")[0];
    const config = node.data.config || {};

    switch (node.data.id) {
      case "click":
        code += `const ${varName}$ = fromEvent(document, 'click').pipe(\n`;
        code += `  map(e => ({ x: e.clientX, y: e.clientY }))\n`;
        code += `);\n`;
        break;
      case "mousemove":
        code += `const ${varName}$ = fromEvent(document, 'mousemove').pipe(\n`;
        code += `  map(e => ({ x: e.clientX, y: e.clientY }))\n`;
        code += `);\n`;
        break;
      case "keydown":
        code += `const ${varName}$ = fromEvent(document, 'keydown').pipe(\n`;
        code += `  map(e => e.key)\n`;
        code += `);\n`;
        break;
      case "interval":
        const period = config.period || 1000;
        code += `const ${varName}$ = interval(${period});\n`;
        break;
      case "array":
        const values = config.values || '["A", "B", "C"]';
        code += `const ${varName}$ = from(${values});\n`;
        break;
      case "fetch":
        const url =
          config.url || "https://jsonplaceholder.typicode.com/todos/1";
        code += `const ${varName}$ = from(fetch('${url}').then(res => res.json()));\n`;
        break;
      case "empty":
        code += `const ${varName}$ = EMPTY;\n`;
        break;
      case "never":
        code += `const ${varName}$ = NEVER;\n`;
        break;
      case "merge":
        code += `// merge 将在操作符链中定义\nlet ${varName}$;\n`;
        break;
      case "race":
        code += `// race 将在操作符链中定义\nlet ${varName}$;\n`;
        break;
      case "of":
        const ofValue = config.value || "hello";
        code += `const ${varName}$ = of(${JSON.stringify(ofValue)});\n`;
        break;
    }
  });

  code += "\n// 操作符链和数据流组合\n";

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
    const config = node.data.config || {};

    // 如果是Observable节点，直接返回变量名
    if (
      node.data.type === "observable" &&
      node.data.id !== "merge" &&
      node.data.id !== "race"
    ) {
      return varName + "$";
    }

    // 获取输入节点
    const connections = nodeConnections.get(nodeId);
    const inputs = connections?.inputs || [];

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
            operatorCode = `${primaryStream}.pipe(\n  takeUntil(${secondaryStream})\n)`;
            break;
          case "skipUntil":
            operatorCode = `${primaryStream}.pipe(\n  skipUntil(${secondaryStream})\n)`;
            break;
          case "zip":
            operatorCode = `zip(${primaryStream}, ${secondaryStream})`;
            break;
          case "combineLatest":
            operatorCode = `combineLatest([${primaryStream}, ${secondaryStream}])`;
            break;
          case "buffer":
            operatorCode = `${primaryStream}.pipe(\n  buffer(${secondaryStream})\n)`;
            break;
          case "switchMapTo":
            operatorCode = `${primaryStream}.pipe(\n  switchMapTo(${secondaryStream})\n)`;
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
            const mapFunc = config.func || "x => x";
            operatorCode = `${inputStream}.pipe(\n  map(${mapFunc})\n)`;
            break;
          case "filter":
            const filterFunc = config.func || "x => true";
            operatorCode = `${inputStream}.pipe(\n  filter(${filterFunc})\n)`;
            break;
          case "take":
            const takeCount = config.count || 5;
            operatorCode = `${inputStream}.pipe(\n  take(${takeCount})\n)`;
            break;
          case "skip":
            const skipCount = config.count || 2;
            operatorCode = `${inputStream}.pipe(\n  skip(${skipCount})\n)`;
            break;
          case "startWith":
            const startValue = config.value || "初始值";
            operatorCode = `${inputStream}.pipe(\n  startWith(${JSON.stringify(
              startValue
            )})\n)`;
            break;
          case "retry":
            const retryCount = config.count || 3;
            operatorCode = `${inputStream}.pipe(\n  retry(${retryCount})\n)`;
            break;
          case "timeout":
            const timeoutMs = config.time || 5000;
            operatorCode = `${inputStream}.pipe(\n  timeout(${timeoutMs})\n)`;
            break;
          case "tap":
            const tapFunc = config.func || "x => console.log('tap:', x)";
            operatorCode = `${inputStream}.pipe(\n  tap(${tapFunc})\n)`;
            break;
          case "catchError":
            const errorFunc = config.func || "err => of('error handled')";
            operatorCode = `${inputStream}.pipe(\n  catchError(${errorFunc})\n)`;
            break;
          case "finalize":
            const finalizeFunc =
              config.func || "() => console.log('finalized')";
            operatorCode = `${inputStream}.pipe(\n  finalize(${finalizeFunc})\n)`;
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
    const connections = nodeConnections.get(observer.id);
    const inputs = connections?.inputs || [];

    if (inputs.length > 0) {
      const input = inputs[0];
      const inputStream = generateOperatorChain(input);
      const observerName = observer.id.split("-")[0];
      operatorChains.set(
        observer.id,
        `// 订阅者\nconst ${observerName}$ = ${inputStream}`
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
          fontSize: "13px",
          lineHeight: "1.5",
        }}
        showLineNumbers
        wrapLines
        wrapLongLines
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodeView;
