import { expect, MockedFunction } from 'vitest'
import { npxImport } from '../lib'
import crypto from 'node:crypto'
// Surely there's a better way to mock stuff out??
import { execaCommand as _execaCommand } from 'execa'
import * as utils from '../lib/utils'

const { _import, _importRelative } = utils as unknown as {
  _import: MockedFunction<typeof utils._import>
  _importRelative: MockedFunction<typeof utils._importRelative>
}
const execaCommand = _execaCommand as MockedFunction<any>
export { _import, _importRelative, execaCommand }
const MOCKS = { _import, _importRelative, execaCommand }

let MOCK_COUNTERS: { [key in keyof typeof MOCKS]?: number } = {}
export const postAssertions = new Set<Function>()
export const runPostAssertions = async () => {
  for (const fn of postAssertions) {
    fn()
  }
  postAssertions.clear()
  MOCK_COUNTERS = {}
}
const increment = (mock: keyof typeof MOCKS) =>
  (MOCK_COUNTERS[mock] = (MOCK_COUNTERS[mock] ?? 0) + 1)
const NOOP_LOGGER = () => {}

export function matchesAllLines(...strings: string[]) {
  return new RegExp(
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
    strings.map((string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*'),
    's'
  )
}

export const npxImportLocalPackage = async (pkg: string) => {
  _import.mockResolvedValueOnce({ fake: 1, pkg: 2, mocking: 3 })
  const dynoImporto = await npxImport(pkg)
  expect(dynoImporto).toBeTruthy()
  expect(Object.keys(dynoImporto)).toStrictEqual(['fake', 'pkg', 'mocking'])
}

export async function npxImportFailed(pkg: string, errorMatcher: string | RegExp) {
  _import.mockRejectedValueOnce('not-found')
  await expect(async () => {
    await npxImport(pkg, NOOP_LOGGER)
  }).rejects.toThrowError(errorMatcher)
  expect(_import).toHaveBeenCalledOnce()
}

export async function npxImportSucceeded(pkg: string | string[], logMatcher?: string | RegExp) {
  const pkgs = Array.isArray(pkg) ? pkg : [pkg]
  for (let i = 0; i < pkgs.length; i++) {
    _import.mockRejectedValueOnce('not-found')
  }
  const logs: string[] = []
  const imported = await npxImport(pkg, (msg: string) => logs.push(msg))
  expect(_import).toHaveBeenCalledTimes(pkgs.length)

  console.log(logs)
  if (logMatcher) {
    expect(logs.join('\n')).toMatch(logMatcher)
  }
  return imported
}

export function expectMock<T = any>(
  mock: keyof typeof MOCKS,
  args: any[],
  transformSuccess: (retVal: T) => T = (x) => x
) {
  const mockedCmd = MOCKS[mock]
  const cmdNr = increment(mock)
  postAssertions.add(() => {
    expect(mockedCmd).toHaveBeenNthCalledWith(cmdNr, ...args)
  })

  return {
    returning(retVal: any | Error) {
      if (retVal instanceof Error) {
        mockedCmd.mockRejectedValueOnce(retVal)
      } else {
        mockedCmd.mockResolvedValueOnce(transformSuccess(retVal))
      }
    },
  }
}

export function expectExecaCommand(cmd: string, ...opts: any[]) {
  return expectMock<object>('execaCommand', [cmd, ...opts], (retVal) => ({
    failed: false,
    stdout: '',
    stderr: '',
    ...retVal,
  }))
}

export function expectRelativeImport(basePath: string, packageImport: string) {
  return expectMock('_importRelative', [basePath, packageImport])
}

export function randomString(length: number) {
  return crypto.randomBytes(length).toString('hex')
}

export function getNpxPath(npxDirectoryHash: string) {
  return `/my/local/pwd/node_modules/.bin:/my/local/node_modules/.bin:/my/node_modules/.bin:/node_modules/.bin:/Users/glen/.nvm/versions/node/v18.3.0/lib/node_modules/npm/node_modules/@npmcli/run-script/lib/node-gyp-bin:/Users/glen/.npm/_npx/${npxDirectoryHash}/node_modules/.bin:/Users/glen/go/bin:/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin:/usr/X11/bin:/usr/local/go/bin`
}
