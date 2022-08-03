import { expect, MockedFunction } from 'vitest'
import { importOnDemand } from '../lib'

// Surely there's a better way to mock stuff out??
import * as utils from '../lib/utils'

const { nativeDynamicImport, execaCommand } = utils as unknown as {
  nativeDynamicImport: MockedFunction<typeof utils.nativeDynamicImport>
  execaCommand: MockedFunction<any>
}

let numExecaCommands = 0
export const postAssertions = new Set<Function>()
export const runPostAssertions = async () => {
  for (const fn of postAssertions) {
    await fn()
  }
  postAssertions.clear()
  numExecaCommands = 0
}

export { nativeDynamicImport, execaCommand }

export function matchesAllLines(...strings: string[]) {
  return new RegExp(
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
    strings.map((string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*'),
    's'
  )
}

export const successfulImport = async (pkg: string) => {
  nativeDynamicImport.mockResolvedValueOnce({ fake: 1, pkg: 2, mocking: 3 })
  const dynoImporto = await importOnDemand(pkg)
  expect(dynoImporto).toBeTruthy()
  expect(Object.keys(dynoImporto)).toStrictEqual(['fake', 'pkg', 'mocking'])
}

export async function failedImport(pkg: string, errorMatcher: string) {
  nativeDynamicImport.mockRejectedValueOnce('not-found')
  await expect(async () => {
    await importOnDemand(pkg)
  }).rejects.toThrowError(errorMatcher)
  expect(nativeDynamicImport).toHaveBeenCalledOnce()
}

export function expectExecaCommand(cmd: string, ...optsAndRetVal: any[]) {
  const opts = optsAndRetVal.slice(0, -1)
  const retVal = optsAndRetVal.at(-1) as object | Error

  const cmdNr = ++numExecaCommands

  if (retVal instanceof Error) {
    execaCommand.mockRejectedValueOnce(retVal)
  } else {
    execaCommand.mockResolvedValueOnce({
      failed: false,
      stdout: '',
      stderr: '',
      ...retVal,
    })
  }

  return () => {
      expect(execaCommand).toHaveBeenNthCalledWith(cmdNr, ...[cmd, ...opts])
    }
}
