import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(__dirname, "generate-gallery-images.py");

const child = spawn("python3", [script, ...process.argv.slice(2)], {
  stdio: "inherit"
});

child.on("error", (error) => {
  console.error(`Failed to run ${script}: ${error.message}`);
  process.exit(1);
});

child.on("close", (code) => {
  process.exit(code ?? 1);
});
