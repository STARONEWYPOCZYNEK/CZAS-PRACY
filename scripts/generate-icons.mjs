import { ImageResponse } from "next/og.js";
import { writeFile } from "fs/promises";

async function generate(size, outPath) {
  const response = new ImageResponse(
    {
      type: "div",
      props: {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2563eb",
          borderRadius: size * 0.18,
        },
        children: {
          type: "div",
          props: {
            style: {
              color: "white",
              fontSize: size * 0.42,
              fontWeight: 700,
              fontFamily: "sans-serif",
            },
            children: "GP",
          },
        },
      },
    },
    { width: size, height: size },
  );

  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(outPath, buffer);
  console.log(`Zapisano ${outPath} (${buffer.length} bajtów)`);
}

await generate(192, "public/icon-192.png");
await generate(512, "public/icon-512.png");
