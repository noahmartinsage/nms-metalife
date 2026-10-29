/**
 * 当 git push 被网络阻断时，用 GitHub Git Data API 复刻一次 push。
 * 用法：node scripts/gh-push.mjs <owner/repo> <branch> "<commit message>"
 * 前置：gh CLI 已登录且对目标仓库有写权限。
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repo = process.argv[2] || "noahmartinsage/nms-metalife";
const branch = process.argv[3] || "main";
const message = process.argv[4] || "chore: sync";

const gh = (args, input) => {
  const opts = { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 };
  if (input) opts.input = input;
  return execFileSync("gh", ["api", ...args], opts).trim();
};

const remoteHead = gh([`repos/${repo}/git/ref/heads/${branch}`, "--jq", ".object.sha"]);
const localHead = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
console.log("remote head:", remoteHead.slice(0, 7), "| local head:", localHead.slice(0, 7));

const files = (process.env.GH_PUSH_FILES
  ? process.env.GH_PUSH_FILES.split(",").map((f) => ({ status: "M", file: f.trim() })).filter((f) => f.file)
  : execFileSync("git", ["diff", "--name-status", `${remoteHead}`, `${localHead}`], { encoding: "utf8" })
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [status, ...rest] = line.split("\t");
        return { status: status[0], file: rest.join("\t") };
      }));

console.log(`changed files: ${files.length}`);

const entries = [];
for (const { status, file } of files) {
  if (status === "D") {
    entries.push({ path: file, mode: "100644", type: "blob", sha: null });
    continue;
  }
  const buf = fs.readFileSync(path.resolve(file));
  const body = JSON.stringify({ content: buf.toString("base64"), encoding: "base64" });
  const sha = gh(["-X", "POST", `repos/${repo}/git/blobs`, "--input", "-", "--jq", ".sha"], body);
  entries.push({ path: file, mode: "100644", type: "blob", sha });
  console.log("  blob", file, sha.slice(0, 7));
}

const baseTree = gh([`repos/${repo}/git/commits/${remoteHead}`, "--jq", ".tree.sha"]);
const treeSha = gh(
  ["-X", "POST", `repos/${repo}/git/trees`, "--input", "-", "--jq", ".sha"],
  JSON.stringify({ base_tree: baseTree, tree: entries })
);
console.log("tree:", treeSha.slice(0, 7));

const commitSha = gh(
  ["-X", "POST", `repos/${repo}/git/commits`, "--input", "-", "--jq", ".sha"],
  JSON.stringify({ message, tree: treeSha, parents: [remoteHead] })
);
console.log("commit:", commitSha.slice(0, 7));

const updated = gh(
  ["-X", "PATCH", `repos/${repo}/git/refs/heads/${branch}`, "--input", "-"],
  JSON.stringify({ sha: commitSha, force: false })
);
console.log("ref updated:", JSON.parse(updated).object.sha.slice(0, 7));
