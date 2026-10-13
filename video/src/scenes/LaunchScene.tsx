import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, DISPLAY, EASE_OUT, SANS, clamp } from "../theme";

// A QR-style drawing with the three corner markers. It is not a scannable code.
const QR_SIZE = 21;
const inFinder = (x: number, y: number) =>
  [[0, 0], [QR_SIZE - 7, 0], [0, QR_SIZE - 7]].some(([fx, fy]) => {
    const dx = x - fx;
    const dy = y - fy;
    if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return false;
    return dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
  });
const nearFinder = (x: number, y: number) => (x < 8 && y < 8) || (x >= QR_SIZE - 8 && y < 8) || (x < 8 && y >= QR_SIZE - 8);
const QR = Array.from({ length: QR_SIZE * QR_SIZE }, (_, i) => {
  const x = i % QR_SIZE;
  const y = Math.floor(i / QR_SIZE);
  if (nearFinder(x, y)) return inFinder(x, y);
  return (x * 7 + y * 13 + x * y * 3) % 5 < 2;
});

const Card = ({ children, index, width, height }: { children: React.ReactNode; index: number; width: number; height: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = 0.3 * fps + index * 0.3 * fps;
  const angle = [-8, 0, 8][index];
  const offset = [-330, 0, 330][index];
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: 250,
        width,
        height,
        marginLeft: -width / 2,
        backgroundColor: COLORS.ink,
        border: `1px solid ${COLORS.faint}`,
        boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
        overflow: "hidden",
        opacity: interpolate(frame, [start, start + 0.3 * fps], [0, 1], clamp),
        translate: `${interpolate(frame, [start, start + 0.6 * fps], [0, offset], { ...clamp, easing: EASE_OUT })}px ${interpolate(frame, [start, start + 0.6 * fps], [60, index === 1 ? -20 : 10], { ...clamp, easing: EASE_OUT })}px`,
        rotate: `${interpolate(frame, [start, start + 0.6 * fps], [0, angle], { ...clamp, easing: EASE_OUT })}deg`,
        zIndex: index === 1 ? 2 : 1,
      }}
    >
      {children}
    </div>
  );
};

// One tap makes the launch kit: the poster, the posts and the event page with its RSVP and QR.
export const LaunchScene = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.ink }}>
    <Img
      src={staticFile("nights/cocktail-bar.webp")}
      style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.3)" }}
    />
    <div style={{ position: "absolute", top: 80, left: 100, right: 100, fontFamily: DISPLAY, fontWeight: 800, fontSize: 80, color: COLORS.white, lineHeight: 1 }}>
      One tap. The whole launch kit.
    </div>
    <Card index={0} width={300} height={400}>
      <div style={{ padding: 26, fontFamily: SANS, color: COLORS.white }}>
        <div style={{ fontSize: 22, color: COLORS.spotlight, fontWeight: 600 }}>Instagram</div>
        <div style={{ height: 180, marginTop: 16, backgroundColor: COLORS.copper, display: "flex", alignItems: "flex-end", padding: 14, fontFamily: DISPLAY, fontWeight: 800, fontSize: 40, lineHeight: 0.95 }}>
          Afrobeats Tuesdays
        </div>
        <div style={{ fontSize: 22, marginTop: 16, color: COLORS.muted, lineHeight: 1.4 }}>Live afrobeats, suya and a dance floor. Tuesdays from 8.</div>
      </div>
    </Card>
    <Card index={1} width={320} height={440}>
      <div style={{ height: "100%", backgroundColor: COLORS.copper, padding: 30, display: "flex", flexDirection: "column", justifyContent: "space-between", color: COLORS.white }}>
        <div style={{ fontFamily: SANS, fontSize: 24, fontWeight: 600 }}>The Copper Room</div>
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 84, lineHeight: 0.88 }}>AFRO BEATS TUES DAYS</div>
        <div style={{ fontFamily: SANS, fontSize: 24 }}>Every Tuesday, 8 pm</div>
      </div>
    </Card>
    <Card index={2} width={300} height={400}>
      <div style={{ padding: 26, fontFamily: SANS, color: COLORS.white }}>
        <div style={{ fontSize: 22, color: COLORS.spotlight, fontWeight: 600 }}>Event page</div>
        <svg viewBox={`-1 -1 ${QR_SIZE + 2} ${QR_SIZE + 2}`} shapeRendering="crispEdges" style={{ display: "block", width: 190, height: 190, margin: "20px auto", backgroundColor: COLORS.white }}>
          {QR.map((cell, i) => (cell ? <rect key={i} x={i % QR_SIZE} y={Math.floor(i / QR_SIZE)} width={1} height={1} fill={COLORS.ink} /> : null))}
        </svg>
        <div style={{ backgroundColor: COLORS.spotlight, color: COLORS.ink, textAlign: "center", padding: "12px 0", fontSize: 26, fontWeight: 600 }}>RSVP</div>
      </div>
    </Card>
  </AbsoluteFill>
);
