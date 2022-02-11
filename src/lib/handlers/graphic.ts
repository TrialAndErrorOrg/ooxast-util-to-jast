import { Graphic, List } from 'ooxast'
import { all } from 'ooxast-util-to-jast'
import { J } from '../types'
import { wrapCommandArg } from '../util/wrap-command-arg'

export function graphic(j: J, node: Graphic) {
  return {
    type: 'command',
    name: 'includegraphics',
    children: [
      wrapCommandArg(j, [
        { type: 'text', value: node.attributes['xlink:href'] || '' },
      ]),
      { type: 'text', value: '\n' },
    ],
  }
}
