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
  subscriptionId?: string; // 新增：订阅ID
  value?: any;
  error?: any;
}

// 判断 Observable 是否为热 Observable 的函数
const isHotObservable = (observableId: string): boolean => {
  // 热 Observable：事件流、定时器等，不依赖于订阅者
  const hotObservables = [
    "click",      // DOM 事件
    "mousemove",  // DOM 事件
    "keydown",    // DOM 事件
    "interval",   // 定时器
    "merge",      // 合并操作
    "race",       // 竞争操作
  ];
  
  return hotObservables.includes(observableId);
};

export const buildRxStream = (
  nodes: Node[],
  edges: Edge[],
  eventSubject: Subject<RxEvent>
) => {
  const nodeObservables = new Map<string, Observable<any>>();
  const subscriptions: Subscription[] = [];
  let subscriptionCounter = 0; // 新增：订阅计数器

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
          source$ = fromEvent<MouseEvent>(document, "click").pipe(
            map((e) => ({ x: e.clientX, y: e.clientY }))
          );
          break;
        case "mousemove":
          source$ = fromEvent<MouseEvent>(document, "mousemove").pipe(
            map((e) => ({ x: e.clientX, y: e.clientY }))
          );
          break;
        case "keydown":
          source$ = fromEvent<KeyboardEvent>(document, "keydown").pipe(
            map((e) => e.key)
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
        case "probabilistic":
          // 自定义概率失败的Observable
          const delay = node.data.config?.delay || 1000;
          const successRate = node.data.config?.successRate || 0.5;

          source$ = new Observable(observer => {
            const timeoutId = setTimeout(() => {
              const random = Math.random();
              if (random <= successRate) {
                observer.next({
                  success: true,
                  value: `成功! (概率: ${(successRate * 100).toFixed(1)}%, 延迟: ${delay}ms)`,
                  timestamp: new Date().toISOString()
                });
                observer.complete();
              } else {
                observer.error(new Error(`模拟失败! (概率: ${((1 - successRate) * 100).toFixed(1)}%, 延迟: ${delay}ms)`));
              }
            }, delay);

            return () => {
              clearTimeout(timeoutId);
            };
          });
          break;
        case "merge":
        case "race":
          // 这些特殊的Observable需要在后面处理，因为它们依赖于其他Observable
          source$ = EMPTY;
          break;
        default:
          source$ = EMPTY;
      }

      // 添加生命周期事件报告（只在没有下游订阅者时）
      const downstreamEdges = edges.filter((edge) => edge.source === node.id);
      if (downstreamEdges.length === 0) {
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
          )
        );
      }

      // 移除 share() 以允许创建独立的订阅实例
      // source$ = source$.pipe(share());

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

        // 添加生命周期事件报告（只在没有下游订阅者时）
        const downstreamEdges = edges.filter((edge) => edge.source === node.id);
        if (downstreamEdges.length === 0) {
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
            )
          );
        }

        // 移除 share() 以允许创建独立的订阅实例
        // source$ = source$.pipe(share());

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
        )
        // 移除 share() 以允许创建独立的订阅实例
        // share()
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
            ) as (x: any) => any;
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
            ) as (x: any) => boolean;
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

      // 添加生命周期事件报告（只在没有下游订阅者时）
      const downstreamEdges = edges.filter((edge) => edge.source === node.id);
      if (downstreamEdges.length === 0) {
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
          )
        );
      }

      // 移除 share() 以允许创建独立的订阅实例
      // result$ = result$.pipe(share());

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

  // 只为有下游订阅者的节点创建订阅
  const nodeSubscriptions = new Map<string, string[]>();

  // 计算每个节点的下游订阅者数量
  const downstreamCount = new Map<string, number>();
  nodes.forEach((node) => {
    const downstreamEdges = edges.filter((edge) => edge.source === node.id);
    downstreamCount.set(node.id, downstreamEdges.length);
    console.log(`Node ${node.id} has ${downstreamEdges.length} downstream subscribers`);
  });

  // 计算每个节点的实际订阅数量（基于所有下游订阅者的总数）
  const nodeSubscriptionCounts = new Map<string, number>();

  // 从订阅者开始，向上传播订阅数量
  const calculateSubscriptionCounts = (nodeId: string): number => {
    if (nodeSubscriptionCounts.has(nodeId)) {
      return nodeSubscriptionCounts.get(nodeId)!;
    }

    const downstreamEdges = edges.filter((edge) => edge.source === nodeId);
    if (downstreamEdges.length === 0) {
      // 如果是订阅者节点，返回1
      const node = nodes.find(n => n.id === nodeId);
      if (node?.data.type === "observer") {
        nodeSubscriptionCounts.set(nodeId, 1);
        return 1;
      }
      return 0;
    }

    // 计算所有下游节点的订阅数量总和
    const totalSubscriptions = downstreamEdges.reduce((total, edge) => {
      return total + calculateSubscriptionCounts(edge.target);
    }, 0);

    nodeSubscriptionCounts.set(nodeId, totalSubscriptions);
    return totalSubscriptions;
  };

  // 计算所有节点的订阅数量
  nodes.forEach(node => {
    calculateSubscriptionCounts(node.id);
  });

  // 为每个节点创建订阅
  nodes.forEach((node) => {
    const subscriptionCount = nodeSubscriptionCounts.get(node.id) || 0;
    if (subscriptionCount > 0) {
      const observable$ = nodeObservables.get(node.id);
      if (!observable$) return;

      // 为每个订阅创建一个订阅实例
      for (let i = 0; i < subscriptionCount; i++) {
        const subscriptionId = `sub_${subscriptionCounter++}`;
        console.log(`Creating subscription for ${node.id} with ID ${subscriptionId} (subscription ${i + 1}/${subscriptionCount})`);

        const subscription = observable$.subscribe({
          next: (value) => {
            eventSubject.next({ type: "next", nodeId: node.id, value, subscriptionId });
          },
          error: (error) => {
            eventSubject.next({ type: "error", nodeId: node.id, error, subscriptionId });
          },
          complete: () => {
            eventSubject.next({ type: "complete", nodeId: node.id, subscriptionId });
          },
        });
        subscriptions.push(subscription);

        // 发出 subscribe 事件
        const subscribeEvent = {
          type: "subscribe",
          nodeId: node.id,
          subscriptionId: subscriptionId
        };
        console.log("Emitting subscribe event:", subscribeEvent);
        // 延迟发出 subscribe 事件，确保 rx-visualizer.tsx 已经订阅
        setTimeout(() => {
          eventSubject.next(subscribeEvent);
        }, 0);
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

// 导出判断冷热 Observable 的函数
export { isHotObservable };