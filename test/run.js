import {importOnDemand} from '../lib/index.js'

try {
  const leftPad = await import('left-pad')
  console.error(`NOOO, LEFT PAD IS HERE!`)
} catch (e) {
  console.log("YESS, No Left pad!!")

  console.log(`We're in a real terminal, let's load left-pad!`)
  const leftPad = await importOnDemand('left-pad', '1.3.0', () => process.stdout.write('.'))
  console.log(leftPad(`Right aligned text!`, 42))
}
