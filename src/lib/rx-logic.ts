import {
  Observable,
  Subject,
  fromEvent,
  interval,
  from,
  of,
  EMPTY,
  NEVER,
  merge,
  race,
  zip,
  combineLatest,
  Subscription,
} from "rxjs";
import {
  map,
  filter,
  take,
  skip,
  startWith,
  takeUntil,
  skipUntil,
  buffer,
  switchMapTo,
  retry,
  timeout,
  share,
  finalize,
  tap,
} from "rxjs/operators";
import { Node, Edge } from "reactflow";

export type NodeStatus = "idle" | "active" | "completed" | "errored" | "cancelled";

export type RxEventType =
  | "subscribe"
  | "next"
  | "error"
  | "complete"
  | "unsubscribe";

export interface RxEvent {
  type: RxEventType;
  nodeId: string;
  value?: any;
  error?: any;
}

export const buildRxStream = (
  nodes: Node[],
  edges: Edge[],
  eventSubject: Subject<RxEvent>
) => {
  const nodeObservables = new Map<string, Observable<any>>();
  const subscriptions: Subscription[] = [];

  // 构建节点连接关系图
  const nodeConnections = new Map<string, string[]>();
  edges.forEach((edge) => {
    if (!nodeConnections.has(edge.target)) {
      nodeConnections.set(edge.target, []);
    }
    nodeConnections.get(edge.target)!.push(edge.source);
  });

  // 创建Observable源
  nodes
    .filter((node) => node.data.type === "observable")
    .forEach((node) => {
      let source$: Observable<any>;

      switch (node.data.id) {
        case "click":
          source$ = fromEvent(document, "click").pipe(
            map((e: MouseEvent) => ({ x: e.clientX, y: e.clientY }))
          );
          break;
        case "mousemove":
          source$ = fromEvent(document, "mousemove").pipe(
            map((e: MouseEvent) => ({ x: e.clientX, y: e.clientY }))
          );
          break;
        case "keydown":
          source$ = fromEvent(document, "keydown").pipe(
            map((e: KeyboardEvent) => e.key)
          );
          break;
        case "interval":
          source$ = interval(node.data.config?.period || 1000);
          break;
        case "array":
          try {
            const values = JSON.parse(node.data.config?.values || '["A", "B", "C"]');
            source$ = from(values);
          } catch (e) {
            source$ = from(["解析错误", "请检查JSON格式"]);
          }
          break;
        case "fetch":
          source$ = from(
            fetch(
              node.data.config?.url ||
              "https://jsonplaceholder.typicode.com/todos/1"
            ).then((res) => res.json())
          );
          break;
        case "empty":
          source$ = EMPTY;
          break;
        case "never":
          source$ = NEVER;
          break;
        case "merge":
        case "race":
          // 这些特殊的Observable需要在后面处理，因为它们依赖于其他Observable
          source$ = EMPTY;
          break;
        default:
          source$ = EMPTY;
      }

      // 添加生命周期事件报告
      source$ = source$.pipe(
        tap({
          next: (value) =>
            eventSubject.next({ type: "next", nodeId: node.id, value }),
          error: (error) =>
            eventSubject.next({ type: "error", nodeId: node.id, error }),
          complete: () =>
            eventSubject.next({ type: "complete", nodeId: node.id }),
        }),
        finalize(() =>
          eventSubject.next({ type: "unsubscribe", nodeId: node.id })
        ),
        share()
      );

      nodeObservables.set(node.id, source$);
    });

  // 处理特殊的merge和race Observable
  nodes
    .filter(
      (node) =>
        node.data.type === "observable" &&
        (node.data.id === "merge" || node.data.id === "race")
    )
    .forEach((node) => {
      const inputs = nodeConnections.get(node.id) || [];
      if (inputs.length >= 2) {
        const inputObservables = inputs
          .map((input) => nodeObservables.get(input))
          .filter((obs): obs is Observable<any> => !!obs);

        let source$: Observable<any>;
        if (node.data.id === "merge") {
          source$ = merge(...inputObservables);
        } else {
          // race
          source$ = race(...inputObservables);
        }

        // 添加生命周期事件报告
        source$ = source$.pipe(
          tap({
            next: (value) =>
              eventSubject.next({ type: "next", nodeId: node.id, value }),
            error: (error) =>
              eventSubject.next({ type: "error", nodeId: node.id, error }),
            complete: () =>
              eventSubject.next({ type: "complete", nodeId: node.id }),
          }),
          finalize(() =>
            eventSubject.next({ type: "unsubscribe", nodeId: node.id })
          ),
          share()
        );

        nodeObservables.set(node.id, source$);
      }
    });

  // 处理操作符节点
  const processedOperators = new Set<string>();
  const processOperator = (nodeId: string): Observable<any> | undefined => {
    if (processedOperators.has(nodeId)) {
      return nodeObservables.get(nodeId);
    }

    const node = nodes.find((n) => n.id === nodeId);
    if (!node || node.data.type !== "operator") return undefined;

    processedOperators.add(nodeId);
    const inputs = nodeConnections.get(nodeId) || [];
    if (inputs.length === 0) return undefined;

    // 处理需要两个输入的操作符
    if (node.data.multipleInputs && inputs.length >= 2) {
      const primaryInput = inputs[0];
      const secondaryInput = inputs[1];

      const primarySource$ = nodeObservables.get(primaryInput) || processOperator(primaryInput);
      const secondarySource$ = nodeObservables.get(secondaryInput) || processOperator(secondaryInput);

      if (!primarySource$ || !secondarySource$) return undefined;

      let result$: Observable<any>;

      switch (node.data.id) {
        case "takeUntil":
          result$ = primarySource$.pipe(takeUntil(secondarySource$));
          break;
        case "skipUntil":
          result$ = primarySource$.pipe(skipUntil(secondarySource$));
          break;
        case "buffer":
          result$ = primarySource$.pipe(buffer(secondarySource$));
          break;
        case "switchMapTo":
          result$ = primarySource$.pipe(switchMapTo(secondarySource$));
          break;
        case "zip":
          result$ = zip(primarySource$, secondarySource$);
          break;
        default:
          result$ = primarySource$;
      }

      // 添加生命周期事件报告
      result$ = result$.pipe(
        tap({
          next: (value) =>
            eventSubject.next({ type: "next", nodeId: node.id, value }),
          error: (error) =>
            eventSubject.next({ type: "error", nodeId: node.id, error }),
          complete: () =>
            eventSubject.next({ type: "complete", nodeId: node.id }),
        }),
        finalize(() =>
          eventSubject.next({ type: "unsubscribe", nodeId: node.id })
        ),
        share()
      );

      nodeObservables.set(nodeId, result$);
      return result$;
    } else {
      // 处理单输入操作符
      const input = inputs[0];
      const source$ = nodeObservables.get(input) || processOperator(input);
      if (!source$) return undefined;

      let result$: Observable<any>;

      switch (node.data.id) {
        case "map":
          try {
            const mapFn = new Function(
              "x",
              `return (${node.data.config?.func || "x => x"})(x)`
            );
            result$ = source$.pipe(map(mapFn));
          } catch (e) {
            result$ = source$.pipe(
              map(() => `函数解析错误: ${(e as Error).message}`)
            );
          }
          break;
        case "filter":
          try {
            const filterFn = new Function(
              "x",
              `return (${node.data.config?.func || "x => true"})(x)`
            );
            result$ = source$.pipe(filter(filterFn));
          } catch (e) {
            result$ = source$; // 如果过滤函数有错误，就不过滤
          }
          break;
        case "take":
          result$ = source$.pipe(take(node.data.config?.count || 5));
          break;
        case "skip":
          result$ = source$.pipe(skip(node.data.config?.count || 2));
          break;
        case "startWith":
          result$ = source$.pipe(startWith(node.data.config?.value || "初始值"));
          break;
        case "retry":
          result$ = source$.pipe(retry(node.data.config?.count || 3));
          break;
        case "timeout":
          result$ = source$.pipe(timeout(node.data.config?.time || 5000));
          break;
        default:
          result$ = source$;
      }

      // 添加生命周期事件报告
      result$ = result$.pipe(
        tap({
          next: (value) =>
            eventSubject.next({ type: "next", nodeId: node.id, value }),
          error: (error) =>
            eventSubject.next({ type: "error", nodeId: node.id, error }),
          complete: () =>
            eventSubject.next({ type: "complete", nodeId: node.id }),
        }),
        finalize(() =>
          eventSubject.next({ type: "unsubscribe", nodeId: node.id })
        ),
        share()
      );

      nodeObservables.set(nodeId, result$);
      return result$;
    }
  };

  // 处理所有操作符节点
  nodes
    .filter((node) => node.data.type === "operator")
    .forEach((node) => {
      processOperator(node.id);
    });

  // 订阅所有终端节点（没有出边的节点）
  const outgoingConnections = new Set<string>();
  edges.forEach((edge) => {
    outgoingConnections.add(edge.source);
  });

  const terminalNodes = Array.from(nodeObservables.keys()).filter(
    (nodeId) => !outgoingConnections.has(nodeId)
  );

  terminalNodes.forEach((nodeId) => {
    const observable$ = nodeObservables.get(nodeId);
    if (observable$) {
      eventSubject.next({ type: "subscribe", nodeId });
      const subscription = observable$.subscribe({
        next: () => { },
        error: () => { },
        complete: () => { },
      });
      subscriptions.push(subscription);
    }
  });

  // 订阅所有观察者节点
  nodes
    .filter((node) => node.data.type === "observer")
    .forEach((node) => {
      const inputs = nodeConnections.get(node.id) || [];
      if (inputs.length > 0) {
        const input = inputs[0];
        const observable$ = nodeObservables.get(input);
        if (observable$) {
          eventSubject.next({ type: "subscribe", nodeId: node.id });
          const subscription = observable$.subscribe({
            next: (value) =>
              eventSubject.next({ type: "next", nodeId: node.id, value }),
            error: (error) =>
              eventSubject.next({ type: "error", nodeId: node.id, error }),
            complete: () =>
              eventSubject.next({ type: "complete", nodeId: node.id }),
          });
          subscriptions.push(subscription);
        }
      }
    });

  return {
    stream$: eventSubject.asObservable(),
    unsubscribe: () => {
      subscriptions.forEach((sub) => sub.unsubscribe());
      eventSubject.complete();
    },
  };
};