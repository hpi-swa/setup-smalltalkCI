const child_process = require('child_process');
const fs = require('fs')
const os = require('os')
const path = require('path')

const core = require('@actions/core')
const exec = require('@actions/exec')
const io = require('@actions/io')
const tc = require('@actions/tool-cache')

const IS_LINUX = process.platform === 'linux'
const IS_WINDOWS = process.platform === 'win32'

const INSTALLATION_DIRECTORY = path.join(os.homedir(), '.smalltalkCI')
const DEFAULT_BRANCH = 'master'
const DEFAULT_SOURCE = 'hpi-swa/smalltalkCI'
const LSB_FILE = '/etc/lsb-release'
const DEFAULT_64BIT_DEPS = 'libpulse0'
const DEFAULT_32BIT_DEPS = 'libc6-i386 libuuid1:i386 ' + (isUbuntu20() ? 'libssl1.1:i386' : 'libssl1.0.0:i386')
const PHARO_32BIT_DEPS = `${DEFAULT_32BIT_DEPS} libcairo2:i386`


async function run() {
  try {
    const version = core.getInput('smalltalk-version', { required: true })
    core.setOutput('smalltalk-version', version)
    const smalltalkCIBranch = core.getInput('smalltalkCI-branch') || DEFAULT_BRANCH
    const smalltalkCISource = core.getInput('smalltalkCI-source') || DEFAULT_SOURCE

    /* Download and extract smalltalkCI. */
    console.log('Downloading and extracting smalltalkCI...')
    let tempDir = path.join(os.homedir(), '.smalltalkCI-temp')
    if (IS_WINDOWS) {
      const toolPath = await tc.downloadTool(`https://github.com/${smalltalkCISource}/archive/${smalltalkCIBranch}.zip`)
      tempDir = await tc.extractZip(toolPath, tempDir)
    }
    else {
      const toolPath = await tc.downloadTool(`https://github.com/${smalltalkCISource}/archive/${smalltalkCIBranch}.tar.gz`)
      tempDir = await tc.extractTar(toolPath, tempDir)
    }
    await io.mv(path.join(tempDir, `smalltalkCI-${smalltalkCIBranch}`), INSTALLATION_DIRECTORY)

    /* Install dependencies if any. */
    if (IS_LINUX) {
      if (is64bit(version)) {
        if (isSqueak(version) || isEtoys(version)) {
          install64bitDependencies(DEFAULT_64BIT_DEPS)
        }
      } else {
        if (isSqueak(version) || isEtoys(version)) {
          await install32bitDependencies(DEFAULT_32BIT_DEPS)
        } else if (isPharo(version) || isMoose(version)) {
          await install32bitDependencies(PHARO_32BIT_DEPS)
        } else if (isGemstone(version)) {
          // nothing to, smalltalkCI will set up the system using GsDevKit_home
        }
      }
    }

    /* Set up smalltalkci command. */
    core.addPath(path.join(INSTALLATION_DIRECTORY, 'bin'))

    if (!IS_WINDOWS) {
      /* Find and export smalltalkCI's env vars. */
      const envList = child_process.execSync('smalltalkci --print-env').toString()
      for (const envItem of envList.split('\n')) {
        const parts = envItem.split('=')
        if (parts.length == 2) {
          core.exportVariable(parts[0], parts[1])
        }
      }
    }
  }
  catch (error) {
    core.setFailed(error.message)
  }
}

async function install64bitDependencies(deps) {
  await exec.exec('sudo apt-get update')
  await exec.exec(`sudo apt-get install -qq --no-install-recommends ${deps}`)
}

async function install32bitDependencies(deps) {
  await exec.exec('sudo dpkg --add-architecture i386')
  await exec.exec('sudo apt-get update')
  await exec.exec(`sudo apt-get install -qq --no-install-recommends ${deps}`)
}

function isUbuntu20() {
  if (IS_LINUX && fs.existsSync(LSB_FILE)) {
    return fs.readFileSync(LSB_FILE).toString().includes("DISTRIB_RELEASE=20")
  } else {
    return false
  }
}

function is64bit(version) {
  return /^[a-zA-Z]*64-/.test(version)
}

function isSqueak(version) {
  return isPlatform(version, 'squeak')
}

function isEtoys(version) {
  return isPlatform(version, 'etoys')
}

function isPharo(version) {
  return isPlatform(version, 'pharo')
}

function isMoose(version) {
  return isPlatform(version, 'moose')
}

function isGemstone(version) {
  return isPlatform(version, 'gemstone')
}

function isPlatform(version, name) {
  return version.toLowerCase().startsWith(name)
}

run()
