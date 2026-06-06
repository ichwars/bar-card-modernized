import { copyFileSync, mkdirSync } from "node:fs";

mkdirSync("dist", { recursive: true });
copyFileSync("src/bar-card.js", "dist/bar-card.js");
console.log("Built dist/bar-card.js");
