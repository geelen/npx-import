import {importOnDemand} from '../lib/index.js'

try {
  const leftPad = await import('left-pad')
  console.error(`NOOO, LEFT PAD IS HERE!`)
} catch (e) {
  console.log("YESS, No Left pad!!")

  const leftPad = await importOnDemand('left-pad')
  console.log(`OMFG IT WORKS`)
  console.log(leftPad("omfg", 25))
}
