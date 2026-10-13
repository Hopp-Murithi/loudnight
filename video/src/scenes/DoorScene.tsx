import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, DISPLAY, EASE_OUT, SANS, clamp } from "../theme";

const BREAK_EVEN = 40;
const SCALE_MAX = 60;

// The door: the count climbs past break-even while the room comes alive behind it.
export const DoorScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const count = Math.round(interpolate(frame, [0.3 * fps, 2.6 * fps], [6, 46], { ...clamp, easing: EASE_OUT }));
  const past = count >= BREAK_EVEN;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ink }}>
      <Img
        src={staticFile("nights/dance-floor.webp")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: `brightness(${interpolate(frame, [0, 2.6 * fps], [0.25, 0.7], clamp)}) saturate(${interpolate(frame, [0, 2.6 * fps], [0.4, 1.15], clamp)})`,
        }}
      />
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(18,13,11,0.92) 0%, rgba(18,13,11,0.55) 55%, rgba(18,13,11,0.15) 100%)" }} />
      <AbsoluteFill style={{ padding: "90px 100px", justifyContent: "space-between" }}>
        <div style={{ fontFamily: SANS, fontSize: 34, color: COLORS.muted }}>Tuesday, 11:30 pm. The door.</div>
        <div style={{ width: 760 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 20, color: COLORS.white }}>
            <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 220, lineHeight: 0.85 }}>{count}</span>
            <span style={{ fontFamily: SANS, fontSize: 48, color: COLORS.muted }}>checked in</span>
          </div>
          <div style={{ position: "relative", height: 16, marginTop: 34, backgroundColor: COLORS.faint }}>
            <div style={{ height: "100%", width: `${(count / SCALE_MAX) * 100}%`, backgroundColor: past ? COLORS.success : COLORS.spotlight }} />
            <div style={{ position: "absolute", top: -14, left: `${(BREAK_EVEN / SCALE_MAX) * 100}%`, width: 4, height: 44, backgroundColor: COLORS.white }} />
          </div>
          <div style={{ fontFamily: SANS, fontSize: 40, marginTop: 26, color: past ? COLORS.success : COLORS.muted, fontWeight: 600 }}>
            {past ? `Past break-even by ${count - BREAK_EVEN}` : `${BREAK_EVEN - count} to break even`}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
