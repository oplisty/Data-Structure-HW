// 图算法核心模块 - 实现道路网络和寻路算法

import { Node, Edge, Graph, Point, PathResult } from '../types';

// 优先队列实现（用于Dijkstra和A*算法）
class PriorityQueue<T> {
  private items: { element: T; priority: number }[] = [];

  enqueue(element: T, priority: number): void {
    const item = { element, priority };
    let added = false;
    for (let i = 0; i < this.items.length; i++) {
      if (item.priority < this.items[i].priority) {
        this.items.splice(i, 0, item);
        added = true;
        break;
      }
    }
    if (!added) {
      this.items.push(item);
    }
  }

  dequeue(): T | undefined {
    return this.items.shift()?.element;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  contains(element: T, compareFn: (a: T, b: T) => boolean): boolean {
    return this.items.some(item => compareFn(item.element, element));
  }
}

// 图管理类
export class GraphManager {
  private graph: Graph;

  constructor() {
    this.graph = {
      nodes: new Map(),
      edges: new Map()
    };
  }

  // 添加节点
  addNode(node: Node): void {
    this.graph.nodes.set(node.id, node);
    if (!this.graph.edges.has(node.id)) {
      this.graph.edges.set(node.id, []);
    }
  }

  // 添加边（双向）
  addEdge(edge: Edge): void {
    const edges = this.graph.edges.get(edge.from) || [];
    edges.push(edge);
    this.graph.edges.set(edge.from, edges);

    // 添加反向边
    const reverseEdge: Edge = {
      id: `${edge.id}_reverse`,
      from: edge.to,
      to: edge.from,
      distance: edge.distance,
      trafficFactor: edge.trafficFactor
    };
    const reverseEdges = this.graph.edges.get(edge.to) || [];
    reverseEdges.push(reverseEdge);
    this.graph.edges.set(edge.to, reverseEdges);
  }

  // 获取节点
  getNode(id: string): Node | undefined {
    return this.graph.nodes.get(id);
  }

  // 获取所有节点
  getAllNodes(): Node[] {
    return Array.from(this.graph.nodes.values());
  }

  // 获取所有边
  getAllEdges(): Edge[] {
    const allEdges: Edge[] = [];
    const seen = new Set<string>();
    this.graph.edges.forEach(edges => {
      edges.forEach(edge => {
        // 避免重复添加反向边
        const edgeKey = [edge.from, edge.to].sort().join('-');
        if (!seen.has(edgeKey)) {
          seen.add(edgeKey);
          allEdges.push(edge);
        }
      });
    });
    return allEdges;
  }

  // 获取邻居节点
  getNeighbors(nodeId: string): Edge[] {
    return this.graph.edges.get(nodeId) || [];
  }

  // 计算两点间欧几里得距离
  static euclideanDistance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  // 计算曼哈顿距离（用于A*启发函数）
  static manhattanDistance(p1: Point, p2: Point): number {
    return Math.abs(p2.x - p1.x) + Math.abs(p2.y - p1.y);
  }

  // Dijkstra算法 - 寻找最短路径
  dijkstra(startId: string, endId: string): PathResult | null {
    const distances = new Map<string, number>();
    const previous = new Map<string, string | null>();
    const pq = new PriorityQueue<string>();
    const visited = new Set<string>();

    // 初始化
    this.graph.nodes.forEach((_, id) => {
      distances.set(id, id === startId ? 0 : Infinity);
      previous.set(id, null);
    });

    pq.enqueue(startId, 0);

    while (!pq.isEmpty()) {
      const current = pq.dequeue();
      if (!current || visited.has(current)) continue;
      visited.add(current);

      if (current === endId) break;

      const neighbors = this.getNeighbors(current);
      for (const edge of neighbors) {
        if (visited.has(edge.to)) continue;

        const newDist = (distances.get(current) || 0) + edge.distance * edge.trafficFactor;
        if (newDist < (distances.get(edge.to) || Infinity)) {
          distances.set(edge.to, newDist);
          previous.set(edge.to, current);
          pq.enqueue(edge.to, newDist);
        }
      }
    }

    // 重建路径
    if (distances.get(endId) === Infinity) {
      return null;
    }

    const path: string[] = [];
    let current: string | null = endId;
    while (current) {
      path.unshift(current);
      current = previous.get(current) || null;
    }

    const distance = distances.get(endId) || 0;
    return {
      path,
      distance,
      estimatedTime: distance / 30 * 60, // 假设平均速度30km/h
      batteryRequired: distance * 2 // 假设每公里消耗2%电量
    };
  }

  // A*算法 - 使用启发式函数的最短路径
  astar(startId: string, endId: string): PathResult | null {
    const startNode = this.getNode(startId);
    const endNode = this.getNode(endId);
    if (!startNode || !endNode) return null;

    const openSet = new PriorityQueue<string>();
    const closedSet = new Set<string>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();
    const cameFrom = new Map<string, string>();

    gScore.set(startId, 0);
    fScore.set(startId, GraphManager.manhattanDistance(startNode.position, endNode.position));
    openSet.enqueue(startId, fScore.get(startId)!);

    while (!openSet.isEmpty()) {
      const current = openSet.dequeue();
      if (!current) break;

      if (current === endId) {
        // 重建路径
        const path: string[] = [];
        let node: string | undefined = current;
        while (node) {
          path.unshift(node);
          node = cameFrom.get(node);
        }
        const distance = gScore.get(endId) || 0;
        return {
          path,
          distance,
          estimatedTime: distance / 30 * 60,
          batteryRequired: distance * 2
        };
      }

      closedSet.add(current);

      const neighbors = this.getNeighbors(current);
      for (const edge of neighbors) {
        if (closedSet.has(edge.to)) continue;

        const tentativeG = (gScore.get(current) || 0) + edge.distance * edge.trafficFactor;

        if (tentativeG < (gScore.get(edge.to) || Infinity)) {
          cameFrom.set(edge.to, current);
          gScore.set(edge.to, tentativeG);

          const neighborNode = this.getNode(edge.to);
          if (neighborNode) {
            const h = GraphManager.manhattanDistance(neighborNode.position, endNode.position);
            fScore.set(edge.to, tentativeG + h);
            if (!openSet.contains(edge.to, (a, b) => a === b)) {
              openSet.enqueue(edge.to, fScore.get(edge.to)!);
            }
          }
        }
      }
    }

    return null;
  }

  // 找到最近的充电站
  findNearestChargingStation(fromNodeId: string, chargingStationNodeIds: string[]): { nodeId: string; distance: number } | null {
    let nearest: { nodeId: string; distance: number } | null = null;

    for (const stationId of chargingStationNodeIds) {
      const result = this.dijkstra(fromNodeId, stationId);
      if (result && (!nearest || result.distance < nearest.distance)) {
        nearest = { nodeId: stationId, distance: result.distance };
      }
    }

    return nearest;
  }

  // 计算从当前位置经过目标点再到最近充电站的总距离
  findOptimalChargingRoute(
    fromNodeId: string, 
    targetNodeId: string, 
    chargingStationNodeIds: string[]
  ): { 
    path: string[]; 
    totalDistance: number; 
    chargingStationId: string 
  } | null {
    const toTarget = this.dijkstra(fromNodeId, targetNodeId);
    if (!toTarget) return null;

    let bestRoute: { path: string[]; totalDistance: number; chargingStationId: string } | null = null;

    for (const stationId of chargingStationNodeIds) {
      const toStation = this.dijkstra(targetNodeId, stationId);
      if (toStation) {
        const totalDistance = toTarget.distance + toStation.distance;
        if (!bestRoute || totalDistance < bestRoute.totalDistance) {
          bestRoute = {
            path: [...toTarget.path, ...toStation.path.slice(1)],
            totalDistance,
            chargingStationId: stationId
          };
        }
      }
    }

    return bestRoute;
  }

  // 获取图结构（用于序列化）
  getGraph(): Graph {
    return this.graph;
  }

  // 从序列化数据恢复
  loadGraph(graph: Graph): void {
    this.graph = graph;
  }

  // 清空图
  clear(): void {
    this.graph.nodes.clear();
    this.graph.edges.clear();
  }
}

// 生成随机道路网络
export function generateRandomNetwork(
  nodeCount: number,
  mapSize: number,
  warehouseCount: number = 1,
  chargingStationCount: number = 3
): GraphManager {
  const gm = new GraphManager();
  const nodes: Node[] = [];

  // 生成仓库节点
  for (let i = 0; i < warehouseCount; i++) {
    const node: Node = {
      id: `warehouse_${i}`,
      position: {
        x: mapSize * 0.1 + Math.random() * mapSize * 0.2,
        y: mapSize * 0.4 + Math.random() * mapSize * 0.2
      },
      type: 'warehouse',
      name: `仓库 ${i + 1}`
    };
    nodes.push(node);
    gm.addNode(node);
  }

  // 生成充电站节点
  for (let i = 0; i < chargingStationCount; i++) {
    const angle = (2 * Math.PI * i) / chargingStationCount;
    const radius = mapSize * 0.35;
    const node: Node = {
      id: `charging_${i}`,
      position: {
        x: mapSize / 2 + radius * Math.cos(angle) + (Math.random() - 0.5) * mapSize * 0.1,
        y: mapSize / 2 + radius * Math.sin(angle) + (Math.random() - 0.5) * mapSize * 0.1
      },
      type: 'charging_station',
      name: `充电站 ${i + 1}`
    };
    nodes.push(node);
    gm.addNode(node);
  }

  // 生成普通路口节点
  const intersectionCount = nodeCount - warehouseCount - chargingStationCount;
  for (let i = 0; i < intersectionCount; i++) {
    const node: Node = {
      id: `intersection_${i}`,
      position: {
        x: Math.random() * mapSize * 0.8 + mapSize * 0.1,
        y: Math.random() * mapSize * 0.8 + mapSize * 0.1
      },
      type: 'intersection',
      name: `路口 ${i + 1}`
    };
    nodes.push(node);
    gm.addNode(node);
  }

  // 生成边（使用Delaunay三角剖分的简化版本）
  // 连接每个节点到最近的几个邻居
  let edgeId = 0;
  for (let i = 0; i < nodes.length; i++) {
    const distances: { index: number; distance: number }[] = [];
    for (let j = 0; j < nodes.length; j++) {
      if (i !== j) {
        distances.push({
          index: j,
          distance: GraphManager.euclideanDistance(nodes[i].position, nodes[j].position)
        });
      }
    }
    distances.sort((a, b) => a.distance - b.distance);

    // 连接到最近的3-5个邻居
    const neighborCount = 3 + Math.floor(Math.random() * 3);
    for (let k = 0; k < Math.min(neighborCount, distances.length); k++) {
      const targetNode = nodes[distances[k].index];
      // 检查是否已经存在这条边
      const existingEdges = gm.getNeighbors(nodes[i].id);
      if (!existingEdges.some(e => e.to === targetNode.id)) {
        const edge: Edge = {
          id: `edge_${edgeId++}`,
          from: nodes[i].id,
          to: targetNode.id,
          distance: distances[k].distance / 100, // 转换为公里
          trafficFactor: 0.8 + Math.random() * 0.4 // 0.8-1.2的交通系数
        };
        gm.addEdge(edge);
      }
    }
  }

  return gm;
}

// 预设地图生成器
export const PresetMaps = {
  // 小规模地图
  small: () => generateRandomNetwork(15, 500, 1, 2),
  
  // 中等规模地图
  medium: () => generateRandomNetwork(30, 800, 2, 4),
  
  // 大规模地图
  large: () => generateRandomNetwork(50, 1200, 3, 6),
  
  // 网格地图
  grid: (size: number, spacing: number): GraphManager => {
    const gm = new GraphManager();
    const nodes: Node[][] = [];

    // 创建网格节点
    for (let i = 0; i < size; i++) {
      nodes[i] = [];
      for (let j = 0; j < size; j++) {
        let type: Node['type'] = 'intersection';
        let name = `路口 (${i},${j})`;

        // 角落放仓库
        if (i === 0 && j === 0) {
          type = 'warehouse';
          name = '中央仓库';
        }
        // 对角线位置放充电站
        else if (i === j && i > 0 && i < size - 1 && i % Math.floor(size / 3) === 0) {
          type = 'charging_station';
          name = `充电站 ${Math.floor(i / Math.floor(size / 3))}`;
        }

        const node: Node = {
          id: `node_${i}_${j}`,
          position: { x: j * spacing + spacing / 2, y: i * spacing + spacing / 2 },
          type,
          name
        };
        nodes[i][j] = node;
        gm.addNode(node);
      }
    }

    // 创建网格边
    let edgeId = 0;
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        // 右边邻居
        if (j < size - 1) {
          gm.addEdge({
            id: `edge_${edgeId++}`,
            from: nodes[i][j].id,
            to: nodes[i][j + 1].id,
            distance: spacing / 100,
            trafficFactor: 1
          });
        }
        // 下边邻居
        if (i < size - 1) {
          gm.addEdge({
            id: `edge_${edgeId++}`,
            from: nodes[i][j].id,
            to: nodes[i + 1][j].id,
            distance: spacing / 100,
            trafficFactor: 1
          });
        }
      }
    }

    return gm;
  }
};
