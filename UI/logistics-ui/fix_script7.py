filepath = "app/components/AMapRealtimeMap.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

import re

# Insert getLngLatDistanceMeters before buildProjection or deduction
idx = content.find("function buildProjection(")
if idx != -1:
    dist_func = """function getLngLatDistanceMeters(a: LngLat, b: LngLat): number {
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

"""
    content = content[:idx] + dist_func + content[idx:]

# Now replace the vehicle update logic
start_str = "      // 更新车辆 Marker\n      if (overlaysRef.current.vehicles[vehicle.id]) {"
end_str = "      // 车辆标签逻辑合并入车体Marker内，此处不再独立生成标签"

idx1 = content.find(start_str)
idx2 = content.find(end_str)

if idx1 != -1 and idx2 != -1:
    new_code = """      // 更新车辆 Marker
      if (overlaysRef.current.vehicles[vehicle.id]) {
        const m = overlaysRef.current.vehicles[vehicle.id];
        const prevData = m.getExtData?.() || {};
        const prevPath = prevData.path || [];
        
        let pathPoints: LngLat[] = [];
        
        if (typeof m.getPosition === 'function') {
          const pos = m.getPosition();
          if (pos && typeof pos.getLng === 'function') {
            pathPoints.push([pos.getLng(), pos.getLat()] as LngLat);
          }
        }
        
        if (pathPoints.length === 0) {
          pathPoints.push(vehiclePoint);
        }

        const currentPathSet = new Set(vehicle.path);
        const passedNodes = prevPath.filter((nodeId: string) => !currentPathSet.has(nodeId));

        for (const nodeId of passedNodes) {
          const node = state.graph.nodes.get(nodeId);
          if (node) {
            pathPoints.push(projection.toLngLat(node.position.x, node.position.y));
          }
        }
        
        pathPoints.push(vehiclePoint);

        const animPath: LngLat[] = [pathPoints[0]];
        for (let i = 1; i < pathPoints.length; i++) {
          const last = animPath[animPath.length - 1];
          const pt = pathPoints[i];
          if (Math.abs(pt[0] - last[0]) > 0.000001 || Math.abs(pt[1] - last[1]) > 0.000001) {
            animPath.push(pt);
          }
        }

        const speedFactor = state.config?.simulationSpeed || 1;
        const tickDurationMs = 250 / Math.max(speedFactor, 0.1);
        
        if (typeof m.stopMove === 'function') {
          m.stopMove();
        }

        if (animPath.length > 1) {
           const distMeters = getPathLengthMeters(animPath);
           const distKm = distMeters / 1000;
           // Extend expected time by 5% to smooth network jitter, avoiding full stops
           const hours = (tickDurationMs * 1.05) / 3600000; 
           let kmph = hours > 0 ? (distKm / hours) : 0;
           
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
          m.setExtData({ contentProps: currentContentProps, status: vehicle.status, path: [...vehicle.path] });
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
