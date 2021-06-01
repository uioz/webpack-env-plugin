# webpack-env-plugin

基于 `TOML` 格式, 支持运行时和编译时环境变量注入插件.

# Note

- 本插件依赖 `html-webpack-plugin` 来注入运行时变量, 需要和 `html-webpack-plugin` 一起使用
- 编译时环境变量注入基于 `webpack.dllPlugin` 与现有的 `TOML` 解析器存在兼容问题, 在极端情况下会出现错误, 例如:
  - `TOML` 所支持的日期字符串被解析为特定的 `Date` 格式, 无法被 `dllPlugin` 识别
  - 超出了 JavaScript 限制的数值
- 运行时环境变量注入只支持表达式, 编译时则可以识别 `TOML` 中的其他数据类型

# Usage

在 `webpack` 的配置文件中, 引入 `webpack-env-plugin`:

```javascript
const { WebpackEnvPlugin } = require('webpack-env-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  plugins: [
    new WebpackEnvPlugin(),
    new HtmlWebpackPlugin(),
  ],
};
```

然后在项目根目录新建 `env.toml`:

```toml
[runtime]
  [runtime.dev] # 运行时环境变量, 只在开发模式下生效
  type = '"runtime"'
  mode = '"development"'
  [runtime.pord] # 运行时环境变量, 只在生产模式下生效
  type = '"runtime"'
  mode = '"production"'

[compile]
  [compile.dev] # 编译时环境变量, 只在开发模式下生效
  type = '"compile"'
  mode = '"development"'
  [compile.pord] # 编译时环境变量, 只在生产模式下生效
  type = [1,2,3] # 识别为数组
  BOOL = true # 识别为 true 而不是字符串
  _TEST = 123456 # 识别为数值
  mode = 'new Date()' # 会被识别为表达式
```

`TOML` 的完整语法可以在[这里](https://toml.io/en/)找到.

配置文件中的所有选项都是可选的, `[runtime]` 和 `[compile]` 外的属性 `webpack-env-plugin` 不会去处理.

在 `index.js` 可以引用这些变量:

```javascript
console.log(type);
console.log(mode);
```

假设当前 `webpack` 是开发模式, 最终编译后的结果为:

```javascript
console.log("compile");
console.log("development");
```

在生成的 `HTML` 上会被插入如下的 `script` 的标签:

```html
<script>
  (function () {
    window.type = "runtime";
    window.mode = "development";
  })();
</script>
```

上面的输出结果有值得注意的几点:

1. 运行时变量不可以和编译时变量重名, 因为编译时变量会被直接替换为变量值
2. 字符串被视为代码段插入, 例如 `time = "Date.now()"` 会被编译为 `window.time = Date.now()` 而 `time = '"Date.now()"'` 会被编译为 `window.time = "Date.now()"`

**注意**: 运行时变量目前只支持字符串格式, 使用其他格式会导致失败.

# API

构造函数参数:

```typescript
interface Options {
  // 配置文件相对于项目路径的位置, 默认会查找项目目录下的 env.toml
  envFilePath?: string;
}
```

# .local.toml

如果你给默认的配置文件名的末尾添加了 `.local` 例如默认的 `env.local.toml`, 那么 `webpack-env-plugin` 会尝试优先解析带有 `.local` 的文件, 然后将其所有的属性覆盖到原有的 `env.toml` 上.

这样做的目的是你可以将 `env.local.toml` 添加到 `.gitignore` 规则中, 用在开发调试时后使用, 而不用修改已经被 `git` 追踪的 `env.toml` 以防止有人不小心将修改错了的 `env.toml` 提交到代码仓库中.

# TODO

- 运行时变量支持 `toml` 其他的数据类型
