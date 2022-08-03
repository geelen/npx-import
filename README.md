# 🧙‍♂️ `npx-import` 🧙‍♀️

### Runtime dependencies, installed _as if by magic_ ✨

<br/>

`npx-import` can be used as a drop-in replacement for [dynamic `import()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import):

```ts
import { npxImport } from 'npx-import'

// If big-dep isn't installed locally, npxImport will try
// to download, install & load it, completely seamlessly.
const dependency = await npxImport('big-dep')
```

It's exactly like [`npx`](https://docs.npmjs.com/cli/v8/commands/npx), but for `import()`! <sub><sub><sub>(hence the name)</sub></sub></sub>

Is this a good idea? See [FAQ](#faq) below.

## Usage

`npx-import` is ideal for cases where you have some dependency that's either large or not used very often, for example:

```ts
import textRenderer from 'tiny-text-renderer'
import { npxImport } from 'npx-import'

export async function writeToFile(report: Report, filename: string) {
  if (filename.endsWith('.png')) {
    console.log(`This is a PNG! We'll have to compile imagemagick!`)
    const magick = await npxImport('imagemagick-utils@^1.1.0')
    await magick.renderToPNG(report, filename)
  } else if (filename.endsWith('.pdf')) {
    console.log(`Argh, a PDF!? Go make a cuppa, this'll take a while...`)
    const pdfBoi = await npxImport('chonk-pdf-boi@3.1.4')
    await pdfBoi.generate(report, filename)
  } else {
    console.log(`Writing to ${filename}...`)
    await textRenderer.write(report, filename)
  }
  console.log(`Done!`)
}
```

When run, `npx-import` will log out some explanation, as well as instructions for installing the dependency locally & skipping this step in future:

```
❯ node ./index.js --filename=image.png

This is a PNG! We'll have to compile imagemagick!
[NPXI] imagemagick-utils not available locally. Attempting to use npx to install temporarily.
[NPXI] Installing... (npx -y -p imagemagick-utils@^1.1.0)
[NPXI] Installed into /Users/glen/.npm/_npx/8cac855b1579fd07/node_modules.
[NPXI] To skip this step in future, run: pnpm add -D imagemagick-utils@^1.1.0
Done!
```

This can make your initial install much quicker, without forcing the user to stop what they're doing, install a related package, and retry.

## Installation

```
npm install --save npx-import
pnpm add -P npx-import
yarn add npx-import
```

## Typescript

Just like `import()`, the return type default to `any`. But you can import the types of a devDependency without any consumers of your package needing to download it at installation time.

```
pnpm add -D big-dep
```

```ts
import { npxImport } from 'npx-import'
import type { BigDep } from 'big-dep'

const bigDep = await npxImport<BigDep>('big-dep')
```

## Configuration

Since package versions are no longer tracked in your `package.json`, we recommend being explicit:

```ts
const lazyDep = await npxImport('left-pad@1.3.0')
```

Any package specifier that's valid in `package.json` will work here: e.g. `^1.0.0`, `~2.3.0`, `>4.0.0`

You can also install multiple packages at once:

```ts
const [depA, depB] = await npxImport(['dep-a@7.8.2', 'dep-b@7.8.2'])
```

`npx-import` also takes a third argument, which lets you customise, or silence, the log output. Each line that would normally be printed is passed to the logger function:

```ts
const grayLog = (line: string) => console.log(chalk.gray(line))
const [depA, depB] = await npxImport(['dep-a@7.8.2', 'dep-b@7.8.2'], grayLog)
```

## FAQ

### Isn't this, like, a heroically bad idea?

Nah it's good actually.

### No but seriously, isn't using `npx` a big security hole? 

Initially, `npx` didn't prompt before downloading and executing a package, which was _definitely_ a security risk. But that's been [fixed since version 7](https://github.com/npm/npx/issues/9#issuecomment-786940691). Now, if you're intending to write `npx prettier` to format your code and accidentally type `npx prettomghackmycomputerpls`, you'll get a helpful prompt:

```
❯ npx prettier@latest
Need to install the following packages:
  prettomghackmycomputerpls@6.6.6
Ok to proceed? (y)
```

And, of course, if you call `npx some-package` and that's either already installed in your project _or_ you've accepted the prompt before (and NPM hasn't cleaned its cache recently) it will just work. It's actually super nice for sharing CLIs.

### But hang on, you're never prompting the user to confirm!?

Ah yes, that seems to go against the previous point. But it's not being triggered from a potentially clumsy human on a keyboard, it's running inside some source code you've (by definition) already authorised to run on your machine.

The alternative is publishing these as normal dependencies of your project and having your users download them at install time. You don't get prompted for those, but it slows down every user's first run...

### What about multiple projects? Won't you get conflicting versions?

As it turns out, no!

---

Built with <3 during a massive yak shave by Glen Maddern.
