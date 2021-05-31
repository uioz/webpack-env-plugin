import path from 'path';
import { WebpackPluginInstance, Compiler, DefinePlugin } from 'webpack';
import { config, DotenvConfigOutput } from 'dotenv';
import HtmlWebpackPlugin from 'html-webpack-plugin';

interface Options {
  runtimeEnvFilePath?: string;
  compileEnvFilePath?: string;
  debug?: boolean;
  encoding?: string;
}

function objectToEnv(obj: { [key: string]: any }) {
  const copy = { ...obj };
  for (const [key, value] of Object.entries(copy)) {
    copy[key] = JSON.stringify(value);
  }
  return copy;
}

function template(env: { [key: string]: any }) {
  const IIFE = (code: string) => `
;(function () {
  ${code}
})();
`;

  const expression = (key: string, value: string) =>
    `window.${key} = ${value};`;

  const expressions = [];

  for (const [key, value] of Object.entries(env)) {
    expressions.push(expression(key, value));
  }

  return IIFE(expressions.join('\n'));
}

export class WebpackEnvPlugin implements WebpackPluginInstance {
  constructor(private options: Options = {}) {}

  handleOptions(context: string): Required<Options> {
    const options = this.options;

    options.runtimeEnvFilePath = path.join(
      context,
      options.runtimeEnvFilePath ?? '.env.runtime'
    );

    options.compileEnvFilePath = path.join(
      context,
      options.compileEnvFilePath ?? '.env.compile'
    );

    return options as Required<Options>;
  }

  handleRuntimeEnv(dotEnv: DotenvConfigOutput, compiler: Compiler) {
    if (dotEnv.error) {
      throw dotEnv.error;
    }

    const { parsed: envs } = dotEnv;

    if (envs) {
      compiler.hooks.compilation.tap('WebpackEnvPlugin', (compilation) => {
        HtmlWebpackPlugin.getHooks(compilation).alterAssetTags.tapAsync(
          'WebpackEnvPlugin',
          (options, callback) => {
            options.assetTags.scripts.unshift({
              tagName: 'script',
              attributes: {},
              meta: {
                plugin: 'webpack-env-plugin',
              },
              voidTag: false,
              innerHTML: template(objectToEnv(envs)),
            });

            callback(null, options);
          }
        );
      });
    }

    return this;
  }

  handleCompileEnv(dotEnv: DotenvConfigOutput, compiler: Compiler) {
    if (dotEnv.error) {
      throw dotEnv.error;
    }

    const { parsed: envs } = dotEnv;

    if (envs) {
      new DefinePlugin(objectToEnv(envs)).apply(compiler);
    }

    return this;
  }

  apply(compiler: Compiler) {
    const { runtimeEnvFilePath, compileEnvFilePath, debug, encoding } =
      this.handleOptions(compiler.context);

    this.handleRuntimeEnv(
      config({
        path: runtimeEnvFilePath,
        debug,
        encoding,
      }),
      compiler
    ).handleCompileEnv(
      config({
        path: compileEnvFilePath,
        debug,
        encoding,
      }),
      compiler
    );
  }
}
