/* The purpose of this file is to be mocked for testing. */
import { createRequire } from 'module'

export async function _import(packageWithPath: string) {
  return await import(packageWithPath)
}

export async function _importRelative(installDir: string, packageWithPath: string) {
  return await import(_resolveRelative(installDir, packageWithPath))
}

export function _resolve(packageWithPath: string) {
  return require.resolve(packageWithPath)
}

export function _resolveRelative(installDir: string, packageWithPath: string) {
  return createRequire(installDir).resolve(packageWithPath)
}
