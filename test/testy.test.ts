import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { importOnDemand } from '../lib'
import {
  execaCommand,
  failedImport,
  matchesAllLines,
  nativeDynamicImport,
  successfulImport,
  runPostAssertions,
  expectExecaCommand,
} from './utils'

vi.mock('../lib/utils', () => {
  return {
    nativeDynamicImport: vi.fn(),
    execaCommand: vi.fn(),
  }
})

describe(`npxImport`, () => {
  afterEach(() => {
    runPostAssertions()
    vi.clearAllMocks()
  })

  describe('already installed', () => {
    test(`should call import() and return it`, async () => {
      await successfulImport('fake-library')
      expect(nativeDynamicImport).toHaveBeenCalledWith('fake-library')

      await successfulImport('@fake/library')
      expect(nativeDynamicImport).toHaveBeenCalledWith('@fake/library')
    })

    test(`should ignore versions (for now)`, async () => {
      await successfulImport('fake-library@1.2.3')
      expect(nativeDynamicImport).toHaveBeenCalledWith('fake-library')

      await successfulImport('@fake/library@1.2.3')
      expect(nativeDynamicImport).toHaveBeenCalledWith('@fake/library')
    })

    test(`should ignore tags`, async () => {
      await successfulImport('fake-library@beta')
      expect(nativeDynamicImport).toHaveBeenCalledWith('fake-library')

      await successfulImport('@fake/library@beta')
      expect(nativeDynamicImport).toHaveBeenCalledWith('@fake/library')
    })

    test(`should pass through paths`, async () => {
      await successfulImport('fake-library/lib/utils.js')
      expect(nativeDynamicImport).toHaveBeenCalledWith('fake-library/lib/utils.js')

      await successfulImport('@fake/library/lib/utils.js')
      expect(nativeDynamicImport).toHaveBeenCalledWith('@fake/library/lib/utils.js')
    })

    test(`should work with versions and paths`, async () => {
      await successfulImport('fake-library@1.2.3/lib/utils.js')
      expect(nativeDynamicImport).toHaveBeenCalledWith('fake-library/lib/utils.js')

      await successfulImport('@fake/library@1.2.3/lib/utils.js')
      expect(nativeDynamicImport).toHaveBeenCalledWith('@fake/library/lib/utils.js')
    })
  })

  describe('failure cases', () => {
    afterEach(() => {
      expect(execaCommand).toHaveBeenNthCalledWith(1, 'npx --version')
    })

    test(`Should fail if NPX can't be found`, async () => {
      expectExecaCommand('npx --version', { failed: true })

      await failedImport(
        'no-npx-existo',
        `Couldn't execute npx --version. Is npm installed and up-to-date?`
      )
    })

    test(`Should fail if NPX is old`, async () => {
      expectExecaCommand('npx --version', { stdout: '7.1.2' })

      await failedImport(
        'npm-too-old',
        `Require npm version 8+. Got '7.1.2' when running 'npx --version'`
      )
    })

    test(`Should attempt to install, passing through whatever happens`, async () => {
      expectExecaCommand('npx --version', { stdout: '8.1.2' })
      expectExecaCommand(
        `npx -y -p broken-install@latest node -e 'console.log(process.env.PATH)'`,
        { shell: true },
        new Error('EXPLODED TRYING TO INSTALL')
      )

      await failedImport(
        'broken-install',
        matchesAllLines(
          `EXPLODED TRYING TO INSTALL`,
          `You should install broken-install locally:`,
          `pnpm add -D broken-install@latest`
        )
      )
    })
  })
})
