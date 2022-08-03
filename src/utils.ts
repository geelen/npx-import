/* The purpose of this file is to be mocked for testing. */
import { createRequire } from 'module'

export async function _import(packageWithPath: string) {
  return await import(packageWithPath)
}

export async function _importRelative(installDir: string, packageWithPath: string) {
  return await createRequire(installDir)(packageWithPath)
}
