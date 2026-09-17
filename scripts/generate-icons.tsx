import { ImageResponse } from "next/og";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const INK = "#12160F";
const LIME = "#E2F705";

async function main() {
  const anton = await readFile(join(process.cwd(), "assets/Anton-Regular.ttf"));

  async function render(size: number) {
    const res = new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: INK,
          }}
        >
          <div
            style={{
              display: "flex",
              color: LIME,
              fontFamily: "Anton",
              fontSize: size * 0.66,
              lineHeight: 1,
              transform: `translateY(${size * 0.045}px)`,
            }}
          >
            S
          </div>
        </div>
      ),
      {
        width: size,
        height: size,
        fonts: [{ name: "Anton", data: anton, weight: 400, style: "normal" }],
      }
    );
    return Buffer.from(await res.arrayBuffer());
  }

  const targets: [number, string][] = [
    [512, "public/icon-512.png"],
    [192, "public/icon-192.png"],
    [512, "src/app/icon.png"],
    [192, "src/app/icon1.png"],
    [180, "src/app/apple-icon.png"],
  ];

  for (const [size, out] of targets) {
    const buf = await render(size);
    await writeFile(join(process.cwd(), out), buf);
    console.log(`wrote ${out} (${size}x${size}, ${buf.length} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
