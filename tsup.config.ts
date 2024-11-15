import { defineConfig } from "tsup";

export default defineConfig(() => {
  return {
    entry: ["src/index.ts"],
    outDir: "lib",
    target: ["node16", "es2017"],
    format: "cjs",
    clean: true,
    sourcemap: true,
    splitting: false,
    dts: true,
  };
});
