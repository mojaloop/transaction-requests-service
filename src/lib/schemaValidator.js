'use strict'

// return an array of values that match on a certain key
function updateDefinition (obj, flags) {
  const key = 'pattern'
  let objects = []
  for (const i in obj) {
    // eslint-disable-next-line no-prototype-builtins
    if (!obj.hasOwnProperty(i)) continue
    if (typeof obj[i] === 'object') {
      objects = objects.concat(updateDefinition(obj[i], key))
    } else if (i === key) {
      if (!obj.regexp && !obj.flags) {
        obj.regexp = {
          pattern: obj[i],
          flags
        }
        delete obj.pattern
      }
    }
  }
}

function generateNewDefinition (originalDefinition) {
  const clonedDefinition = Object.assign({}, originalDefinition)
  updateDefinition(clonedDefinition)
  return clonedDefinition
}

module.exports = {
  generateNewDefinition
}
