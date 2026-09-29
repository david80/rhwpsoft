@echo off
chcp 65001 > nul
echo ========================================================
echo  RHWP STUDIO - Windows 자체 서명 인증서 시스템 등록 도구
echo ========================================================
echo.
echo 관리자 권한으로 실행 중인지 확인합니다...
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [오류] 관리자 권한으로 실행해야 합니다.
    echo 이 파일을 마우스 우클릭한 뒤 "관리자 권한으로 실행"을 선택해주세요.
    pause
    exit /b 1
)

set CERT_PATH=%~dp0..\certs\rhwp-cert.crt

if not exist "%CERT_PATH%" (
    echo [오류] 인증서 파일이 없습니다: %CERT_PATH%
    pause
    exit /b 1
)

echo [진행 중] Windows 신뢰할 수 있는 루트 인증 기관에 인증서를 등록합니다...
certutil -addstore -f "Root" "%CERT_PATH%"

if %errorlevel% equ 0 (
    echo.
    echo [성공] 인증서가 시스템에 정상 등록되었습니다!
    echo 이제 SmartScreen 경고 없이 RHWP STUDIO.exe를 안전하게 실행할 수 있습니다.
) else (
    echo.
    echo [실패] 인증서 등록 중 오류가 발생했습니다.
)

echo.
pause
