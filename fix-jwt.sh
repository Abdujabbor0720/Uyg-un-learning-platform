#!/bin/bash

# Fix JWT usage in all API routes

echo "🔧 Fixing JWT usage in API routes..."

# Files to fix
files=(
  "app/api/users/all/route.ts"
  "app/api/users/status/route.ts"
  "app/api/users/role/route.ts"
  "app/api/admin/create-first-admin/route.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  Fixing: $file"
    # Add import at the top if not exists
    if ! grep -q "import { getUserFromToken" "$file"; then
      sed -i "1i import { getUserFromToken, createToken } from '@/lib/jwt';" "$file"
    fi
    
    # Remove old require('crypto') lines
    sed -i "/require('crypto')/d" "$file"
    
    # Remove btoa/atob usage
    sed -i "s/btoa(/Buffer.from(/g" "$file"
    sed -i "s/atob(/Buffer.from(/g" "$file"
  fi
done

echo "✅ JWT fixes applied!"
