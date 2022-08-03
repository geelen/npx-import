/* The purpose of this file is to be mocked for testing. */
export { execaCommand } from 'execa'

export async function nativeDynamicImport(packageWithPath: string) {
  return await import(packageWithPath)
}
