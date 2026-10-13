import { LogoLoader } from "@/components/ui/LogoLoader";

export default function Loading() {
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <LogoLoader />
    </div>
  );
}
