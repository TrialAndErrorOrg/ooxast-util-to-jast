import { one } from './one'
import { handlers } from './handlers/index'
import { own } from './util/own'

import {
  Context,
  J,
  JWithoutProps,
  JWithProps,
  JastContent,
  JastRoot,
  Node,
  Options,
  Attributes,
} from './types'
import { convert } from 'unist-util-is'
import rehypeMinifyWhitespace from 'rehype-minify-whitespace'

export { one } from './one'
export { all } from './all'
export { handlers as defaultHandlers }

const block = convert(['heading', 'paragraph', 'root'])

export function toJast(
  tree: JastRoot | JastContent,
  options: Options = {
    newLines: false,
    checked: '[x]',
    unchecked: '[ ]',
    quotes: ['"'],
    topSection: 1,
    columnSeparator: false,
  }
) {
  // const byId: { [s: string]: Element } = {}
  let jast: JastContent | JastRoot

  // TODO: fix this type error
  const j: J = Object.assign(
    ((
      node: JastRoot | JastContent,
      type: string,
      props?: Attributes | string | Array<JastContent>,
      children?: string | Array<JastContent>
    ) => {
      let attributes: Attributes | undefined

      if (typeof props === 'string' || Array.isArray(props)) {
        children = props
        attributes = {}
      } else {
        attributes = props
      }

      // @ts-ignore Assume valid `type` and `children`/`value`.
      const result: Node = { type, ...attributes }

      if (typeof children === 'string') {
        // @ts-ignore: Looks like a literal.
        result.value = children
      } else if (children) {
        // @ts-ignore: Looks like a parent.
        result.children = children
      }

      if (node.position) {
        result.position = node.position
      }

      return result as JastContent
    }) as JWithProps & JWithoutProps,
    {
      //  nodeById: byId,
      baseFound: false,
      inTable: false,
      wrapText: true,
      /** @type {string|null} */
      frozenBaseUrl: null,
      qNesting: 0,
      handlers: options.handlers
        ? { ...handlers, ...options.handlers }
        : handlers,
      document: options.document,
      checked: options.checked || '[x]',
      unchecked: options.unchecked || '[ ]',
      quotes: options.quotes || ['"'],
      italics: options.italics || 'emph',
      sectionDepth: options.topSection || 1,
      documentClass: options.documentClass || { name: 'article' },
      bibname: options.bibname || 'bibliography',
      columnSeparator: !!options.columnSeparator,
    } as Context
  )

  // visit(tree, 'element', (node) => {
  //   const id =
  //     node.attributes &&
  //     'id' in node.attributes &&
  //     String(node.attributes.id).toUpperCase()

  //   if (id && !own.call(byId, id)) {
  //     byId[id] = node
  //   }
  // })

  // @ts-ignore: does return a transformer, that does accept any node.
  rehypeMinifyWhitespace({ newlines: options.newlines === true })(tree)

  // @ts-ignore: does return a transformer, that does accept any node.
  const result = one(j, tree, undefined)

  if (!result) {
    jast = { type: 'root', children: [] }
  } else if (Array.isArray(result)) {
    jast = { type: 'root', children: result }
  } else {
    jast = result
  }

  // visit(mdast, 'text', ontext)

  return jast

  /**
   * Collapse text nodes, and fix whitespace.
   * Most of this is taken care of by `rehype-minify-whitespace`, but
   * we’re generating some whitespace too, and some nodes are in the end
   * ignored.
   * So clean up.
   *
   //* {import('unist-util-visit/complex-types').BuildVisitor JastRoot, 'text'>}
   */
  function ontext(node: any, index: any, parent: any) {
    /* c8 ignore next 3 */
    if (index === null || !parent) {
      return
    }

    const previous = parent.children[index - 1]

    if (previous && previous.type === node.type) {
      previous.value += node.value
      parent.children.splice(index, 1)

      if (previous.position && node.position) {
        previous.position.end = node.position.end
      }

      // Iterate over the previous node again, to handle its total value.
      return index - 1
    }

    node.value = node.value.replace(/[\t ]*(\r?\n|\r)[\t ]*/, '$1')

    // We don’t care about other phrasing nodes in between (e.g., `[ asd ]()`),
    // as there the whitespace matters.
    if (parent && block(parent)) {
      if (!index) {
        node.value = node.value.replace(/^[\t ]+/, '')
      }

      if (index === parent.children.length - 1) {
        node.value = node.value.replace(/[\t ]+$/, '')
      }
    }

    if (!node.value) {
      parent.children.splice(index, 1)
      return index
    }
  }
}
