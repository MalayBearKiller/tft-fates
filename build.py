#!/usr/bin/env python3
"""data.js + audio.js + game.js 를 file:// 에서도 열리는 단일 번들 app.js 로 합칩니다.

소스(ES 모듈)를 수정한 뒤 항상 실행하세요:  python3 build.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SOURCES = ["data.js", "audio.js", "game.js"]

parts = []
for name in SOURCES:
    src = (ROOT / name).read_text(encoding="utf-8")
    src = re.sub(r"^import .*?;\s*$", "", src, flags=re.M)   # import 문 제거
    src = re.sub(r"^export\s+", "", src, flags=re.M)          # export 키워드 제거
    parts.append(f"// ---- {name} ----\n{src.strip()}\n")

bundle = (
    "// TFT Fates Standalone Bundle (CORS file:// 호환)\n"
    "// ⚠️ 자동 생성 파일입니다. 직접 수정하지 말고 data.js / audio.js / game.js 를 고친 뒤 `python3 build.py` 를 실행하세요.\n"
    "(function() {\n" + "\n".join(parts) + "})();\n"
)
(ROOT / "app.js").write_text(bundle, encoding="utf-8")
print(f"app.js 생성 완료 ({len(bundle):,} bytes)")
