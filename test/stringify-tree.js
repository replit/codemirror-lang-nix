// FIXME dont print empty lines in pretty tree. this happens in rare cases
// example: extra newline before ")" tokens

// dirty: this will patch the tree's toString methods
export function stringifyTree(tree, options) {

  if (!options) options = {};
  const pretty = options.pretty || false;
  const human = options.human || false; // human readable, like python or yaml
  const text = options.text || '';
  const indentStep = options.indent || '  ';

  // Tree https://github.com/lezer-parser/common/blob/main/src/tree.ts#L314
  tree.toString = function toString(depth = 0) {
    //let mounted = this.prop(NodeProp.mounted)
    //if (mounted && !mounted.overlay) return mounted.tree.toString()
    let children = ""
    for (let ch of this.children) {
      let str = ch.toString(depth + 1)
      if (str) {
        //if (children) children += ","
        children += str
      }
    }
    return !this.type.name ? children :
      (/\W/.test(this.type.name) && !this.type.isError ? JSON.stringify(this.type.name) : this.type.name) + (
        human
        ? (children.length ? "\n" + children : "")
        : (children.length ? (" (" + (pretty ? "\n" : "") + children + (pretty ? "\n" : "") + ")") : "")
      )
  }

  if (!tree.children[0].set) {
    // Tree
    // TODO print type + source tree
    //console.dir(tree, { depth: 5 });

    tree.children[0].toString = function toString(depth = -1) {
      //let mounted = this.prop(NodeProp.mounted)
      //if (mounted && !mounted.overlay) return mounted.tree.toString()
      let children = ""
      for (let ch of this.children) {
        let str = ch.toString(depth + 1)
        if (str) {
          //if (children) children += ","
          children += str
        }
      }
      let nodeText = text
      let indent = indentStep.repeat(depth)
      if (human) {
        return indent + (!this.type.name ? children :
          (/\W/.test(this.type.name) && !this.type.isError ? JSON.stringify(this.type.name) : this.type.name) +
          //(children.length ? "(" + children + ")" : "")
          (text ? ` ${nodeText}` : '') +
          (children.length ? "\n" + children : ""))
      }
      return indent + (!this.type.name ? children :
        (/\W/.test(this.type.name) && !this.type.isError ? JSON.stringify(this.type.name) : this.type.name) +
        //(children.length ? "(" + children + ")" : "")
        (children.length ? ((pretty ? "\n" : "") + "(" + children + ")") : ""))
    }

    return tree.toString(0);
  }

  else
  if (tree.children[0].set) {
    // TreeBuffer https://github.com/lezer-parser/common/blob/main/src/tree.ts#L530
    // monkeypatch: print type + source tree
    tree.children[0].toString = function toString(depth = 0) {
      let result = []
      for (let index = 0; index < this.buffer.length;) {
        result.push(this.childString(index, depth + 1))
        index = this.buffer[index + 3]
      }
      //return result.join(",")
      return result.join((human ? '' : ',') + ((human || pretty) ? '\n' : ''))
    }
    tree.children[0].childString = function childString(index, depth = 0) {
      let id = this.buffer[index], endIndex = this.buffer[index + 3]
      let type = this.set.types[id], result = type.name // TODO add source to result
      if (/\W/.test(result) && !type.isError) result = JSON.stringify(result)
      let nodeText
      if (human) {
        if (text) {
          nodeText = text.slice(
            this.buffer[index + 1],
            this.buffer[index + 2],
          )
          //if (/[\W]/.test(nodeText))
          nodeText = JSON.stringify(nodeText)
          result += ` ${nodeText}`
        }
        result = indentStep.repeat(depth) + result
      }
      if (pretty) {
        result = indentStep.repeat(depth) + result
      }
      index += 4
      if (endIndex == index) return result
      let children = []
      while (index < endIndex) {
        children.push(this.childString(index, depth + 1))
        index = this.buffer[index + 3]
      }
      if (human) {
        const indent = indentStep.repeat(depth);
        return result + '\n' + children.map(str => str + '\n').join('')
      }
      if (pretty) {
        const indent = indentStep.repeat(depth);
        // TODO? test children.length
        return result + " (" + '\n' + children.join((human ? '' : ',') + ((human || pretty) ? '\n' : '')) + ((human || pretty) ? '\n' : '') + indent + ")"
      }
      return result + "(" + children.join(",") + ")"
    }

    return tree.toString(-1);
  }
}
