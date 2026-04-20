filepath = "../../UI/logistics-ui/app/components/AMapRealtimeMap.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

idx1 = content.find("        // 使用车辆状态+剩余路径节点作为路线特征签名\n        const currentRouteSignature = ")
if idx1 != -1:
    idx2 = content.find("const isRouteChanged", idx1)
    if idx2 != -1:
        new_logic = """        // 使用最终目的地和大致结构作为稳定签名
        const currentRouteStr = vehicle.path.join('-');
        const prevRouteStr = prevData.routeStr || '';
        
        let pathPoints: LngLat[] = [];
        
        // 利用后端仿真的恒定物理速度完全托管给 AMap，达到丝滑追踪。
        const speedFactor = state.config?.simulationSpeed || 1;
        const expectedKmph = vehicle.speed * speedFactor;

        // 检查车辆当前是否过度偏离了我们推算的理想物理连线
        let driftMeters = 0;
        let isMoving = false;
        
        if (typeof m.getPosition === 'function') {
          const pos = m.getPosition();
          if (pos && typeof pos.getLng === 'function') {
            driftMeters = getLngLatDistanceMeters([pos.getLng(), pos.getLat()], vehiclePoint);
            isMoving = true;
          }
        }
        
        // 判断是否仅仅是车辆路过了节点（路径变短）。若是，不打断动画！
        const isJustShrinked = prevRouteStr.length > 0 && currentRouteStr.length > 0 && prevRouteStr.endsWith(currentRouteStr);
        const isRouteChanged = !isJustShrinked && (currentRouteStr !== prevRouteStr || prevData.status !== vehicle.status);
        
"""
        content = content[:idx1] + new_logic + content[idx2 + 20:]
        content = content.replace("routeSignature: currentRouteSignature", "routeStr: currentRouteStr")
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print("Updated shrink logic!")
