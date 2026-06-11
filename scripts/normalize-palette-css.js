const fs = require("fs");
const path = require("path");

const cssPath = path.join(__dirname, "..", "dist", "tailwind.min.css");
let css = fs.readFileSync(cssPath, "utf8");

const replacements = new Map([
  ["e5e7eb", "#D8D4C8"],
  ["e2e8f0", "#D8D4C8"],
  ["9ca3af", "#6B7280"],
  ["0f172a", "#13243F"],
  ["1f2937", "#6B6557"],
  ["f8fafc", "#FBFAF5"],
  ["1e293b", "#2A3A55"],
]);

for (const [from, to] of replacements) {
  css = css.replace(new RegExp(`#${from}`, "gi"), to);
}

fs.writeFileSync(cssPath, css);
