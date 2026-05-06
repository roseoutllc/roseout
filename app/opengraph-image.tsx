import { ImageResponse } from "next/og";

export const alt = "RoseOut AI outing planner";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background:
            "radial-gradient(circle at 20% 20%, rgba(225,6,42,0.45), transparent 28%), linear-gradient(135deg, #050505 0%, #120006 55%, #000 100%)",
          color: "white",
          display: "flex",
          fontFamily: "Arial, sans-serif",
          height: "100%",
          justifyContent: "center",
          padding: "72px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              color: "#e1062a",
              fontSize: 34,
              fontWeight: 900,
              letterSpacing: 8,
              textTransform: "uppercase",
            }}
          >
            RoseOut
          </div>
          <div style={{ fontSize: 92, fontWeight: 900, lineHeight: 0.95 }}>
            Plan your perfect outing.
          </div>
          <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 34, lineHeight: 1.35 }}>
            AI-ranked restaurants, activities, date nights, and reservations.
          </div>
        </div>
      </div>
    ),
    size
  );
}
