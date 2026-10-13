import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, DISPLAY, EASE_OUT, SANS, clamp } from "../theme";

// A Tuesday nobody comes to: the room is dim and the count does not move.
export const QuietScene = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ink }}>
      <Img
        src={staticFile("nights/blues-cellar.webp")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "grayscale(0.85) brightness(0.32)",
          scale: interpolate(frame, [0, durationInFrames], [1.08, 1], clamp),
        }}
      />
      <AbsoluteFill style={{ padding: "90px 100px", justifyContent: "space-between" }}>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 34,
            color: COLORS.muted,
            opacity: interpolate(frame, [0, 0.6 * fps], [0, 1], clamp),
          }}
        >
          Tuesday, 9:04 pm
        </div>
        <div>
          <div
            style={{
              fontFamily: DISPLAY,
              fontWeight: 800,
              fontSize: 190,
              lineHeight: 0.9,
              color: COLORS.white,
              opacity: interpolate(frame, [0.3 * fps, 1.1 * fps], [0, 1], { ...clamp, easing: EASE_OUT }),
              translate: `0 ${interpolate(frame, [0.3 * fps, 1.1 * fps], [30, 0], { ...clamp, easing: EASE_OUT })}px`,
            }}
          >
            6 guests.
          </div>
          <div
            style={{
              fontFamily: SANS,
              fontSize: 48,
              color: COLORS.muted,
              marginTop: 24,
              opacity: interpolate(frame, [1.2 * fps, 1.9 * fps], [0, 1], clamp),
            }}
          >
            Same rent. Same staff. Same stock.
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
