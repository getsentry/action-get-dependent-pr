# Get Dependent Pull Request

This GitHub Action will allow you to find a Pull Request that depends on the current Pull Request. For example,
if you have two repos `foo/bar` and `foo/baz`, where a PR in `foo/bar` depends on `foo/baz`:

In `foo/bar` you have a PR #1, with a description that includes

```
Requires https://github.com/foo/baz/pull/123
```

In `foo/baz`, you can use this action to get the Pull Request object and the HEAD SHA.

## Using

## Developing

Install the dependencies  
```bash
$ yarn install
```

Build the typescript and package it for distribution
```bash
$ yarn dist
```

Run the tests :heavy_check_mark:  
```bash
$ yarn test

 PASS  ./index.test.js
  ✓ throws invalid number (3ms)
  ✓ wait 500 ms (504ms)
  ✓ test runs (95ms)

...
```
