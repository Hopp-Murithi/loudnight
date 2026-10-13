import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, DISPLAY, EASE_OUT, SANS, clamp } from "../theme";

export const EndScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ink, alignItems: "center", justifyContent: "center", gap: 30 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 28,
          opacity: interpolate(frame, [0, 0.4 * fps], [0, 1], clamp),
          scale: interpolate(frame, [0, 0.8 * fps], [0.92, 1], { ...clamp, easing: EASE_OUT }),
        }}
      >
        <Img src={staticFile("logo.svg")} style={{ width: 130, height: 130 }} />
        <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 190, color: COLORS.white, lineHeight: 1 }}>Encore</span>
      </div>
      <div
        style={{
          height: 8,
          backgroundColor: COLORS.spotlight,
          width: interpolate(frame, [0.4 * fps, 1.2 * fps], [0, 160], { ...clamp, easing: EASE_OUT }),
        }}
      />
      <div style={{ fontFamily: SANS, fontSize: 56, color: COLORS.muted, opacity: interpolate(frame, [0.6 * fps, 1.2 * fps], [0, 1], clamp) }}>
        Fill your quiet nights.
      </div>
    </AbsoluteFill>
  );
};
