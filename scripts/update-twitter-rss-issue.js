const Parser = require('rss-parser');
const { Octokit } = require('octokit');

const parser = new Parser();

const octokit = new Octokit({
  auth: process.env.MY_GITHUB_TOKEN
});

const RSS_REPO = `KNighD/rss-box`

// 获取推文 id
const getTId = (link) => {
  return new URL(link).pathname.match(/.*\/(.*)$/)[1]
}

// 获取已归档
const getRssJSON = async () => {
  const { data } = await octokit.request(`GET /repos/${RSS_REPO}/contents/rss.json`, {
    owner: 'OWNER',
    repo: 'REPO',
    path: 'PATH'
  })
  return {
    content: JSON.parse(new Buffer.from(data.content, 'base64').toString('utf-8')),
    sha: data.sha
  }
}

// 获取最新的 issue number
const getLatestIssueNumber = async () => {
  const { data } = await octokit.request(`GET /repos/${RSS_REPO}/issues`, {
    owner: 'OWNER',
    repo: 'REPO'
  })
  return data.shift().issue_number
}

// 发布到 issue comment
const addComment = async (feedItem, issueNumber) => {
  await octokit.request(`POST /repos/${RSS_REPO}/issues/${issueNumber}/comments`, {
    owner: 'OWNER',
    repo: 'REPO',
    issue_number: 'ISSUE_NUMBER',
    body: `${feedItem.title}

---
creator：${feedItem.creator} [原文链接](${feedItem.link})`
  });
}

// 归档到 rss.json
const updateRss = async (tId, feedItem, rssJSON) => {
  rssJSON.content[tId] = feedItem
  const content = new Buffer.from(JSON.stringify(rssJSON.content), 'utf-8').toString('base64')
  await octokit.request(`PUT /repos/${RSS_REPO}/contents/rss.json`, {
    owner: 'OWNER',
    repo: 'REPO',
    path: 'PATH',
    message: `添加 ${tId}`,
    sha: rssJSON.sha,
    committer: {
      name: 'ifttt',
      email: 'octocat@github.com'
    },
    content
  })
}

const run = async () => {
  try {
    let feed = await parser.parseURL('https://nitter.net/i/lists/1552112375448231938/rss');
    for (const item of feed.items) {
      const tId = getTId(item.link)
      const rssJSON = await getRssJSON()
      if (!rssJSON.content[tId]) {
        await updateRss(tId, item, rssJSON)
        const issueNumber = await getLatestIssueNumber()
        await addComment(item, issueNumber)
      }
    }
  } catch (error) {
    console.log(error)
    throw error
  }
}

run()