import AdScene from "./ad-scene";

// The launch ad render stage. /studio/ad plays the 30s spot on loop;
// frame rendering drives it via window.__seek.
export const metadata = { title: "Zecway — Ad Studio", robots: { index: false } };

export default function AdStudioPage() {
  return <AdScene />;
}
