'use strict'

import fs from 'fs'
import path from 'path'
import process from 'process'

import camelcase from 'camelcase'
import isThere from 'is-there'
import mkdirp from 'mkdirp'

import os from 'os'
import FileSystemLoader from './fileSystemLoader'

function removeExtension(filePath) {
  const ext = path.extname(filePath)
  return filePath.replace(new RegExp(ext + '$'), '')
}

interface DtsContentOptions {
  dropExtension: any
  rootDir: any
  searchDir: string
  outDir: string
  rInputPath: string
  rawTokenList: any
  resultList: any
  EOL: any
}

class DtsContent {
  options: DtsContentOptions
  constructor(options: DtsContentOptions) {
    this.options = options
  }

  get contents() {
    return this.options.resultList
  }

  get formatted() {
    const { resultList, EOL } = this.options
    if (!resultList || !resultList.length) {
      return ''
    }
    return (
      [
        'declare const styles: {',
        ...resultList.map((line: any) => '  ' + line),
        '};',
        'export = styles;',
        '',
      ].join(os.EOL) + EOL
    )
  }

  get tokens() {
    return this.options.rawTokenList
  }

  get outputFilePath() {
    const { dropExtension, rootDir, outDir, rInputPath } = this.options
    const outputFileName = dropExtension
      ? removeExtension(rInputPath)
      : rInputPath
    return path.join(rootDir, outDir, outputFileName + '.d.ts')
  }

  get inputFilePath() {
    const { rootDir, searchDir, rInputPath } = this.options
    return path.join(rootDir, searchDir, rInputPath)
  }

  writeFile() {
    const outPathDir = path.dirname(this.outputFilePath)
    if (!isThere(outPathDir)) {
      mkdirp.sync(outPathDir)
    }
    return new Promise((resolve, reject) => {
      fs.writeFile(this.outputFilePath, this.formatted, 'utf8', err => {
        if (err) {
          reject(err)
        } else {
          resolve(this)
        }
      })
    })
  }
}

interface DtsCreatorOptions {
  rootDir?: any
  searchDir?: string
  outDir?: string
  camelCase?: any
  dropExtension?: any
  EOL?: any
}

export class DtsCreator {
  rootDir: any
  searchDir: string
  outDir: string
  loader: any
  inputDirectory: any
  outputDirectory: any
  camelCase: any
  dropExtension: any
  rawTokenList: any
  resultList: any
  EOL: any
  constructor(options: DtsCreatorOptions) {
    this.rootDir = options.rootDir || process.cwd()
    this.searchDir = options.searchDir || ''
    this.outDir = options.outDir || this.searchDir
    this.loader = new FileSystemLoader(this.rootDir)
    this.inputDirectory = path.join(this.rootDir, this.searchDir)
    this.outputDirectory = path.join(this.rootDir, this.outDir)
    this.camelCase = options.camelCase
    this.dropExtension = !!options.dropExtension
    this.EOL = options.EOL || os.EOL
  }

  create(filePath, initialContents, clearCache = false) {
    return new Promise((resolve, reject) => {
      const rInputPath = path.isAbsolute(filePath)
        ? path.relative(this.inputDirectory, filePath)
        : path.relative(this.inputDirectory, path.join(process.cwd(), filePath))
      if (clearCache) {
        this.loader.tokensByFile = {}
      }
      this.loader
        .fetch(filePath, '/', undefined, initialContents)
        .then(res => {
          if (res) {
            const tokens = res
            const keys = Object.keys(tokens)

            const convertKey = this.getConvertKeyMethod(this.camelCase)

            const result = keys
              .map(k => convertKey(k))
              .map(k => 'readonly "' + k + '": string;')

            const content = new DtsContent({
              dropExtension: this.dropExtension,
              rootDir: this.rootDir,
              searchDir: this.searchDir,
              outDir: this.outDir,
              rInputPath,
              rawTokenList: keys,
              resultList: result,
              EOL: this.EOL,
            })

            resolve(content)
          } else {
            reject(res)
          }
        })
        .catch(err => reject(err))
    })
  }

  getConvertKeyMethod(camelCaseOption) {
    switch (camelCaseOption) {
      case true:
        return camelcase
      case 'dashes':
        return this.dashesCamelCase
      default:
        return key => key
    }
  }

  /**
   * Replaces only the dashes and leaves the rest as-is.
   *
   * Mirrors the behaviour of the css-loader:
   * https://github.com/webpack-contrib/css-loader/blob/1fee60147b9dba9480c9385e0f4e581928ab9af9/lib/compile-exports.js#L3-L7
   */
  dashesCamelCase(str) {
    return str.replace(/-+(\w)/g, (match, firstLetter) => {
      return firstLetter.toUpperCase()
    })
  }
}
