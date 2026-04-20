filepath = "app/components/AMapRealtimeMap.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

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

const AMapRealtimeMap"""

content = content.replace("const AMapRealtimeMap", dist_func)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
