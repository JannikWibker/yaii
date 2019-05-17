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

const reduce_rule = (rule, amount) => {
  const new_inner_rules = []
  for(let i = 0; i < rule.length; i++) {
    new_inner_rule[i] = rule[i].slice(amount)
  }
  return new_inner_rules.filter(rule => rule.length > 0)
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

const reduce_rule_object = (rules, amount) => map_rules_to_references(Object.keys(rules), reduce_rules(Object.values(rules), 1))

const get_precedence = (rules, rule) => Object.keys(rules).indexOf(rule)+1 // +1 since indices are zero-based

const get_missing_portions = (rules, rule, tokens) => {

  let new_rules = rules

  for(let i = 0; i < tokens.length; i++) {
    const token = tokens[i]

    let has_path_to_token

    if(typeof token === 'string') {
      has_path_to_token = !!Array.from(find_path_to_terminal(new_rules, rule, token, new Set(), 0))[0]
    } else if(typeof token === 'object') {
      has_path_to_token = !!Array.from(find_path_to_non_terminal(new_rules, rule, token.rule, new Set(), 0))[0]
    }

    if(has_path_to_token) {
      new_rules = reduce_rule_object(new_rules, 1)
    } else {
      break
    }
  }

  if(new_rules[rule].length === 0) return []

  return new_rules[rule][0] // at this point only one sub-rule should remain, this is why the first element is taken, if this did not happen an array of arrays would be returned. Incase that nothing exists anymore an empty array is returned
}

const try_to_reduce_stack = (rules, stack) => {
  // iterating from top to bottom+1 since one rule should still remain there. breaking if can't integrate further
  for(let i = stack.length-1; i > 1; i--) {
    if(SUPER_VERBOSE) console.log('try_to_reduce_stack_current_stack_item:', stack[i])
    if(SUPER_VERBOSE) console.log(get_missing_portions(rules, stack[i].rule, stack[i].children))
    if(SUPER_VERBOSE) console.log('does "%c%s%c" (%s) fit into "%c%s%c" (%s)?', 'color: #ef6c00', stack[i].rule, 'color: black', stack[i].children.join(' '), 'color: #ef6c00', stack[i-1].rule, 'color: black', stack[i-1].children.join(' '))
    if(get_missing_portions(rules, stack[i].rule, stack[i].children).length === 0) {
      // stack[i] is completed
      const missing_from_previous = get_missing_portions(rules, stack[i-1].rule, stack[i-1].children)
      const amount_to_reduce = stack[i-1].children.length
      const new_rules = reduce_rule_object(rules, amount_to_reduce)
      const path_from_previous_to_current = Array.from(find_path_to_non_terminal(new_rules, stack[i-1].rule, stack[i].rule, new Set(), 0))

      if(SUPER_VERBOSE) console.log(
        'missing_from_previous:', missing_from_previous,
        'amount_to_reduce:', amount_to_reduce,
        'new_rules:', new_rules,
        'path_from_previous_to_current:', path_from_previous_to_current
      )

      if(last(path_from_previous_to_current) === stack[i].rule) {
        if(SUPER_VERBOSE) console.log('rule "%c%s%c" can be integrated into "%c%s%c"', 'color: #ef6c00', stack[i].rule, 'color: black', 'color: #ef6c00', stack[i-1].rule, 'color: black')
        stack[i-1].children.push(stack.pop())
        stack[i-1].missing.filter((_, i) => i !== 0) // filter out the first element since this is the one that was just integrated
      }
    }
  }
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

  // main loop through the TokenStream. `stop` is used to break incase of a syntax error
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

    // matching rule for current token
    const matching_rules = Array.from(find_path_to_terminal(rules, current_rule, token, new Set(), 0))
    console.log('matching rule for (only) token', matching_rules)

    i++; // incrementing i already, if look-ahead works i is also incremted again there

    // look-ahead token

    // check if there even is a next_token. Could be that the end of the TokenStream is reached
    if(i < input.length) {

      // take the rule with the lowest precedence of all matching rules and use that as a starting point for next_token
      current_rule = matching_rules[0]

      // reduce the rules by 1, this is done since the first part of the rule should have 
      // already been matched with token, now next_token is checked against the following portions of
      // the rules. This is done because tokens can only be checked against the first portion of a rule
      const reduced_rules = map_rules_to_references(matching_rules, reduce_rules(get_rules_by_reference(rules, matching_rules), 1)) 
      
      if(SUPER_VERBOSE) console.log('reduced rules', reduced_rules)

      let reduced_matching_rule

      console.log('searching for a match of both token and next_token now')

      // here the actual search for a matching rule is done. It should really only match one
      // rule in total, but if more are matched the one with the highest precedence is taken
      for(let i = 0; i < matching_rules.length; i++) {
        reduced_matching_rule = last(Array.from(find_path_to_terminal(reduced_rules, matching_rules[i], next_token, new Set(), 0))) || reduced_matching_rule
      }

      console.log('reduced_matching_rule', reduced_matching_rule)

      if(!reduced_matching_rule) console.log(token, next_token)

      // incase a rule matches check the precedences (missing on the stack vs. current rule)
      // - precedence of matching rule is higher: push to stack
      // - precedence of matching rule is equal: try to integrate into rule on the stack
      // - precedence is lower: process `token` alone
      if(reduced_matching_rule || stack.length === 0) {
        if(stack.length === 0) {
          if(reduced_matching_rule) {
            i++
            stack.push({
              rule: reduced_matching_rule,
              children: [token, next_token],
              missing: get_missing_portions(rules, reduced_matching_rule, [token, next_token])
            })
          } else {
            stack.push({
              rule: reduced_matching_rule,
              children: [token],
              missing: get_missing_portions(rules, reduced_matching_rule, [token])
            })
          }
        } else {
          
          const missing_portions = get_missing_portions(rules, last(stack).rule, last(stack).children)

          // if a terminal is the item in the array of missing portions it's precedence is the
          // precedence of it's own rule, if another rule is referenced the precedence of that rule is taken
          const missing_precedence = get_precedence(rules, isTerminal(missing_portions[0]) ? last(stack).rule : missing_portions[0])
          const new_precedence = get_precedence(rules, reduced_matching_rule)
          const relation = new_precedence > missing_precedence ? 1 : new_precedence < missing_precedence ? -1 : 0

          console.log('still missing from rule "%c%s%c":', 'color: #ef6c00', last(stack).rule, 'color: black', missing_portions)
          console.log({...last(stack)})
          console.log(
            'precedences: missing from stack: %c%s%c\n             matched rule (new): %c%s%c\n\ncomparing precedences: (new) %d %s %d (missing from stack) -> %c%s%c',
            'color: #ef6c00', missing_precedence, 'color: black',
            'color: #ef6c00', new_precedence, 'color: black',
            new_precedence,
            relation === 1 ? '>' : relation === 0 ? '=' : '<',
            missing_precedence,
            'font-weight: 700', relation === 1 ? 'push' : relation === 0 ? 'integrate' : 'backtrack', 'font-weight: initial'
          )

          if(relation === 1) { // push to stack
            stack.push({
              rule: reduced_matching_rule,
              children: [token, next_token],
              missing: get_missing_portions(rules, reduced_matching_rule, [token, next_token])
            })

            i++

          } else if(relation === 0) { // integrate into previous rule
            stack[stack.length-1].children.push({
              rule: reduced_matching_rule,
              children: [token, next_token],
              missing: get_missing_portions(rules, reduced_matching_rule, [token, next_token])
            })

            i++
            // should now try to reduce stack
            try_to_reduce_stack(rules, stack)
          } else if(relation === -1) { // do the backtracking and stuff
            // here we have to check if only token would match anything. We already
            // have the list of things that token matches (`matching_rules`) so we just
            // have to choose the one with the highest precedence and try the precedence check again
            // NOTE: what if the rule on the stack is already completed? could that case exist or is
            // that taken care of by something else? tbh idk
            // NOTE: when will i be incremented?

            if(SUPER_VERBOSE) console.log('the tokens "%c%s%c" and "%c%s%c" did not produce a match. Trying only "%c%s%c" now.', 'color: #ef6c00', token, 'color: black', 'color: #ef6c00', next_token, 'color: black', 'color: #ef6c00', token, 'color: black')
            if(SUPER_VERBOSE) console.log('highest matching rule for "%c%s%c" is: "%c%s%c"', 'color: #ef6c00', token, 'color: black', 'color: #ef6c00', last(matching_rules), 'color: black')
            if(SUPER_VERBOSE) console.log('trying to append to last rule on the stack')
          }
        }
      } else {
        console.log('hello there', token, next_token, i, input.length)
        console.log(stack)
        if(SUPER_VERBOSE) console.log('the tokens "%c%s%c" and "%c%s%c" did not produce a match. Trying only "%c%s%c" now.', 'color: #ef6c00', token, 'color: black', 'color: #ef6c00', next_token, 'color: black', 'color: #ef6c00', token, 'color: black')
        if(SUPER_VERBOSE) console.log('highest matching rule for "%c%s%c" is: "%c%s%c"', 'color: #ef6c00', token, 'color: black', 'color: #ef6c00', last(matching_rules), 'color: black')
        if(SUPER_VERBOSE) console.log('trying to append to last rule on the stack')

        const missing_portions = last(stack).missing
        // if a terminal is the item in the array of missing portions it's precedence is the
        // precedence of it's own rule, if another rule is referenced the precedence of that rule is taken
        const missing_precedence = get_precedence(rules, isTerminal(missing_portions[0]) ? last(stack).rule : missing_portions[0])

        const new_precedence = get_precedence(rules, matching_rules[0])

        console.log(missing_portions, missing_precedence, new_precedence)

        // compare the precedences (new_precedence vs missing_precedence)
        // - higher: integrate into rule on the stack
        // - equal: idk
        // - lower: idk (look at the case "()!", the factorial has a lower precedence, meaning
        //          that it should come higher in the whole AST, does this mean that the stack
        //          should be iterated from top to bottom and the factorial rule should be sorted 
        //          into a spot with rules of higher precedence above it and rules with lower
        //          precedence below it?; is this the way to handle lower precedence on the right
        //          of the currently read input?; should this also be done when token and next_token
        //          produce a match but the precedence is lower or what should then be done?)

        // what happens here?
        // only token should be parsed and it should be attempted to integrate it into the rule on the stack, that is what should happen
      }

      // the following code is slowly getting migrated into the above, this code will be gone soon (hopefully).

      // incase no rule matches both token and next_token:
      // if(!reduced_matching_rule) {

      //   // if(SUPER_VERBOSE) console.log('the tokens "%c%s%c" and "%c%s%c" did not produce a match. Trying only "%c%s%c" now.', 'color: #ef6c00', token, 'color: black', 'color: #ef6c00', next_token, 'color: black', 'color: #ef6c00', token, 'color: black')
      //   // if(SUPER_VERBOSE) console.log('highest matching rule for "%c%s%c" is: "%c%s%c"', 'color: #ef6c00', token, 'color: black', 'color: #ef6c00', matching_rules.reverse()[0], 'color: black')
      //   // if(SUPER_VERBOSE) console.log('trying to append to last rule on the stack')
        
      //   const twice_reduced_rules = map_rules_to_references(matching_rules, reduce_rules(get_rules_by_reference(reduced_rules, matching_rules), 1))

      //   const has_path_to_terminal = !!Array.from(find_path_to_terminal(twice_reduced_rules, last(stack).rule, token, new Set(), 0))[0]

      //   // console.log('has_path_to_terminal', has_path_to_terminal)

      //   if(SUPER_VERBOSE) console.log('if the previous call returned an array (%s) we now know that the rule has a path to the terminal symbol we are checking. This means we can insert the terminal into the rule on the stack', has_path_to_terminal ? 'id did' : 'id did not')

      //   stack[stack.length-1].children.push(token)

      //   // console.log('stack (shallow copy):', [...stack])

      //   // here is probably the point where we should start iterating the stack from top to bottom and try to integrate stuff into the rule before the current. 

      //   try_to_reduce_stack(rules, stack)

      //   // for(let i = stack.length-1; i > 1; i--) { // iterating from top to bottom+1 since one rule should still remain there. breaking if cant integrate further
      //   //   // stack[i] // current stack item
      //   //   console.log('iterating stack now, trying to integrate rules into each other', stack[i])
      //   //   console.log('does "%c%s%c" (%s) fit into "%c%s%c" (%s)?', 'color: #ef6c00', stack[i].rule, 'color: black', stack[i].children.join(' '), 'color: #ef6c00', stack[i-1].rule, 'color: black', stack[i-1].children.join(' '))

      //   //   const path_from_previous_to_current = Array.from(find_path_to_non_terminal(twice_reduced_rules, stack[i-1].rule, stack[i].rule, new Set(), 0))
          
      //   //   if(SUPER_VERBOSE) console.log('this is the path that was found:', path_from_previous_to_current)
      //   //   if(SUPER_VERBOSE) console.log('if the array has "%c%s%c" at the end (%s), then there exists a path meaning that the current rule can be integrated into the previous rule', 'color: #ef6c00', stack[i].rule, 'color: black', last(path_from_previous_to_current) === stack[i].rule ? 'which it does' : 'which it does not')

      //   //   if(last(path_from_previous_to_current) === stack[i].rule) {
      //   //     if(SUPER_VERBOSE) console.log('rule "%c%s%c" can be integrated into "%c%s%c"', 'color: #ef6c00', stack[i].rule, 'color: black', 'color: #ef6c00', stack[i-1].rule, 'color: black')

      //   //     stack[i-1].children.push(stack.pop())
      //   //     console.log('stack (shallow copy):', [...stack])
      //   //   }
      //   // }

      //   // if(SUPER_VERBOSE) console.log('it should be checked if the last rule on the stack is completed. Since the last token did not work together with the current last rule the last rule on the stack should be complete (or there is a syntax error in the input but error discovery is not yet implemented). This means that the last rule can be incorporated into the second to last (if it fits. This could be checked by searching using a "find_path_to_non_terminal" starting from the second to last rule to the last rule)')

      //   // if(stack[stack.length-2] !== undefined) {
      //   //   const path_from_second_to_last_to_last = Array.from(find_path_to_non_terminal(twice_reduced_rules, stack[stack.length-2].rule, stack[stack.length-1].rule, new Set(), 0))
      //   //   if(SUPER_VERBOSE) console.log('does the last rule fit into the second to last?', path_from_second_to_last_to_last)
      //   //   if(SUPER_VERBOSE) console.log('if this call returns an array with the last rule on the stack at the end then there exists a path from the second to last rule to the last rule meaning that the second to last rule can be incorporated into  the second to last')

      //   //   if(last(path_from_second_to_last_to_last) === last(stack).rule) {
      //   //     if(SUPER_VERBOSE) console.log('incorporating last rule into second to last rule since it fits')
      //   //     stack[stack.length-2].children.push(stack.pop())
      //   //     console.log('stack:', [...stack])
      //   //   }
      //   // }

      //   // console.log('now we have to deal with the next_token ("%c%s%c") which could not be assigned to a rule yet', 'color: #ef6c00', next_token, 'color: black')
      //   // console.log('it should be checked if it can be integrated into the (now) last rule on the stack (note: doing all of this should be done somewhat recursively / iteratively so that the stack can be reduced to it\'s smallest possible state)')

      //   i++

      // // incase a rule matches check the precedences
      // // - precedence of matching rule is higher: push to stack
      // // - precedence of matching rule is equal: try to integrate into rule on the stack
      // // - precedence is lower: process `token` alone
      // } else {
      //   // console.log(
      //   //   'matching rule for token and next_token: "%c%s%c"',
      //   //   'color: #ef6c00', reduced_matching_rule, 'color: black'
      //   // )

      //   stack.push({
      //     rule: reduced_matching_rule,
      //     children: [token, next_token]
      //   })
  
      //   i++;
      // }
    
    } else {
      console.log('skipped look-ahead since no next_token')
    }
  }
  return input
}

export default (scope) => Parser.bind(scope)