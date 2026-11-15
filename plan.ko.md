# 플랜: 3D 약혼반지 디자인 웹앱

[English](plan.md) | **한국어**

## 목표
개인/포트폴리오용 3D 약혼반지 커스터마이저. 사용자가 밴드, 센터 스톤, 세팅, 밴드 형태/사이즈를 바꾸면 3D 미리보기가 실시간으로 갱신되고, 결과를 링크나 이미지로 공유할 수 있다. 백엔드, 결제, 로그인은 없다. 모든 상태는 클라이언트에 있고 URL로 공유한다.

## 스택
- Next.js (App Router, TypeScript), 페이지 하나에 클라이언트 컴포넌트
- 3D는 `three` + `@react-three/fiber` + `@react-three/drei` (OrbitControls, Environment, ContactShadows)
- 상태는 `zustand`, 검증은 `zod` 스키마(URL 디코딩 검증에도 같은 스키마 사용)
- UI는 Tailwind + shadcn/ui
- 테스트는 Vitest(순수 로직), 배포는 Vercel
- 외부 3D 모델 파일 없이 모든 형상을 코드로 절차적으로 생성한다.

## 커스터마이즈 범위 (v1)
| 영역 | 옵션 |
|---|---|
| 밴드 소재 | 플래티넘, 옐로/화이트/로즈 골드 |
| 센터 스톤 | 컷(라운드, 프린세스, 오벌, 쿠션, 에메랄드, 페어), 캐럿 0.3–3ct, 종류(다이아몬드, 사파이어, 루비, 에메랄드, 모이사나이트) |
| 세팅 | 프롱 4/6개, 베젤, 헤일로(없음, 싱글, 히든), 숄더(스트레이트, 테이퍼드, 캐시드럴, 스플릿 섕크, 트위스트), 사이드 스톤(없음, 파베, 프렌치 파베, U컷 파베, 채널 세팅, 인셋 U컷 파베), 사이드 스톤 커버리지(30/50/70%) |
| 밴드 형태 | 프로파일(컴포트 핏, 플랫, 나이프 엣지), 폭 1.5–4mm, 두께 1.4–2.4mm, 반지 사이즈(US 3–13), 안쪽 각인 문구 |

## 핵심 설계
- **실제 mm 단위 모델링.** US 사이즈 → 안지름 `d = 11.63 + 0.8128 × size` (mm). 라운드 캐럿 → 지름 `≈ 6.5 × ∛ct` mm, 다른 컷은 컷별 길이/폭 비율로 환산한다.
- **밴드**는 단면 프로파일(2D 점 배열)을 반지 둘레로 스윕해 만든다. 폭, 두께, 축 방향 오프셋이 각도에 따라 변하고, 숄더 스타일(테이퍼, 캐시드럴 암, 스플릿, 트위스트)은 이것으로 만든다.
- **보석**은 크라운/거들/파빌리온 점을 계산한 패싯 지오메트리 + drei `MeshRefractionMaterial`(내부 반사 광선 추적, ior, 분산) + Lightformer로 만든 절차적 스튜디오 환경맵.
- **세팅**은 바스켓 헤드다. 스톤 거들 둘레에 클로 프롱(끝이 가늘어지는 튜브)을 배치하고 얇은 갤러리 레일로 잇는다. 헤일로와 파베의 작은 스톤은 `InstancedMesh`.
- **각인**은 CanvasTexture 글자를 밴드 안쪽 면에 입힌다.
- **공유**는 설정을 압축한 문자열을 URL `?d=`에 넣고 zod로 검증한다(실패하면 기본값). PNG 스크린샷, GLB 내보내기는 선택 기능.

## 파일 구조 (주요)
```
src/app/page.tsx                       레이아웃 (뷰어 + 패널, 모바일은 하단 시트)
src/components/viewer/RingViewer.tsx   Canvas, 조명, 환경맵, 컨트롤
src/components/ring/*                  Ring (assembly), Band, CenterStone, Prongs, Sweep (bezel/halo frame), Melee, PaveMetal, Engraving
src/components/Designer.tsx            메인 화면: 헤더, 단계 표시, 뷰어 카드, 옵션 카드
src/components/panel/*                 단계별 옵션 카드, 타일, 선 그림 아이콘, 공유 버튼
src/lib/ring/config.ts                 zod 스키마, 기본값, 프리셋
src/lib/ring/sizing.ts                 사이즈·캐럿 → mm 변환
src/lib/ring/geometry/*                순수 지오메트리 생성 함수
src/lib/ring/labels.ts                 옵션 이름, 디자인 제목과 요약
src/lib/ring/materials.ts              금속/보석 재질 프리셋
src/lib/share.ts                       URL 인코딩/디코딩
src/hooks/useDesignUrlSync.ts          ?d=와 스토어를 서로 맞춤
src/store/ringStore.ts                 zustand 스토어
```

## 단계
0. 셋업
1. 뷰어 + 밴드
2. 센터 스톤
3. 세팅
4. 패널 UI
5. 공유
6. 다듬기와 배포
7. 리디자인: 주얼리 스토어 스타일 UI(뷰어 카드 + 아이콘 타일이 있는 단계별 옵션 카드)와 더 섬세한 반지 헤드. 레이아웃과 분위기는 상용 반지 빌더를 참고하되, 다른 회사의 이름, 로고, 이미지는 쓰지 않는다.

세부 작업은 [checklist.ko.md](checklist.ko.md), 결정 이유는 [context-notes.ko.md](context-notes.ko.md)에 있다.

## 검증
- `npm run lint`, `npm run build` 통과
- Vitest: 사이즈/캐럿 변환, 밴드 프로파일 치수, 공유 URL 왕복, 잘못된 URL 입력 시 기본값 복구
- 개발 서버에서 옵션별 수동 확인, 모바일 폭(390px) 확인
- 공유 링크를 새 탭에서 열어 같은 디자인인지 확인
- Vercel 프리뷰 배포에서 반복
