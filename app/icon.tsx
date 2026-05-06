import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(135deg, #e1062a 0%, #640015 100%)",
          color: "white",
          display: "flex",
          fontFamily: "Arial, sans-serif",
          fontSize: 188,
          fontWeight: 900,
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        R
      </div>
    ),
    size
  );
}
