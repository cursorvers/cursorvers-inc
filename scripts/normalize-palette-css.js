const fs = require("fs");
const path = require("path");

const cssPath = path.join(__dirname, "..", "dist", "tailwind.min.css");
let css = fs.readFileSync(cssPath, "utf8");

const replacements = new Map([
  ["e5e7eb", "#E4E4E7"],
  ["e2e8f0", "#E4E4E7"],
  ["9ca3af", "#6B6F76"],
  ["0f172a", "#111111"],
  ["1f2937", "#55595F"],
  ["f8fafc", "#FFFFFF"],
  ["1e293b", "#333333"],
]);

for (const [from, to] of replacements) {
  css = css.replace(new RegExp(`#${from}`, "gi"), to);
}

fs.writeFileSync(cssPath, css);
