filepath = "../../UI/logistics-ui/app/components/AMapRealtimeMap.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

import re

# We will replace the block from `      // 更新车辆 Marker` to `      // 车辆标签逻辑合并入车体Marker内，此处不再独立生成标签`
start_str = "      // 更新车辆 Marker\n      if (overlaysRef.current.vehicles[vehicle.id]) {"
end_str = "      // 车辆标签逻辑合并入车体Marker内，此处不再独立生成标签"

idx1 = content.find(start_str)
idx2 = content.find(end_str)

if idx1 != -1 and idx2 != -1:
    new_code = """      // 更新车辆 Marker
      if (overlaysRef.current.vehicles[vehicle.id]) {
        const m = overlaysRef.current.vehicles[vehicle.id];
        const prevData = m.getExtData?.() || {};
        const prevRouteSignature = prevData.routeSignature as string | undefined;

        // 使用车辆状态+剩余路径节点作为路线特征签名
        const currentRouteSignature = `${vehicle.status}|${vehicle.path.join('-')}`;
        
        let pathPoints: LngLat[] = [];
        
        // 我们利用后端仿真的恒定物理速度完全托管给 AMap，达到丝滑追踪。
        const speedFactor = state.config?.simulationSpeed || 1;
        const expectedKmph = vehicle.speed * speedFactor;

        // 检查车辆当前是否过度偏离了我们推算的理想物理连线（比如超过 30 米或更改了路线），如果是再触发更新动画路线
        let driftMeters = 0;
        let isMoving = false;
        
        if (typeof m.getPosition === 'function') {
          const pos = m.getPosition();
          if (pos && typeof pos.getLng === 'function') {
            driftMeters = getLngLatDistanceMeters([pos.getLng(), pos.getLat()], vehiclePoint);
            isMoving = true;
          }
        }
        
        // 阈值设为 40米：如果网络卡顿导致车辆偏移超过了 40米，强行矫正！否则我们相信 AMap Auto-Run。
        const isRouteChanged = currentRouteSignature !== prevRouteSignature;
        const needsResync = isRouteChanged || driftMeters > 40 || !isMoving;
        
        if (needsResync) {
          if (typeof m.stopMove === 'function') m.stopMove();

          // 重新构建一整条前方轨迹
          const fullPath: LngLat[] = [vehiclePoint];
          const dedupeSet = new Set<string>([`${vehiclePoint[0]},${vehiclePoint[1]}`]);

          for (const nodeId of vehicle.path) {
            const node = state.graph.nodes.get(nodeId);
            if (node) {
              const pt = projection.toLngLat(node.position.x, node.position.y);
              const key = `${pt[0]},${pt[1]}`;
              if (!dedupeSet.has(key)) {
                 fullPath.push(pt);
                 dedupeSet.add(key);
              }
            }
          }
          
          if (fullPath.length > 1 && expectedKmph > 0) {
             if (typeof m.moveAlong === 'function' && fullPath.length > 2) {
               m.moveAlong(fullPath, { speed: expectedKmph, autoRotation: false });
             } else if (typeof m.moveTo === 'function') {
               m.moveTo(fullPath[1], { speed: expectedKmph, autoRotation: false });
             } else {
               m.setPosition(vehiclePoint);
             }
          } else {
             m.setPosition(vehiclePoint);
          }
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
          m.setExtData({ contentProps: currentContentProps, routeSignature: currentRouteSignature, status: vehicle.status, path: [...vehicle.path] });
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
        
        const currentRouteSignature = `${vehicle.status}|${vehicle.path.join('-')}`;

        const marker = new (AMap as any).Marker({
          position: vehiclePoint,
          content: contentStr,
          offset: new (AMap as any).Pixel(0, 0),
          zIndex: 120,
          extData: { 
            contentProps: `${vehicle.name}-${vehicle.color}-${selectedVehicleId === vehicle.id}`,
            routeSignature: currentRouteSignature,
            status: vehicle.status,
            path: [...vehicle.path]
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
