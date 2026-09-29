#!/bin/bash
set -e

CERT_DIR="./certs"
mkdir -p "$CERT_DIR"

PASSWORD="rhwpstudio123!"

echo "========================================================"
echo " RHWP STUDIO - 자체 서명 코드서명 인증서(Self-Signed Cert) 생성"
echo "========================================================"

# 1. 개인키 생성 (RSA 2048)
openssl genrsa -out "$CERT_DIR/rhwp-private.key" 2048

# 2. 자체 서명 인증서 생성 (유효기간 10년 / 3650일)
openssl req -new -x509 -key "$CERT_DIR/rhwp-private.key" \
  -out "$CERT_DIR/rhwp-cert.crt" -days 3650 \
  -subj "/C=KR/ST=Seoul/O=RHWP/OU=RHWP STUDIO/CN=RHWP STUDIO"

# 3. Windows 및 electron-builder용 PFX (PKCS#12) 파일 생성
openssl pkcs12 -export -out "$CERT_DIR/rhwp-cert.pfx" \
  -inkey "$CERT_DIR/rhwp-private.key" -in "$CERT_DIR/rhwp-cert.crt" \
  -passout pass:"$PASSWORD"

echo ""
echo "✅ 인증서 생성이 완료되었습니다!"
echo "   - PFX 파일: $CERT_DIR/rhwp-cert.pfx (비밀번호: $PASSWORD)"
echo "   - 공개키 CRT: $CERT_DIR/rhwp-cert.crt"
echo ""
