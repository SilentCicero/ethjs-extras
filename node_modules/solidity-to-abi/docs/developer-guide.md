# Developer Guide

All information regarding contributing to and progressing solidity-to-abi can be found in this document.

## Install from Source

```
git clone http://github.com/SilentCicero/solidity-to-abi
npm install
```

## Folder Structure

All module source code is found in the `src` directory. All module helper scripts can be found in the `scripts` folder. These will not need to be touched, and are purely configuration for this repository.

```
./solidity-to-abi
  ./.github
  ./docs
  ./internals
    ./scripts
  ./src
    ./tests
```

## Unit Testing

All tests can be found in [`src/tests`](../../../blob/master/src/tests)

## Gotchas

1. Does not do any type checking

## Future Plans

1. Allow module to intake entire SOL contracts and output ABI

## Contributing

Please help better the ecosystem by submitting issues and pull requests to default. We need all the help we can get to build the absolute best linting standards and utilities. We follow the AirBNB linting standard. Please read more about contributing to `solidity-to-abi` in the `CONTRIBUTING.md`.

## Licence

This project is licensed under the MIT license, Copyright (c) 2016 SilentCicero. For more information see LICENSE.md.
