import { Landmark } from "lucide-react";

export function Coin({ size = 28 }: { size?: number }) {
  return (
    <span
      className="relative grid place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        background:
          "radial-gradient(circle at 32% 28%, #ffe9a8 0%, #f6c64a 45%, #e0a32a 100%)",
        boxShadow:
          "inset 0 1.5px 1px rgba(255,255,255,0.65), inset 0 -2px 2px rgba(150,90,10,0.35), 0 1px 2px rgba(120,80,0,0.3)",
        border: "1.5px solid #d99a25",
      }}
    >
      <Landmark size={size * 0.5} strokeWidth={2.2} color="#9a6510" />
    </span>
  );
}
