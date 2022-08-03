import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  expectExecaCommand,
  npxImportFailed,
  getNpxPath,
  matchesAllLines,
  _import,
  randomString,
  runPostAssertions,
  npxImportLocalPackage,
  npxImportSucceeded,
  expectRelativeImport,
} from './utils'

vi.mock('../lib/utils', () => {
  return {
    _import: vi.fn(),
    _importRelative: vi.fn(),
  }
})
vi.mock('execa', () => {
  return {
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
      await npxImportLocalPackage('fake-library')
      expect(_import).toHaveBeenCalledWith('fake-library')

      await npxImportLocalPackage('@fake/library')
      expect(_import).toHaveBeenCalledWith('@fake/library')
    })

    test(`should ignore versions (for now)`, async () => {
      await npxImportLocalPackage('fake-library@1.2.3')
      expect(_import).toHaveBeenCalledWith('fake-library')

      await npxImportLocalPackage('@fake/library@1.2.3')
      expect(_import).toHaveBeenCalledWith('@fake/library')
    })

    test(`should ignore tags`, async () => {
      await npxImportLocalPackage('fake-library@beta')
      expect(_import).toHaveBeenCalledWith('fake-library')

      await npxImportLocalPackage('@fake/library@beta')
      expect(_import).toHaveBeenCalledWith('@fake/library')
    })

    test(`should pass through paths`, async () => {
      await npxImportLocalPackage('fake-library/lib/utils.js')
      expect(_import).toHaveBeenCalledWith('fake-library/lib/utils.js')

      await npxImportLocalPackage('@fake/library/lib/utils.js')
      expect(_import).toHaveBeenCalledWith('@fake/library/lib/utils.js')
    })

    test(`should work with versions and paths`, async () => {
      await npxImportLocalPackage('fake-library@1.2.3/lib/utils.js')
      expect(_import).toHaveBeenCalledWith('fake-library/lib/utils.js')

      await npxImportLocalPackage('@fake/library@1.2.3/lib/utils.js')
      expect(_import).toHaveBeenCalledWith('@fake/library/lib/utils.js')
    })
  })

  describe('failure cases', () => {
    test(`Should fail if NPX can't be found`, async () => {
      expectExecaCommand('npx --version').returning({ failed: true })

      await npxImportFailed(
        'no-npx-existo',
        `Couldn't execute npx --version. Is npm installed and up-to-date?`
      )
    })

    test(`Should fail if NPX is old`, async () => {
      expectExecaCommand('npx --version').returning({ stdout: '7.1.2' })

      await npxImportFailed(
        'npm-too-old',
        `Require npm version 8+. Got '7.1.2' when running 'npx --version'`
      )
    })

    test(`Should attempt to install, passing through whatever happens`, async () => {
      expectExecaCommand('npx --version').returning({ stdout: '8.1.2' })
      expectExecaCommand(
        `npx -y -p broken-install@latest node -e 'console.log(process.env.PATH)'`,
        { shell: true }
      ).returning(new Error('EXPLODED TRYING TO INSTALL'))

      await npxImportFailed(
        'broken-install',
        matchesAllLines(
          `EXPLODED TRYING TO INSTALL`,
          `You should install broken-install locally:`,
          `pnpm add -D broken-install@latest`
        )
      )
    })

    test(`Should include tag in error instructions`, async () => {
      expectExecaCommand('npx --version').returning({ stdout: '8.1.2' })
      expectExecaCommand(
        `npx -y -p left-pad@this-tag-no-exist node -e 'console.log(process.env.PATH)'`,
        { shell: true }
      ).returning(new Error('No matching version found for left-pad@this-tag-no-exist.'))

      await npxImportFailed(
        'left-pad@this-tag-no-exist',
        matchesAllLines(
          `No matching version found for left-pad@this-tag-no-exist.`,
          `You should install left-pad locally:`,
          `pnpm add -D left-pad@this-tag-no-exist`
        )
      )
    })

    test(`Should not include path in error instructions`, async () => {
      const npxDirectoryHash = randomString(12)
      const basePath = `/Users/glen/.npm/_npx/${npxDirectoryHash}/node_modules`

      expectExecaCommand('npx --version').returning({ stdout: '8.1.2' })
      expectExecaCommand(`npx -y -p @org/pkg@my-tag node -e 'console.log(process.env.PATH)'`, {
        shell: true,
      }).returning({ stdout: getNpxPath(npxDirectoryHash) })
      expectRelativeImport(basePath, '@org/pkg/weird-path.js').returning(
        new Error(`Error [ERR_MODULE_NOT_FOUND]: Cannot find module '${basePath}/weird-path.js'`)
      )

      await npxImportFailed(
        '@org/pkg@my-tag/weird-path.js',
        matchesAllLines(
          `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '${basePath}/weird-path.js'`,
          `You should install @org/pkg locally:`,
          `pnpm add -D @org/pkg@my-tag`
        )
      )
    })
  })

  describe('success cases', () => {
    test(`Should call relative import and return`, async () => {
      const npxDirectoryHash = randomString(12)

      expectExecaCommand('npx --version').returning({ stdout: '8.1.2' })
      expectExecaCommand(`npx -y -p @org/pkg@my-tag node -e 'console.log(process.env.PATH)'`, {
        shell: true,
      }).returning({ stdout: getNpxPath(npxDirectoryHash) })
      expectRelativeImport(
        `/Users/glen/.npm/_npx/${npxDirectoryHash}/node_modules`,
        '@org/pkg/lib/index.js'
      ).returning({ foo: 1, bar: 2 })

      const imported = await npxImportSucceeded('@org/pkg@my-tag/lib/index.js')
      expect(imported).toStrictEqual({ foo: 1, bar: 2 })
    })
  })
})
