# 체크리스트

[English](checklist.md) | **한국어**

## 0단계: 셋업
- [x] 플랜, 체크리스트, 컨텍스트 노트 작성 (영어 + 한국어)
- [x] `git init`, 첫 커밋
- [x] Next.js 스캐폴딩 (TypeScript, Tailwind, App Router, `src/`)
- [x] three, @react-three/fiber, @react-three/drei, zustand, zod 설치
- [x] Vitest 설정
- [x] shadcn init 후 Slider, Select, Tabs, ToggleGroup 추가
- [x] CLAUDE.md Status, Commands 갱신

## 1단계: 뷰어 + 밴드
- [ ] RingViewer: Canvas, 환경맵, OrbitControls, ContactShadows
- [ ] `sizing.ts` (US 사이즈 → 안지름) + 테스트
- [ ] `bandProfile.ts` (컴포트 핏, 플랫, 나이프 엣지) + 테스트
- [ ] Band 컴포넌트 (LatheGeometry)
- [ ] 금속 재질 프리셋

## 2단계: 센터 스톤
- [ ] 컷별 캐럿 → mm 변환 + 테스트
- [ ] 6개 컷 보석 지오메트리
- [ ] 보석 재질 프리셋 (색, IOR, 분산)

## 3단계: 세팅
- [ ] 프롱 4/6개
- [ ] 베젤
- [ ] 헤일로 (InstancedMesh)
- [ ] 숄더 파베 (InstancedMesh)

## 4단계: 패널 UI
- [ ] zustand 스토어 + zod 설정 스키마 + 기본값
- [ ] 탭: 소재, 스톤, 세팅, 밴드
- [ ] 프리셋 3–4개
- [ ] 안쪽 각인

## 5단계: 공유
- [ ] URL `?d=` 인코딩/디코딩 + 테스트 (왕복, 잘못된 입력)
- [ ] PNG 스크린샷
- [ ] (선택) GLB 내보내기

## 6단계: 다듬기와 배포
- [ ] 모바일 레이아웃 (하단 시트), 390px 확인
- [ ] 성능 점검
- [ ] Vercel 배포
