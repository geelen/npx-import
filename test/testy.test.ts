import { afterEach, describe, expect, MockedFunction, test, vi } from 'vitest'
import { importOnDemand } from '../lib'

// Surely there's a better way to mock stuff out??
import * as utils from '../lib/utils'

const { nativeDynamicImport, execaCommand } = utils as unknown as {
  nativeDynamicImport: MockedFunction<typeof utils.nativeDynamicImport>
  execaCommand: MockedFunction<any>
}

vi.mock('../lib/utils', () => {
  return {
    nativeDynamicImport: vi.fn(),
    execaCommand: vi.fn(),
  }
})

function matchesAllLines(...strings: string[]) {
  return new RegExp(
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
    strings.map((string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*'),
    's'
  )
}

describe(`npxImport`, () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  describe.only('already installed', () => {
    const successFullImport = async (pkg: string) => {
      nativeDynamicImport.mockResolvedValueOnce({ fake: 1, pkg: 2, mocking: 3 })
      const dynoImporto = await importOnDemand(pkg)
      expect(dynoImporto).toBeTruthy()
      expect(Object.keys(dynoImporto)).toStrictEqual(['fake', 'pkg', 'mocking'])
    }

    test(`should call import() and return it`, async () => {
      await successFullImport('fake-library')
      expect(nativeDynamicImport).toHaveBeenCalledWith('fake-library')

      await successFullImport('@fake/library')
      expect(nativeDynamicImport).toHaveBeenCalledWith('@fake/library')
    })

    test(`should ignore versions (for now)`, async () => {
      await successFullImport('fake-library@1.2.3')
      expect(nativeDynamicImport).toHaveBeenCalledWith('fake-library')

      await successFullImport('@fake/library@1.2.3')
      expect(nativeDynamicImport).toHaveBeenCalledWith('@fake/library')
    })

    test(`should ignore tags`, async () => {
      await successFullImport('fake-library@beta')
      expect(nativeDynamicImport).toHaveBeenCalledWith('fake-library')

      await successFullImport('@fake/library@beta')
      expect(nativeDynamicImport).toHaveBeenCalledWith('@fake/library')
    })

    test(`should pass through paths`, async () => {
      await successFullImport('fake-library/lib/utils.js')
      expect(nativeDynamicImport).toHaveBeenCalledWith('fake-library/lib/utils.js')

      await successFullImport('@fake/library/lib/utils.js')
      expect(nativeDynamicImport).toHaveBeenCalledWith('@fake/library/lib/utils.js')
    })

    test(`should work with versions and paths`, async () => {
      await successFullImport('fake-library@1.2.3/lib/utils.js')
      expect(nativeDynamicImport).toHaveBeenCalledWith('fake-library/lib/utils.js')

      await successFullImport('@fake/library@1.2.3/lib/utils.js')
      expect(nativeDynamicImport).toHaveBeenCalledWith('@fake/library/lib/utils.js')
    })
  })

  test(`Should fail if NPX can't be found`, async () => {
    nativeDynamicImport.mockRejectedValueOnce('not-found')
    execaCommand.mockResolvedValueOnce({ stdout: '', failed: true })

    await expect(async () => {
      await importOnDemand('no-npx-existo')
    }).rejects.toThrowError(`Couldn't execute npx --version. Is npm installed and up-to-date?`)

    expect(nativeDynamicImport).toHaveBeenCalledOnce()
    expect(execaCommand).toHaveBeenCalledOnce()
  })

  test(`Should fail if NPX is old`, async () => {
    nativeDynamicImport.mockRejectedValueOnce('not-found')
    execaCommand.mockResolvedValueOnce({ stdout: '7.1.2', failed: false })

    await expect(async () => {
      await importOnDemand('npm-too-old')
    }).rejects.toThrowError(`Require npm version 8+. Got '7.1.2' when running 'npx --version'`)

    expect(nativeDynamicImport).toHaveBeenCalledOnce()
    expect(execaCommand).toHaveBeenCalledOnce()
  })

  test(`Should attempt to install, passing through whatever happens`, async () => {
    nativeDynamicImport.mockRejectedValueOnce('not-found')
    execaCommand.mockResolvedValueOnce({ stdout: '8.1.2', failed: false })
    execaCommand.mockRejectedValue(new Error('EXPLODED TRYING TO INSTALL'))

    await expect(async () => {
      await importOnDemand('broken-install')
    }).rejects.toThrowError(
      matchesAllLines(
        `EXPLODED TRYING TO INSTALL`,
        `You should install broken-install locally:`,
        `pnpm add -D broken-install@latest`
      )
    )

    expect(nativeDynamicImport).toHaveBeenCalledOnce()
    expect(execaCommand).toHaveBeenCalledTimes(2)
  })
})
