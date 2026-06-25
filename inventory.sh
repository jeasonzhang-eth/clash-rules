#!/usr/bin/env bash
# 扫描 used-rulesets.txt 列出的规则集，生成 INVENTORY.md。
# 让你一眼看清每个集：条目数、首行注释、出现的规则类型。
# 用法：bash inventory.sh   （在本仓根目录运行）
set -euo pipefail
cd "$(dirname "$0")"

MANIFEST="used-rulesets.txt"
OUT="INVENTORY.md"

{
  echo "# 规则集清单（自有 clash-rules）"
  echo
  echo "> 由 \`inventory.sh\` 自动生成，覆盖 \`used-rulesets.txt\` 中 override.js 实际引用的规则集。"
  echo "> 重新生成：\`bash inventory.sh\`"
  echo
  echo "| 规则集 | 文件 | 条目数 | 规则类型 | 首行注释 |"
  echo "|--------|------|-------:|----------|----------|"
} > "$OUT"

total=0
while IFS= read -r path; do
  [[ -z "$path" || "$path" == \#* ]] && continue
  name="$(basename "$path" .yaml)"
  if [[ ! -f "$path" ]]; then
    echo "| $name | \`$path\` | — | **缺失** | — |" >> "$OUT"
    continue
  fi
  # 条目数：payload 下以 - 开头的非注释行
  count=$(grep -E '^\s*-\s' "$path" | grep -vc '^\s*#' || true)
  # 出现的规则类型
  types=$(grep -E '^\s*-\s' "$path" | sed -E 's/^\s*-\s*//; s/,.*//' | sort -u | paste -sd '/' - || true)
  # 首行注释（payload 下第一条 # 注释）
  comment=$(grep -E '^\s*#' "$path" | head -1 | sed -E 's/^\s*#\s*//; s/\|/\\|/g' || true)
  echo "| $name | \`$path\` | $count | $types | $comment |" >> "$OUT"
  total=$((total + count))
done < "$MANIFEST"

{
  echo
  echo "**合计域名/规则条目：${total}**（去重前，按文件累加）"
} >> "$OUT"

echo "生成完成 -> ${OUT} （合计条目 ${total}）"
