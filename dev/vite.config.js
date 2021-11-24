// import { lezer } from './dev/lezerplugin/dist/rollup-plugin-lezer.js'
// import {lezer} from "@lezer/generator/rollup";
export default {
  plugins: [],
  root: "dev",
  server: {
    host: '0.0.0.0',
    hmr: {
      port: 443,
    }
  }
}