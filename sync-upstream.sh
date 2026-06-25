#!/usr/bin/env bash
# 从上游 dler-io/Rules 拉更新，但默认只「看」不「合」。
# 只对 used-rulesets.txt 里实际用到的文件做 diff，更新永远是你过目后的动作。
#
# 用法：
#   bash sync-upstream.sh            # 仅显示上游与本地的差异（不改任何文件）
#   bash sync-upstream.sh --merge    # 把上游 main 合并进当前分支（你确认后再跑）
set -euo pipefail
cd "$(dirname "$0")"

MANIFEST="used-rulesets.txt"
MERGE=0
[[ "${1:-}" == "--merge" ]] && MERGE=1

git remote get-url upstream >/dev/null 2>&1 || \
  git remote add upstream https://github.com/dler-io/Rules.git

echo "==> fetch upstream ..."
git fetch upstream --quiet

echo "==> 与 upstream/main 的差异（仅限引用到的规则集）："
echo
changed=0
while IFS= read -r path; do
  [[ -z "$path" || "$path" == \#* ]] && continue
  # Custom/ 是自有文件，不参与上游 diff
  [[ "$path" == Custom/* ]] && continue
  if ! git diff --quiet HEAD upstream/main -- "$path" 2>/dev/null; then
    echo "--- $path ---"
    git --no-pager diff HEAD upstream/main -- "$path" | sed -n '1,40p'
    echo
    changed=$((changed + 1))
  fi
done < "$MANIFEST"

if [[ $changed -eq 0 ]]; then
  echo "（引用到的规则集与上游一致，无需更新）"
  exit 0
fi

echo "==> 共 $changed 个引用文件与上游不同。"
if [[ $MERGE -eq 1 ]]; then
  echo "==> 合并 upstream/main ..."
  git merge upstream/main
  echo "完成。记得跑 inventory.sh 刷新清单，再 push。"
else
  echo "如确认采纳：bash sync-upstream.sh --merge"
fi
