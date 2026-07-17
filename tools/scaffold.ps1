param(
    [Parameter(Mandatory = $true)]
    [string]$Feature
)

$base = "src/features/$Feature"

$folders = @(
    "$base/components",
    "$base/hooks",
    "$base/pages",
    "$base/services",
    "$base/types",
    "$base/utils"
)

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Force -Path $folder | Out-Null
}

$files = @{
    "$base/index.ts" = ""
    "$base/pages/$($Feature)Page.tsx" = @"
export default function $($Feature)Page() {
  return (
    <div>
      <h1>$Feature</h1>
    </div>
  );
}
"@
}

foreach ($file in $files.GetEnumerator()) {
    Set-Content -Path $file.Key -Value $file.Value
}

Write-Host ""
Write-Host "[OK] Feature '$Feature' created successfully."