/* eslint-disable */
import _InputStream from './InputStream.js'
import _TokenStream from './TokenStream.js'
import _Parser from './Parser.js'

const tokens = {
  operators: {
    condition: {
      greater_than: '>',
      less_than: '<',
      greater_than_or_equal_to: '>=',
      less_than_or_equal_to: '<=',
      equality: '==',
      unequality: '!=',
      logical_and: '&&',
      locical_or: '||',
    },
    arithmetic: {
      exponentiation: '^',
      division: '/',
      multiplication: '*',
      modulo: '%',
      plus: '+',
      minus: '-',
    },
    other: {
      exclamation_mark: '!',
      colon: ':',
      comma: ',',
      left_parenthesis: '(',
      right_parenthesis: ')',
      single_quote: '\'',
      double_quote: '"',
      backslash: '\\',
    }
  },
  keywords: {
    true: 'true',
    false: 'false'
  }
}

const token = (type, value, sub_type) => ({ type: type, sub_type: sub_type, value: value })

const ast = {
  program: (children) => ({ type: 'program', children: children }),
  function: (value, args) => ({ type: 'function', value: value, arguments: args }),
  term: {
    condition: (operator, valueA, valueB) => ({ 
      type: 'term', sub_type: 'condition', operator: operator, valueA: valueA, valueB: valueB, return_type: 'boolean'
    }),
    arithmetic: (operator, valueA, valueB) => ({ 
      type: 'term', sub_type: 'arithmetic', operator: operator, valueA: valueA, valueB: valueB, return_type: 'number'
    })
  },
  primitive: {
    string: (value) => ({ type: 'primitive', sub_type: 'string', value: value }),
    number: (value) => ({ type: 'primitive', sub_type: 'number', value: value }),
    boolean: (value) => ({ type: 'primitive', sub_type: 'boolean', value: value }),
    other: (sub_type, value) => ({ type: 'primitive', sub_type: sub_type, value: value })
  },
  range: (valueA, valueB) => ({ type: 'range', valueA: valueA, valueB: valueB }),
  reference: (value) => ({ type: 'reference', value: value }),
}

const _toc = tokens.operators.condition
const _toa = tokens.operators.arithmetic
const _too = tokens.operators.other

const precedence = {
  [_too.colon]: 1, // range
  [_toc.logical_or]: 2,
  [_toc.logical_and]: 3,
  [_toc.equality]: 4, [_toc.inequality]: 4,
  [_toc.greater_than]: 5, [_toc.greater_than_or_equal_to]: 5, [_toc.less_than]: 5, [_toc.less_than_or_equal_to]: 5,
  [_toa.minus]: 6, [_toa.plus]: 6, // arithmetic plus / minus
  [_toa.modulo]: 7, [_toa.division]: 7, [_toa.multiplication]: 7,
  [_toa.exponentiation]: 8,
  [_too.exclamation_mark]: 9, // unary factorial
  // [_toa.minus]: 9 // unary minus
  // [_toa.plus]: 9 // unary plus
  // [_too.exclamation_mark]: 9 // unary logical not
  // [<function call>]: 10 // function call
  [_too.left_parenthesis]: 11, [_too.right_parenthesis]: 11
}

const rules = {
  prec_1: [
    ['@id'],
    ['prec_2'],
    ['prec_2', '@,', 'prec_1']
  ],
  prec_2: [
    ['prec_3'],
    ['prec_3', '@||', 'prec_4']
  ],
  prec_3: [
    ['prec_4'],
    ['prec_4', '@&&', 'prec_5']
  ],
  prec_4: [
    ['prec_5'],
    ['prec_4', '@!=', 'prec_5'],
    ['prec_4', '@==', 'prec_5']
  ],
  prec_5: [
    ['prec_6'],
    ['prec_5', '@>', 'prec_6']
  ],
  prec_6: [
    ['prec_7'],
    ['prec_6', '@+', 'prec_7'],
    ['prec_6', '@-', 'prec_7']
  ],
  prec_7: [
    ['prec_8'],
    ['prec_7', '@*', 'prec_8'],
    ['prec_7', '@/', 'prec_8'],
    ['prec_7', '@%', 'prec_8']
  ],
  prec_8: [
    ['prec_9'],
    ['prec_8', '@^', 'prec_9']
  ],
  prec_9: [
    ['prec_10'],
    // ['@!', 'prec_10'],
    // ['@+', 'prec_10'],
    // ['@-', 'prec_10'],
    ['prec_10', '@!']
  ],
  prec_10: [
    ['prec_11'],
    ['id', '@(', 'prec_1', '@)']
  ],
  prec_11: [
    ['id'],
    // ['@(', 'prec_1', '@)']
  ],
  id: [
    ['@id']
  ]
}

const InputStream = _InputStream({ tokens: tokens, token: token, ast: ast })
const TokenStream = _TokenStream({ tokens: tokens, token: token, ast: ast })
const Parser = _Parser({ 
  tokens: tokens, 
  token: token, 
  ast: ast, 
  precedence: precedence, 
  rules: rules 
})

const parser = (input, options) => {
  // return Parser(TokenStream(InputStream(input, options), options), options)
  // return Parser(['id', '(', 'id', '>', 'id', '+', 'id', ')'], options)
  // return Parser(['id', '(', '(', 'id', '>', '(', 'id', '||', 'id', ')', ')', '&&', 'id', '!=', 'id', ',', '(', 'id', '(', 'id', ':', 'id', ')', '+', 'id', ')', '%', 'id', ',', 'id', '(', 'id', ':', 'id', ')', ')'], options)
  // return Parser(['id', '>', 'id'], options)
  return Parser(['id', '(', 'id', '>', 'id', ',', 'id', ',', 'id', ')'], options)
  // return Parser(['id', '+', 'id'], options)
  // return Parser([',', 'id'])
}

parser()

export default parser

['id', '(', '(', 'id', '>', '(', 'id', '||', 'id', ')', ')', '&&', 'id', '!=', 'id', ',', '(', 'id', '(', 'id', ':', 'id', ')', '+', 'id', ')', '%', 'id', ',', 'id', '(', 'id', ':', 'id', ')', ')']