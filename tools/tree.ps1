param(
    [string[]]$Ignore = @("node_modules", ".git", "dist")
)

Get-ChildItem -Recurse |
Where-Object {
    $path = $_.FullName
    -not ($Ignore | Where-Object { $path -match "\\$_(\\|$)" })
} |
ForEach-Object {
    $_.FullName.Replace((Get-Location).Path + "\", "")
}