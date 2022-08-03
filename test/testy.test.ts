import { expect, test } from 'vitest'
import { importOnDemand } from '../lib/index.js'

test('should work as expected', async () => {
  const dynoImporto = await importOnDemand('vitest')
  expect(dynoImporto).toBeTruthy()
  expect(Object.keys(dynoImporto)).toStrictEqual([
    'createExpect',
    'describe',
    'expect',
    'it',
    'suite',
    'test',
    'afterAll',
    'afterEach',
    'beforeAll',
    'beforeEach',
    'getRunningMode',
    'isFirstRun',
    'isWatchMode',
    'runOnce',
    'vi',
    'vitest',
    'withCallback',
    'chai',
    'assert',
    'should',
  ])
})
