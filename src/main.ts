import * as core from '@actions/core';
import * as github from '@actions/github';
import getToken from 'github-app-token';

async function run(): Promise<void> {
  try {
    const privateKey: string = core.getInput('privateKey');
    const id: string = core.getInput('appId');
    const textPattern: string = core.getInput('textPattern');
    const patternFlags: string = core.getInput('patternFlags');
    // const sourceRepoFull: string = core.getInput('sourceRepo');
    const pullRequestPayload = github.context.payload.pull_request;
    // const {owner, repo} = github.context.repo;
    const defaultRegex = new RegExp(
      'requires.*https://github.com/([^/]+)/([^/]+)/pull/(\\d+)',
      'im'
    );

    if (!pullRequestPayload) {
      core.error('This action only works for pull requests');
      return;
    }

    const token = await getToken(id, privateKey);
    const octokit = github.getOctokit(token);

    const textPatternRegex =
      (textPattern && new RegExp(textPattern, patternFlags)) || defaultRegex;

    const matches = pullRequestPayload.body?.match(textPatternRegex);

    if (!matches) {
      // No match, nothing to do here...
      return;
    }

    const [, owner, repo, targetPullRequestNumber] = matches;

    const pullRequest = await octokit.pulls.get({
      owner,
      repo,
      // @ts-ignore (typing is wrong for this)
      pull_number: targetPullRequestNumber,
    });

    // Can't use merge commit here because of `bin/bump-sentry`
    core.setOutput('ref', pullRequest.data.head.sha);
    core.setOutput('pullRequest', JSON.stringify(pullRequest.data));
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
