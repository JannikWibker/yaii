/* eslint-disable */

const isTerminal = (part) => part.startsWith('@')

const isNonTerminal = (part) => !part.startsWith('@')

const isMatchingTerminal = (part, terminal) => part === '@' + terminal

const search_rule_for = (rules, current_rule, token, visited=new Set(), i=0) => {
  const matching_rules = new Set()
  const follow_rules = new Set()

  if(i > 10) {
    console.log('breaking duo to i > 10')
    return []
  }

  if(Array.from(visited).includes(current_rule)) return []

  rules[current_rule].forEach(rule => {
    if(isTerminal(rule[0])) {
      if(isMatchingTerminal(rule[0], token)) {
        console.log('adding to matching_rules: ', current_rule)
        matching_rules.add(current_rule)
      }
    } else {
      follow_rules.add(rule[0])
    }
  })

  console.log(matching_rules, follow_rules)

  visited.add(current_rule)

  follow_rules.forEach(rule => {
    console.log('follow rule:', rule)
    search_rule_for(rules, rule, token, visited, i+1)
      .forEach(rule => matching_rules.add(rule))
  })

  return matching_rules
}

const find_path_to_terminal = (rules, current_rule, token, path=new Set(), i=0) => {
  if(i > 1000) {
    console.log('breaking duo to overflow (limit: 1000)')
    return []
  }

  // console.log('current_rule', current_rule)

  const rules_to_follow = new Set()

  rules[current_rule].forEach(rule => {
    if(isMatchingTerminal(rule[0], token)) {
      // console.log('found matching terminal symbol:', rule[0], current_rule, token)
      return path.add(current_rule)
    } else if(isNonTerminal(rule[0]) && rule[0] !== current_rule) {
      // console.log(rule[0])
      rules_to_follow.add(rule[0])
    } else {
      return
    }
  })

  // console.log('rules_to_follow', Array.from(rules_to_follow))

  rules_to_follow.forEach(rule => 
      path.add(...find_path_to_terminal(rules, rule, token, path.add(current_rule), i+1)))

  return path
}

const reduce_rules = (rules, amount) =>
  rules.map(rule => rule
    .map(rule => rule.slice(amount))
    .filter(rule => rule.length > 0)
  )

const get_rules_by_reference = (rules, rule_references) =>
  rule_references.map(reference => rules[reference])

const map_rules_to_references = (rule_references, rules) =>
  rule_references.reduce((acc, curr, i) => {
    acc[curr] = rules[i]
    return acc
  }, {})

const Parser = function(input, options) {

  const {tokens, ast, precedence, rules} = this

  const stack = []

  let i = 0;
  let token
  let next_token

  console.log(input)

  let current_rules_references = Object.keys(rules)
  let current_rule = current_rules_references[0]

  let stop = false

  while(i+1 < input.length && !stop) {

    token = input[i]
    next_token = input[i+1]

    console.log(`token:       "${token}"\nnext_token:  "${next_token}"\n\nstack:`, stack)

    // current token

    const matching_rules = Array.from(find_path_to_terminal(rules, current_rule, token, new Set(), 0))

    console.log('find_path_to_terminal', matching_rules)

    i++;

    // look-ahead token

    if(i < input.length) {
      current_rule = matching_rules[0]

      const reduced_rules = map_rules_to_references(matching_rules, reduce_rules(get_rules_by_reference(rules, matching_rules), 1))

      console.log('reduced rules', reduced_rules)
      
      const reduced_matching_rule = matching_rules
        .map(current_rule => Array.from(find_path_to_terminal(reduced_rules, current_rule, next_token, new Set(), 0)))
        .flat()
        .reverse()[0]

      // reduced_matching_rules sind alle rules die immernoch matchen, es sollte sich nur um eine handeln, da nur ein Look-Ahead von 1 unterstützt wird. 
      if(!reduced_matching_rule) {
        console.log('the tokens "' + token + '" and "' + next_token + '" did not produce a match. Trying only "' + token + '" now.')
      }

      console.log('reduced_find_path_to_terminal', reduced_matching_rule)

      stack.push({
        rule: reduced_matching_rule,
        children: [token, next_token]
      })

      i++;

    
    } else {
      console.log('skipped look-ahead since no next_token')
    }
  }

  // const matching_rules = Array.from(find_path_to_terminal(rules, current_rule, token, new Set(), 0))

  // console.log('find_path_to_terminal', matching_rules)

  // // shift matching rules by 1 and find matching rule for next_token

  // const _reduced_rules = reduce_rules(get_rules_by_reference(rules, matching_rules), 1)

  // current_rule = matching_rules[0]

  // const reduced_rules = map_rules_to_references(matching_rules, _reduced_rules)

  // console.log('reduced rules', reduced_rules)

  // console.log('next_token', next_token)

  // const reduced_matching_rules = matching_rules
  //   .map(current_rule => Array.from(find_path_to_terminal(reduced_rules, current_rule, next_token, new Set(), 0)))
  //   .flat()

  // console.log('reduced_find_path_to_terminal', reduced_matching_rules)

  // reduced_matching_rules sind alle rules die immernoch matchen, es sollte sich nur um eine handeln, da nur ein Look-Ahead von 1 unterstützt wird. 

  return input
}

export default (scope) => Parser.bind(scope)