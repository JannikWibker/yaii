# YAII - Yet Another Interpreter Interpreter

This project is a tool which I am developing in order to be able to build a simple excel-like language for another project.

Thereby the code here is heavily mixed together with code needed for this language. This tool is just something which is useful for creating said language and may become it's own project in the future.

The main idea is to be able to interpret a given grammar and parse it. A general purpose lexer is not included, however a purpose build one for the excel-like language is.


## Approach to parsing

The array of tokens is being turned into an AST by a bottom-up-parsing algorithm.

The algorithm works by going through the array of tokens one-by-one and checking what rules match while incorporating the next token into it's decisions. The decisions are always made based on the precedence of the matching rules.

Terminology:
- `token`: the token that is currently being processed
- `next_token`: the token after `token` (look-ahead)
- `stack`: a stack that will later be reduced to one element which will then contain the complete AST
- `rule on the stack`: the topmost element of the stack

Method:
- **(1)** search for matching rules for `token` and `next_token`
- **(2)** push the match to the `stack`
- **(3)** take a look what parts of the rule on the `stack` are still missing
  - **(3.1)** nothing missing: **parsing complete**
  - **(3.2)** still something missing:
    - **(3.2.1)** continue to the next tokens
    - **(3.2.2)** search for matching rules for `token` and `next_token` (if no `next_token` is available continue to **(3.2.2.3)**)
      - **(3.2.2.1)** no matching rule found: **syntax error**
    - **(3.2.3)** compare the precedence of the matching rule to the parts of the rule on the `stack` that are still missing
      - **(3.2.3.1)** precedence is higher: push the matching rule to the `stack`
      - **(3.2.3.2)** precedence is equal: try to integrate the tokens into the rule on the `stack`
      - **(3.2.3.3)** precedence is lower: try to process `token` alone without `next_token` and check precedence again **(3.2.3)**
    - **(3.2.4)** whenever something is added to one of the `stack` items check how much the `stack` can be shrunk:
      - **(3.2.4.1)** is the rule on the `stack` complete?
        - **(3.2.4.1.1)** yes: try to integrate it into the rule before that. Does that work?
          - **(3.2.4.1.1.1)** yes: has the `stack` only one rule left?
            - **(3.2.4.1.1.1.1)** yes: are there any more tokens left?
              - **(3.2.4.1.1.1.1)** yes: lower the precedence of the rule on the `stack` till a rule matches for the current rule on the stack and the `token`. While searching use the rule as `token` and the original `token` as `next_token`, continue to **(3.2.1)**
              - **(3.2.4.1.1.1.2)** no: **parsing complete**
            - **(3.2.4.1.1.1.2)** no: continue to **(3.2.4.1)**
          - **(3.2.4.1)** no: continue to **(3.2.4.1.2)**
        - **(3.2.4.1.2)** no: continue to **(3.2.1)**

> When either **(3.1)** or **(3.2.4.1.1.1.1)** are reached parsing is complete.
> 
> Whenever no matching rule is found but one should exist a syntax error has occured