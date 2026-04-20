filepath = "app/components/AMapRealtimeMap.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# We need to replace the section from "      // 更新车辆 Marker" up to "      // 车辆标签逻辑合并入车体Marker内，此处不再独立生成标签"
start_str = "      // 更新车辆 Marker\n      if (overlaysRef.current.vehicles[vehicle.id]) {"
end_str = "      // 车辆标签逻辑合并入车体Marker内，此处不再独立生成标签"

import re
idx1 = content.find(start_str)
idx2 = content.find(end_str)

if idx1 != -1 and idx2 != -1:
    new_code = """      // 更新车辆 Marker
      if (overlaysRef.current.vehicles[vehicle.id]) {
        const m = overlaysRef.current.vehicles[vehicle.id];
        const prevData = m.getExtData?.() || {};
        const prevPath = prevData.path || [];
        
        let pathPoints: LngLat[] = [];
        
        // 尝试获取当前标记的实际停留位置作为起点
        if (typeof m.getPosition === 'function') {
          const pos = m.getPosition();
          if (pos && typeof pos.getLng === 'function') {
            pathPoints.push([pos.getLng(), pos.getLat()] as LngLat);
          }
        }
        
        // 如果没有获取到起点，或者起点和当前坐标一样，则至少保证有一个当前点
        if (pathPoints.length === 0) {
          pathPoints.push(vehiclePoint);
        }

        // 推算在这一个 Tick 中，车辆穿越了哪些中间节点
        // prevPath 包含了上个时刻车辆需要经过的所有剩余节点
        // vehicle.path 包含了当前时刻车辆需要经过的所有剩余节点
        // 找出 prevPath 中存在但 vehicle.path 中已经不存在的节点（表示已被经过）
        const currentPathSet = new Set(vehicle.path);
        const passedNodes = prevPath.filter((nodeId: string) => !currentPathSet.has(nodeId));

        for (const nodeId of passedNodes) {
          const node = state.graph.nodes.get(nodeId);
          if (node) {
            pathPoints.push(projection.toLngLat(node.position.x, node.position.y));
          }
        }
        
        // 最后加上车辆当前新状态的精确坐标
        pathPoints.push(vehiclePoint);

        // 去除过于接近的重复点，以免 moveAlong 因端点重合而出错
        const animPath: LngLat[] = [pathPoints[0]];
        for (let i = 1; i < pathPoints.length; i++) {
          const last = animPath[animPath.length - 1];
          const pt = pathPoints[i];
          if (Math.abs(pt[0] - last[0]) > 0.000001 || Math.abs(pt[1] - last[1]) > 0.000001) {
            animPath.push(pt);
          }
        }

        const speedFactor = state.config?.simulationSpeed || 1;
        // The default tick is expected to be 250ms base time in backend
        const tickDuration = 250 / Math.max(speedFactor, 0.1);
        
        // 停掉之前的残留动画
        if (typeof m.stopMove === 'function') {
          m.stopMove();
        }

        // 如果形成了多段路径，用 moveAlong。如果只有直线起点和终点，用 moveTo
        if (animPath.length > 2 && typeof m.moveAlong === 'function') {
           // 稍微延长5%以覆盖微小的网络抖动
           m.moveAlong(animPath, { duration: tickDuration * 1.05, autoRotation: false });
        } else if (animPath.length === 2 && typeof m.moveTo === 'function') {
           m.moveTo(animPath[1], { duration: tickDuration * 1.05, autoRotation: false });
        } else {
           m.setPosition(vehiclePoint);
        }

        const currentContentProps = `${vehicle.name}-${vehicle.color}-${selectedVehicleId === vehicle.id}`;
        const prevContentProps = prevData.contentProps;

        if (currentContentProps !== prevContentProps) {
          const size = selectedVehicleId === vehicle.id ? 28 : 20;
          const border = selectedVehicleId === vehicle.id ? '#f59e0b' : '#ffffff';
          const contentStr = `
            <div style="position:relative; display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -50%); transition:all 0.3s; pointer-events:none;">
              <div style="margin-bottom:4px;color:#0f172a;font-size:11px;font-weight:700;padding:1px 4px;background-color:#ffffffcc;border:1px solid #94a3b8;border-radius:8px;white-space:nowrap;">
                ${vehicle.name}
              </div>
              <div style="width:${size}px;height:${size}px;background-color:${vehicle.color};border-radius:50%;border:${selectedVehicleId === vehicle.id ? 3 : 2}px solid ${border};box-shadow:0 0 5px rgba(0,0,0,0.5); transition:all 0.3s; box-sizing:border-box;"></div>
            </div>
          `;
          m.setContent(contentStr);
        }
        
        if (m.setExtData) {
          m.setExtData({ contentProps: currentContentProps, status: vehicle.status, path: vehicle.path });
        }
      } else {
        const size = selectedVehicleId === vehicle.id ? 28 : 20;
        const border = selectedVehicleId === vehicle.id ? '#f59e0b' : '#ffffff';
        const contentStr = `
          <div style="position:relative; display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -50%); transition:all 0.3s; pointer-events:none;">
            <div style="margin-bottom:4px;color:#0f172a;font-size:11px;font-weight:700;padding:1px 4px;background-color:#ffffffcc;border:1px solid #94a3b8;border-radius:8px;white-space:nowrap;">
              ${vehicle.name}
            </div>
            <div style="width:${size}px;height:${size}px;background-color:${vehicle.color};border-radius:50%;border:${selectedVehicleId === vehicle.id ? 3 : 2}px solid ${border};box-shadow:0 0 5px rgba(0,0,0,0.5); box-sizing:border-box;"></div>
          </div>
        `;
        
        const marker = new (AMap as any).Marker({
          position: vehiclePoint,
          content: contentStr,
          offset: new (AMap as any).Pixel(0, 0),
          zIndex: 120,
          extData: { 
            contentProps: `${vehicle.name}-${vehicle.color}-${selectedVehicleId === vehicle.id}`,
            status: vehicle.status,
            path: vehicle.path
          },
        });

        marker.setMap(map);
        overlaysRef.current.vehicles[vehicle.id] = marker;
      }

"""
    new_content = content[:idx1] + new_code + content[idx2:]
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Injected logic properly.")
else:
    print("Could not find boundaries.")
