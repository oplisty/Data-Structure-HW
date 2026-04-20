filepath = "app/components/AMapRealtimeMap.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

import re

# Remove the one I injected (at the top near buildProjection)
content = re.sub(r'function getLngLatDistanceMeters.*?return earthRadius \* c;\n}\n\n', '', content, flags=re.DOTALL)
content = re.sub(r'function getPathLengthMeters.*?return total;\n}\n\n', '', content, flags=re.DOTALL)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
