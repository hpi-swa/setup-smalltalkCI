# setup-smalltalkCI

This GitHub Action sets up [smalltalkCI] for testing Smalltalk projects.

## Usage

### Basic

```yaml
steps:
  - uses: actions/checkout@v2
  - uses: hpi-swa/setup-smalltalkCI@v1
    id: smalltalkci
    with:
      smalltalk-image: 'Squeak64-trunk'
  - run: smalltalkci -s ${{ steps.smalltalkci.outputs.smalltalk-image }}
    shell: bash
    timeout-minutes: 15
```

### Testing Different Smalltalk Images

```yaml
jobs:
  build:
    strategy:
      matrix:
        smalltalk: [ Squeak64-trunk, Pharo64-stable ]
    name: ${{ matrix.smalltalk }}
    steps:
      - uses: actions/checkout@v2
      - uses: hpi-swa/setup-smalltalkCI@v1
        with:
          smalltalk-image: ${{ matrix.smalltalk }}
      - run: smalltalkci -s ${{ matrix.smalltalk }}
        shell: bash
        timeout-minutes: 15
```

### Testing Different Smalltalk Images with Different Configurations
```yaml
jobs:
  build:
    strategy:
      matrix:
        smalltalk: [ Squeak64-trunk, Pharo64-stable ]
        smalltalk_config: [ .smalltalkA.ston, .smalltalkB.ston ]
    name: ${{ matrix.smalltalk }}
    steps:
      - uses: actions/checkout@v2
      - uses: hpi-swa/setup-smalltalkCI@v1
        with:
          smalltalk-image: ${{ matrix.smalltalk }}
      - run: smalltalkci -s ${{ matrix.smalltalk }} ${{ matrix.smalltalk_config }}
        shell: bash
        timeout-minutes: 15
```

### Use a different branch or fork

```yaml
steps:
  - uses: actions/checkout@v2
  - uses: hpi-swa/setup-smalltalkCI@v1
    id: smalltalkci
    with:
      smalltalk-image: 'Squeak64-trunk'
      smalltalkCI-branch: 'testing-branch'
      smalltalkCI-source: 'myfork/smalltalkCI'
  - run: smalltalkci -s ${{ steps.smalltalkci.outputs.smalltalk-image }}
    shell: bash
    timeout-minutes: 15
```


### (Pharo and GithubAction specific) Registering Repository in Iceberg  

Registering a repository in Iceberg allows developers to access the directory of the repository regardless of where it is located in the file system.  
This ease access to non-smalltalk resources.  
To register the repository in Iceberg you need to add the option #registerInIceberg : true in your .smalltalkci.ston file.  

```smalltalk
(IceRepository registeredRepositoryIncludingPackage: self class package) location pathString
```

However, Iceberg requires the full commit history.  
actions/checkout provides by default only the latest one.  
Therefore we need to use an option to get all commits.  
(Only available for Pharo 9 and later version at this time). 

```yaml
steps:
  - uses: actions/checkout@v3
    with:
      fetch-depth: 0 #Option fetching all commits
  - uses: hpi-swa/setup-smalltalkCI@v1
    id: smalltalkci
    with:
      smalltalk-image: 'Squeak64-trunk'
  - run: smalltalkci -s ${{ steps.smalltalkci.outputs.smalltalk-image }}
    shell: bash
    timeout-minutes: 15
```


[smalltalkCI]: https://github.com/hpi-swa/smalltalkCI
