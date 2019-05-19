/* eslint-disable */
const SUPER_VERBOSE = true
const last = (arr) => arr[arr.length-1]

const isTerminal = (part) => typeof part === 'string' && part.startsWith('@')

const isNonTerminal = (part) => !part.startsWith('@')

const isMatchingTerminal = (part, terminal) => part === '@' + terminal

const find_path_to_terminal = (rules, current_rule, token) => {
  const path = Array.from(_find_path_to_terminal(rules, current_rule, token, new Set(), 0))
  if(path.length !== 0) {

    let really_has_path = false

    const last_rule = rules[last(path)] // not recalculating constants

    for(let i = 0; i < last_rule.length; i++) { // looping through all sub_rules of rules[last(path)]; the last item in the path array should be the actual direct match
      const sub_rule_part = last_rule[i][0] // first item of sub_rule
      if(isMatchingTerminal(sub_rule_part, token)) { // does this first item of the sub_rule match the terminal?
        really_has_path = true
      }
    }

    if(really_has_path) {
      return path
    } else {
      return []
    }

  } else {
    return []
  }
}

// if no path to the terminal symbol is found this just returns every rule that it went through to find the terminal even if it did not find it at the end. Solving this using a wrapper function that checks if the terminal was REALLY found?
const _find_path_to_terminal = (rules, current_rule, token, path=new Set(), i=0) => {
  if(i > 1000) {
    console.log('breaking duo to overflow (limit: 1000)')
    return new Set()
  }

  // console.log(rules, current_rule, token)

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
    path.add(..._find_path_to_terminal(rules, rule, token, path.add(current_rule), i+1))
  )

  return path
}

const find_path_to_non_terminal = (rules, current_rule, target_rule) => {
  return Array.from(_find_path_to_non_terminal(rules, current_rule, target_rule, new Set(), 0))
}

const _find_path_to_non_terminal = (rules, current_rule, target_rule, path=new Set(), i=0) => {
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
    path.add(..._find_path_to_non_terminal(rules, rule, target_rule, path.add(current_rule), i+1)))

  return path
}

const copy_rules = (rules) => {
  const new_rules = []
  for(let i = 0; i < rules.length; i++) {
    const new_inner_rules = []
      for(let k = 0; k < rules[j].length; k++) {
        new_inner_rules[k] = rules[j][k]
      }
      new_rules[j] = new_inner_rules
  }
  return new_rules
}

const reduce_rule = (rule, amount) => {
  const new_inner_rules = []
  for(let i = 0; i < rule.length; i++) {
    new_inner_rules[i] = rule[i].slice(amount)
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

const reduce_rule_object = (rules, amount) => map_rules_to_references(Object.keys(rules), reduce_rules(Object.values(rules), amount))

const get_precedence = (rules, rule) => Object.keys(rules).indexOf(rule)+1 // +1 since indices are zero-based

const get_missing_portions = (rules, rule, tokens) => {

  let new_rules = rules

  for(let i = 0; i < tokens.length; i++) {
    const token = tokens[i]

    let has_path_to_token

    if(typeof token === 'string') {
      has_path_to_token = !!find_path_to_terminal(new_rules, rule, token)[0]
    } else if(typeof token === 'object') {
      // get_missing_portions often gets something wrong about the first item of its list of missing things, could this be why?
      // there was a bug inside find_path_to_terminal, the same bug is probably also inside of find_path_to_non_terminal, should check that
      // probably not the case, this else if block is not really getting executed since all tokens are of type string (which is weird, some tokens should be other rules)
      has_path_to_token = !!find_path_to_non_terminal(new_rules, rule, token.rule)[0]
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

const try_to_reduce_stack = (rules, stack, no_manual_missing_check_on_first_item=false) => {
  // iterating from top to bottom+1 since one rule should still remain there. breaking if can't integrate further
  if(SUPER_VERBOSE) console.group('try_to_reduce_stack')
  for(let i = stack.length-1; i > 0; i--) {
    
    if(SUPER_VERBOSE) console.log('current_stack_item:', stack[i])
    if(SUPER_VERBOSE) console.log(get_missing_portions(rules, stack[i].rule, stack[i].children)) // somehow this gives the wrong result, should this be replaced with stack[i].missing?
    if(SUPER_VERBOSE) console.log(stack[i].missing)
    if(SUPER_VERBOSE) console.log('does "%c%s%c" (%s) fit into "%c%s%c" (%s)?', 'color: #ef6c00', stack[i].rule, 'color: black', stack[i].children.join(' '), 'color: #ef6c00', stack[i-1].rule, 'color: black', stack[i-1].children.join(' '))
    if(SUPER_VERBOSE) console.log('missing portions from rule ' + stack[i].rule, get_missing_portions(rules, stack[i].rule, stack[i].children))
    
    // stack[i] is completed
    if((no_manual_missing_check_on_first_item && i === stack.length-1 && stack[i].missing.length === 0) || get_missing_portions(rules, stack[i].rule, stack[i].children).length === 0) {

      if(SUPER_VERBOSE) console.log('rule %s is completed. Now the question is, does it fit into rule %s', stack[i].rule, stack[i-1].rule)
      // theres probably something wrong with this code below, the check does not return that prec_5 fits into prec_1 of prec_10
      // found the bug: when trying to find_path_to_non_terminal the only rule that should be reduced is the current_rule (stack[i-1].rule) and not the rest
      // without the rest "unreduced" there is often no path available to the target rule. `reduce_rule` should be used and that should then be somehow merged with the normal `rules`
      // and after that these new rules should be used for find_path_to_non_terminal.
      const missing_from_previous = get_missing_portions(rules, stack[i-1].rule, stack[i-1].children)
      const amount_to_reduce = stack[i-1].children.length

      // copying rules (reducing by 0, could also use copy_rules and then manually do the conversion between array and object)
      const new_rules = reduce_rule_object(rules, 0)
      // reducing only the current_rule (stack[i-1].rule) since otherwise a path to target_rule (stack[i].rule) cannot be found most of the time
      new_rules[stack[i-1].rule] = reduce_rule(rules[stack[i-1].rule], amount_to_reduce)

      const path_from_previous_to_current = find_path_to_non_terminal(new_rules, stack[i-1].rule, stack[i].rule)

      if(SUPER_VERBOSE) console.log(
        'missing_from_previous:', missing_from_previous, '\n',
        'amount_to_reduce:', amount_to_reduce, '\n',
        'new_rules:', new_rules, '\n',
        'path_from_previous_to_current:', path_from_previous_to_current
      )

      if(last(path_from_previous_to_current) === stack[i].rule) {
        if(SUPER_VERBOSE) console.log('rule "%c%s%c" can be integrated into "%c%s%c"', 'color: #ef6c00', stack[i].rule, 'color: black', 'color: #ef6c00', stack[i-1].rule, 'color: black')
        stack[i-1].children.push(stack.pop())
        stack[i-1].maybe_not_really_completed = stack[i-1].missing[0]
        stack[i-1].missing = stack[i-1].missing.filter((_, i) => i !== 0) // filter out the first element since this is the one that was just integrated
        // is the first rule in missing really complete now? not really i think, but could be set to done since its potentially done.
        // Can it be checked if a given token can still be integrated into the rule later on? Maybe. 
        // Saving to 'maybe_not_really_completed' to be able to look it up later (I know that this is probably a really really bad idea)
      }
    }
  }
  console.groupEnd()
  return stack
}

const Parser = function(input, options) {

  const {ast, rules} = this

  let stack = []

  let i = 0;
  let token
  let next_token

  console.log(input)

  let current_rules_references = Object.keys(rules)
  let current_rule = current_rules_references[0]

  let stop = false

  // main loop through the TokenStream. `stop` is used to break incase of a syntax error
  while(i+1 < input.length && !stop) { // this is probably missing the last iteration where only token is defined and not next_token, should this be adjusted or should the last token be done manually since backtracking should always be done on the last token?

    token = input[i]
    next_token = input[i+1]

    console.group(i, token, next_token)

    console.log(
      'token:           "%c%s%c"\nnext_token:      "%c%s%c"\nalready parsed:  "%c%s%c"\n\nstack:',
      'color: #ef6c00', token, 'color: black',
      'color: #ef6c00', next_token, 'color: black',
      'color: #ef6c00', input.slice(0, i).join(''), 'color: black',
      [...stack]
    )

    // matching rule for current token
    const matching_rules = find_path_to_terminal(rules, current_rule, token)
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
        reduced_matching_rule = last(find_path_to_terminal(reduced_rules, matching_rules[i], next_token)) || reduced_matching_rule
      }

      if(!reduced_matching_rule) console.log(
          'couldn\'t find rule (reduced_matching_rule) for both token ("%c%s%c") and next_token ("%c%s%c"): "%c%s%c"', 
          'color: #ef6c00', token, 'color: black', 
          'color: #ef6c00', next_token, 'color: black', 
          'color: #ef6c00', reduced_matching_rule, 'color: black'
        )
      else console.log('found rule (reduced_matching_rule for both token and next_token: "%c%s%c"', 'color: #ef6c00', reduced_matching_rule, 'color: black')

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
          console.log(missing_portions)
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
            stack = try_to_reduce_stack(rules, stack)
          } else if(relation === -1) { // do the backtracking and stuff
            // here we have to check if only token would match anything. We already
            // have the list of things that token matches (`matching_rules`) so we just
            // have to choose the one with the highest precedence and try the precedence check again
            // NOTE: what if the rule on the stack is already completed? could that case exist or is
            // that taken care of by something else? tbh idk
            // NOTE: when will i be incremented?

            // EXAMPLE of when this can happen:
            // id(id > id, id, id)
            //         ^ ^
            //  token        :  id
            //  next_token   :  ,
            //  matching_rule:  prec_1
            //  missing      :  prec_6, prec_1
            //  action:      :  complete prec_6 with id, then use resulting prec_5 and insert into prec_10
            //  action       :  look if , matches the missing portions of prec_10 (it does)
            //  action       :  insert , into prec_10, check if complete (it's not), if yes: backtrack further, if not continue parsing


            if(SUPER_VERBOSE) console.log('the tokens "%c%s%c" and "%c%s%c" did not produce a match. Trying only "%c%s%c" now.', 'color: #ef6c00', token, 'color: black', 'color: #ef6c00', next_token, 'color: black', 'color: #ef6c00', token, 'color: black')
            if(SUPER_VERBOSE) console.log('highest matching rule for "%c%s%c" is: "%c%s%c"', 'color: #ef6c00', token, 'color: black', 'color: #ef6c00', last(matching_rules), 'color: black')
            if(SUPER_VERBOSE) console.log('trying to append to last rule on the stack and then backtrack if possible')

            const missing_portions = last(stack).missing
            const has_path_to_terminal = !!find_path_to_terminal(rules, missing_portions[0], token)[0]

            console.log('still missing from last rule:', missing_portions)

            if(has_path_to_terminal) {
              console.log('path to terminal found, inserting into previous rule')
              stack[stack.length-1].children.push(token) // should this be pushed as a token or a complete rule? also when pushing as a complete rule, what would be the rule used to describe this?, would it be missing_portions[0] or last(matching_rules)

              console.log(get_precedence(rules, last(matching_rules)), get_precedence(rules, missing_portions[0]))
              // if this token completes a portion of the last rule just remove that portion from the list
              if(get_precedence(rules, last(matching_rules)) >= get_precedence(rules, missing_portions[0])) {
                stack[stack.length-1].missing = stack[stack.length-1].missing.filter((missing_rule, i) => i !== 0)
                console.log('MAYBE COMPLETED STACK ITEM', stack[stack.length-1])
              }

              // it should probably be tried to reduce the size of the stack as much as possible
              stack = try_to_reduce_stack(rules, stack, true)

              // now we have to deal with the next_token
              // trying if it can be appended, similar to what has been done with token

              {
                const missing_portions = last(stack).missing
                let has_path_to_terminal
                console.log(missing_portions, stack)
                if(isTerminal(missing_portions[0])) {
                  has_path_to_terminal = isMatchingTerminal(missing_portions[0], next_token)
                } else {
                  has_path_to_terminal = find_path_to_terminal(rules, missing_portions[0], next_token).length > 0
                }

                console.log('can next_token be integrated into the last rule (%c%s%c) on the stack? %s', 'color: #ef6c00', last(stack).rule, 'color: back', has_path_to_terminal ? 'yes' : 'no')
              }
              
              
            } else {
              console.log('no path to terminal was found in the previous rule, this seems like a syntax error')
            }
          }
        }
      } else {
        console.log('hello there', token, next_token, i, input.length)
        console.log(stack)
        if(SUPER_VERBOSE) console.log('the tokens "%c%s%c" and "%c%s%c" did not produce a match. Trying only "%c%s%c" now.', 'color: #ef6c00', token, 'color: black', 'color: #ef6c00', next_token, 'color: black', 'color: #ef6c00', token, 'color: black')
        if(SUPER_VERBOSE) console.log('highest matching rule for "%c%s%c" is: "%c%s%c"', 'color: #ef6c00', token, 'color: black', 'color: #ef6c00', last(matching_rules), 'color: black')
        if(SUPER_VERBOSE) console.log('trying to append to last rule on the stack and then backtrack if possible')

        const stack_last = last(stack)

        const missing_portions = stack_last.missing
        // if a terminal is the item in the array of missing portions it's precedence is the
        // precedence of it's own rule, if another rule is referenced the precedence of that rule is taken
        const missing_precedence = get_precedence(rules, isTerminal(missing_portions[0]) ? stack_last.rule : missing_portions[0])
        const maybe_missing_precedence = get_precedence(rules, isTerminal(stack_last.maybe_not_really_completed) ? stack_last.rule : stack_last.maybe_not_really_completed)

        console.log(stack_last)

        const new_precedence = get_precedence(rules, matching_rules[0])

        console.log(missing_portions, stack_last.maybe_not_really_completed, token, missing_precedence, maybe_missing_precedence, new_precedence)

        // is precedence really that important here to be honest?
        if(new_precedence > missing_precedence || new_precedence > maybe_missing_precedence) {
          console.log('new precedence is higher')
        } else {
          console.log('new precedence is lower')
        }

        // checking if token would fit in somewhere (either last(stack).maybe_not_really_completed or last(stack).missing[0])
        // i need to do some weird rule reducing here again and check something with last(last(stack).children) and token.
        // if they match last(stack).maybe_not_really_completed then i know that it's actually not really completed and i can append
        // the token to the children and add whats missing from the maybe_not_really_completed rule to the beginning of last(stack).missing
        // incase of prec_1 this would mean that maybe_not_really_completed would no longer hold a value and prec_1 would just go into missing again

        let fits_in_maybe_not_really_completed = false
        let start_of_maybe_not_really_completed

        let fits_in_missing = false
        let start_of_missing

        for(let i = stack_last.children.length-1; i > 0; i--) {
          const current_child = stack_last.children[i]
          // this assumes that there is always a fallthrough to higher precedence rules
          // we will check the rule stack_last.maybe_not_really_completed
          // we can assume that maybe_not_really_completed is a rule reference instead of a terminal
          // but just to be sure we check it
          if(!isTerminal(stack_last.maybe_not_really_completed)) {
            // checking wether or not current_child is a terminal or not
            let path_to_ith_child = false
            if(isTerminal(current_child)) {
              path_to_ith_child = find_path_to_terminal(rules, stack_last.maybe_not_really_completed, current_child).length > 0
            } else {
              path_to_ith_child = find_path_to_non_terminal(rules, stack_last.maybe_not_really_completed, current_child.rule).length > 0 
            }
            console.log(path_to_ith_child)


            if(path_to_ith_child) {
              // found a path from the nth child to maybe_not_really_completed, now testing what happens if all the children inbetween are also there
              console.log('children in between')
              let iteration_rules = rules
              for(let j = i+1; j < stack_last.children.length; j++) {
                console.log(stack_last.children[j])
                // need to reduce the rules by 1 now each iteration
                iteration_rules = reduce_rule_object(iteration_rules, 1)
                console.log(iteration_rules)
                // now need to check if stack_last.children[j] matches
                let path_to_jth_child = false
                if(isTerminal(stack_last.children[j])) {
                  path_to_jth_child = find_path_to_terminal(iteration_rules, stack_last.maybe_not_really_completed, stack_last.children[j]).length > 0
                } else {
                  path_to_jth_child = find_path_to_non_terminal(iteration_rules, stack_last.maybe_not_really_completed, stack_last.children[j]).length > 0
                }
                if(!path_to_jth_child) {
                  console.log('cannot track further forward')
                  break
                }
              }
              start_of_maybe_not_really_completed = i
              // found a path, no longer need to check the children further back
              break
            }

          } else {
            console.log('something must have went wrong, received a terminal as last(stack).maybe_not_really_completed')
          }
        }

        // now need to check wether or not token fits into maybe_not_really_completed

        const amount_to_reduce_rules_by = stack_last.children.length - start_of_maybe_not_really_completed
        console.log(fits_in_maybe_not_really_completed, start_of_maybe_not_really_completed)
        console.log('amount to reduce rules:', amount_to_reduce_rules_by)

        const maybe_not_really_completed_rules = reduce_rule_object(rules, amount_to_reduce_rules_by)

        console.log(maybe_not_really_completed_rules)

        // now we have to check token against those new rules
        fits_in_maybe_not_really_completed = find_path_to_terminal(maybe_not_really_completed_rules, stack_last.maybe_not_really_completed, token).length > 0

        if(!fits_in_maybe_not_really_completed) {

          for(let i = stack_last.children.length-1; i > 0; i--) {
            const current_child = stack_last.children[i]
            // this assumes that there is always a fallthrough to higher precedence rules
            // we will check the rule stack_last.missing[0]
            if(!isTerminal(stack_last.missing[0])) {
              // checking wether or not current_child is a terminal or not
            let path_to_ith_child = false
            if(isTerminal(current_child)) {
              path_to_ith_child = find_path_to_terminal(rules, stack_last.missing[0], current_child).length > 0
            } else {
              path_to_ith_child = find_path_to_non_terminal(rules, stack_last.missing[0], current_child.rule).length > 0
            }
            console.log(path_to_ith_child)

            if(path_to_ith_child) {
              // found a path from the nth child to missing[0], now testing what happens if all the children inbetween are also there
              console.log('children in between')
              let iteration_rules = rules
              for(let j = i+1; j < stack_last.children.length; j++) {
                console.log(stack_last.children[j])
                // need to reduce the rules by 1 now each iteration
                iteration_rules = reduce_rule_object(iteration_rules, 1)
                console.log(iteration_rules)
                // now need to check if stack_last.children[j] matches
                let path_to_jth_child = false
                if(isTerminal(stack_last.children[j])) {
                  path_to_jth_child = find_path_to_terminal(iteration_rules, stack_last.missing[0], stack_last.children[j]).length > 0
                } else {
                  path_to_jth_child = find_path_to_non_terminal(iteration_rules, stack_last.missing[0], stack_last.children[j]).length > 0
                }
                if(!path_to_jth_child) {
                  console.log('cannot track further forward')
                  break
                }
              }
              start_of_missing = i
              // found a path, no longer need to check the children further back
              break
            }


            } else {
              // is this really an error here? I don't think so
              console.log('something must have went wrong, received a terminal as last(stack).missing[0]')
            }
          }

          const amount_to_reduce_rules_by = stack_last.children.length - start_of_maybe_not_really_completed
          console.log(fits_in_missing, start_of_missing)
          console.log('amount to reduce rules:', amount_to_reduce_rules_by)

          const missing_rules = reduce_rule_object(rules, amount_to_reduce_rules_by)

          fits_in_missing = find_path_to_terminal(missing_rules, stack.missing[0], token).length > 0
        }

        if(fits_in_maybe_not_really_completed) {
          console.log('fits_in_maybe_not_really_completed')
        } else if(fits_in_missing) {
          console.log('fits_in_missing')
        } else {
          console.log('this is probably a syntax error, did not fit inside maybe_not_really_completed and missing[0]')
        }

        // this is wrong, i need to find out where last(stack).maybe_not_really_completed begins in last(stack).rule and then have to do the check with that
        // Incase of prec_10 being on the stack and maybe_not_really_completed being prec_1 this would mean that prec_1 starts after "id(". Meaning that the
        // check has to be done for all items after that (so reduce by 2 because the items that came before are 2 (does that really work, is reducing right here?))
        console.log(
          'I now need to check wether %s is actually not completed by checking if %s and %s match it, after that do the same for the first item of missing (%s)', 
          last(stack).maybe_not_really_completed, last(stack).children.map(part => typeof part === 'string' ? part : part.rule).join(''), token, last(stack).missing[0]
        )

        debugger

        // also consider:
        // last(stack).maybe_not_really_completed should also be checked

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
    
    } else {
      console.log('skipped look-ahead since no next_token')
    }
    console.log(stack)
    console.groupEnd()
  }
  return input
}

export default (scope) => Parser.bind(scope)