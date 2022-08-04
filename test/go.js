import { npxImport, npxResolve } from '../lib/index.js'

try {
  const leftPad = await import('left-pad')
  console.error(`NOOO, LEFT PAD IS HERE!`)
} catch (e) {
  console.log(`This is a PNG! We'll have to compile imagemagick!`)
  const leftPad = await npxImport('left-pad@>1.0.0')
}

console.log({ location: await npxResolve('left-pad@3.4.0') })
console.log(`Done!`)
