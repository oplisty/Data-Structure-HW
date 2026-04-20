/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SimulationState } from '../types';
import { wgs84togcj02 } from '../utils/geo';

interface AMapRealtimeMapProps {
  state: SimulationState;
  width?: number;
  height?: number;
  onNodeClick?: (nodeId: string) => void;
  selectedVehicleId?: string;
}

type LngLat = [number, number];

interface AMapOverlay {
  setMap: (map: AMapInstance | null) => void;
}

interface AMapEventOverlay extends AMapOverlay {
  on?: (event: string, handler: () => void) => void;
}

interface AMapInstance {
  addControl: (control: unknown) => void;
  add: (overlays: unknown[]) => void;
  setLimitBounds?: (bounds: unknown) => void;
  setFitView: (
    overlays: unknown[],
    immediately?: boolean,
    avoid?: number[],
    maxZoom?: number
  ) => void;
  destroy: () => void;
}

interface AMapNamespace {
  Map: new (container: HTMLElement, options: Record<string, unknown>) => AMapInstance;
  Bounds?: new (southWest: LngLat, northEast: LngLat) => unknown;
  Scale: new () => unknown;
  ToolBar: new (options?: Record<string, unknown>) => unknown;
  Polyline: new (options: Record<string, unknown>) => AMapOverlay;
  CircleMarker: new (options: Record<string, unknown>) => AMapEventOverlay;
  Text: new (options: Record<string, unknown>) => AMapOverlay;
  Pixel: new (x: number, y: number) => unknown;
}

interface AMapWindow extends Window {
  AMap?: AMapNamespace;
  _AMapSecurityConfig?: { securityJsCode: string };
}

const DEFAULT_CENTER: LngLat = [113.2644, 23.1291]; // 广州
const DEFAULT_SPAN_DEGREE = 0.2;
const DEFAULT_MAX_ROAD_SEGMENTS = 12000;
const DEFAULT_MAX_NODE_MARKERS = 8000;
const DEFAULT_SHOW_ROAD_SEGMENTS = false;
const DEFAULT_SHOW_ROAD_NODE_MARKERS = false;

let amapScriptPromise: Promise<void> | null = null;

function loadAMapScript(apiKey: string, securityCode?: string): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('AMap can only be used in browser'));
  }

  const win = window as AMapWindow;
  if (win.AMap) {
    return Promise.resolve();
  }

  if (amapScriptPromise) {
    return amapScriptPromise;
  }

  amapScriptPromise = new Promise((resolve, reject) => {
    if (securityCode) {
      win._AMapSecurityConfig = { securityJsCode: securityCode };
    }

    const script = document.createElement('script');
    script.id = 'amap-jsapi-loader';
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(apiKey)}&plugin=AMap.Scale,AMap.ToolBar,AMap.MoveAnimation`;
    script.async = true;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load AMap JS API'));

    document.head.appendChild(script);
  });

  return amapScriptPromise;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parseBooleanEnv(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  const text = value.trim().toLowerCase();
  if (text === '1' || text === 'true' || text === 'yes' || text === 'on') return true;
  if (text === '0' || text === 'false' || text === 'no' || text === 'off') return false;
  return fallback;
}

function isLikelyLngLat(minX: number, maxX: number, minY: number, maxY: number): boolean {
  const lonValid = minX >= 70 && maxX <= 140;
  const latValid = minY >= 0 && maxY <= 60;
  const rangeValid = maxX - minX <= 5 && maxY - minY <= 5;
  return lonValid && latValid && rangeValid;
}

function buildProjection(state: SimulationState, center: LngLat, spanDegree: number) {
  const nodes = Array.from(state.graph.nodes.values());

  if (nodes.length === 0) {
    return {
      toLngLat: (x: number, y: number): LngLat => [center[0] + x * 0.001, center[1] + y * 0.001],
      bboxPoints: [center],
    };
  }

  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const node of nodes) {
    minX = Math.min(minX, node.position.x);
    maxX = Math.max(maxX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxY = Math.max(maxY, node.position.y);
  }

  if (isLikelyLngLat(minX, maxX, minY, maxY)) {
    const toLngLat = (x: number, y: number): LngLat => wgs84togcj02(x, y);
    const bboxPoints: LngLat[] = [
      [minX, minY],
      [minX, maxY],
      [maxX, minY],
      [maxX, maxY],
    ];
    return { toLngLat, bboxPoints };
  }

  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;

  const rangeX = Math.max(1, maxX - minX);
  const rangeY = Math.max(1, maxY - minY);
  const range = Math.max(rangeX, rangeY);
  const scale = spanDegree / range;

  const toLngLat = (x: number, y: number): LngLat => {
    const lng = center[0] + (x - midX) * scale;
    // 地图纬度向上增大，这里反转 y 轴保持视觉直觉一致
    const lat = center[1] + (midY - y) * scale;
    return [lng, lat];
  };

  const bboxPoints: LngLat[] = [
    toLngLat(minX, minY),
    toLngLat(minX, maxY),
    toLngLat(maxX, minY),
    toLngLat(maxX, maxY),
  ];

  return { toLngLat, bboxPoints };
}



function getLngLatDistanceMeters(a: LngLat, b: LngLat): number {
  const earthRadius = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const x = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return earthRadius * c;
}

function getPathLengthMeters(points: LngLat[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += getLngLatDistanceMeters(points[i - 1], points[i]);
  }
  return total;
}

const AMapRealtimeMap: React.FC<AMapRealtimeMapProps> = ({
  state,
  width = 800,
  height = 600,
  onNodeClick,
  selectedVehicleId,
}) => {
  const apiKey = process.env.NEXT_PUBLIC_AMAP_KEY || '';
  const securityCode = process.env.NEXT_PUBLIC_AMAP_SECURITY_CODE || '';

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<AMapInstance | null>(null);
  const overlaysRef = useRef<{
    roads: AMapOverlay[];
    nodes: AMapOverlay[];
    vehicles: Record<string, any>;
    routes: Record<string, AMapOverlay>;
    labels: Record<string, AMapOverlay>;
    tasks: Record<string, AMapOverlay>;
  }>({
    roads: [],
    nodes: [],
    vehicles: {},
    routes: {},
    labels: {},
    tasks: {}
  });

  const hasFitViewRef = useRef(false);
  const prevGraphNodesCountRef = useRef(0);
  const prevGraphEdgesCountRef = useRef(0);

  const [loadStatus, setLoadStatus] = useState<'loading' | 'ready' | 'error'>(
    apiKey ? 'loading' : 'error'
  );

  const center = useMemo<LngLat>(() => {
    const lng = Number(process.env.NEXT_PUBLIC_MAP_CENTER_LNG ?? DEFAULT_CENTER[0]);
    const lat = Number(process.env.NEXT_PUBLIC_MAP_CENTER_LAT ?? DEFAULT_CENTER[1]);

    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
      return DEFAULT_CENTER;
    }

    return [clampNumber(lng, -180, 180), clampNumber(lat, -90, 90)];
  }, []);

  const spanDegree = useMemo(() => {
    const value = Number(process.env.NEXT_PUBLIC_MAP_SPAN_DEGREE ?? DEFAULT_SPAN_DEGREE);
    if (!Number.isFinite(value) || value <= 0) return DEFAULT_SPAN_DEGREE;
    return clampNumber(value, 0.01, 2);
  }, []);

  const maxRoadSegments = useMemo(() => {
    const value = Number(process.env.NEXT_PUBLIC_MAX_ROAD_SEGMENTS ?? DEFAULT_MAX_ROAD_SEGMENTS);
    if (!Number.isFinite(value) || value < 1000) return DEFAULT_MAX_ROAD_SEGMENTS;
    return Math.floor(value);
  }, []);

  const maxNodeMarkers = useMemo(() => {
    const value = Number(process.env.NEXT_PUBLIC_MAX_NODE_MARKERS ?? DEFAULT_MAX_NODE_MARKERS);
    if (!Number.isFinite(value) || value < 1000) return DEFAULT_MAX_NODE_MARKERS;
    return Math.floor(value);
  }, []);

  const showRoadSegments = useMemo(
    () => parseBooleanEnv(process.env.NEXT_PUBLIC_SHOW_ROAD_SEGMENTS, DEFAULT_SHOW_ROAD_SEGMENTS),
    []
  );

  const showRoadNodeMarkers = useMemo(
    () => parseBooleanEnv(process.env.NEXT_PUBLIC_SHOW_ROAD_NODE_MARKERS, DEFAULT_SHOW_ROAD_NODE_MARKERS),
    []
  );

  useEffect(() => {
    if (!apiKey) {
      return;
    }

    let disposed = false;

    loadAMapScript(apiKey, securityCode)
      .then(() => {
        if (disposed) return;
        setLoadStatus('ready');
      })
      .catch((error) => {
        console.error('AMap load failed:', error);
        if (!disposed) {
          setLoadStatus('error');
        }
      });

    return () => {
      disposed = true;
    };
  }, [apiKey, securityCode]);

  useEffect(() => {
    if (loadStatus !== 'ready') return;
    if (!containerRef.current) return;
    if (mapRef.current) return;

    const AMap = (window as AMapWindow).AMap;
    if (!AMap) return;

    const map = new AMap.Map(containerRef.current, {
      center,
      zoom: 12,
      viewMode: '2D',
      resizeEnable: true,
      mapStyle: 'amap://styles/normal',
    });

    map.addControl(new AMap.Scale());
    map.addControl(new AMap.ToolBar({ position: 'RB' }));

    mapRef.current = map;

    return () => {
      /* 清理旧组件逻辑更新 */
      Object.keys(overlaysRef.current.vehicles).forEach(k => overlaysRef.current.vehicles[k]?.setMap?.(null));
      Object.keys(overlaysRef.current.routes).forEach(k => overlaysRef.current.routes[k]?.setMap?.(null));
      Object.keys(overlaysRef.current.labels).forEach(k => overlaysRef.current.labels[k]?.setMap?.(null));
      Object.keys(overlaysRef.current.tasks).forEach(k => overlaysRef.current.tasks[k]?.setMap?.(null));
      overlaysRef.current.roads.forEach((o) => o?.setMap?.(null));
      overlaysRef.current.nodes.forEach((o) => o?.setMap?.(null));
      overlaysRef.current = { roads: [], nodes: [], vehicles: {}, routes: {}, labels: {}, tasks: {} };
      hasFitViewRef.current = false;

      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, [loadStatus, center]);

  useEffect(() => {
    const map = mapRef.current;
    const AMap = (window as AMapWindow).AMap;
    if (!map || !AMap || !state || !state.graph) return;

    const projection = buildProjection(state, center, spanDegree);

    // 检查地图基础结构是否改变，如果变了就重新绘制地图底图
    const nodesCount = state.graph.nodes.size;
    const edgesCount = state.graph.edges.size;
    const graphChanged = nodesCount !== prevGraphNodesCountRef.current || edgesCount !== prevGraphEdgesCountRef.current;

    if (graphChanged) {
      // 销毁旧的路网节点
      overlaysRef.current.roads.forEach(o => o?.setMap?.(null));
      overlaysRef.current.nodes.forEach(o => o?.setMap?.(null));
      overlaysRef.current.roads = [];
      overlaysRef.current.nodes = [];

      // 绘制道路
      if (showRoadSegments) {
        const allEdges = Array.from(state.graph.edges.values()).flat();
        const edgeStep = Math.max(1, Math.ceil(allEdges.length / maxRoadSegments));
        const edgeDedup = new Set<string>();

        const newRoads = [];
        for (let edgeIndex = 0; edgeIndex < allEdges.length; edgeIndex += edgeStep) {
          const edge = allEdges[edgeIndex];
          const edgeKey = [edge.from, edge.to].sort().join('-');
          if (edgeDedup.has(edgeKey)) continue;
          edgeDedup.add(edgeKey);

          const fromNode = state.graph.nodes.get(edge.from);
          const toNode = state.graph.nodes.get(edge.to);
          if (!fromNode || !toNode) continue;

          const line = new AMap.Polyline({
            path: [
              projection.toLngLat(fromNode.position.x, fromNode.position.y),
              projection.toLngLat(toNode.position.x, toNode.position.y),
            ],
            strokeColor: edge.trafficFactor > 1.1 ? '#ef4444' : '#64748b',
            strokeWeight: edge.trafficFactor > 1.1 ? 4 : 2,
            strokeStyle: edge.trafficFactor > 1.1 ? 'dashed' : 'solid',
            strokeOpacity: 0.9,
          });

          line.setMap(map);
          newRoads.push(line);
        }
        overlaysRef.current.roads = newRoads;
      }

      // 节点
      const allNodes = Array.from(state.graph.nodes.values());
      const nodeStep = Math.max(1, Math.ceil(allNodes.length / maxNodeMarkers));

      const newNodes = [];
      for (let nodeIndex = 0; nodeIndex < allNodes.length; nodeIndex += nodeStep) {
        const node = allNodes[nodeIndex];

        if (!showRoadNodeMarkers && node.type !== 'warehouse' && node.type !== 'charging_station') {
          continue;
        }

        const centerPoint = projection.toLngLat(node.position.x, node.position.y);

        let color = '#6b7280';
        let radius = 4;
        if (node.type === 'warehouse') {
          color = '#3b82f6';
          radius = 8;
        } else if (node.type === 'charging_station') {
          color = '#10b981';
          radius = 7;
        }

        const marker = new AMap.CircleMarker({
          center: centerPoint,
          radius,
          fillColor: color,
          fillOpacity: 0.95,
          strokeColor: '#0f172a',
          strokeWeight: 1,
          bubble: true,
        });

        marker.setMap(map);
        if (onNodeClick && marker.on) {
          marker.on('click', () => onNodeClick(node.id));
        }
        newNodes.push(marker);
      }
      overlaysRef.current.nodes = newNodes;

      prevGraphNodesCountRef.current = nodesCount;
      prevGraphEdgesCountRef.current = edgesCount;
    }

    // 动态绘制：任务
    const activeTasks = state.tasks.filter((task) =>
      task.status === 'pending' || task.status === 'assigned' || task.status === 'in_progress'
    );

    const currentTaskIds = new Set(activeTasks.map(t => t.id));
    
    // 清理已完成/过期的任务标记
    Object.keys(overlaysRef.current.tasks).forEach(taskId => {
      if (!currentTaskIds.has(taskId)) {
        overlaysRef.current.tasks[taskId]?.setMap?.(null);
        delete overlaysRef.current.tasks[taskId];
      }
    });

    for (const task of activeTasks) {
      const point = projection.toLngLat(task.position.x, task.position.y);
      const isPending = task.status === 'pending';

      let color = '#6b7280';
      if (task.priority === 'urgent') color = '#ef4444';
      else if (task.priority === 'high') color = '#f59e0b';
      else if (task.priority === 'medium') color = '#3b82f6';
      else if (task.priority === 'low') color = '#10b981';

      if (overlaysRef.current.tasks[task.id]) {
        // 更新已有任务
        const m = overlaysRef.current.tasks[task.id] as any;
        m.setCenter(point);
        m.setOptions({ fillColor: color, fillOpacity: isPending ? 0.95 : 0.45 });
      } else {
        // 新建任务
        const marker = new AMap.CircleMarker({
          center: point,
          radius: 6,
          fillColor: color,
          fillOpacity: isPending ? 0.95 : 0.45,
          strokeColor: '#111827',
          strokeWeight: 1,
        });
        marker.setMap(map);
        overlaysRef.current.tasks[task.id] = marker;
      }
    }

    // 动态绘制：车辆 + 车辆路径
    const currentVehicleIds = new Set(state.vehicles.map(v => v.id));
    Object.keys(overlaysRef.current.vehicles).forEach(vid => {
      if (!currentVehicleIds.has(vid)) {
        overlaysRef.current.vehicles[vid]?.setMap?.(null);
        overlaysRef.current.routes[vid]?.setMap?.(null);
        overlaysRef.current.labels[vid]?.setMap?.(null);
        delete overlaysRef.current.vehicles[vid];
        delete overlaysRef.current.routes[vid];
        delete overlaysRef.current.labels[vid];
      }
    });

    for (const vehicle of state.vehicles) {
      const vehiclePoint = projection.toLngLat(vehicle.position.x, vehicle.position.y);

      // --- 计算包含平滑插值的完整节点序列，供车辆动画和路线复用 ---
      const m = overlaysRef.current.vehicles[vehicle.id];
      const prevData = m?.getExtData?.() || {};
      const prevPath = prevData.path || [];
      const currentPathSet = new Set(vehicle.path);
      const passedNodes = prevPath.filter((nodeId: string) => !currentPathSet.has(nodeId));

      let markerPos: LngLat | null = null;
      if (m && typeof m.getPosition === 'function') {
        const pos = m.getPosition();
        if (pos && typeof pos.getLng === 'function') {
          markerPos = [pos.getLng(), pos.getLat()] as LngLat;
        }
      }

      // 为了不让路线突然消失，需要包含车子当前「实际上正在经过的」节点
      const pathFromCurrentToBackend: LngLat[] = [];
      if (markerPos) {
        pathFromCurrentToBackend.push(markerPos);
      } else {
        pathFromCurrentToBackend.push(vehiclePoint);
      }

      for (const nodeId of passedNodes) {
        const node = state.graph.nodes.get(nodeId);
        if (node) {
          pathFromCurrentToBackend.push(projection.toLngLat(node.position.x, node.position.y));
        }
      }
      pathFromCurrentToBackend.push(vehiclePoint);

      // 车辆单次行程动画的轨迹数组（去重）
      const animPath: LngLat[] = [pathFromCurrentToBackend[0]];
      for (let i = 1; i < pathFromCurrentToBackend.length; i++) {
        const last = animPath[animPath.length - 1];
        const pt = pathFromCurrentToBackend[i];
        if (Math.abs(pt[0] - last[0]) > 0.000001 || Math.abs(pt[1] - last[1]) > 0.000001) {
          animPath.push(pt);
        }
      }

      // 将后端的剩余路径（vehicle.path）拼接到后续路线中以绘制完整的线图
      const fullRoutePoints: LngLat[] = [...animPath];
      for (const nodeId of vehicle.path) {
        const node = state.graph.nodes.get(nodeId);
        if (node) {
          fullRoutePoints.push(projection.toLngLat(node.position.x, node.position.y));
        }
      }

      // 更新导航线
      if (fullRoutePoints.length > 1 && vehicle.status !== 'idle') {
        if (overlaysRef.current.routes[vehicle.id]) {
          (overlaysRef.current.routes[vehicle.id] as any).setPath(fullRoutePoints);
          (overlaysRef.current.routes[vehicle.id] as any).setMap(map);
        } else {
          const route = new (AMap as any).Polyline({
            path: fullRoutePoints,
            strokeColor: vehicle.color,
            strokeWeight: 3,
            strokeOpacity: 0.8,
            strokeStyle: 'dashed',
            lineJoin: 'round',
          });
          route.setMap(map);
          overlaysRef.current.routes[vehicle.id] = route;
        }
      } else {
        if (overlaysRef.current.routes[vehicle.id]) {
          overlaysRef.current.routes[vehicle.id].setMap(null);
        }
      }

      const size = selectedVehicleId === vehicle.id ? 28 : 20;
      const border = selectedVehicleId === vehicle.id ? '#f59e0b' : '#ffffff';
      // 移除整体的 translate 平移，将圆点置于容器的左上角 (0,0) 并用 Pixel(offset) 完全校准中心点！
      const contentStr = `
        <div style="position:relative; width:${size}px; height:${size}px; pointer-events:none; transition:all 0.3s;">
          <div style="position:absolute; bottom:${size + 4}px; left:50%; transform:translateX(-50%); color:#0f172a; font-size:11px; font-weight:700; padding:1px 4px; background-color:#ffffffcc; border:1px solid #94a3b8; border-radius:8px; white-space:nowrap;">
            ${vehicle.name}
          </div>
          <div style="width:${size}px; height:${size}px; background-color:${vehicle.color}; border-radius:50%; border:${selectedVehicleId === vehicle.id ? 3 : 2}px solid ${border}; box-shadow:0 0 5px rgba(0,0,0,0.5); box-sizing:border-box; transition:all 0.3s;"></div>
        </div>
      `;
      const currentContentProps = `${vehicle.name}-${vehicle.color}-${selectedVehicleId === vehicle.id}`;
      const nowTime = Date.now();

      // 更新车辆 Marker
      if (m) {
        const prevTime = prevData.time || nowTime;
        const dt = Math.max(nowTime - prevTime, 100);
        const tickDurationMs = Math.min(Math.max(dt, 100), 2000); // Usually 250~1000ms
        
        if (typeof m.stopMove === 'function') {
          m.stopMove();
        }

        if (animPath.length > 1) {
           const distMeters = getPathLengthMeters(animPath);
           const distKm = distMeters / 1000;
           // Extend expected time by 15% to smooth network jitter, avoiding full stops
           const hours = (tickDurationMs * 1.15) / 3600000; 
           const kmph = hours > 0 ? (distKm / hours) : 0;
           
           if (kmph > 0 && typeof m.moveAlong === 'function' && animPath.length > 2) {
             m.moveAlong(animPath, { speed: kmph, autoRotation: false });
           } else if (kmph > 0 && typeof m.moveTo === 'function') {
             m.moveTo(animPath[1], { speed: kmph, autoRotation: false });
           } else {
             m.setPosition(vehiclePoint);
           }
        } else {
           m.setPosition(vehiclePoint);
        }

        if (currentContentProps !== prevData.contentProps) {
          m.setContent(contentStr);
          // 尺寸如果有变，需要动态调整 Offset 回准中心
          m.setOffset(new (AMap as any).Pixel(-size/2, -size/2));
        }
        
        if (m.setExtData) {
          m.setExtData({ contentProps: currentContentProps, status: vehicle.status, path: [...vehicle.path], time: nowTime });
        }
      } else {
        const marker = new (AMap as any).Marker({
          position: vehiclePoint,
          content: contentStr,
          offset: new (AMap as any).Pixel(-size/2, -size/2), // 完美居中圆点
          zIndex: 120,
          extData: { 
            contentProps: currentContentProps,
            status: vehicle.status,
            path: [...vehicle.path],
            time: nowTime
          },
        });

        marker.setMap(map);
        overlaysRef.current.vehicles[vehicle.id] = marker;
      }

      // 车辆标签逻辑合并入车体Marker内，此处不再独立生成标签
    }

    if (!hasFitViewRef.current && projection.bboxPoints.length > 1) {
      const boundsMask = projection.bboxPoints.map((point): AMapOverlay =>
        new AMap.CircleMarker({ center: point, radius: 0.1, fillOpacity: 0, strokeOpacity: 0 })
      );
      map.add(boundsMask);
      map.setFitView(boundsMask, false, [60, 60, 60, 60], 14);

      if (AMap.Bounds && map.setLimitBounds) {
        const lngList = projection.bboxPoints.map((p) => p[0]);
        const latList = projection.bboxPoints.map((p) => p[1]);
        const minLng = Math.min(...lngList);
        const maxLng = Math.max(...lngList);
        const minLat = Math.min(...latList);
        const maxLat = Math.max(...latList);
        map.setLimitBounds(new AMap.Bounds([minLng, minLat], [maxLng, maxLat]));
      }

      boundsMask.forEach((b) => b.setMap(null));
      hasFitViewRef.current = true;
    }
  }, [
    state,
    center,
    spanDegree,
    maxRoadSegments,
    maxNodeMarkers,
    showRoadSegments,
    showRoadNodeMarkers,
    selectedVehicleId,
    onNodeClick,
  ]);

  if (loadStatus === 'error') {
    return (
      <div
        className="rounded-lg border border-red-800/60 bg-red-950/40 p-4 text-sm text-red-200"
        style={{ width, height }}
      >
        未能加载高德地图。请在 UI 目录配置 .env.local 并提供 NEXT_PUBLIC_AMAP_KEY。
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden border border-gray-700" style={{ width, height }}>
      {loadStatus === 'loading' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900/60 text-sm text-gray-200 backdrop-blur-sm">
          正在加载高德地图...
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute left-3 top-3 z-20 rounded-md bg-gray-900/80 px-3 py-2 text-xs text-gray-100">
        实时地图模式（高德底图 + 仿真叠加）
      </div>
      <div className="pointer-events-none absolute right-3 top-3 z-20 rounded-md bg-gray-900/80 px-3 py-2 text-xs text-gray-100">
        已抽稀显示: 路段≤{maxRoadSegments} 节点≤{maxNodeMarkers}
        {showRoadSegments ? '（显示道路线）' : '（隐藏道路线）'}
        {showRoadNodeMarkers ? '（显示道路节点）' : '（隐藏道路节点）'}
      </div>
    </div>
  );
};

export default AMapRealtimeMap;
