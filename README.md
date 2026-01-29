# metadata-enrichment

[![License](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](https://opensource.org/license/apache-2-0) [![NPM](https://img.shields.io/npm/v/@salesforce/metadata-enrichment.svg?label=@salesforce/metadata-enrichment)](https://www.npmjs.com/package/@salesforce/metadata-enrichment) [![Downloads/week](https://img.shields.io/npm/dw/@salesforce/metadata-enrichment.svg)](https://npmjs.org/package/@salesforce/metadata-enrichment) 

## Introduction

A library for handling metadata enrichment. Supports metadata enrichment flows in [the CLI plugin](https://github.com/salesforcecli/plugin-metadata-enrichment), Agentforce for Developers, and other experiences. 

## Features

- Send metadata enrichment requests
- Read/write enriched metadata for local project components

## Issues

Please report all issues to the [issues only repository](https://github.com/forcedotcom/cli/issues).

## Usage


### Install

Install the package:

```
npm install @salesforce/metadata-enrichment
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details on how to contribute to the library.

### Install & Build

Install:

```
yarn install 
```

Build:

```
yarn build
```

### Plugin Local Development

This library is used extensively by [plugin-metadata-enrichment](https://github.com/salesforcecli/plugin-metadata-enrichment).
To link the local library to the local plugin for development:

1. Clean artifacts from plugin library

```
[plugin-metadata-enrichment]
yarn clean-all
```

2. Install and build metadata-enrichment library

```
[metadata-enrichment]
yarn install && yarn build
```

3. Run local install script

```
[metadata-enrichment]
yarn local:install /{PATH}/{TO}/{LOCAL}/{PLUGIN}/plugin-metadata-enrichment
```

This installs a local package into your plugin directory and updates your `package.json` to point to it.

4. Install and build plugin

```
[plugin-metadata-enrichment]
yarn install && yarn build
```
