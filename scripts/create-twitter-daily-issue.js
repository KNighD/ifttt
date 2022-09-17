const { Octokit } = require('octokit');
const dayjs = require('dayjs')

const octokit = new Octokit({
  auth: process.env.MY_GITHUB_TOKEN
});

const RSS_REPO = 'KNighD/rss-box'

const createIssue = async () => {
  await octokit.request(`POST /repos/${RSS_REPO}/issues`, {
    owner: 'OWNER',
    repo: 'REPO',
    title: dayjs().format('YYYY-MM-DD'),
  })
}

createIssue()