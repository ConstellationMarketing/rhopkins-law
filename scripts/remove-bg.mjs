import { removeBackground } from "@imgly/background-removal-node";
import { readFileSync, writeFileSync } from "fs";

const inputPath = "/tmp/attorney-original.webp";
const outputPath = "/tmp/attorney-nobg.png";

console.log("Reading image...");
const imageData = readFileSync(inputPath);
const blob = new Blob([imageData], { type: "image/webp" });

console.log("Removing background (this may take a moment)...");
const result = await removeBackground(blob);

const arrayBuffer = await result.arrayBuffer();
writeFileSync(outputPath, Buffer.from(arrayBuffer));
console.log("Done! Saved to", outputPath);
