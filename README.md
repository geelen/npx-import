# NPX Import

**Use `npx` to defer installation of dependencies to runtime**

## Usage

This can be used as a drop-in replacement for [dynamic `import()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import):

```ts
// Dynamic import normall requires dependencies to be preinstalled:
const normalDep = await import('big-dep') // Throws if big-dep is missing.
```

```ts
import { npxImport } from 'npx-import'

// npxImport will try to transparently use npx to fetch big-dep and include it
const dependency = await npxImport('big-dep')
```

## Installation

```
npm install --save iod
pnpm add -P iod
yarn add iod
```


Produces:

```
We're in a real terminal, let's load left-pad!
[IOD] left-pad not available locally. Attempting to use npx to install temporarily.
[IOD] Installing... (npx -y -p left-pad@latest)
[IOD] Installed into /Users/glen/.npm/_npx/93d8cd1db3c1662d/node_modules.
[IOD] To skip this step in future, run: pnpm add -D left-pad@latest
                                                             Right aligned text!
```

## Configuration

Since package versions are no longer tracked in your `package.json`, we recommend being explicit

```ts
const lazyDep = await importOnDemand('left-pad@1.3.0')
```

IOD also takes a third argument, which lets you customise, or silence, the log output. Each line that would normally be printed is passed to the logger function:

```ts
if (process.stdout.isTTY) {
  console.log(`We're in a real terminal, let's load left-pad!`)
  const leftPad = await importOnDemand('left-pad', '1.3.0', () => process.stdout.write('.'))
  console.log(leftPad(`Right aligned text!`, 42))
}
```

```
We're in a real terminal, let's load left-pad!
....                       Right aligned text!
```

## Rationale
