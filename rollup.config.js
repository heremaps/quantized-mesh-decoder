import { terser } from 'rollup-plugin-terser'

const config = (file, plugins = []) => ({
  input: 'src/index.js',
  output: {
    name: 'quantized-mesh-decoder',
    format: 'umd',
    indent: false,
    exports: 'named',
    file
  },
  plugins
})

export default [
  config('dist/quantized-mesh-decoder.js'),
  config('dist/quantized-mesh-decoder.min.js', [terser()])
]
