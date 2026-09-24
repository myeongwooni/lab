#!/usr/bin/env bash
# apps/* 마다 Vercel 프로젝트가 있는지 확인하고, 없으면 만들어 첫 배포를 띄웁니다.
# 모든 프로젝트에 "변경 없는 앱은 배포 건너뛰기"를 켭니다. 그 밖의 설정은 건드리지 않고,
# 이후 배포는 Vercel Git 연동이 맡습니다.
#
# 필요한 환경변수
#   VERCEL_TOKEN     Vercel 액세스 토큰
#   VERCEL_TEAM_ID   프로젝트가 속한 Vercel 팀 ID
#   GITHUB_REPO      owner/repo
#   GITHUB_REPO_ID   GitHub 저장소 숫자 ID (첫 배포에 필요)
#   DEPLOY_REF       첫 배포할 브랜치 (기본 main)
set -euo pipefail

api="https://api.vercel.com"
team="teamId=${VERCEL_TEAM_ID}"
auth=(-H "Authorization: Bearer ${VERCEL_TOKEN}" -H "Content-Type: application/json")
ref="${DEPLOY_REF:-main}"

projects=$(curl -fsS "${auth[@]}" "${api}/v9/projects?${team}&limit=100")

# 푸시마다 모든 앱이 빌드되지 않도록, 앱 폴더와 그 의존성이 바뀐 커밋만 배포하게 합니다.
skip_unaffected() {
  local project="$1"
  curl -fsS "${auth[@]}" -X PATCH "${api}/v9/projects/${project}?${team}" \
    -d '{"enableAffectedProjectsDeployments": true}' >/dev/null
  echo "  변경 없는 커밋은 배포 건너뛰기: 켬"
}

for dir in apps/*/; do
  dir="${dir%/}"
  [ -f "${dir}/package.json" ] || continue
  name=$(basename "${dir}")

  # 이름이 달라도 같은 Root Directory로 이 저장소에 연결된 프로젝트가 있으면 그걸로 칩니다.
  existing=$(jq -r --arg root "${dir}" --arg repo "${GITHUB_REPO#*/}" \
    '.projects[] | select(.rootDirectory == $root and .link.repo == $repo)
     | "\(.name) \(.enableAffectedProjectsDeployments // false)"' <<<"${projects}" | head -n1)
  if [ -n "${existing}" ]; then
    read -r existing_name skipping <<<"${existing}"
    echo "✓ ${dir} → ${existing_name}"
    [ "${skipping}" = "true" ] || skip_unaffected "${existing_name}"
    continue
  fi

  echo "+ ${dir}: Vercel 프로젝트 ${name} 생성"
  body=$(jq -n --arg name "${name}" --arg root "${dir}" --arg repo "${GITHUB_REPO}" \
    '{name: $name, framework: "nextjs", rootDirectory: $root, gitRepository: {type: "github", repo: $repo}}')
  curl -fsS "${auth[@]}" -X POST "${api}/v11/projects?${team}" -d "${body}" >/dev/null
  skip_unaffected "${name}"

  # 프로젝트를 만든 푸시는 이미 지나갔으므로 첫 배포는 직접 띄웁니다.
  body=$(jq -n --arg name "${name}" --arg ref "${ref}" --argjson repoId "${GITHUB_REPO_ID}" \
    '{name: $name, project: $name, target: "production", gitSource: {type: "github", repoId: $repoId, ref: $ref}}')
  url=$(curl -fsS "${auth[@]}" -X POST "${api}/v13/deployments?${team}" -d "${body}" | jq -r '.url')
  echo "  배포 시작: https://${url}"
  echo "- \`${dir}\` → Vercel 프로젝트 \`${name}\` 생성, 배포 https://${url}" >>"${GITHUB_STEP_SUMMARY:-/dev/null}"
done
