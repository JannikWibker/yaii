let TokenStream = function(input, options) {

  const {tokens, token} = this
  let current = null

  const is = {
    keyword: (kw) => Object.values(tokens.keywords).includes(kw),
    boolean: (kw) => kw === 'true' || kw === 'false',
    digit: (ch) => /[0-9]/i.test(ch),
    identifier_start: (ch) => /[a-z_$]/i.test(ch),
    identifier: (ch) => /[a-z0-9_$]/i.test(ch),
    operator: (ch) => '!+-^*/%<>=&|:,'.indexOf(ch) >= 0,
    parenthesis: (ch) => ch === tokens.operators.other.left_parenthesis || ch === tokens.operators.other.right_parenthesis,
    whitespace: (ch) => ' \t\n'.indexOf(ch) >= 0,
  }

  const find = (obj, value) => Object.keys(obj).find(key => obj[key] === value)

  const classify = {
    condition: (op) => find(tokens.operators.condition, op),
    arithmetic: (op) => find(tokens.operators.arithmetic, op),
    other: (op) => find({
        exclamation_mark: tokens.operators.other.exclamation_mark,
        colon: tokens.operators.other.colon,
        comma: tokens.operators.other.comma
    }, op)
  }

  let read = {
    number: () => {
      let has_dot = false
      const number = read_while(ch => {
        if(ch === '.') {
          if(has_dot) return false
          else return has_dot = true
        }
        return is.digit(ch)
      })
      return token('primitive', parseFloat(number), 'number')
    },
    identifier: () => {
      let id = read_while(is.identifier)
      if(is.boolean(id)) {
        return token('primitive', id, 'boolean')
      } else {
        return token('identifier', id)
      }
    },
    string: (quote_type='"') => {
      return token('primitive', read.escaped(quote_type), 'string') // uses read.escaped and sets '"" as break condition. 
    },
    escaped: (end) => { // escaped reads the input till it reaches EOF or `end`. Meanwhile it interprets `\n`, `\t`. `\<end>` is not being interpreted as an end condition. escaped is used for string building, it builds up a string and incase of `\<end>` it adds <end> to the string instead of breaking. 
      let escaped = false
      let str = ''
      input.next()
      while(!input.eof()) {
        const ch = input.next()
        if(escaped) {
          if(ch === 'n') {
            str += '\n'
          } else if(ch === 't') {
            str += '\t'
          } else {
            str += ch
          }
          escaped = false
        } else if(ch === tokens.operators.other.backslash) {
          escaped = true
        } else if(ch === end) {
          break
        } else {
          str += ch
        }
      }
      return str
    }
  }

  let read_while = (predicate, str='') =>
    !input.eof() && predicate(input.peek())
      ? read_while(predicate, str + input.next())
      : str

  let read_next = () => {
    read_while(is.whitespace)
    if(input.eof()) return null
    let ch = input.peek()
    if(ch === tokens.operators.other.double_quote) return read.string(tokens.operators.other.double_quote) // double quote
    if(ch === tokens.operators.other.single_quote) return read.string(tokens.operators.other.single_quote) // single quote
    if(is.digit(ch)) return read.number()
    if(is.identifier_start(ch)) return read.identifier()
    if(is.parenthesis(ch)) return token('operator', input.next(), 'parenthesis')
    if(is.operator(ch)) {
      const str = read_while(is.operator)
      const sub_type = ((!!classify.condition(str) && 'condition')
                    || (!!classify.arithmetic(str) && 'arithmetic')
                    || (!!classify.other(str) && 'other'))

      return token('operator', str, sub_type)
    }
    input.croak('can\'t handle character: ' + ch)
  }

  let peek = () => current || (current = read_next())

  let next = () => {
    let tok = current
    current = null
    return tok || read_next()
  }

  let eof = () => peek() === null

  return {
    next:  next,
    peek:  peek,
    eof:   eof,
    croak: input.croak
  }
}

export default (scope) => TokenStream.bind(scope)