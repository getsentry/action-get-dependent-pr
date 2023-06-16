import * as core from '@actions/core';
import * as github from '@actions/github';
import getToken from 'github-app-token';

async function run(): Promise<void> {
  try {
    const privateKey: string = core.getInput('privateKey');
    const id: string = core.getInput('appId');
    const textPattern: string = core.getInput('textPattern');
    const patternFlags: string = core.getInput('patternFlags');
    const exactRepo: string = core.getInput('repo');

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
      core.info('No match, nothing to do here...');
      return;
    }

    // If exactRepo was passed, then ensure that the link that was parsed matches it
    if (exactRepo && `${matches[1]}/${matches[2]}` !== exactRepo) {
      core.info(
        `Exact repo does not match. '${exactRepo}' vs '${matches[1]}/${matches[2]}'`
      );
      return;
    }

    const [, targetOwner, targetRepo, targetPullRequestNumber] = matches;

    const pullRequest = await octokit.pulls.get({
      owner: targetOwner,
      repo: targetRepo,
      // @ts-ignore (typing is wrong for this)
      pull_number: targetPullRequestNumber,
    });

    const outputs = {
      sha: pullRequest.data.head.sha,
      branch: pullRequest.data.head.ref,
      number: pullRequest.data.number,
      pullRequest: JSON.stringify(pullRequest.data),
    } as {[key: string]: string | number};

    core.info('Set the following outputs:');
    // Can't use merge commit here because of `bin/bump-sentry`
    for (const [k, v] of Object.entries(outputs)) {
      core.info(`${k}: '${v}'`);
      core.setOutput(k, v);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
