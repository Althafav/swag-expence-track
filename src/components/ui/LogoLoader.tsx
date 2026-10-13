import Image from "next/image";

/**
 * "The Mowing Pass" — the SWAG wordmark is mowed into existence like a lawn:
 * a faded ghost logo (uncut grass), a blade sweeping across that reveals the
 * real logo with fresh mow-stripes in its wake, then turning back for the
 * next row. Pure CSS (see `.swag-loader*` in globals.css), so it's safe to
 * render from Server Components / `loading.tsx`.
 */
export function LogoLoader({ size = 220, label = "Loading" }: { size?: number; label?: string }) {
  return (
    <div className="swag-loader" role="status" aria-live="polite">
      <div className="swag-loader__lawn" style={{ width: size }} aria-hidden="true">
        <Image className="swag-loader__ghost" src="/swag-logo-cutout.png" alt="" width={880} height={332} priority />
        <div className="swag-loader__cut">
          <Image src="/swag-logo-cutout.png" alt="" width={880} height={332} priority />
          <div className="swag-loader__stripes" />
        </div>
        <div className="swag-loader__blade" />
      </div>
      <p className="swag-eyebrow swag-loader__label">
        {label}
        <span className="swag-loader__dots" aria-hidden="true">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </span>
      </p>
    </div>
  );
}
