# guber.uz serverini Windows noutbukda o'rnatish
# Ishga tushirish (PowerShell, "server" papkasida):
#   powershell -ExecutionPolicy Bypass -File .\install-windows.ps1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "`n=== guber.uz server o'rnatish (Windows) ===`n" -ForegroundColor Cyan

# 1. Docker bormi?
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Docker Desktop topilmadi." -ForegroundColor Yellow
    Write-Host "O'rnating: https://www.docker.com/products/docker-desktop/  (WSL2 bilan)"
    Write-Host "O'rnatgach kompyuterni qayta yoqing, Docker Desktop'ni oching va shu skriptni qayta ishga tushiring."
    exit 1
}
docker info *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker Desktop ishlamayapti. Uni oching, 1 daqiqa kuting va qayta urinib ko'ring." -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] Docker ishlayapti" -ForegroundColor Green

# 2. Noutbuk uxlab qolmasin (zaryadga ulanganda)
powercfg /change standby-timeout-ac 0
powercfg /change hibernate-timeout-ac 0
powercfg /setacvalueindex SCHEME_CURRENT SUB_BUTTONS LIDACTION 0
powercfg /setactive SCHEME_CURRENT
Write-Host "[OK] Zaryadda: uyqu o'chirildi, qopqoq yopilsa ham ishlaydi" -ForegroundColor Green

# 3. .env
if (-not (Test-Path .env)) { Copy-Item .env.example .env }

# 4. Cloudflare (token hali bo'lmasa)
$hasToken = Select-String -Path .env -Pattern '^CF_TUNNEL_TOKEN=.+' -Quiet
if (-not $hasToken) {
    Write-Host "`nCloudflare sozlanadi. API token kerak bo'ladi (QOLLANMA.md, 3-qadam).`n" -ForegroundColor Cyan
    docker compose run --rm cf-setup
    if ($LASTEXITCODE -ne 0) { Write-Host "Cloudflare sozlanmadi. Xatoni o'qib, qayta urinib ko'ring." -ForegroundColor Red; exit 1 }
}

# 5. Ishga tushirish
docker compose up -d
if ($LASTEXITCODE -ne 0) { exit 1 }
docker compose ps
Write-Host "`n[OK] Server ishlayapti!" -ForegroundColor Green
Write-Host "  Noutbukda tekshirish: http://localhost:8080"
Write-Host "  Internetda:           https://guber.uz  (1-2 daqiqadan so'ng)"
Write-Host "  Docker Desktop -> Settings -> General -> 'Start Docker Desktop when you sign in' ni yoqing!"
Start-Process "http://localhost:8080"
