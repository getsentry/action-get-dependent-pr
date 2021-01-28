import * as core from '@actions/core';
import * as github from '@actions/github';
import getToken from 'github-app-token';

async function run(): Promise<void> {
  try {
    const privateKey: string = core.getInput('privateKey');
    const id: string = core.getInput('appId');
    const textPattern: string = core.getInput('textPattern');
    const patternFlags: string = core.getInput('patternFlags');
    const sourceRepoFull: string = core.getInput('sourceRepo');
    const pullRequestPayload = github.context.payload.pull_request;
    const {owner, repo} = github.context.repo;

    if (!pullRequestPayload) {
      core.error('This action only works for pull requests');
      return;
    }

    const token = await getToken(id, privateKey);
    const octokit = github.getOctokit(token);

    // Look for cross reference events in the PR
    const resp = await octokit.issues.listEventsForTimeline({
      owner,
      repo,
      issue_number: Number(pullRequestPayload.number),
    });

    const textPatternRegex = new RegExp(textPattern, patternFlags);

    const data = resp.data.find(
      event =>
        // @ts-ignore
        event.event === 'cross-referenced' &&
        (!sourceRepoFull ||
          // @ts-ignore
          event.source.issue.repository.full_name === sourceRepoFull) &&
        textPatternRegex.test(
          // @ts-ignore
          event.source.issue.body
        ) &&
        // @ts-ignore
        !!event.source.issue.pull_request
    );

    if (!data) {
      core.debug('Not found or not a pull request');
      return;
    }

    const [sourceOwner, sourceRepo] = sourceRepoFull.split('/');
    const pullRequest = await octokit.pulls.get({
      owner: sourceOwner,
      repo: sourceRepo,
      // @ts-ignore (typing is wrong for this)
      pull_number: data.source.issue.number,
    });

    // Can't use merge commit here because of `bin/bump-sentry`
    core.setOutput('ref', pullRequest.data.head.sha);
    core.setOutput('pullRequest', JSON.stringify(pullRequest));
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
