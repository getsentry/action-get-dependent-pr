import {wait} from '../src/wait';
import * as process from 'process';
import * as cp from 'child_process';
import * as path from 'path';

test('throws invalid number', async () => {
  const input = parseInt('foo', 10);
  await expect(wait(input)).rejects.toThrow('milliseconds not a number');
});

test('wait 500 ms', async () => {
  const start = new Date();
  await wait(500);
  const end = new Date();
  var delta = Math.abs(end.getTime() - start.getTime());
  expect(delta).toBeGreaterThan(450);
});

// shows how the runner will run a javascript action with env / stdout protocol
test('test runs', async () => {
  process.env['INPUT_MILLISECONDS'] = '500';
  const ip = path.join(__dirname, '..', 'lib', 'main.js');
  const options: cp.ExecSyncOptions = {
    env: process.env,
  };

  const result = await new Promise<{stdout: string, stderr: string, err: cp.ExecException|null}>((resolve) => {
    // cp.execSync will throw an error if the command returns a non-zeo
    // status, which may or may no happen depending on the environment
    // this test is run (i.e. locally vs on a GitHub Action).
    cp.exec(`node ${ip}`, options, (err, stdout, stderr) => {
      resolve({
        stdout,
        stderr,
        err,
      });
    });
  });
  // The error returned locally is different from the error we get when running in an action.
  // However, both will be prefixed with `::error::` by the @actions/core library.
  expect(result.stdout).toContain('::error::');
  expect(result.stderr).toContain('');

  // Depending on whether we run locally or on a GitHub action we get
  // different results.
  if (result.err) {
    console.log('An error was returned by lib/main.js:', result.err);
  } else {
    console.log(`No error returned by lib/main.js`)
  }
});
