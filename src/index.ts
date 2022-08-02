import { execaCommand } from 'execa'

const INSTRUCTIONS = {
  npm: (packageName: string) => `npm install --save-dev ${packageName}`,
  pnpm: (packageName: string) => `pnpm add -D ${packageName}`,
  yarn: (packageName: string) => `yarn add -D ${packageName}`,
}

function getPackageManager(): keyof typeof INSTRUCTIONS {
  const userAgent = process.env.npm_config_user_agent
  if (userAgent) {
    if (userAgent.startsWith('pnpm')) return 'pnpm'
    if (userAgent.startsWith('yarn')) return 'yarn'
    if (userAgent.startsWith('npm')) return 'npm'
  }

  const execpath = process.env.npm_execpath
  if (execpath) {
    if (/np[xm]-cli\.js$/.exec(execpath)) return 'npm'
    if (/yarn$/.exec(execpath)) return 'yarn'
  }

  const mainModulePath = process.mainModule?.path
  if (mainModulePath) {
    if (/\/\.?pnpm\//.exec(mainModulePath)) return 'pnpm'
    if (/\/\.?yarn\//.exec(mainModulePath)) return 'yarn'
  }

  return 'npm'
}

function installInstructions(packageName: string) {
  return INSTRUCTIONS[getPackageManager()](packageName)
}

export async function importOnDemand(packageName: string): Promise<any> {
  try {
    return await import(packageName)
  } catch (e) {
    try {
      return await installAndImport()
    } catch (e) {
      throw new Error(
        `IOD (Install On-Demand) failed for '${packageName}' with message: ${e.message}\n\n` +
          `You should install '${packageName}' locally: ${installInstructions(
            packageName
          )}`
      )
    }
  }
}

async function installAndImport() {
  const versionCmd = `npoox --version`
  const { failed, stdout } = await execaCommand(versionCmd)
  if (failed) {
    throw new Error(
      `Couldn't execute ${versionCmd}. Is npm installed and up-to-date?`
    )
  }
}
