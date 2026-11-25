@echo off
chcp 65001 > nul
rem RHWP STUDIO 1.0.5 이하의 install-cert-windows.bat 이 등록한 인증서를 제거합니다. (SECURITY.md)
echo RHWP STUDIO - 인증서 제거 도구
echo.
net session >nul 2>&1
set ADMIN=%errorlevel%
if %ADMIN% neq 0 echo [오류] 이 파일을 마우스 오른쪽 단추로 눌러 "관리자 권한으로 실행"을 선택해 주세요.
if %ADMIN% neq 0 pause
if %ADMIN% neq 0 exit /b 1

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference = 'Stop'; $left = 0; foreach ($loc in 'LocalMachine','CurrentUser') { foreach ($name in 'Root','TrustedPublisher') { $path = 'Cert:\' + $loc + '\' + $name; $find = { Get-ChildItem $path | Where-Object { $_.Thumbprint -eq '633A6C6454CBC55A651ABC78C71DD1C269AC1EA7' -or ($_.Subject -eq $_.Issuer -and $_.Subject -like '*CN=RHWP STUDIO*' -and $_.Subject -like '*O=RHWP*') } }; foreach ($cert in @(& $find)) { Write-Host ('[제거] ' + $path + ' ' + $cert.Thumbprint); Remove-Item $cert.PSPath }; $left += @(& $find).Count } }; exit $left"
set RESULT=%errorlevel%
echo.
if %RESULT% equ 0 echo [완료] 남아 있는 RHWP STUDIO 인증서가 없습니다.
if %RESULT% neq 0 echo [실패] 인증서를 모두 제거하지 못했습니다. SECURITY.md의 직접 제거 방법을 따라 주세요.
pause
exit /b %RESULT%
