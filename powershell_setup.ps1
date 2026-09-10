# Run from PowerShell: .\powershell_setup.ps1
# Updates only this terminal's PATH; does not install anything or change your profile.
$partizipRuntime = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies'
$partizipNodeDir = Join-Path $partizipRuntime 'node\bin'
$partizipPnpmDir = Join-Path $partizipRuntime 'bin\fallback'

if (!(Test-Path -LiteralPath (Join-Path $partizipNodeDir 'node.exe')) -or
    !(Test-Path -LiteralPath (Join-Path $partizipPnpmDir 'pnpm.cmd'))) {
    throw 'Bundled Node.js/pnpm were not found. Install Node.js 22.18+ and pnpm, or update the runtime path in powershell_setup.ps1.'
}

# Remove existing copies before prepending, so repeated setup does not grow PATH.
$partizipOtherPaths = $env:PATH -split ';' | Where-Object {
    $_ -and $_.TrimEnd('\') -ine $partizipNodeDir -and $_.TrimEnd('\') -ine $partizipPnpmDir
}
$env:PATH = (@($partizipNodeDir, $partizipPnpmDir) + @($partizipOtherPaths)) -join ';'

Write-Host 'Project tools enabled for this PowerShell window.'
& (Join-Path $partizipNodeDir 'node.exe') --version
& (Join-Path $partizipPnpmDir 'pnpm.cmd') --version
Write-Host 'Start the website with: pnpm dev'
