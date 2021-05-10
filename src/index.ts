import path from 'path';
import { WebpackPluginInstance, Compiler } from 'webpack';
import { config, DotenvConfigOutput, DotenvConfigOptions } from 'dotenv';

interface Options {
  runtimeEnvFilePath?: string;
  compileEnvFilePath?: string;
  debug?: boolean;
  encoding?: string;
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

    console.log(envs);

    return this;
  }

  handleCompileEnv(dotEnv: DotenvConfigOutput, compiler: Compiler) {
    if (dotEnv.error) {
      throw dotEnv.error;
    }

    const { parsed: envs } = dotEnv;

    console.log(envs);

    return this;
  }

  apply(compiler: Compiler) {
    const {
      runtimeEnvFilePath,
      compileEnvFilePath,
      debug,
      encoding,
    } = this.handleOptions(compiler.context);

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
