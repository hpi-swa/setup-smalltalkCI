const child_process = require('child_process')
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
const UBUNTU_VERSION = getUbuntuVersion()
const DEFAULT_64BIT_DEPS = 'libpulse0'
const DEFAULT_32BIT_DEPS = `libc6-i386 libuuid1:i386${UBUNTU_VERSION == 18 ? ' libssl1.0.0:i386' : (UBUNTU_VERSION == 20 ? ' libssl1.1:i386': '')}`
const PHARO_32BIT_DEPS = `${DEFAULT_32BIT_DEPS} libcairo2:i386`


async function run() {
  try {
    let image
    const version = core.getInput('smalltalk-version')
    if (version.length > 0) {
      image = version
      core.warning('Please use "smalltalk-image". "smalltalk-version" is deprecated and will be removed in the future.')
    } else {
      image = core.getInput('smalltalk-image', { required: true })
    }

    const is64bit = /^[a-zA-Z]*64-/.test(image)
    const isSqueak = isPlatform(image, 'squeak')
    const isEtoys = isPlatform(image, 'etoys')
    const isPharo = isPlatform(image, 'pharo')
    const isMoose = isPlatform(image, 'moose')
    const isGemstone = isPlatform(image, 'gemstone')

    if (!isSqueak && !isEtoys && !isPharo && !isMoose && !isGemstone) {
      return core.setFailed(`Unsupported Smalltalk version "${image}".`)
    }

    core.setOutput('smalltalk-image', image)
    core.setOutput('smalltalk-version', version)

    const smalltalkCIBranch = core.getInput('smalltalkCI-branch') || DEFAULT_BRANCH
    const smalltalkCISource = core.getInput('smalltalkCI-source') || DEFAULT_SOURCE

    /* Download and extract smalltalkCI. */
    console.log('Downloading and extracting smalltalkCI...')
    let tempDir = path.join(os.homedir(), '.smalltalkCI-temp')
    if (IS_WINDOWS) {
      const toolPath = await tc.downloadTool(`https://github.com/${smalltalkCISource}/archive/${smalltalkCIBranch}.zip`)
      tempDir = await tc.extractZip(toolPath, tempDir)
    } else {
      const toolPath = await tc.downloadTool(`https://github.com/${smalltalkCISource}/archive/${smalltalkCIBranch}.tar.gz`)
      tempDir = await tc.extractTar(toolPath, tempDir)
    }
    await io.mv(path.join(tempDir, `smalltalkCI-${smalltalkCIBranch}`), INSTALLATION_DIRECTORY)

    /* Install dependencies if any. */
    if (IS_LINUX) {
      if (is64bit) {
        if (isSqueak || isEtoys) {
          await install64bitDependencies(DEFAULT_64BIT_DEPS)
        }
      } else {
        if (isSqueak || isEtoys) {
          await install32bitDependencies(DEFAULT_32BIT_DEPS)
        } else if (isPharo || isMoose) {
          await install32bitDependencies(PHARO_32BIT_DEPS)
        } else if (isGemstone) {
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
  } catch (error) {
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

function getUbuntuVersion() {
  if (IS_LINUX && fs.existsSync(LSB_FILE)) {
    const contents = fs.readFileSync(LSB_FILE).toString();
    if (contents.includes('DISTRIB_RELEASE=22')) {
      return 22
    } else if (contents.includes('DISTRIB_RELEASE=20')) {
      return 20
    } else if (contents.includes('DISTRIB_RELEASE=18')) {
      return 18
    } else {
      return -1
    }
  } else {
    return -1
  }
}

function isPlatform(image, name) {
  return image.toLowerCase().startsWith(name)
}

// eslint-disable-next-line no-floating-promise/no-floating-promise
run()  // return a Promise as specified by the GitHub Actions protocol
