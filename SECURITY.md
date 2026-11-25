# 보안 공지 (Security Notice)

## 2026-11-25: RHWP STUDIO 인증서를 등록했다면 제거해 주세요

[English](#english)

### 대상
Windows에서 이 저장소의 `scripts/install-cert-windows.bat`을 **관리자 권한으로 실행한 적이 있는 사용자**입니다.
설치 파일(`.exe`, `.dmg`)만 내려받아 사용했다면 해당하지 않습니다. 설치 파일에는 인증서나 등록 기능이 들어 있지 않습니다.

### 문제
이 스크립트는 자체 서명 인증서를 Windows의 '신뢰할 수 있는 루트 인증 기관'에 등록했습니다.
그런데 인증서의 개인 키가 2026-09-29부터 이 저장소에 공개되어 있었습니다.
인증서가 남아 있으면, 이 키를 가진 사람이 만든 가짜 웹사이트나 프로그램을 그 PC가 신뢰할 수 있습니다.

| 항목 | 값 |
|------|----|
| 이름 | `CN=RHWP STUDIO, OU=RHWP STUDIO, O=RHWP, S=Seoul, C=KR` |
| SHA-1 지문 | `633A6C6454CBC55A651ABC78C71DD1C269AC1EA7` |
| SHA-256 지문 | `08D5894D6F8017D5F0821AD6FB748AE60799E2A9341679AB6BD2E9957BCF0AAD` |

`create-self-signed-cert.sh`로 인증서를 직접 만들어 등록했다면 이름은 같고 지문은 다릅니다. 이 경우에도 제거해 주세요.

### 제거 방법
**스크립트 사용**: [`scripts/remove-cert-windows.bat`](scripts/remove-cert-windows.bat)을 내려받아 마우스 오른쪽 단추로 누르고 **[관리자 권한으로 실행]** 을 선택합니다.

**직접 제거**:
1. `Win + R`을 누르고 `certlm.msc`를 실행합니다.
2. **신뢰할 수 있는 루트 인증 기관 → 인증서**에서 `RHWP STUDIO`를 모두 찾아 삭제합니다.
3. `certmgr.msc`에서도 같은 위치를 확인해 남아 있으면 삭제합니다.

제거해도 RHWP STUDIO는 그대로 사용할 수 있습니다. 배포된 설치 파일은 이 인증서로 서명되지 않았습니다.

### 조치
저장소에서 개인 키, 인증서, 생성·등록 스크립트를 제거하고, 저장소 기록에서도 개인 키와 PFX를 지웠습니다. 2026-11-25 이전에 복제한 저장소는 새로 받아 주세요. 이 인증서는 다시 사용하지 않습니다.

---

## English

### Who is affected
Windows users who **ran `scripts/install-cert-windows.bat` from this repository as administrator**.
If you only downloaded the installers (`.exe`, `.dmg`), you are not affected. They neither contain nor register the certificate.

### Problem
The script added a self-signed certificate to the Windows Trusted Root Certification Authorities store, and its private key had been public in this repository since 2026-09-29.
While the certificate remains, that PC may trust fake websites or programs made by anyone who has the key.

- Subject: `CN=RHWP STUDIO, OU=RHWP STUDIO, O=RHWP, S=Seoul, C=KR`
- SHA-1: `633A6C6454CBC55A651ABC78C71DD1C269AC1EA7`
- SHA-256: `08D5894D6F8017D5F0821AD6FB748AE60799E2A9341679AB6BD2E9957BCF0AAD`

Certificates you generated yourself with `create-self-signed-cert.sh` have the same subject but a different thumbprint. Remove those too.

### How to remove it
**Script**: download [`scripts/remove-cert-windows.bat`](scripts/remove-cert-windows.bat), right-click it, and choose **Run as administrator**.

**Manually**:
1. Press `Win + R` and run `certlm.msc`.
2. Under **Trusted Root Certification Authorities → Certificates**, delete every `RHWP STUDIO` entry.
3. Check the same folder in `certmgr.msc` and delete any that remain.

RHWP STUDIO keeps working after removal. The released installers were never signed with this certificate.

### What we did
We removed the private key, the certificate, and the scripts that created and registered it from the repository, and purged the private key and PFX from its history. If you cloned the repository before 2026-11-25, please clone it again. The certificate will not be used again.
