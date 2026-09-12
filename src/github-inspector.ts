import type { RepoFileInsight, RepoInspection } from "./types.js";

type GitHubResponse = Record<string, unknown> | Array<Record<string, unknown>>;

async function github<T extends GitHubResponse>(path: string): Promise<T> {
  const token = process.env.GITHUB_TOKEN;
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) throw new Error(`GitHub API ${response.status}: ${await response.text()}`);
  return response.json() as Promise<T>;
}

function parseReference(reference: string): { owner: string; repo: string; issue?: number } {
  const url = reference.match(/github\.com\/([^/]+)\/([^/#?]+)(?:\/issues\/(\d+))?/i);
  if (!url) throw new Error("Reference must be a GitHub repository URL or issue URL.");
  return { owner: url[1], repo: url[2].replace(/\.git$/, ""), issue: url[3] ? Number(url[3]) : undefined };
}

function isTestFile(name: string): boolean {
  return /(^|\/)(test|tests|__tests__|spec|specs)(\/|$)|\.(test|spec)\.[^.]+$/i.test(name);
}

function relevance(name: string, text: string): boolean {
  const words = text.toLowerCase().split(/[^a-z0-9]+/).filter((x) => x.length > 3);
  const lower = name.toLowerCase();
  return words.some((word) => lower.includes(word));
}

function languageFor(path: string): string | undefined {
  const ext = path.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = { ts: "TypeScript", tsx: "TSX", js: "JavaScript", jsx: "JSX", py: "Python", go: "Go", rs: "Rust", java: "Java", rb: "Ruby", php: "PHP", cs: "C#" };
  return ext ? map[ext] : undefined;
}

function signalsFor(path: string, content: string): string[] {
  const signals: string[] = [];
  if (/TODO|FIXME|HACK/i.test(content)) signals.push("contains TODO/FIXME markers");
  if (/throw new Error|raise |panic\(/i.test(content)) signals.push("contains explicit error paths");
  if (/fetch\(|axios\.|http\.request|requests\.|urllib/i.test(content)) signals.push("performs network/API operations");
  if (/auth|oauth|jwt|session|token/i.test(`${path}\n${content}`)) signals.push("touches authentication/session concepts");
  if (/database|postgres|mysql|sqlite|prisma|supabase|sql/i.test(`${path}\n${content}`)) signals.push("touches persistence/database concepts");
  if (/describe\(|it\(|test\(|expect\(|pytest|unittest/i.test(content)) signals.push("contains test-like assertions");
  return signals;
}

async function fetchFileInsight(owner: string, repo: string, path: string): Promise<RepoFileInsight | undefined> {
  try {
    const data = await github<Record<string, unknown>>(`/repos/${owner}/${repo}/contents/${path.split("/").map(encodeURIComponent).join("/")}`);
    if (data.type !== "file" || typeof data.content !== "string") return undefined;
    const content = Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8");
    if (content.length > 12000) return { path, size: Number(data.size ?? content.length), language: languageFor(path), content: content.slice(0, 12000), signals: [...signalsFor(path, content), "content truncated for analysis"] };
    return { path, size: Number(data.size ?? content.length), language: languageFor(path), content, signals: signalsFor(path, content) };
  } catch {
    return undefined;
  }
}

export async function inspectGitHub(reference: string): Promise<RepoInspection> {
  const parsed = parseReference(reference);
  const repo = await github<Record<string, unknown>>(`/repos/${parsed.owner}/${parsed.repo}`);
  const branch = String(repo.default_branch ?? "main");
  const contents = await github<Array<Record<string, unknown>>>(`/repos/${parsed.owner}/${parsed.repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`);
  const paths = contents.filter((item) => item.type === "blob").map((item) => String(item.path)).slice(0, 1500);

  let issue: RepoInspection["issue"];
  if (parsed.issue) {
    const data = await github<Record<string, unknown>>(`/repos/${parsed.owner}/${parsed.repo}/issues/${parsed.issue}`);
    issue = {
      number: parsed.issue,
      title: String(data.title ?? ""),
      body: String(data.body ?? ""),
      state: String(data.state ?? ""),
      labels: Array.isArray(data.labels) ? data.labels.map((x) => String((x as Record<string, unknown>).name ?? "")) : [],
    };
  }

  const contextText = `${issue?.title ?? ""} ${issue?.body ?? ""}`;
  const testFiles = paths.filter(isTestFile).slice(0, 40);
  const relevantFiles = paths.filter((path) => relevance(path, contextText)).slice(0, 30);
  const candidates = [...new Set([...relevantFiles, ...testFiles.slice(0, 12)])].slice(0, 24);
  const insights = (await Promise.all(candidates.map((path) => fetchFileInsight(parsed.owner, parsed.repo, path)))).filter(Boolean) as RepoFileInsight[];

  return {
    owner: parsed.owner,
    repo: parsed.repo,
    defaultBranch: branch,
    description: repo.description ? String(repo.description) : undefined,
    language: repo.language ? String(repo.language) : undefined,
    stars: Number(repo.stargazers_count ?? 0),
    openIssues: Number(repo.open_issues_count ?? 0),
    recentFiles: paths.slice(0, 80),
    testFiles,
    relevantFiles,
    fileInsights: insights,
    issue,
  };
}
