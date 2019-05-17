# Language Specification - Spreadsheet Cell Language

## Example code and what structure it turns into

### 1

```
=MAX(C1:C4)
```

```js
["id", "(", "id", ":", "id", ")"]
```

```js
{
  type: 'program',
  children: [
    {
      type: 'function',
      value: 'MAX',
      arguments: [
        {
          type: 'range',
          valueA: { type: 'reference', value: 'C1' },
          valueB: { type: 'reference', value: 'C4' },
        }
      ]
    }
  ]
}
```

```js
lib.MAX(lib.RANGE('C1', 'C4'))
```

### 2

```
=IF(C1 > C2, C1, C2)
```

```js
["id", "(", "id", ">", "id", ",", "id", ",", "id", ")"]
```

```js
{
  type: 'program',
  children: [
    {
      type: 'function',
      value: 'IF',
      arguments: [
        {
          type: 'term',
          sub_type: 'condition',
          operator: 'greater than',
          valueA: { type: 'reference', value: 'C1' },
          valueB: { type: 'reference', value: 'C2' }
        },
        { type: 'reference', value: 'C1' },
        { type: 'reference', value: 'C2' }
      ]
    ]
  }
}
```

```js
lib.IF(lib.GET('C1') > lib.GET('C2'), lib.GET('C1'), lib.GET('C2'))
```

### 3

```
=IF((C1 > (C2 || C3)) && C4 != "str", (MAX(C1:C2) + 5) % 2, MIN(C3:C4))
```

```js
["id", "(", "(", "id", ">", "(", "id", "||", "id", ")", ")", "&&", "id", "!=", "str", "," "(", "id", "(", "id", ":", "id", ")", "+", "num", ")", "%", "num", ",", "id", "(", "id", ":", "id", ")", ")"]
```

```js
{
  type: 'program',
  children: [
    {
      type: 'function',
      value: 'IF',
      arguments: [
        {
          type: 'term',
          sub_type: 'condition',
          operator: 'and',
          valueA: {
            type: 'term',
            sub_type: 'condition',
            operator: 'greater than',
            valueA: { type: 'reference', value: 'C1' },
            valueB: {
              type: 'term',
              sub_type: 'condition',
              operator: 'or',
              valueA: { type: 'reference', value: 'C2' },
              valueB: { type: 'reference', value: 'C3' }
            }
          },
          valueB: {
            type: 'term',
            sub_type: 'condition',
            operator: 'not equal',
            valueA: { type: 'reference', value: 'C4' },
            valueB: {
              type: 'primitive',
              sub_type: 'string',
              value: 'str'
            }
          }
        },
        {
          type: 'term',
          sub_type: 'arithmetic',
          operator: 'modulo',
          valueA: {
            type: 'term',
            sub_type: 'arithmetic',
            operator: 'addition',
            valueA: {
              type: 'function',
              value: 'MAX',
              arguments: [
                {
                  type: 'range',
                  valueA: { type: 'reference', value: 'C1' },
                  valueB: { type: 'reference', value: 'C2' }
                }
              ]
            },
            valueB: {
              type: 'primitive',
              sub_type: 'number',
              value: '5'
            }
          },
          valueB: {
            type: 'primitive',
            sub_type: 'number',
            value: '2'
          }
        },
        {
          type: 'function',
          value: 'MIN',
          arguments: [
            {
              type: 'range',
              valueA: { type: 'reference', value: 'C3' },
              valueB: { type: 'reference', value: 'C4' }
            }
          ]
        }
      ]
    }
  ]
}
```

```js
lib.IF((lib.GET('C1') > (lib.GET('C2') || lib.GET('C3'))) && lib.GET('C4') !== 'str', (lib.MAX(lib.RANGE('C1', 'C2')) + 5) % 2, lib.MIN(lib.RANGE('C3', 'C4')))
```

## Operator precedence

> Higher is better

| Precedence | Name          | Associativity | Operator         |
| ---------- | ------------- | ------------- | ---------------- |
| 11 | Parenthesis           | n/a           | `( ... )`        |
| 10 | Function Call         | left-to-right | `... ( ... )`    |
|  9 | Range                 | left-to-right | `...:...`        |
|  8 | Logical NOT           | right-to-left | `! ...`          |
|  8 | Unary Plus            | right-to-left | `+ ...`          |
|  8 | Unary Minus           | right-to-left | `- ...`          |
|  8 | Unary Factorial       | left-to-right | `... !`          |
|  7 | Exponentiation        | right-to-left | `... ^ ...`      |
|  6 | Multiplication        | left-to-right | `... * ...`      |
|  6 | Division              | left-to-right | `... / ...`      |
|  6 | Modulo                | left-to-right | `... % ...`      |
|  5 | Addition              | left-to-right | `... + ...`      |
|  5 | Subtraction           | left-to-right | `... - ...`      |
|  4 | Less Than             | right-to-left | `... < ...`      |
|  4 | Less Than Or Equal    | right-to-left | `... >= ...`     |
|  4 | Greater Than          | right-to-left | `... > ...`      |
|  4 | Greater Than Or Equal | right-to-left | `... >= ...`     |
|  3 | Equality              | right-to-left | `... == ...`     |
|  3 | Inequality            | right-to-left | `... != ...`     |
|  2 | Logical AND           | right-to-left | `... && ...`     |
|  1 | Logical OR            | right-to-left | `... || ...`     |

## BNF / EBNF - Grammar

### Special characters

```bnf
binary_condition_operator_1  := ">" | "<" | ">=" | "<=" | "==" | "!="
binary_condition_operator_2  := "==" | "!="
binary_condition_operator_3  := "&&"
binary_condition_operator_4  := "||"

binary_arithmetic_operator_1 := "^"
binary_arithmetic_operator_2 := "/" | "*" | "%"
binary_arithmetic_operator_3 := "+" | "-"

unary_prefix_operator      := "!" || "-" || "+"
unary_postfix_operator     := "!"
```


```bnf
prec_1 : prec_2             // list
       | prec_2 "," prec_1

prec_2 : prec_3             // logical OR
       | prec_2 "||" prec_3 // binary_condition_operator_4

prec_3 : prec_4             // logical AND
       | prec_3 "&&" prec_4 // binary_condition_operator_3

prec_4 : prec_5             // equality / inequality
       | prec_4 "!=" prec_5 // binary_condition_operator_2
       | prec_4 "==" prec_5

prec_5 : prec_6             // comparison
       | prec_5 ">=" prec_6 // binary_condition_operator_1
       | prec_5 "<=" prec_6
       | prec_5 ">" prec_6
       | prec_5 "<" prec_6

prec_6 : prec_7             // addition / subtraction
       | prec_6 "+" prec_7 // binary_arithmetic_operator_3
       | prec_6 "-" prec_7

prec_7 : prec_8             // multiplication / division / modulo
       | prec_7 "*" prec_8 // binary_arithmetic_operator_2
       | prec_7 "/" prec_8
       | prec_7 "%" prec_8

prec_8 : prec_9             // exponentiation
       | prec_8 "^" prec_9 // binary_arithmetic_operator_1

prec_9 : prec_10      // unary operators
       | "!" prec_10  // unary_prefix_operator
       | "+" prec_10  
       | "-" prec_10
       | prec_10 "!"  // unary_postfix_operator

prec_10 : prec_11
        | identifier "(" prec_1 ")"

prec_11 : value
        | "(" prec_1 ")"

value : identifier
      | primitive
      | range

range : identifier ":" identifier

primitive : string
          | number
          | boolean

boolean : "true"
        | "false"

reference : cell_reference
          | column_reference
          | row_reference

range : cell_reference ":" cell_reference
      | column_reference ":" column_reference
      | row_reference ":" row_reference

cell_reference : /(\w+\d+)/

column_reference : /(\w+)/

row_reference : /(\d+)/

number : /\d*\.?\d*/

string : /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/

identifier : /([_\w][_\w\d]*)/
```

## List of useful excel functions:

- ABS
- ACOS
- ACOSH
- ACOT
- ACOTH
- ADDRESS (https://support.office.com/en-us/article/address-function-d0c26c0d-3991-446b-8de4-ab46431d4f89)
- AND (is this neccessary, && already exists?)
- ASIN
- ASINH
- ATAN
- ATAN2
- AVEDEV (average deviation (standard deviation / variance?))
- AVERAGE
- AVERAGEIF
- AVERAGEIFS
- BITAND
- BITLSHIFT
- BITOR
- BITRSHIFT
- BITXOR
- CEILING
- CHAR
- CLEAN
- COLUMN
- COLUMNS
- CONCAT
- COS
- COSH
- COUNT
- COUNTA
- COUNTBLANK
- COUNTIF
- COUNTIFS
- DECIMAL
- EVEN
- FACT
- FILTER
- FIND
- FINDB
- FLOOR
- GCD
- IF
- IFERROR
- INT
- ISBLANK
- ISERR
- ISERROR
- ISFORMULA
- ISLOGICAL
- ISNONTEXT
- ISNUMBER
- ISODD
- ISREF
- ISTEXT
- LN
- LOG
- LOG10
- LOWER
- MATCH
- MAX
- MAXIFS
- MEDIAN
- MIN
- MINIFS
- MOD
- NOT
- NOW
- ODD
- OR
- PI
- POWER
- PRODUCT
- PROPER
- RADIANS
- REPT
- ROUND
- ROW
- ROWS
- SEARCH
- SEQUENCE
- SIGN
- SIN
- SINH
- SORT
- SQRT
- SUM
- SUMIF
- SUMIFS
- SUMPRODUCT
- TAN
- TANH
- TIME
- TODAY
- WEEKDAY
- WEEKNUM
- WORKDAY
- XOR
