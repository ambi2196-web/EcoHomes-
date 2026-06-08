@echo off
echo ================================================
echo  EcoHomes - Push to GitHub
echo ================================================
echo.

cd /d "F:\PM Course Case studies\EcoHomes"

REM Remove the broken .git folder created by the sandbox
if exist ".git" (
    echo Cleaning up old .git folder...
    rmdir /s /q ".git"
)

REM Initialize fresh git repo
echo Initializing git repository...
git init
git config user.email "ambi2196@gmail.com"
git config user.name "Ashu"
git branch -M main

REM Stage all files
echo.
echo Staging all files...
git add .

REM Commit
echo.
echo Creating commit...
git commit -m "feat: Phase 0 foundation — React+Tauri wizard shell, ENS store, 5-step UI, FastAPI backend

- Monorepo setup with Turborepo + pnpm workspaces
- React 18 + TypeScript + Vite + Tailwind CSS desktop app
- Zustand persisted state store with full ENS data types
- 5-step wizard: Location > Requirements > Analysis > Style > Prototype
- Step 1: Nominatim geocoding (free, no API key)
- Step 2: Plot/room requirements form with ENS building type selector
- Step 3: Climate zone detection + Open-Meteo API + ENS material/layout engine
- Step 4: Architectural style and budget picker
- Step 5: SVG floor plan generator with download
- FastAPI backend skeleton with CORS configured
- Architecture doc, GitHub setup guide, README"

REM Add remote
echo.
echo Adding GitHub remote...
git remote add origin https://github.com/ambi2196-web/EcoHomes-.git

REM Push
echo.
echo Pushing to GitHub...
echo (A browser window or login prompt may appear - sign in to GitHub)
git push -u origin main

echo.
echo ================================================
if %ERRORLEVEL% == 0 (
    echo  SUCCESS! Code is now on GitHub.
    echo  Visit: https://github.com/ambi2196-web/EcoHomes-
) else (
    echo  Push failed. See error above.
    echo  If asked for credentials:
    echo    Username: ambi2196-web
    echo    Password: use a Personal Access Token from
    echo    https://github.com/settings/tokens
)
echo ================================================
pause
