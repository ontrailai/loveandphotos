/**
 * ESLint Rule: no-large-supabase-queries
 * Detects potentially oversized Supabase .in() queries that could cause net::ERR_FAILED
 * Suggests using fetchInBatches utility instead
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent oversized Supabase .in() queries that can cause URL length errors',
      category: 'Possible Errors',
      recommended: true
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          maxArraySize: {
            type: 'integer',
            minimum: 1,
            default: 50
          },
          maxVariableThreshold: {
            type: 'integer',
            minimum: 1,
            default: 100
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      largeLiteralArray: 'Supabase .in() query with {{count}} items may cause URL length errors. Use fetchInBatches from @utils/batchSupabaseQueries for arrays > {{max}} items.',
      largeVariableArray: 'Supabase .in() query with potentially large array variable "{{name}}". Consider using fetchInBatches from @utils/batchSupabaseQueries if array size > {{max}} items.',
      missingBatchingImport: 'Large Supabase query detected but fetchInBatches is not imported. Add: import { fetchInBatches } from "@utils/batchSupabaseQueries"',
      dynamicArrayWarning: 'Supabase .in() query with dynamic array. Ensure array size is validated or use fetchInBatches for safety.'
    }
  },

  create(context) {
    const options = context.options[0] || {}
    const maxArraySize = options.maxArraySize || 50
    const maxVariableThreshold = options.maxVariableThreshold || 100

    // Track imports to suggest fetchInBatches if not present
    let hasBatchingImport = false
    let hasSupabaseUsage = false

    function checkForBatchingImport(node) {
      if (node.type === 'ImportDeclaration') {
        const source = node.source.value
        if (source === '@utils/batchSupabaseQueries' || source.includes('batchSupabaseQueries')) {
          const specifiers = node.specifiers
          hasBatchingImport = specifiers.some(spec =>
            spec.imported && spec.imported.name === 'fetchInBatches'
          )
        }
      }
    }

    function isSupabaseInQuery(node) {
      // Check if this is a .in() call on a Supabase query chain
      if (node.type !== 'CallExpression') return false
      if (!node.callee || !node.callee.property) return false
      if (node.callee.property.name !== 'in') return false

      // Check if it's part of a Supabase query chain (look for .from() in the chain)
      let current = node.callee.object
      while (current) {
        if (current.type === 'CallExpression' &&
            current.callee &&
            current.callee.property &&
            (current.callee.property.name === 'from' ||
             current.callee.property.name === 'select')) {
          return true
        }
        current = current.callee ? current.callee.object : null
      }

      return false
    }

    function analyzeArrayArgument(node, arrayArg) {
      if (!arrayArg) return null

      // Case 1: Literal array [id1, id2, id3, ...]
      if (arrayArg.type === 'ArrayExpression') {
        const elementCount = arrayArg.elements.length
        if (elementCount > maxArraySize) {
          return {
            type: 'largeLiteralArray',
            count: elementCount,
            max: maxArraySize
          }
        }
        return null
      }

      // Case 2: Variable array (someArray, userIds, etc.)
      if (arrayArg.type === 'Identifier') {
        const varName = arrayArg.name

        // Check for suspicious variable names that suggest large arrays
        const suspiciousPatterns = [
          /userIds/i, /photographerIds/i, /itemIds/i, /allIds/i,
          /users/i, /photographers/i, /items/i, /records/i,
          /\.length/i, /Array/i, /list/i
        ]

        const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(varName))

        if (isSuspicious) {
          return {
            type: 'largeVariableArray',
            name: varName,
            max: maxArraySize
          }
        }
        return null
      }

      // Case 3: Dynamic arrays (map results, filters, etc.)
      if (arrayArg.type === 'CallExpression' ||
          arrayArg.type === 'MemberExpression') {
        return {
          type: 'dynamicArrayWarning'
        }
      }

      return null
    }

    return {
      ImportDeclaration: checkForBatchingImport,

      CallExpression(node) {
        if (isSupabaseInQuery(node)) {
          hasSupabaseUsage = true

          // Get the array argument (second argument to .in())
          const arrayArg = node.arguments[1]
          const analysis = analyzeArrayArgument(node, arrayArg)

          if (analysis) {
            // Report the specific issue
            context.report({
              node,
              messageId: analysis.type,
              data: analysis
            })
          }
        }
      },

      'Program:exit'() {
        // If we found Supabase usage but no batching import, suggest adding it
        if (hasSupabaseUsage && !hasBatchingImport) {
          const firstSupabaseQuery = context.getSourceCode().ast.body.find(node => {
            // Find first Supabase-related code to attach warning
            return node.type === 'VariableDeclaration' ||
                   node.type === 'ExpressionStatement'
          })

          if (firstSupabaseQuery) {
            context.report({
              node: firstSupabaseQuery,
              messageId: 'missingBatchingImport'
            })
          }
        }
      }
    }
  }
}