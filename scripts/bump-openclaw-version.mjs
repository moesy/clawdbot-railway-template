import fs from "node:fs";

const owner = "openclaw";
const repo = "openclaw";
const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error("Missing GITHUB_TOKEN");
  process.exit(2);
}

async function gh(path) {
  const url = `https://api.github.com${path}`;
  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/vnd.github+json",
      "user-agent": "clawdbot-railway-template-bot",
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

function readCurrentTag(config) {
  const m = config.match(/\nOPENCLAW_VERSION = "([^\n"]+)"\n/);
  return m ? m[1].trim() : null;
}

function replaceTag(config, next) {
  const re = /\nOPENCLAW_VERSION = "([^\n"]+)"\n/;
  if (!re.test(config)) throw new Error("Could not find OPENCLAW_VERSION in railway.toml");
  return config.replace(re, `\nOPENCLAW_VERSION = "${next}"\n`);
}

const latest = await gh(`/repos/${owner}/${repo}/releases/latest`);
const latestTag = latest.tag_name;
if (!latestTag) throw new Error("No tag_name in latest release response");

const configPath = "railway.toml";
const config = fs.readFileSync(configPath, "utf8");
const currentTag = readCurrentTag(config);
if (!currentTag) throw new Error("Could not parse current OPENCLAW_VERSION from railway.toml");

console.log(`current=${currentTag} latest=${latestTag}`);

if (currentTag === latestTag) {
  console.log("No update needed.");
  process.exit(0);
}

fs.writeFileSync(configPath, replaceTag(config, latestTag));
console.log(`Updated ${configPath} to ${latestTag}`);
