import { readFileSync } from 'fs';
import path from 'path';
import { WebpackPluginInstance, Compiler, DefinePlugin } from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import _merge from 'lodash.merge';
import toml from '@ltd/j-toml';

interface Options {
  envFilePath?: string;
}

type Mode = {
  dev?: { [key: string]: string };
  pord?: { [key: string]: string };
};

interface EnvStructure {
  runtime?: Mode;
  compile?: Mode;
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

function parseEnv(envFilePath: string) {
  const { name, ext, dir } = path.parse(envFilePath);

  const defaultEnv: EnvStructure = toml.parse(
    readFileSync(envFilePath),
    1,
    '\n',
    false
  );

  try {
    _merge(
      defaultEnv,
      toml.parse(
        readFileSync(path.join(dir, `${name}.local${ext}`)),
        1,
        '\n',
        false
      )
    );
  } catch {
    //
  }

  return defaultEnv;
}

export class WebpackTomlenvPlugin implements WebpackPluginInstance {
  constructor(private options: Options = {}) {}

  handleOptions(context: string): Required<Options> {
    const options = this.options;

    options.envFilePath = path.join(context, options.envFilePath ?? 'env.toml');

    return options as Required<Options>;
  }

  handleRuntimeEnv(envs: Mode, compiler: Compiler): void {
    compiler.hooks.compilation.tap('WebpackTomlenvPlugin', (compilation) => {
      HtmlWebpackPlugin.getHooks(compilation).alterAssetTags.tapAsync(
        'WebpackTomlenvPlugin',
        (options, callback) => {
          let innerHTML = '';

          switch (compiler.options.mode) {
            case 'development':
              if (envs.dev) {
                innerHTML = template(envs.dev);
              }
              break;
            default:
              if (envs.pord) {
                innerHTML = template(envs.pord);
              }
              break;
          }

          if (innerHTML) {
            options.assetTags.scripts.unshift({
              tagName: 'script',
              attributes: {},
              meta: {
                plugin: 'webpack-tomlenv-plugin',
              },
              voidTag: false,
              innerHTML,
            });
          }

          callback(null, options);
        }
      );
    });
  }

  handleCompileEnv(envs: Mode, compiler: Compiler): void {
    switch (compiler.options.mode) {
      case 'development':
        if (envs.dev) {
          new DefinePlugin(envs.dev).apply(compiler);
        }
        break;
      default:
        if (envs.pord) {
          new DefinePlugin(envs.pord).apply(compiler);
        }
        break;
    }
  }

  apply(compiler: Compiler): void {
    const { envFilePath } = this.handleOptions(compiler.context);

    const data = parseEnv(envFilePath);

    if (data.runtime) {
      this.handleRuntimeEnv(data.runtime, compiler);
    }

    if (data.compile) {
      this.handleCompileEnv(data.compile, compiler);
    }
  }
}
