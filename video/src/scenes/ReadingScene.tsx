import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, DISPLAY, EASE_OUT, SANS, clamp } from "../theme";

const STEPS = [
  { label: "Scouting the venue", source: "Google Places" },
  { label: "Reading what people nearby love", source: "Qloo" },
  { label: "Checking what else is on that night", source: "Ticketmaster" },
  { label: "Inventing three nights nobody runs", source: "Encore" },
];

// The live trace: each step arrives, works, then turns into a tick with its source beside it.
export const ReadingScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stepGap = 0.55 * fps;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ink }}>
      <Img
        src={staticFile("nights/pub-stage.webp")}
        style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.16, filter: "blur(2px)" }}
      />
      <AbsoluteFill style={{ padding: "80px 100px", gap: 36 }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 84, color: COLORS.white, lineHeight: 1 }}>
          Encore reads the neighbourhood
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {STEPS.map((step, index) => {
            const start = 0.4 * fps + index * stepGap;
            const done = frame > start + 0.45 * fps;
            return (
              <div
                key={step.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                  padding: "16px 28px",
                  backgroundColor: "rgba(28,20,17,0.85)",
                  border: `1px solid ${COLORS.faint}`,
                  opacity: interpolate(frame, [start, start + 0.3 * fps], [0, 1], clamp),
                  translate: `${interpolate(frame, [start, start + 0.4 * fps], [-40, 0], { ...clamp, easing: EASE_OUT })}px 0`,
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    flexShrink: 0,
                    backgroundColor: done ? COLORS.success : "transparent",
                    border: `3px solid ${done ? COLORS.success : COLORS.spotlight}`,
                  }}
                />
                <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 36, color: COLORS.white, flex: 1 }}>
                  {step.label}
                </div>
                <div
                  style={{
                    fontFamily: SANS,
                    fontSize: 28,
                    color: COLORS.spotlight,
                    border: `1px solid ${COLORS.spotlight}`,
                    padding: "6px 14px",
                  }}
                >
                  {step.source}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
