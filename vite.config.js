import { defineConfig } from "vite";
import { createHash } from "node:crypto";

function productionContentSecurityPolicy() {
  return {
    name: "umbral-production-csp",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(html) {
        // Hash the final JSON-LD bytes after Vite's HTML transforms. Other
        // inline scripts remain blocked; development keeps Vite's HMR policy.
        const schemaHashes = [
          ...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi),
        ]
          .filter(([, attrs]) =>
            /\btype\s*=\s*(["'])application\/ld\+json\1/i.test(attrs),
          )
          .map(([, , content]) => {
            const normalized = content.replace(/\r\n?/g, "\n");
            JSON.parse(normalized);
            return `'sha256-${createHash("sha256").update(normalized).digest("base64")}'`;
          });
        const policy = [
          "default-src 'self'",
          `script-src 'self' ${[...new Set(schemaHashes)].join(" ")}`.trim(),
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob:",
          "font-src 'self'",
          // GLTFLoader passes embedded texture blobs to ImageBitmapLoader.
          "connect-src 'self' blob:",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'none'",
          "frame-src 'none'",
          "media-src 'self'",
        ].join("; ");
        return [
          {
            tag: "meta",
            attrs: { "http-equiv": "Content-Security-Policy", content: policy },
            injectTo: "head-prepend",
          },
        ];
      },
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [productionContentSecurityPolicy()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => (id.includes("/three/") ? "three" : undefined),
      },
    },
  },
});
