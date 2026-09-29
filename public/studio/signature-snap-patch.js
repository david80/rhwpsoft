/**
 * RHWP STUDIO - Smart Signature & Stamp Alignment Patch [PATCH-001]
 * 
 * 업스트림 rhwp(#4068, #7363)의 VertRelTo 상대 위치 계산 오류로 인해,
 * 표/문단 아래의 서명 이미지가 선행 박스로 위로 치솟아 렌더링되는 현상을
 * Canvas 렌더링 레벨에서 비파괴(Non-destructive) 방식으로 보정합니다.
 * 
 * 원본 HWP 바이너리 데이터는 일체 변경되지 않으므로,
 * 한컴오피스 정품 소프트웨어와의 호환성이 100% 보존됩니다.
 */
(() => {
  if (typeof window === 'undefined' || !window.CanvasRenderingContext2D) return;

  const originalFillText = CanvasRenderingContext2D.prototype.fillText;
  const originalStrokeText = CanvasRenderingContext2D.prototype.strokeText;
  const originalDrawImage = CanvasRenderingContext2D.prototype.drawImage;

  // 캔버스별 감지된 서명/직인 텍스트 앵커 목록 (WeakMap)
  const canvasAnchorMap = new WeakMap();

  // 서명/직인 관련 텍스트 패턴
  const SIGN_TEXT_REGEX = /(\(\s*인\s*\)|\(\s*서\s*명\s*\)|\[\s*인\s*\]|\(\s*직\s*인\s*\)|（\s*인\s*）)/;

  function registerAnchor(ctx, text, x, y) {
    if (typeof text !== 'string') return;
    if (!SIGN_TEXT_REGEX.test(text)) return;

    let anchors = canvasAnchorMap.get(ctx.canvas);
    if (!anchors) {
      anchors = [];
      canvasAnchorMap.set(ctx.canvas, anchors);
    }

    // 현재 캔버스 변환 행렬(Transform)을 반영한 절대 좌표 계산
    const transform = ctx.getTransform();
    const realX = x * transform.a + y * transform.c + transform.e;
    const realY = x * transform.b + y * transform.d + transform.f;

    anchors.push({
      text: text.trim(),
      x,
      y,
      realX,
      realY,
      time: Date.now()
    });

    // 최근 10개만 유지 (오래된 프레임 잔류 방지)
    if (anchors.length > 20) {
      anchors.splice(0, anchors.length - 20);
    }
  }

  // 1. 텍스트 그리기 후킹 (서명/직인 위치 수집)
  CanvasRenderingContext2D.prototype.fillText = function(text, x, y, maxWidth) {
    try {
      registerAnchor(this, text, x, y);
    } catch (_) {}
    return maxWidth !== undefined 
      ? originalFillText.call(this, text, x, y, maxWidth)
      : originalFillText.call(this, text, x, y);
  };

  CanvasRenderingContext2D.prototype.strokeText = function(text, x, y, maxWidth) {
    try {
      registerAnchor(this, text, x, y);
    } catch (_) {}
    return maxWidth !== undefined 
      ? originalStrokeText.call(this, text, x, y, maxWidth)
      : originalStrokeText.call(this, text, x, y);
  };

  // 2. 이미지 그리기 후킹 (서명 이미지 스마트 스냅)
  CanvasRenderingContext2D.prototype.drawImage = function(...args) {
    try {
      const img = args[0];
      const anchors = canvasAnchorMap.get(this.canvas);

      // 서명/직인 앵커가 있고 유효한 이미지 인자인 경우
      if (anchors && anchors.length > 0 && img) {
        let dx, dy, dw, dh;
        let isSliceForm = false;

        if (args.length === 3) {
          // drawImage(image, dx, dy)
          dx = args[1];
          dy = args[2];
          dw = img.width || 80;
          dh = img.height || 40;
        } else if (args.length === 5) {
          // drawImage(image, dx, dy, dw, dh)
          dx = args[1];
          dy = args[2];
          dw = args[3];
          dh = args[4];
        } else if (args.length === 9) {
          // drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)
          isSliceForm = true;
          dx = args[5];
          dy = args[6];
          dw = args[7];
          dh = args[8];
        }

        // 이미지 크기가 서명/도장 형태(통상 20px ~ 300px 이내)인지 확인
        const isSignatureCandidate = dw >= 15 && dw <= 350 && dh >= 15 && dh <= 250;

        if (isSignatureCandidate && typeof dx === 'number' && typeof dy === 'number') {
          // X축이 가깝고(±200px), Y축이 서명 텍스트보다 상단(30px ~ 400px 위)에 치솟아 있는 앵커 찾기
          const targetAnchor = anchors.find(a => {
            const xDist = Math.abs(a.x - (dx + dw / 2));
            const yOffset = a.y - dy; // 양수이면 이미지가 텍스트보다 위에 있음
            return xDist < 180 && yOffset > 25 && yOffset < 450;
          });

          if (targetAnchor) {
            // (인) 텍스트의 중심에 서명 이미지가 포개지도록 Y축을 보정
            const adjustedDy = targetAnchor.y - (dh * 0.65);
            
            if (isSliceForm) {
              args[6] = adjustedDy;
            } else if (args.length >= 3) {
              args[2] = adjustedDy;
            }
          }
        }
      }
    } catch (_) {
      // 렌더링 방해 방지
    }

    return originalDrawImage.apply(this, args);
  };

  console.info('[RHWP STUDIO] Smart Signature & Stamp Alignment Patch [PATCH-001] Active.');
})();
