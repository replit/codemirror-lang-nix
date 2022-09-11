// based on test-parser.js
// based on manual-test.js

import {parser} from "../dist/index.js"
import {stringifyTree} from "./stringify-tree.js"

// use a patched version of fileTests to parse test files
// https://github.com/lezer-parser/generator/pull/7
// https://github.com/lezer-parser/generator/blob/main/src/test.ts
//import {fileTests} from "@lezer/generator/dist/test"
function toLineContext(file, index) {
  const endEol = file.indexOf('\n', index + 80);

  const endIndex = endEol === -1 ? file.length : endEol;

  return file.substring(index, endIndex).split(/\n/).map(str => '  | ' + str).join('\n');
}
const defaultIgnore = false
function fileTests(file, fileName, mayIgnore = defaultIgnore) {
  let caseExpr = /\s*#\s*(.*)(?:\r\n|\r|\n)([^]*?)==+>([^]*?)(?:$|(?:\r\n|\r|\n)+(?=#))/gy
  let tests = []
  let lastIndex = 0;
  for (;;) {
    let m = caseExpr.exec(file)
    if (!m) throw new Error(`Unexpected file format in ${fileName} around\n\n${toLineContext(file, lastIndex)}`)

    //let [, name, configStr] = /(.*?)(\{.*?\})?$/.exec(m[1])! // typescript
    let execResult = /(.*?)(\{.*?\})?$/.exec(m[1])
    if (execResult === null) throw Error('execResult is null')
    let [, name, configStr] = execResult

    let text = m[2].trim(), expected = m[3].trim()
    let config = configStr ? JSON.parse(configStr) : null
    let strict = !/⚠|\.\.\./.test(expected)

    tests.push({
      name,
      text,
      expected,
      configStr,
      config,
      strict,
      /*
      run(parser) {
        if (parser.configure && (strict || config))
          parser = parser.configure({strict, ...config})
        testTree(parser.parse(text), expected, mayIgnore)
      },
      */
    })
    lastIndex = m.index + m[0].length
    if (lastIndex == file.length) break
  }
  return tests
}

import * as fs from "fs"
import * as path from "path"
import { fileURLToPath } from 'url';
let caseDir = path.dirname(fileURLToPath(import.meta.url))

const writePrettyTree = true

for (let file of fs.readdirSync(caseDir)) {
  if (!/\.txt$/.test(file)) continue
  //let fileName = /^[^\.]*/.exec(file)[0]
  let filePath = path.join(caseDir, file)
  let fileContent = fs.readFileSync(filePath, "utf8")
  const result = []
  for (let testData of fileTests(fileContent, file)) {
    const { name, text, configStr, strict } = testData;
    //const strictStr = strict ? '' : '... ' // prefer ascii ... over unicode ⚠
    const strictStr = ''; // FIXME ...
    const tree = parser.parse(testData.text);
    const stringifyOptions = writePrettyTree && { pretty: true, text };
    const actual = stringifyTree(tree, stringifyOptions);
    // parse error -> make tests fail
    // FIXME make this optional, to allow testing for parser errors
    const actualWithFixme = actual.replace(/⚠/g, '⚠ FIXME');
    result.push(`# ${name}${(configStr || '')}\n${text}\n==>\n${strictStr}${actualWithFixme}`)
  }
  const newFileContent = result.join("\n\n") + "\n";
  // TODO backup?
  console.log(`writing ${filePath}`);
  fs.writeFileSync(filePath, newFileContent, "utf8");
}
