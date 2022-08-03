# NPX Import

**Use `npx` to defer installation of dependencies to runtime**

## Installation

```
npm install --save iod
pnpm add -P iod
yarn add iod
```

## Usage

Anywhere in your app, you can do:

```ts
import { importOnDemand } from 'iod'

if (process.stdout.isTTY) {
  console.log(`We're in a real terminal, let's load left-pad!`)
  // Use it as a direct replacement for .import() (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import)
  const leftPad = await importOnDemand('left-pad')
  console.log(leftPad(`Right aligned text!`, 80))
}
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
