/* eslint-disable */
const SUPER_VERBOSE = true
const last = (arr) => arr[arr.length-1]

const isTerminal = (part) => part.startsWith('@')

const isNonTerminal = (part) => !part.startsWith('@')

const isMatchingTerminal = (part, terminal) => part === '@' + terminal

const find_path_to_terminal = (rules, current_rule, token, path=new Set(), i=0) => {
  if(i > 1000) {
    console.log('breaking duo to overflow (limit: 1000)')
    return new Set()
  }

  const rules_to_follow = new Set()

  for(let i = 0; i < rules[current_rule].length; i++) {
    const rule = rules[current_rule][i]

    if(isMatchingTerminal(rule[0], token)) {
      path.add(current_rule)
    } else if(isNonTerminal(rule[0]) && rule[0] !== current_rule) {
      rules_to_follow.add(rule[0])
    }

  }

  rules_to_follow.forEach(rule => 
      path.add(...find_path_to_terminal(rules, rule, token, path.add(current_rule), i+1)))

  return path
}

const find_path_to_non_terminal = (rules, current_rule, target_rule, path=new Set(), i=0) => {
  if(i > 1000) {
    console.log('breaking duo to overflow (limit: 1000)')
    return new Set()
  }

  const rules_to_follow = new Set()

  for(let i = 0; i < rules[current_rule].length; i++) {
    const rule = rules[current_rule][i]

    if(isNonTerminal(rule[0]) && rule[0] === target_rule) {
      path.add(current_rule).add(rule[0])
    } else if(isNonTerminal(rule[0]) && rule[0] !== current_rule) {
      rules_to_follow.add(rule[0])
    }

  }

  rules_to_follow.forEach(rule =>
    path.add(...find_path_to_non_terminal(rules, rule, target_rule, path.add(current_rule), i+1)))

  return path
}

const reduce_rules = (rules, amount) => {
  const new_rules = []

  for(let j = 0; j < rules.length; j++) {
    const new_inner_rules = []
    for(let k = 0; k < rules[j].length; k++) {
      new_inner_rules[k] = rules[j][k].slice(amount)
    }
    new_rules[j] = new_inner_rules.filter(rule => rule.length > 0)
  }

  return new_rules
}

// const reduce_rules = (rules, amount) =>
//   rules.map(rule => rule
//     .map(rule => rule.slice(amount))
//     .filter(rule => rule.length > 0)
//   )

const get_rules_by_reference = (rules, rule_references) => {
  const new_rules = []

  for(let i = 0; i < rule_references.length; i++)
    new_rules[i] = rules[rule_references[i]]

  return new_rules
}


const map_rules_to_references = (rule_references, rules) => {
  const new_rules = {}

  for(let i = 0; i < rule_references.length; i++)
    new_rules[rule_references[i]] = rules[i]

  return new_rules
}

const Parser = function(input, options) {

  const {ast, rules} = this

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

    console.log(
      'token:           "%c%s%c"\nnext_token:      "%c%s%c"\nalready parsed:  "%c%s%c"\n\nstack:', 
      'color: #ef6c00', token, 'color: black', 
      'color: #ef6c00', next_token, 'color: black', 
      'color: #ef6c00', input.slice(0, i).join(''), 'color: black',
      [...stack]
    )

    // current token

    const matching_rules = Array.from(find_path_to_terminal(rules, current_rule, token, new Set(), 0))

    console.log('matching rule for (only) token', matching_rules)

    i++;

    // look-ahead token

    if(i < input.length) {
      current_rule = matching_rules[0]

      const reduced_rules = map_rules_to_references(matching_rules, reduce_rules(get_rules_by_reference(rules, matching_rules), 1))

      if(SUPER_VERBOSE) console.log('reduced rules', reduced_rules)

      let reduced_matching_rule

      for(let i = 0; i < matching_rules.length; i++) {
        reduced_matching_rule = last(Array.from(find_path_to_terminal(reduced_rules, matching_rules[i], next_token, new Set(), 0))) || reduced_matching_rule
      }

      // reduced_matching_rules sind alle rules die immernoch matchen, es sollte sich nur um eine handeln, da nur ein Look-Ahead von 1 unterstützt wird. 

      if(!reduced_matching_rule) {

        if(SUPER_VERBOSE) console.log('the tokens "%c%s%c" and "%c%s%c" did not produce a match. Trying only "%c%s%c" now.', 'color: #ef6c00', token, 'color: black', 'color: #ef6c00', next_token, 'color: black', 'color: #ef6c00', token, 'color: black')
        if(SUPER_VERBOSE) console.log('highest matching rule for "%c%s%c" is: "%c%s%c"', 'color: #ef6c00', token, 'color: black', 'color: #ef6c00', matching_rules.reverse()[0], 'color: black')
        if(SUPER_VERBOSE) console.log('trying to append to last rule on the stack')
        
        const twice_reduced_rules = map_rules_to_references(matching_rules, reduce_rules(get_rules_by_reference(reduced_rules, matching_rules), 1))

        const has_path_to_terminal = !!Array.from(find_path_to_terminal(twice_reduced_rules, last(stack).rule, token, new Set(), 0))[0]

        console.log('has_path_to_terminal', has_path_to_terminal)

        if(SUPER_VERBOSE) console.log('if the previous call returned an array (%s) we now know that the rule has a path to the terminal symbol we are checking. This means we can insert the terminal into the rule on the stack', has_path_to_terminal ? 'id did' : 'id did not')

        stack[stack.length-1].children.push(token)

        console.log('stack (shallow copy):', [...stack])

        // here is probably the point where we should start iterating the stack from top to bottom and try to integrate stuff into the rule before the current. 

        for(let i = stack.length-1; i > 1; i--) { // iterating from top to bottom+1 since one rule should still remain there. breaking if cant integrate further
          // stack[i] // current stack item
          console.log('iterating stack now, trying to integrate rules into each other', stack[i])
          console.log('does "%c%s%c" (%s) fit into "%c%s%c" (%s)?', 'color: #ef6c00', stack[i].rule, 'color: black', stack[i].children.join(' '), 'color: #ef6c00', stack[i-1].rule, 'color: black', stack[i-1].children.join(' '))

          const path_from_previous_to_current = Array.from(find_path_to_non_terminal(twice_reduced_rules, stack[i-1].rule, stack[i].rule, new Set(), 0))
          
          if(SUPER_VERBOSE) console.log('this is the path that was found:', path_from_previous_to_current)
          if(SUPER_VERBOSE) console.log('if the array has "%c%s%c" at the end (%s), then there exists a path meaning that the current rule can be integrated into the previous rule', 'color: #ef6c00', stack[i].rule, 'color: black', last(path_from_previous_to_current) === stack[i].rule ? 'which it does' : 'which it does not')

          if(last(path_from_previous_to_current) === stack[i].rule) {
            if(SUPER_VERBOSE) console.log('rule "%c%s%c" can be integrated into "%c%s%c"', 'color: #ef6c00', stack[i].rule, 'color: black', 'color: #ef6c00', stack[i-1].rule, 'color: black')

            stack[i-1].children.push(stack.pop())
            console.log('stack (shallow copy):', [...stack])
          }
        }

        // if(SUPER_VERBOSE) console.log('it should be checked if the last rule on the stack is completed. Since the last token did not work together with the current last rule the last rule on the stack should be complete (or there is a syntax error in the input but error discovery is not yet implemented). This means that the last rule can be incorporated into the second to last (if it fits. This could be checked by searching using a "find_path_to_non_terminal" starting from the second to last rule to the last rule)')

        // if(stack[stack.length-2] !== undefined) {
        //   const path_from_second_to_last_to_last = Array.from(find_path_to_non_terminal(twice_reduced_rules, stack[stack.length-2].rule, stack[stack.length-1].rule, new Set(), 0))
        //   if(SUPER_VERBOSE) console.log('does the last rule fit into the second to last?', path_from_second_to_last_to_last)
        //   if(SUPER_VERBOSE) console.log('if this call returns an array with the last rule on the stack at the end then there exists a path from the second to last rule to the last rule meaning that the second to last rule can be incorporated into  the second to last')

        //   if(last(path_from_second_to_last_to_last) === last(stack).rule) {
        //     if(SUPER_VERBOSE) console.log('incorporating last rule into second to last rule since it fits')
        //     stack[stack.length-2].children.push(stack.pop())
        //     console.log('stack:', [...stack])
        //   }
        // }

        console.log('now we have to deal with the next_token ("%c%s%c") which could not be assigned to a rule yet', 'color: #ef6c00', next_token, 'color: black')
        console.log('it should be checked if it can be integrated into the (now) last rule on the stack (note: doing all of this should be done somewhat recursively / iteratively so that the stack can be reduced to it\'s smallest possible state)')

        i++

      } else {
        console.log('matching rule for token and next_token: "%c%s%c"', 'color: #ef6c00', reduced_matching_rule, 'color: black')

        stack.push({
          rule: reduced_matching_rule,
          children: [token, next_token]
        })
  
        i++;
      }
    
    } else {
      console.log('skipped look-ahead since no next_token')
    }
  }

  return input
}

export default (scope) => Parser.bind(scope)