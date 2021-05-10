import { WebpackPluginInstance, Compiler } from 'webpack';
import { DotenvConfigOutput } from 'dotenv';
interface Options {
    runtimeEnvFilePath?: string;
    compileEnvFilePath?: string;
    debug?: boolean;
    encoding?: string;
}
export declare class WebpackEnvPlugin implements WebpackPluginInstance {
    private options;
    constructor(options?: Options);
    handleOptions(context: string): Required<Options>;
    handleRuntimeEnv(dotEnv: DotenvConfigOutput, compiler: Compiler): this;
    handleCompileEnv(dotEnv: DotenvConfigOutput, compiler: Compiler): this;
    apply(compiler: Compiler): void;
}
export {};
//# sourceMappingURL=index.d.ts.map