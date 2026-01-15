const router = require("express").Router();

// GET /external/github/repo?url=<repositoryUrl>
// Exemplu: /external/github/repo?url=https://github.com/facebook/react
router.get("/github/repo", async (req, res) => {
  try {
    const repoUrl = req.query.url;
    if (!repoUrl) {
      return res.status(400).json({ message: "Missing url query param" });
    }

    // 1) Parse owner/repo din URL
    // Accepta:
    // - https://github.com/owner/repo
    // - https://github.com/owner/repo/
    // - https://github.com/owner/repo.git
    const match = String(repoUrl).match(/github\.com\/([^\/]+)\/([^\/\?#]+)(?:[\/\?#]|$)/i);
    if (!match) {
      return res.status(400).json({ message: "Invalid GitHub repository URL" });
    }

    const owner = match[1];
    let repo = match[2];
    repo = repo.replace(/\.git$/i, "");

    // 2) Cerem info repo
    const repoResp = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        "Accept": "application/vnd.github+json",
        "User-Agent": "bug-tracker-app"
      }
    });

    if (!repoResp.ok) {
      return res.status(repoResp.status).json({ message: "GitHub repo fetch failed" });
    }

    const repoData = await repoResp.json();

    // 3) Cerem ultimul commit
    const commitsResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`, {
      headers: {
        "Accept": "application/vnd.github+json",
        "User-Agent": "bug-tracker-app"
      }
    });

    if (!commitsResp.ok) {
      return res.status(commitsResp.status).json({ message: "GitHub commits fetch failed" });
    }

    const commits = await commitsResp.json();
    const last = commits && commits.length > 0 ? commits[0] : null;

    return res.json({
      owner,
      repo,
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      openIssues: repoData.open_issues_count,
      lastCommit: last
        ? {
            sha: last.sha,
            message: last.commit?.message,
            author: last.commit?.author?.name,
            date: last.commit?.author?.date
          }
        : null
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: String(err) });
  }
});

module.exports = router;
