module.exports =
/******/ (function(modules, runtime) { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	__webpack_require__.ab = __dirname + "/";
/******/
/******/ 	// the startup function
/******/ 	function startup() {
/******/ 		// Load entry module and return exports
/******/ 		return __webpack_require__(888);
/******/ 	};
/******/
/******/ 	// run startup
/******/ 	return startup();
/******/ })
/************************************************************************/
/******/ ({

/***/ 29:
/***/ (function(module) {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 87:
/***/ (function(module) {

module.exports = require("os");

/***/ }),

/***/ 622:
/***/ (function(module) {

module.exports = require("path");

/***/ }),

/***/ 718:
/***/ (function(module) {

module.exports = eval("require")("@actions/io");


/***/ }),

/***/ 743:
/***/ (function(module) {

module.exports = eval("require")("@actions/tool-cache");


/***/ }),

/***/ 888:
/***/ (function(__unusedmodule, __unusedexports, __webpack_require__) {

const os = __webpack_require__(87)
const path = __webpack_require__(622)

const core = __webpack_require__(29)
const exec = __webpack_require__(991)
const io = __webpack_require__(718)
const tc = __webpack_require__(743)

const INSTALLATION_DIRECTORY = path.join(os.homedir(), '.smalltalkCI')
const DEFAULT_64BIT_DEPS = 'libpulse0'
const DEFAULT_32BIT_DEPS = 'libc6-i386 libuuid1:i386 libssl1.0.0:i386'
const PHARO_32BIT_DEPS = `${DEFAULT_32BIT_DEPS} libcairo2:i386`


async function run() {
  try {
    const SCI_BRANCH = core.getInput('smalltalkCI-branch') || 'master'
    const SCI_REPO = core.getInput('smalltalkCI-source') || 'hpi-swa/smalltalkCI'
    const version = core.getInput('smalltalk-version', { required: true })
    core.setOutput('smalltalk-version', version)

    /* Download and extract smalltalkCI. */
    console.log('Downloading and extracting smalltalkCI...')
    let tempDir = path.join(os.homedir(), '.smalltalkCI-temp')
    if (isWindows()) {
      const toolPath = await tc.downloadTool(`https://github.com/${SCI_REPO}/archive/${SCI_BRANCH}.zip`)
      tempDir = await tc.extractZip(toolPath, tempDir)
    }
    else {
      const toolPath = await tc.downloadTool(`https://github.com/${SCI_REPO}/archive/${SCI_BRANCH}.tar.gz`)
      tempDir = await tc.extractTar(toolPath, tempDir)
    }
    await io.mv(path.join(tempDir, `smalltalkCI-${SCI_BRANCH}`), INSTALLATION_DIRECTORY)

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


/***/ }),

/***/ 991:
/***/ (function(module) {

module.exports = eval("require")("@actions/exec");


/***/ })

/******/ });