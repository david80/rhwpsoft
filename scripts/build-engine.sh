#!/bin/bash
# 수정한 rhwp 엔진(WASM)을 빌드해 public/studio 에 적용합니다. [PATCH-013]
# 필요: rustup(Rust 1.93.1 + wasm32-unknown-unknown), wasm-pack 0.15.0
# 사용: scripts/build-engine.sh [작업 폴더]   (작업 폴더에 3GB 정도 필요)
set -euo pipefail

VERSION="0.9.1"
CRATE_SHA256="d97b7c0c1c602dd5cf25907c3dd2db753c78c381cecb129f26b828e349e4a5d0"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PATCH="$ROOT/patches/rhwp-v$VERSION-floating-picture.patch"
WORK="${1:-$(mktemp -d)}"

mkdir -p "$WORK"
cd "$WORK"
if [ ! -f rhwp.crate ]; then
  curl -sSfL -o rhwp.crate "https://static.crates.io/crates/rhwp/rhwp-$VERSION.crate"
fi
echo "$CRATE_SHA256  rhwp.crate" | shasum -a 256 -c -
rm -rf "rhwp-$VERSION" pkg
tar xzf rhwp.crate
cd "rhwp-$VERSION"
patch -p1 < "$PATCH"

# 배포 바이너리에 빌드한 컴퓨터의 경로가 남지 않게 한다
CARGO_DIR="${CARGO_HOME:-$HOME/.cargo}"
RUSTUP_DIR="${RUSTUP_HOME:-$HOME/.rustup}"
export RUSTFLAGS="--remap-path-prefix=$WORK=/build --remap-path-prefix=$CARGO_DIR=/cargo --remap-path-prefix=$RUSTUP_DIR=/rustup"
export CARGO_TARGET_DIR="$WORK/target"
wasm-pack build --release --target web --out-dir ../pkg --no-pack -- --locked

# JS 접착 코드는 공식 배포본과 같아야 Studio 번들과 짝이 맞는다
cmp "$WORK/pkg/rhwp.js" "$ROOT/node_modules/@rhwp/core/rhwp.js"

HASH="$(shasum -a 256 "$WORK/pkg/rhwp_bg.wasm" | cut -c1-8)"
ASSETS="$ROOT/public/studio/assets"
OLD="$(basename "$(ls "$ASSETS"/rhwp_bg-*.wasm)")"
NEW="rhwp_bg-$HASH.wasm"
cp "$WORK/pkg/rhwp_bg.wasm" "$ROOT/public/studio/rhwp_bg.wasm"
cp "$WORK/pkg/rhwp_bg.wasm" "$ASSETS/$NEW"
if [ "$OLD" != "$NEW" ]; then
  rm "$ASSETS/$OLD"
  grep -l "$OLD" "$ASSETS"/*.js | while read -r f; do perl -pi -e "s/\Q$OLD\E/$NEW/g" "$f"; done
fi
echo "✅ 엔진 적용: $NEW"
