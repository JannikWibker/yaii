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
      modulu: '%',
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
  identifiers: {
    true: 'true',
    false: 'false'
  },
  other: {
    identifier: /()/,
    number: /()/,
    whitespace: /()/,
  }
}

const tokenize = (str) => {

  let tokenstream = []

  let i = 0;
  let l = str.length

  let state = ''

  let curr = str[i]

  const peek = (peek_distance=1) => {
    return str[i+peek_distance]
  }

  const next = () => {
    curr = str[++i]
    return curr
  }

  const revert = () => {
    curr = str[--i]
    return curr
  }

  const is_conditional_operator = (ch) => {
    const next_ch = next()

    if(ch === '>') {
      if(next_ch === '=') return 'greater_than_or_equal'
      else { 
        revert()
        return 'greater_than'
      }
    } else if(ch === '<') {
      if(next_ch === '=') return 'less_than_or_equal'
      else {
        revert()
        return 'less_than'
      }
    } else if(ch === '=' && next_ch === '=') {
      return 'equality'
    } else if(ch === '!' && next_ch === '=') {
      return 'inequality'
    } else if(ch === '&' && next_ch === '&') {
      return 'logical_and'
    } else if(ch === '|' && next_ch === '|') {
      return 'logical_or'
    } else {
      revert()
      return false
    }
  }

  const is_arithmetic_operator = (ch) => {
    if(ch === '^') {
      return 'exponentiation'
          } else if(ch === '/') {
      return 'division'
    } else if(ch === '*') {
      return 'multiplication'
    } else if(ch === '%') {
      return 'modulo'
    } else if(ch === '+') {
      return 'plus'
    } else if(ch === '-') {
      return 'minus'
    } else {
      return false
    }
  }

  const is_other_operator = (ch) => {
    if(ch === '!') {
      return 'exclamation_mark'
    } else if(ch === ':') {
      return 'colon'
    } else if(ch === ',') {
      return 'comma'
    } else if(ch === '(') {
      return 'left_parenthesis'
    } else if(ch === ')') {
      return 'right_parenthesis'
    } else if(ch === '\'') {
      return 'single_quote'
    } else if(ch === '"') {
      return 'double_quote'
    } else if(ch === '\\') {
      return 'backslash'
    } else {
      false
    }
  }

  const is_whitespace = (ch) => {
    if(' \t\n'.indexOf(ch) >= 0) {
      return 'whitespace'
    } else {
      return false
    }
  }

  const is_digit_start = (ch) => {
    if('0123456789'.indexOf(ch) >= 0) {
      return 'digit'
    } else {
      return false
    }
  }

  const is_identifier_start = (ch) => {
    return /[a-z_]/i.test(ch) ? 'identifier_start' : false
  }

  const is_identifier = (ch) => {
    return /[a-z0-9_]/i.test(ch) ? 'identifier' : false
  }

  const is_string_start = (ch) => {
    return ch === '"' || ch === '\'' ? 'string_start' : false
  }

  while(i < l) {

    if(state === '' && is_digit_start(ch)) state = 'digit'
    else if(state === '' && is_identifier_start(ch)) state = 'identifier'
    else if(state === '' && is_string_start(ch)) state = 'string'
    else if(state === 'digit') {
      
    } else if(state === 'identifier') {

    } else if(state === 'string') {

    } else {

    }
    

    const result = is_conditional_operator(curr) || is_arithmetic_operator(curr) || is_other_operator(curr) || is_digit_start(curr) || is_whitespace(curr) || false
    console.log(curr, result)
    next()
  }
}



console.log(tokenize('(123)+- > 321 && !1'))