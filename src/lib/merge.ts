// Please excuse the quality of the typescriptification

type MergeResult = {
  merged: any,
  added: {
    a: Record<string, any>,
    b: Record<string, any>
  },
  updated: {
    a: Record<string, any>,
    b: Record<string, any>
  },
  conflicts?: Record<string, any>
}

// from https://github.com/rsms/js-object-merge
export const merge = (o: any, a: any, b: any, objOrShallow?: any) => {
  let r, k, v, ov, bv, inR,
    isArray = Array.isArray(a),
    hasConflicts, conflicts: Record<string, any> = {},
    newInA: Record<string, any> = {}, newInB: Record<string, any> = {},
    updatedInA: Record<string, any> = {}, updatedInB: Record<string, any> = {},
    deep = true

  if (typeof objOrShallow !== 'object') {
    r = isArray ? [] : {}
    deep = !objOrShallow
  } else {
    r = objOrShallow
  }

  for (k in b) {
    if (isArray && isNaN((k = parseInt(k)))) continue
    v = b[k]
    r[k] = v
    if (!(k in o)) {
      newInB[k] = v
    } else if (v !== o[k]) {
      updatedInB[k] = v
    }
  }

  for (k in a) {
    if (isArray && isNaN((k = parseInt(k)))) continue
    v = a[k]
    ov = o[k]
    inR = (k in r)
    if (!inR) {
      r[k] = v
    } else if (r[k] !== v) {
      bv = b[k]
      if (deep && typeof v === 'object' && typeof bv === 'object') {
        // TS funkiness: https://stackoverflow.com/a/62274125
        bv = (<any>Object).merge((k in o && typeof ov === 'object') ? ov : {}, v, bv)
        r[k] = bv.merged
        if (bv.conflicts) {
          conflicts[k] = { conflicts: bv.conflicts }
          hasConflicts = true
        }
      } else {
        // if
        if (bv === ov) {
          // Pick A as B has not changed from O
          r[k] = v
        } else if (v !== ov) {
          // A, O and B are different
          if (k in o)
            conflicts[k] = { a: v, o: ov, b: bv }
          else
            conflicts[k] = { a: v, b: bv }
          hasConflicts = true
        } // else Pick B (already done) as A has not changed from O
      }
    }

    if (k in o) {
      if (v !== ov)
        updatedInA[k] = v
    } else {
      newInA[k] = v
    }
  }

  let result: MergeResult

  result = {
    merged: r,
    added: {
      a: newInA,
      b: newInB
    },
    updated: {
      a: updatedInA,
      b: updatedInB
    }
  }
  if (hasConflicts) {
    result.conflicts = conflicts
  }
  return result
}
