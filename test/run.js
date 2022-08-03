import {importOnDemand} from '../lib/index.js'

try {
  const leftPad = await import('left-padf')
  console.error(`NOOO, LEFT PAD IS HERE!`)
} catch (e) {
  console.log("YESS, No Left pad!!")

  console.log(`We're in a real terminal, let's load left-pad!`)
  const leftPad = await npxImport('left-pad', '1.3.0')
  console.log(leftPad(`Right aligned text!`, 42))
}
