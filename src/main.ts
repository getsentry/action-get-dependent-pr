import * as core from '@actions/core';
import * as github from '@actions/github';
import getToken from 'github-app-token';

async function run(): Promise<void> {
  try {
    const privateKey: string = core.getInput('privateKey');
    const id: string = core.getInput('appId');
    const textPattern: string = core.getInput('textPattern');
    const patternFlags: string = core.getInput('patternFlags');

    const pullRequestPayload = github.context.payload.pull_request;

    if (!pullRequestPayload) {
      core.error('This action only works for pull requests');
      return;
    }

    const {owner, repo} = github.context.repo;

    const token = await getToken(id, privateKey);
    const octokit = github.getOctokit(token);

    // We want to fetch the pull request on every run, if we use the workflow event
    // payload, the PR body text can be stale e.g. if you re-run a workflow
    const sourcePullRequest = await octokit.pulls.get({
      owner,
      repo,
      // @ts-ignore (typing is wrong for this)
      pull_number: pullRequestPayload.number,
    });

    const textPatternRegex =
      (textPattern && new RegExp(textPattern, patternFlags)) ||
      new RegExp(
        'requires.*https://github.com/([^/]+)/([^/]+)/pull/(\\d+)',
        'im'
      );

    const matches = sourcePullRequest?.data.body?.match(textPatternRegex);

    if (!matches) {
      core.debug('No match, nothing to do here...');
      return;
    }

    const [, targetOwner, targetRepo, targetPullRequestNumber] = matches;

    const pullRequest = await octokit.pulls.get({
      owner: targetOwner,
      repo: targetRepo,
      // @ts-ignore (typing is wrong for this)
      pull_number: targetPullRequestNumber,
    });

    // Can't use merge commit here because of `bin/bump-sentry`
    core.setOutput('sha', pullRequest.data.head.sha);
    core.setOutput('branch', pullRequest.data.head.ref);
    core.setOutput('number', pullRequest.data.number);
    core.setOutput('pullRequest', JSON.stringify(pullRequest.data));
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
