import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, DISPLAY, EASE_OUT, SANS, clamp } from "../theme";

const CHIPS = ["Afrobeats, 0.94 affinity within 2 km", "West African food, a top local signal", "4 trivia nights nearby, none like this"];

// One concept with its receipts. Marked as a sample: the film shows the product, not a real result.
export const ConceptScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const score = Math.round(interpolate(frame, [0.6 * fps, 2 * fps], [0, 82], { ...clamp, easing: EASE_OUT }));

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.inkSoft, alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          width: 1080,
          padding: "44px 56px",
          backgroundColor: COLORS.ink,
          border: `1px solid ${COLORS.faint}`,
          boxShadow: `0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(242,184,96,0.08)`,
          opacity: interpolate(frame, [0, 0.4 * fps], [0, 1], clamp),
          scale: interpolate(frame, [0, 0.6 * fps], [0.94, 1], { ...clamp, easing: EASE_OUT }),
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: SANS, fontSize: 28 }}>
          <span style={{ color: COLORS.spotlight, fontWeight: 600 }}>Your Tuesday</span>
          <span style={{ color: COLORS.muted, border: `1px solid ${COLORS.faint}`, padding: "4px 12px" }}>Sample</span>
        </div>
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 100, lineHeight: 1, color: COLORS.white, marginTop: 12 }}>
          Afrobeats Tuesdays
        </div>
        <div style={{ fontFamily: SANS, fontSize: 34, color: COLORS.muted, marginTop: 10 }}>
          Live afrobeats and West African street food.
        </div>
        <div style={{ marginTop: 30 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: SANS, fontSize: 30, color: COLORS.white }}>
            <span>Fit for your venue</span>
            <span style={{ fontWeight: 600 }}>{score} of 100</span>
          </div>
          <div style={{ height: 12, backgroundColor: COLORS.faint, marginTop: 12 }}>
            <div style={{ height: "100%", width: `${score}%`, backgroundColor: COLORS.spotlight }} />
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 28 }}>
          {CHIPS.map((chip, index) => {
            const start = 1.6 * fps + index * 0.35 * fps;
            return (
              <div
                key={chip}
                style={{
                  fontFamily: SANS,
                  fontSize: 25,
                  color: COLORS.white,
                  padding: "10px 16px",
                  border: `1px solid ${COLORS.spotlight}`,
                  backgroundColor: "rgba(242,184,96,0.14)",
                  opacity: interpolate(frame, [start, start + 0.3 * fps], [0, 1], clamp),
                  translate: `0 ${interpolate(frame, [start, start + 0.4 * fps], [16, 0], { ...clamp, easing: EASE_OUT })}px`,
                }}
              >
                {chip}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
