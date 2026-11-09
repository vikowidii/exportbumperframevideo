@echo off
title BumperCraft Studio - Server Lokal
cd /d "%~dp0"
echo ========================================================
echo   MENJALANKAN BUMPERCRAFT STUDIO DI KOMPUTER LOKAL
echo ========================================================
echo.

where node >nul 2>nul
if errorlevel 1 goto no_node

if exist "node_modules" goto check_env
echo [INFO] Mengunduh dependensi (pertama kali saja)...
call npm install
if errorlevel 1 goto install_failed

:check_env
if not exist ".env" if exist ".env.example" copy ".env.example" ".env" >nul

echo.
echo [INFO] Memeriksa apakah server di port 3000 sudah berjalan...
node -e "fetch('http://localhost:3000',{signal:AbortSignal.timeout(2000)}).then(r=>r.text()).then(t=>process.exit(t.includes('Studio Bumper & Frame')?0:1)).catch(()=>process.exit(1))"
if errorlevel 1 goto start_server

echo [OK] Studio sudah berjalan. Membuka tab browser yang baru.
start "" http://localhost:3000
exit /b 0

:start_server
echo.
echo [OK] Menjalankan server lokal di port 3000...
echo Buka browser di: http://localhost:3000
echo.
start "" http://localhost:3000
call npm run dev
if errorlevel 1 goto server_failed
exit /b 0

:no_node
echo [ERROR] Node.js belum terinstall di komputer Anda!
echo Silakan download dan install Node.js dari: https://nodejs.org
echo Setelah install, buka kembali file ini.
pause
exit /b 1

:install_failed
echo [ERROR] Instalasi dependensi gagal. Periksa koneksi internet dan pesan di atas.
pause
exit /b 1

:server_failed
echo.
echo [ERROR] Server gagal dijalankan. Port 3000 mungkin dipakai aplikasi lain.
echo Tutup aplikasi tersebut atau jalankan server dengan PORT lain.
pause
exit /b 1
