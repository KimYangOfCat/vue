## 打包文件说明

| | UMD | CommonJS | ES Module |
| --- | --- | --- | --- |
| **完整版** | vue.js | vue.common.js | vue.esm.js |
| **只包含运行时版本** | vue.runtime.js | vue.runtime.common.js | vue.runtime.esm.js |
| **完整版(生产环境)** | vue.min.js | | |
| **只包含运行时版本(生产环境)** | vue.runtime.min.js | | |

### 相关名词

- **完整版**：构建后的文件同时包含编译器和运行时。

- **编译器**：负责将模板字符串编译成 JavaScript 渲染函数。

- **运行时**：负责创建Vue.js实例，渲染视图和使用虚拟DOM实现重新渲染，基本上包含除编译器外的所有部分。

- **[UMD](https://github.com/umdjs/umd)**：UMD版本的文件可以通过 `<script>` 标签直接在浏览器中使用。来自 Unpkg CDN  [https://unpkg.com/vue](https://unpkg.com/vue) 的默认文件是包含运行时+编译器的UMD版本。

- **[CommonJS](http://wiki.commonjs.org/wiki/Modules/1.1)**：CommonJS 版本用来配合较旧的打包工具，比如 [browserify](http://browserify.org/) 或 [webpack 1](https://webpack.github.io)。这些打包工具的默认文件（`pkg.main`）只包含运行时的 CommonJS 版本（`vue.runtime.common.js`）

- **[ES Module](http://exploringjs.com/es6/ch_modules.html)**: ES Module版本用来配合现代打包工具，比如 [webpack 2](https://webpack.js.org) 或 [rollup](http://rollupjs.org/)。这些打包工具的默认文件（`pkg.module`）只包含运行时的ES Module版本（`vue.runtime.esm.js`）。

### 运行时 + 编译器 VS 只包含运行时

如果需要在客户端编译模板（比如传入一个字符串给 `template` 选项，或挂载到一个元素上并以其 DOM 内部的HTML作为模板），那么需要用到编译器，因此需要完整版：

当使用 `vue-loader` 或 `vueify` 的时候，`*.vue` 文件内部的模板会在构建时预编译成 JavaScript。所以，最终打包完成的文件实际上是不需要编译器的，只需要引入运行时版本即可。

由于运行时版本的体积比完整版要小30%左右，所以应该尽可能使用运行时版本。如果仍然希望使用完整版，则需要在打包工具里配置一个别名。

#### 对于 webpack，需要这么处理：

``` js
module.exports = {
  // ...
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.esm.js' // 'vue/dist/vue.common.js' for webpack 1
    }
  }
}
````

#### 对于 Rollup，需要这么处理：

``` js
const alias = require('rollup-plugin-alias')

rollup({
  // ...
  plugins: [
    alias({
      'vue': 'vue/dist/vue.esm.js'
    })
  ]
})
```

#### 对于 Browserify

需要添加到项目的package.json中：：

``` js
{
  // ...
  "browser": {
    "vue": "vue/dist/vue.common.js"
  }
}
```

### 开发环境 VS 生产环境模式

对于 UMD 版本来说，开发环境和生产环境二者的模式都是硬编码的：开发环境下使用未压缩的代码，生产环境下使用压缩后的代码。

CommonJS 和 ES Module 版本用于打包工具，因此 Vue.js 不提供压缩后的版本，需要自行将最终的包进行压缩。

此外，这两个版本同时保留原始的 `process.env.NODE_ENV` 检测，来决定它们应该在什么模式下运行。我们应该使用适当的打包工具配置来替换这些环境变量，以便控制Vue.js所运行的模式。把 `process.env.NODE_ENV` 替换为字符串字面量，同时让 UglifyJS 之类的压缩工具完全删除仅供开发环境的代码块，从而减少最终文件的大小。

#### 在 webpack 中

我们使用 [DefinePlugin](https://webpack.js.org/plugins/define-plugin/):

``` js
var webpack = require('webpack')

module.exports = {
  // ...
  plugins: [
    // ...
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    })
  ]
}
```

#### 在 Rollup 中

使用 [rollup-plugin-replace](https://github.com/rollup/rollup-plugin-replace)：

``` js
const replace = require('rollup-plugin-replace')

rollup({
  // ...
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify('production')
    })
  ]
}).then(...)
```

#### 在 Browserify 中

应用一次全局的 [envify](https://github.com/hughsk/envify) 转换。

``` bash
NODE_ENV=production browserify -g envify -e main.js | uglifyjs -c -m > build.js
```
