const os = require('os')
const path = require('path')

const core = require('@actions/core')
const exec = require('@actions/exec')
const io = require('@actions/io')
const tc = require('@actions/tool-cache')

const INSTALLATION_DIRECTORY = path.join(os.homedir(), '.smalltalkCI')
const DEFAULT_BRANCH = 'master'
const DEFAULT_SOURCE = 'hpi-swa/smalltalkCI'
const DEFAULT_64BIT_DEPS = 'libpulse0'
const DEFAULT_32BIT_DEPS = 'libc6-i386 libuuid1:i386 libssl1.0.0:i386'
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
    if (isWindows()) {
      const toolPath = await tc.downloadTool(`https://github.com/${smalltalkCISource}/archive/${smalltalkCIBranch}.zip`)
      tempDir = await tc.extractZip(toolPath, tempDir)
    }
    else {
      const toolPath = await tc.downloadTool(`https://github.com/${smalltalkCISource}/archive/${smalltalkCIBranch}.tar.gz`)
      tempDir = await tc.extractTar(toolPath, tempDir)
    }
    await io.mv(path.join(tempDir, `smalltalkCI-${smalltalkCIBranch}`), INSTALLATION_DIRECTORY)

    /* Install dependencies if any. */
    if (isLinux()) {
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
          // TODO
        }
      }
    }

    /* Set up smalltalkci command. */
    core.addPath(path.join(INSTALLATION_DIRECTORY, 'bin'))
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

function isLinux() {
  return process.platform === 'linux'
}

function isWindows() {
  return process.platform === 'win32'
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
