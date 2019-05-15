import { Plugin } from '@hakkajs/cli/lib/plugin'
import chalk from 'chalk'
import glob from 'glob'
import path from 'path'
import { DtsCreator } from './lib/dtsCreator'
/**
 * TypedCssModulesAnswers
 */
export interface TypedCssModulesAnswers {
  name: string
}
export interface TypedCssModulesOptions {
  pattern: string
  watch: boolean
  silent: string
}
let creator
let args: TypedCssModulesOptions
function writeFile(f) {
  creator
    .create(f, null, !!args.watch)
    .then(content => content.writeFile())
    .then(content => {
      if (!args.silent) {
        // tslint:disable-next-line:no-console
        console.log('Wrote ' + chalk.green(content.outputFilePath))
        if (content.messageList && content.messageList.length) {
          content.messageList.forEach(message => {
            // tslint:disable-next-line:no-console
            console.warn(chalk.yellow('[Warn] ' + message))
          })
        }
      }
    })
    // tslint:disable-next-line:no-console
    .catch(reason => console.error(chalk.red('[Error] ' + reason)))
}

export default (api: Plugin) => {
  api
    .command('typed-css-modules [name]')
    .option('-P, --pattern [value]', 'filter path by pattern')
    .option('-W, --watch', "Watch input directory's css files or pattern")
    .option(
      '-S, --silent',
      'Silent output. Do not show "files written" or warning messages'
    )
    .action(async (name: string, options: TypedCssModulesOptions) => {
      args = options
      if (!options) {
        api.outputHelp()
        return
      }
      const rootDir = process.cwd()
      const searchDir = './'
      const filesPattern = path.join(searchDir, options.pattern || '**/*.css')
      creator = new DtsCreator({
        rootDir,
        searchDir,
      })
      if (options.watch) {
        // TODO
      } else {
        glob(filesPattern, null, (err, files) => {
          if (err) {
            // tslint:disable-next-line:no-console
            console.error(err)
            return
          }
          if (!files || !files.length) {
            return
          }
          files.forEach(writeFile)
        })
      }
    })
}
