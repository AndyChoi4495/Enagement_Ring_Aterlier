// 뷰어 밖(패널)에서 현재 3D 화면을 PNG로 캡처할 수 있게 연결하는 모듈
// Lets code outside the canvas (the panel) capture the current 3D view as a PNG
type Capture = () => Promise<Blob | null>;

let current: Capture | null = null;

export function registerCapture(capture: Capture | null) {
  current = capture;
}

/** PNG of the current view, or null if the viewer is not mounted yet. */
export function captureViewer(): Promise<Blob | null> {
  return current ? current() : Promise.resolve(null);
}
