import StudioScene from "./studio-scene";

// Unlinked render stage for the launch film. Visit /studio to preview the
// 30s loop; automated rendering drives it frame-by-frame via window.__seek.
export const metadata = { title: "Zecway — Studio", robots: { index: false } };

export default function StudioPage() {
  return <StudioScene />;
}
