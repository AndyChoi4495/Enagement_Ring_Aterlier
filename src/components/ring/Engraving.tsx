// 각인 문구를 캔버스 텍스처로 그려 밴드 안쪽 면에 붙이는 컴포넌트
// Draws the engraving text to a canvas texture and wraps it on the band's inner surface
import { useEffect, useMemo } from "react";
import { BackSide, CanvasTexture, Color } from "three";
import { METALS, type MetalId } from "@/lib/ring/materials";

interface EngravingProps {
  text: string;
  innerRadius: number;
  bandWidth: number;
  metal: MetalId;
}

const FONT_PX = 96;
const CANVAS_H = 128; // a little taller than the font so descenders fit
const FONT = `italic ${FONT_PX}px Georgia, "Times New Roman", serif`;

/** Text texture (white glyphs on black) used as an alpha map. */
function textTexture(text: string) {
  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = FONT;
  const width = Math.ceil(measure.measureText(text).width) + 16;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, CANVAS_H);
  ctx.font = FONT;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, width / 2, CANVAS_H / 2);

  const texture = new CanvasTexture(canvas);
  // Seen from inside the ring, from the front: canvas top must lie toward the back.
  texture.flipY = false;
  texture.anisotropy = 8;
  return { texture, aspect: width / CANVAS_H };
}

export function Engraving({ text, innerRadius, bandWidth, metal }: EngravingProps) {
  const { texture, aspect } = useMemo(() => textTexture(text), [text]);
  useEffect(() => () => texture.dispose(), [texture]);

  // Glyph height ≈ 45% of the band width; shrink long text so it stays within 300° of the band.
  const radius = innerRadius - 0.01;
  let height = (Math.min(0.45 * bandWidth, 1.3) * CANVAS_H) / FONT_PX;
  const maxArc = (300 / 180) * Math.PI;
  if ((height * aspect) / radius > maxArc) height = (maxArc * radius) / aspect;
  const arc = (height * aspect) / radius;

  // Recessed letters read as darker, rougher metal.
  const color = useMemo(() => new Color(METALS[metal].color).multiplyScalar(0.55), [metal]);

  // Cylinder axis Y → ring axis Z (as in Band); θ = 0 lands at the bottom of the ring.
  return (
    <mesh rotation-x={Math.PI / 2}>
      <cylinderGeometry args={[radius, radius, height, 128, 1, true, -arc / 2, arc]} />
      <meshStandardMaterial
        color={color}
        metalness={1}
        roughness={0.55}
        alphaMap={texture}
        transparent
        depthWrite={false}
        side={BackSide}
      />
    </mesh>
  );
}
