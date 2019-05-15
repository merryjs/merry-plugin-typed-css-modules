import { Plugin } from "@hakkajs/cli/lib/plugin";
import path from "path";
/**
 * TypedCssModulesAnswers
 */
export interface TypedCssModulesAnswers {
  name: string;
}
export default (api: Plugin) => {
  api.command("typed-css-modules [name]").action(async (name: string) => {
    // define your own questions or remove it if you don't need it
    const answers = await api.prompt<TypedCssModulesAnswers>([
      {
        name: "name",
        message: "Your questions?",
        validate: typedCssModulesName => {
          if (!typedCssModulesName) {
            return "typedCssModules name are required";
          }
          return true;
        },
        default: name
      }
    ]);
    // write file to api.conf.dist/path/to/index.js
    await api.tmplWithFormat(
      'const name = "typed-css-modules";',
      path.join(api.conf.dist, "path/to/", "index.js"),
      answers
    );
  });
};
