'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { SimulationState } from '../types';
import AMapRealtimeMap from './AMapRealtimeMap';

interface MapCanvasProps {
  state: SimulationState;
  width?: number;
  height?: number;
  onNodeClick?: (nodeId: string) => void;
  selectedVehicleId?: string;
}

const CanvasMapFallback: React.FC<MapCanvasProps> = ({
  state,
  width = 800,
  height = 600,
  onNodeClick,
  selectedVehicleId
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  // 计算地图缩放和偏移
  const calculateTransform = useCallback(() => {
    const nodes = Array.from(state.graph.nodes.values());
    if (nodes.length === 0) return { scale: 1, offsetX: 0, offsetY: 0 };

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    nodes.forEach(node => {
      minX = Math.min(minX, node.position.x);
      maxX = Math.max(maxX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxY = Math.max(maxY, node.position.y);
    });

    const padding = 50;
    const mapWidth = maxX - minX || 1;
    const mapHeight = maxY - minY || 1;

    const scaleX = (width - padding * 2) / mapWidth;
    const scaleY = (height - padding * 2) / mapHeight;
    const newScale = Math.min(scaleX, scaleY) * scale;

    const offsetX = padding - minX * newScale + (width - mapWidth * newScale) / 2 + offset.x;
    const offsetY = padding - minY * newScale + (height - mapHeight * newScale) / 2 + offset.y;

    return { scale: newScale, offsetX, offsetY };
  }, [state.graph.nodes, width, height, scale, offset]);

  // 坐标转换
  const transformPoint = useCallback((x: number, y: number, transform: { scale: number; offsetX: number; offsetY: number }) => {
    return {
      x: x * transform.scale + transform.offsetX,
      y: y * transform.scale + transform.offsetY
    };
  }, []);

  // 绘制道路
  const drawRoads = useCallback((ctx: CanvasRenderingContext2D, transform: { scale: number; offsetX: number; offsetY: number }) => {
    const edges = Array.from(state.graph.edges.values()).flat();
    const drawnEdges = new Set<string>();

    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;

    edges.forEach(edge => {
      const edgeKey = [edge.from, edge.to].sort().join('-');
      if (drawnEdges.has(edgeKey)) return;
      drawnEdges.add(edgeKey);

      const fromNode = state.graph.nodes.get(edge.from);
      const toNode = state.graph.nodes.get(edge.to);
      if (!fromNode || !toNode) return;

      const from = transformPoint(fromNode.position.x, fromNode.position.y, transform);
      const to = transformPoint(toNode.position.x, toNode.position.y, transform);

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();

      // 绘制道路权重（交通状况）
      if (edge.trafficFactor > 1.1) {
        ctx.save();
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        ctx.restore();
      }
    });
  }, [state.graph.edges, state.graph.nodes, transformPoint]);

  // 绘制节点
  const drawNodes = useCallback((ctx: CanvasRenderingContext2D, transform: { scale: number; offsetX: number; offsetY: number }) => {
    const nodes = Array.from(state.graph.nodes.values());

    nodes.forEach(node => {
      const pos = transformPoint(node.position.x, node.position.y, transform);
      const isHovered = hoveredNode === node.id;

      ctx.beginPath();

      switch (node.type) {
        case 'warehouse':
          // 仓库 - 方形
          ctx.fillStyle = isHovered ? '#60A5FA' : '#3B82F6';
          ctx.fillRect(pos.x - 12, pos.y - 12, 24, 24);
          ctx.strokeStyle = '#1E40AF';
          ctx.lineWidth = 2;
          ctx.strokeRect(pos.x - 12, pos.y - 12, 24, 24);
          
          // 仓库图标
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('W', pos.x, pos.y);
          break;

        case 'charging_station':
          // 充电站 - 三角形
          ctx.fillStyle = isHovered ? '#34D399' : '#10B981';
          ctx.beginPath();
          ctx.moveTo(pos.x, pos.y - 14);
          ctx.lineTo(pos.x - 12, pos.y + 10);
          ctx.lineTo(pos.x + 12, pos.y + 10);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#059669';
          ctx.lineWidth = 2;
          ctx.stroke();

          // 闪电图标
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 10px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⚡', pos.x, pos.y + 2);
          break;

        default:
          // 普通路口 - 小圆点
          ctx.fillStyle = isHovered ? '#9CA3AF' : '#6B7280';
          ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
          ctx.fill();
      }
    });
  }, [state.graph.nodes, transformPoint, hoveredNode]);

  // 绘制任务点
  const drawTasks = useCallback((ctx: CanvasRenderingContext2D, transform: { scale: number; offsetX: number; offsetY: number }) => {
    const activeTasks = state.tasks.filter(t => 
      t.status === 'pending' || t.status === 'assigned' || t.status === 'in_progress'
    );

    activeTasks.forEach(task => {
      const pos = transformPoint(task.position.x, task.position.y, transform);

      // 根据优先级选择颜色
      let color = '#6B7280';
      switch (task.priority) {
        case 'urgent': color = '#EF4444'; break;
        case 'high': color = '#F59E0B'; break;
        case 'medium': color = '#3B82F6'; break;
        case 'low': color = '#10B981'; break;
      }

      // 绘制任务标记（菱形）
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(Math.PI / 4);
      
      ctx.fillStyle = task.status === 'pending' ? color : `${color}88`;
      ctx.fillRect(-8, -8, 16, 16);
      ctx.strokeStyle = task.status === 'pending' ? '#1F2937' : '#9CA3AF';
      ctx.lineWidth = 2;
      ctx.strokeRect(-8, -8, 16, 16);
      
      ctx.restore();

      // 显示任务重量
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 9px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${task.weight}`, pos.x, pos.y);

      // 超时警告
      const timeLeft = task.deadline - state.currentTime;
      if (timeLeft < 10 && task.status === 'pending') {
        ctx.fillStyle = '#EF4444';
        ctx.font = 'bold 10px Arial';
        ctx.fillText('!', pos.x + 15, pos.y - 10);
      }
    });
  }, [state.tasks, state.currentTime, transformPoint]);

  // 绘制车辆
  const drawVehicles = useCallback((ctx: CanvasRenderingContext2D, transform: { scale: number; offsetX: number; offsetY: number }) => {
    state.vehicles.forEach(vehicle => {
      const pos = transformPoint(vehicle.position.x, vehicle.position.y, transform);
      const isSelected = selectedVehicleId === vehicle.id;

      // 绘制路径
      if (vehicle.path.length > 0 && (vehicle.status === 'delivering' || vehicle.status === 'returning')) {
        ctx.save();
        ctx.strokeStyle = `${vehicle.color}66`;
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        
        const startPos = transformPoint(vehicle.position.x, vehicle.position.y, transform);
        ctx.moveTo(startPos.x, startPos.y);

        vehicle.path.forEach(nodeId => {
          const node = state.graph.nodes.get(nodeId);
          if (node) {
            const nodePos = transformPoint(node.position.x, node.position.y, transform);
            ctx.lineTo(nodePos.x, nodePos.y);
          }
        });
        
        ctx.stroke();
        ctx.restore();
      }

      // 选中高亮
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
        ctx.fillStyle = `${vehicle.color}33`;
        ctx.fill();
        ctx.strokeStyle = vehicle.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 车辆主体
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = vehicle.color;
      ctx.fill();
      ctx.strokeStyle = '#1F2937';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 车辆方向指示
      if (vehicle.path.length > 1) {
        const nextNode = state.graph.nodes.get(vehicle.path[1]);
        if (nextNode) {
          const targetPos = transformPoint(nextNode.position.x, nextNode.position.y, transform);
          const angle = Math.atan2(targetPos.y - pos.y, targetPos.x - pos.x);
          
          ctx.save();
          ctx.translate(pos.x, pos.y);
          ctx.rotate(angle);
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.moveTo(8, 0);
          ctx.lineTo(2, -4);
          ctx.lineTo(2, 4);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }

      // 电量指示器
      const batteryWidth = 20;
      const batteryHeight = 4;
      const batteryX = pos.x - batteryWidth / 2;
      const batteryY = pos.y + 16;

      ctx.fillStyle = '#374151';
      ctx.fillRect(batteryX, batteryY, batteryWidth, batteryHeight);
      
      let batteryColor = '#10B981';
      if (vehicle.battery < 20) batteryColor = '#EF4444';
      else if (vehicle.battery < 50) batteryColor = '#F59E0B';
      
      ctx.fillStyle = batteryColor;
      ctx.fillRect(batteryX, batteryY, batteryWidth * (vehicle.battery / 100), batteryHeight);

      // 状态指示
      if (vehicle.status === 'charging') {
        ctx.fillStyle = '#FBBF24';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⚡', pos.x, pos.y - 18);
      } else if (vehicle.status === 'waiting') {
        ctx.fillStyle = '#9CA3AF';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⏳', pos.x, pos.y - 18);
      }

      // 车辆编号
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 9px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${parseInt(vehicle.id.split('_')[1]) + 1}`, pos.x, pos.y);
    });
  }, [state.vehicles, state.graph.nodes, selectedVehicleId, transformPoint]);

  // 绘制充电站状态
  const drawChargingStationsStatus = useCallback((ctx: CanvasRenderingContext2D, transform: { scale: number; offsetX: number; offsetY: number }) => {
    state.chargingStations.forEach(station => {
      const pos = transformPoint(station.position.x, station.position.y, transform);

      // 绘制排队车辆数
      if (station.currentQueue.length > 0) {
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(pos.x + 15, pos.y - 15, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${station.currentQueue.length}`, pos.x + 15, pos.y - 15);
      }

      // 显示当前充电数/容量
      ctx.fillStyle = '#374151';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${station.chargingVehicles.length}/${station.capacity}`, pos.x, pos.y + 22);
    });
  }, [state.chargingStations, transformPoint]);

  // 绘制网格
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#1F2937';
    ctx.lineWidth = 0.5;

    const gridSize = 50;
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }, [width, height]);

  // 绘制图例
  const drawLegend = useCallback((ctx: CanvasRenderingContext2D) => {
    const legendX = 10;
    let legendY = height - 120;
    const itemHeight = 20;

    ctx.fillStyle = 'rgba(17, 24, 39, 0.8)';
    ctx.fillRect(legendX, legendY - 10, 120, 130);

    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.fillText('图例', legendX + 10, legendY);
    legendY += itemHeight;

    // 仓库
    ctx.fillStyle = '#3B82F6';
    ctx.fillRect(legendX + 10, legendY - 8, 16, 16);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '11px Arial';
    ctx.fillText('仓库', legendX + 32, legendY + 4);
    legendY += itemHeight;

    // 充电站
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.moveTo(legendX + 18, legendY - 8);
    ctx.lineTo(legendX + 10, legendY + 6);
    ctx.lineTo(legendX + 26, legendY + 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('充电站', legendX + 32, legendY + 4);
    legendY += itemHeight;

    // 任务
    ctx.save();
    ctx.translate(legendX + 18, legendY);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(-6, -6, 12, 12);
    ctx.restore();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('配送任务', legendX + 32, legendY + 4);
    legendY += itemHeight;

    // 车辆
    ctx.beginPath();
    ctx.arc(legendX + 18, legendY, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#3B82F6';
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('配送车辆', legendX + 32, legendY + 4);
  }, [height]);

  // 主绘制函数
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, width, height);

    // 绘制网格背景
    drawGrid(ctx);

    const transform = calculateTransform();

    // 按层次绘制
    drawRoads(ctx, transform);
    drawNodes(ctx, transform);
    drawTasks(ctx, transform);
    drawChargingStationsStatus(ctx, transform);
    drawVehicles(ctx, transform);
    drawLegend(ctx);

    // 显示当前时间
    ctx.fillStyle = 'rgba(17, 24, 39, 0.8)';
    ctx.fillRect(width - 150, 10, 140, 30);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'right';
    const hours = Math.floor(state.currentTime / 60);
    const minutes = Math.floor(state.currentTime % 60);
    ctx.fillText(`模拟时间: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`, width - 20, 30);
  }, [
    width, height, state, calculateTransform,
    drawGrid, drawRoads, drawNodes, drawTasks,
    drawVehicles, drawChargingStationsStatus, drawLegend
  ]);

  // 处理鼠标事件
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDragging) {
      setOffset({
        x: offset.x + (x - lastMousePos.x),
        y: offset.y + (y - lastMousePos.y)
      });
      setLastMousePos({ x, y });
      return;
    }

    // 检测节点悬停
    const transform = calculateTransform();
    let found = false;

    state.graph.nodes.forEach((node, id) => {
      const pos = transformPoint(node.position.x, node.position.y, transform);
      const dist = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
      if (dist < 15) {
        setHoveredNode(id);
        found = true;
      }
    });

    if (!found) {
      setHoveredNode(null);
    }
  }, [calculateTransform, transformPoint, state.graph.nodes, isDragging, offset, lastMousePos]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX - canvasRef.current!.getBoundingClientRect().left, y: e.clientY - canvasRef.current!.getBoundingClientRect().top });
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    if (hoveredNode && onNodeClick) {
      onNodeClick(hoveredNode);
    }
  }, [hoveredNode, onNodeClick]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.5, Math.min(3, prev * delta)));
  }, []);

  // 动画循环
  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="relative rounded-lg overflow-hidden border border-gray-700">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="cursor-grab active:cursor-grabbing"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
      />
      
      {/* 缩放控制 */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-2">
        <button
          onClick={() => setScale(prev => Math.min(3, prev * 1.2))}
          className="w-8 h-8 bg-gray-800 hover:bg-gray-700 text-white rounded flex items-center justify-center"
        >
          +
        </button>
        <button
          onClick={() => setScale(prev => Math.max(0.5, prev / 1.2))}
          className="w-8 h-8 bg-gray-800 hover:bg-gray-700 text-white rounded flex items-center justify-center"
        >
          -
        </button>
        <button
          onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }}
          className="w-8 h-8 bg-gray-800 hover:bg-gray-700 text-white rounded flex items-center justify-center text-xs"
        >
          ⟲
        </button>
      </div>

      {/* 悬停信息 */}
      {hoveredNode && (
        <div className="absolute top-3 left-3 bg-gray-800 text-white px-3 py-2 rounded text-sm">
          <span className="font-medium">
            {state.graph.nodes.get(hoveredNode)?.name || hoveredNode}
          </span>
        </div>
      )}
    </div>
  );
};

const MapCanvas: React.FC<MapCanvasProps> = ({
  state,
  width = 800,
  height = 600,
  onNodeClick,
  selectedVehicleId
}) => {
  const enableAmap = Boolean(process.env.NEXT_PUBLIC_AMAP_KEY);

  if (enableAmap) {
    return (
      <AMapRealtimeMap
        state={state}
        width={width}
        height={height}
        onNodeClick={onNodeClick}
        selectedVehicleId={selectedVehicleId}
      />
    );
  }

  return (
    <CanvasMapFallback
      state={state}
      width={width}
      height={height}
      onNodeClick={onNodeClick}
      selectedVehicleId={selectedVehicleId}
    />
  );
};

export default MapCanvas;
