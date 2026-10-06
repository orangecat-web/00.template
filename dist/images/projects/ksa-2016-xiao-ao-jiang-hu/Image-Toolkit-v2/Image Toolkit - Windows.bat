@echo off
setlocal EnableExtensions
chcp 65001 >nul
title Image Toolkit v2

rem 永遠從啟動器所在資料夾執行；UNC / NAS 路徑也可由 pushd 暫時映射。
pushd "%~dp0" >nul 2>&1
if errorlevel 1 (
  echo.
  echo [錯誤] 無法進入 Image Toolkit 所在資料夾：
  echo %~dp0
  goto :finish_error
)

if not exist "image-toolkit.sh" (
  echo.
  echo [錯誤] 找不到 image-toolkit.sh
  echo 請確認三個 Toolkit 檔案放在同一個圖片資料夾。
  goto :finish_error_popd
)

set "BASH_EXE="

if exist "%ProgramFiles%\Git\bin\bash.exe" set "BASH_EXE=%ProgramFiles%\Git\bin\bash.exe"
if not defined BASH_EXE if exist "%ProgramFiles%\Git\usr\bin\bash.exe" set "BASH_EXE=%ProgramFiles%\Git\usr\bin\bash.exe"
if not defined BASH_EXE if exist "%LocalAppData%\Programs\Git\bin\bash.exe" set "BASH_EXE=%LocalAppData%\Programs\Git\bin\bash.exe"
if not defined BASH_EXE if exist "%ProgramFiles(x86)%\Git\bin\bash.exe" set "BASH_EXE=%ProgramFiles(x86)%\Git\bin\bash.exe"

if not defined BASH_EXE (
  for /f "delims=" %%B in ('where bash.exe 2^>nul') do (
    if not defined BASH_EXE set "BASH_EXE=%%B"
  )
)

if not defined BASH_EXE (
  echo.
  echo [錯誤] 找不到 Git Bash。
  echo 請先安裝 Git for Windows，並確認 Git Bash 可以正常開啟。
  goto :finish_error_popd
)

"%BASH_EXE%" --noprofile --norc "./image-toolkit.sh"
set "TOOLKIT_EXIT=%ERRORLEVEL%"

popd >nul 2>&1

echo.
if not "%TOOLKIT_EXIT%"=="0" (
  echo Image Toolkit 結束，錯誤碼：%TOOLKIT_EXIT%
) else (
  echo Image Toolkit 已關閉。
)
echo.
pause
exit /b %TOOLKIT_EXIT%

:finish_error_popd
popd >nul 2>&1

:finish_error
echo.
pause
exit /b 1
