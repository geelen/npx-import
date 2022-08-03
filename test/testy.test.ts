import { vi, describe, afterEach, expect, test, MockedFunction, beforeEach } from 'vitest'
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

describe('npxImport', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  test('should try native import() first', async () => {
    nativeDynamicImport.mockResolvedValueOnce({
      fake: 1,
      pkg: 2,
      mocking: 3,
    })

    const dynoImporto = await importOnDemand('fake-package')
    expect(dynoImporto).toBeTruthy()
    expect(Object.keys(dynoImporto)).toStrictEqual(['fake', 'pkg', 'mocking'])

    expect(nativeDynamicImport).toHaveBeenCalledOnce()
  })

  test('Should use NPX if it doesnt exist', async () => {
    nativeDynamicImport.mockRejectedValue('NO EXISTO')

    execaCommand.mockResolvedValueOnce({
      stdout: '',
      failed: true,
    })

    await expect(async () => {
      await importOnDemand('fake-package')
    }).rejects.toThrowError(`Couldn't execute npx --version. Is npm installed and up-to-date?`)

    expect(nativeDynamicImport).toHaveBeenCalledOnce()
  })
})
