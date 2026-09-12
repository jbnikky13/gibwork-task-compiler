export interface GitHubRepoContext {
  owner: string;
  repo: string;
  defaultBranch: string;
  description?: string;
  language?: string;
  stars: number;
  openIssues: number;
  recentFiles: string[];
  testFiles: string[];
  relevantFiles: string[];
  issue?: {
    number: number;
    title: string;
    body: string;
    state: string;
    labels: string[];
  };
}

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

export async function inspectGitHub(reference: string): Promise<GitHubRepoContext> {
  const parsed = parseReference(reference);
  const repo = await github<Record<string, unknown>>(`/repos/${parsed.owner}/${parsed.repo}`);
  const contents = await github<Array<Record<string, unknown>>>(`/repos/${parsed.owner}/${parsed.repo}/git/trees/${encodeURIComponent(String(repo.default_branch))}?recursive=1`);
  const paths = contents.filter((item) => item.type === "blob").map((item) => String(item.path)).slice(0, 1500);

  let issue: GitHubRepoContext["issue"];
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

  return {
    owner: parsed.owner,
    repo: parsed.repo,
    defaultBranch: String(repo.default_branch ?? "main"),
    description: repo.description ? String(repo.description) : undefined,
    language: repo.language ? String(repo.language) : undefined,
    stars: Number(repo.stargazers_count ?? 0),
    openIssues: Number(repo.open_issues_count ?? 0),
    recentFiles: paths.slice(0, 80),
    testFiles,
    relevantFiles,
    issue,
  };
}
