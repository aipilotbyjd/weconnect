# WeConnect - Local Services Setup Script
# This script helps set up MongoDB and Redis locally without Docker

Write-Host "🚀 WeConnect Local Services Setup" -ForegroundColor Green
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "⚠️  This script should be run as Administrator for best results" -ForegroundColor Yellow
    Write-Host ""
}

# Check if Chocolatey is installed
$choco = Get-Command choco -ErrorAction SilentlyContinue
if (-not $choco) {
    Write-Host "📦 Installing Chocolatey package manager..." -ForegroundColor Blue
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    $env:PATH = [Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [Environment]::GetEnvironmentVariable("PATH","User")
}

Write-Host "📦 Installing MongoDB..." -ForegroundColor Blue
try {
    choco install mongodb -y
    Write-Host "✅ MongoDB installed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install MongoDB via Chocolatey" -ForegroundColor Red
    Write-Host "Please install manually from: https://www.mongodb.com/try/download/community" -ForegroundColor Yellow
}

Write-Host "📦 Installing Redis..." -ForegroundColor Blue
try {
    # Redis for Windows is archived, so we'll use WSL or suggest alternatives
    Write-Host "ℹ️  Redis for Windows is no longer maintained." -ForegroundColor Yellow
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "1. Use WSL2: wsl --install -d Ubuntu" -ForegroundColor Cyan
    Write-Host "2. Use Memurai (Redis-compatible): choco install memurai-developer -y" -ForegroundColor Cyan
    Write-Host "3. Keep using Docker for Redis only" -ForegroundColor Cyan
    
    $choice = Read-Host "Choose option (1/2/3)"
    
    switch ($choice) {
        "1" {
            Write-Host "Setting up WSL2 Ubuntu..." -ForegroundColor Blue
            wsl --install -d Ubuntu
            Write-Host "After WSL setup, run: wsl -d Ubuntu -e sudo apt update && sudo apt install redis-server -y" -ForegroundColor Cyan
        }
        "2" {
            choco install memurai-developer -y
            Write-Host "✅ Memurai (Redis-compatible) installed" -ForegroundColor Green
        }
        "3" {
            Write-Host "ℹ️  Keeping Redis in Docker - you'll need to fix Docker networking first" -ForegroundColor Yellow
        }
        default {
            Write-Host "ℹ️  Skipping Redis setup" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "❌ Failed to install Redis alternative" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔧 Starting services..." -ForegroundColor Blue

# Start MongoDB
try {
    Start-Service MongoDB -ErrorAction SilentlyContinue
    Write-Host "✅ MongoDB service started" -ForegroundColor Green
} catch {
    Write-Host "⚠️  MongoDB service not started automatically" -ForegroundColor Yellow
    Write-Host "Start it manually: net start MongoDB" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "📋 Service Information:" -ForegroundColor Green
Write-Host "MongoDB: mongodb://localhost:27017" -ForegroundColor Cyan
Write-Host "Redis: localhost:6379 (if installed)" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 You can now run: npm run start:dev" -ForegroundColor Green