import semver from 'semver'
import path from 'path'
import { createRequire } from 'module'
import { parse } from 'parse-package-name'
import { execaCommand, nativeDynamicImport } from './utils'

type Logger = (message: string) => void

export async function importOnDemand<T = unknown>(
  pkg: string,
  logger: Logger = (message: string) => console.log(`[IOD] ${message}`)
): Promise<T> {
  const { name: packageName, version, path } = parse(pkg)
  const packageWithPath = path.length > 0 ? [packageName, path].join('/') : packageName
  console.log({ packageWithPath })
  try {
    return await nativeDynamicImport(packageWithPath)
  } catch (e) {
    logger(
      `${packageWithPath} not available locally. Attempting to use npx to install temporarily.`
    )
    try {
      await checkNpxVersion()
      const installDir = await installAndReturnDir(packageName, version, logger)
      return await createRequire(installDir)(packageWithPath)
    } catch (e) {
      throw new Error(
        `IOD (Import On-Demand) failed for ${packageWithPath} with message:\n    ${e.message}\n\n` +
          `You should install ${packageName} locally: \n    ` +
          installInstructions(packageName, version) +
          `\n\n`
      )
    }
  }
}

// export async function importOnDemandMulti<T = unknown>(
//   packages: PackageSpecifier[],
//   logger: Logger = (message: string) => console.log(`[IOD] ${message}`)
// ): Promise<T> {}

async function checkNpxVersion() {
  const versionCmd = `npx --version`
  const { failed, stdout: npmVersion } = await execaCommand(versionCmd)
  if (failed) {
    throw new Error(`Couldn't execute ${versionCmd}. Is npm installed and up-to-date?`)
  }

  if (!semver.gte(npmVersion, '8.0.0')) {
    throw new Error(`Require npm version 8+. Got '${npmVersion}' when running '${versionCmd}'`)
  }
}

async function installAndReturnDir(packageName: string, version: string, logger: Logger) {
  const installPackage = `npx -y -p ${packageName}@${version}`
  logger(`Installing... (${installPackage})`)
  const emitPath = `node -e 'console.log(process.env.PATH)'`
  const { failed, stdout } = await execaCommand(`${installPackage} ${emitPath}`, {
    shell: true,
  })
  if (failed) {
    throw new Error(`Failed installing ${packageName} using: ${installPackage}.`)
  }
  const paths = stdout.split(':')
  const tempPath = paths.find((p) => /\/\.npm\/_npx\//.exec(p))

  if (!tempPath)
    throw new Error(
      `Failed to find temporary install directory. Looking for paths matching '/.npm/_npx/' in:\n${JSON.stringify(
        paths
      )}`
    )

  // Expecting the path ends with node_modules/.bin
  const nodeModulesPath = path.resolve(tempPath, '..')
  if (!nodeModulesPath.endsWith('node_modules')) {
    throw new Error(
      `Found NPX temporary path of '${tempPath}' but expected to be able to find a node_modules directory by looking in '..'.`
    )
  }

  logger(`Installed into ${nodeModulesPath}.`)
  logger(`To skip this step in future, run: ${installInstructions(packageName, version)}`)

  return nodeModulesPath
}

const INSTRUCTIONS = {
  npm: (packageName: string) => `npm install --save-dev ${packageName}`,
  pnpm: (packageName: string) => `pnpm add -D ${packageName}`,
  yarn: (packageName: string) => `yarn add -D ${packageName}`,
}
function installInstructions(packageName: string, version: string) {
  return INSTRUCTIONS[getPackageManager()](`${packageName}@${version}`)
}

export function getPackageManager(): keyof typeof INSTRUCTIONS {
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
