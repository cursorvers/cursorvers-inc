const fs = require("fs");
const { execSync } = require("child_process");

const resolveBuildId = () => {
  if (process.env.BUILD_ID) {
    return process.env.BUILD_ID;
  }

  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch (error) {
    return new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 12);
  }
};

const buildId = resolveBuildId();
const htmlFiles = fs.readdirSync(".").filter((file) => file.endsWith(".html"));

for (const file of htmlFiles) {
  const content = fs.readFileSync(file, "utf8");
  if (!content.includes("data-build-id")) {
    continue;
  }

  const updated = content.replace(
    /(<span data-build-id>)([^<]*)(<\/span>)/g,
    `$1${buildId}$3`
  );

  fs.writeFileSync(file, updated);
}
