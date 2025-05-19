import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default async function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "transparent",
        }}
      >
        <div
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            border: "2px solid #ae8fc6",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "2px",
          }}
        >
          <svg
            viewBox="0 0 100 125"
            fill="#ae8fc6"
            style={{
              width: "24px",
              height: "24px",
              transform: "rotate(180deg)", // This flips it to point down
            }}
          >
            <path d="m65.75,86.64h-31.49c-.91,0-1.65.74-1.65,1.65v5.71h34.79v-5.71c0-.91-.74-1.65-1.65-1.65Z" />
            <path d="m36.92,73.68c.35,4.96.15,8.95.02,10.84h26.13c-.14-1.89-.33-5.88.02-10.84.28-4.01.86-7.82,1.71-11.32,1.02-4.17,2.45-7.92,4.24-11.15-.95-1.77-4.14-7.84-7.5-15.34-5.36-12-8.56-21.76-9.5-29.01-.06-.49-.48-.86-.98-.87v34.58c2.11.48,3.68,2.37,3.68,4.62,0,2.61-2.13,4.74-4.74,4.74s-4.74-2.13-4.74-4.74c0-2.25,1.58-4.14,3.68-4.62V6c-.49,0-.91.38-.98.87-.94,7.25-4.13,17.01-9.5,29.01-3.35,7.5-6.55,13.57-7.5,15.34,1.79,3.23,3.22,6.98,4.24,11.15.86,3.5,1.43,7.31,1.71,11.32Z" />
          </svg>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
