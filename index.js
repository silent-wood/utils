/*
 * @Author: lishun
 * @Date: 2020-11-26 10:34:30
 * @LastEditors: lishun
 * @LastEditTime: 2020-11-26 10:41:20
 * @Description: 描述
 * @Copyright: Cloud-Star. Co. Ltd. All rights reserved.
 */
var class2Type = {}
var toString = class2Type.toString
var typeMap = ['String', 'Number', 'Boolean', 'Array', 'Object', 'Date', 'RegExp', 'Fuction', 'Symbol', 'BigInt']
typeMap.forEach(name => {
    class2Type['[object ' + name + ']'] = name.toLowerCase()
})
function toType (obj) {
    if (obj == null) return obj + ''
    return typeof obj === 'function' || typeof obj === 'object' ?
      class2Type[toString.call(obj)] || 'object' :
    typeof obj
}
