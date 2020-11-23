(function () {
    var class2type = {}
    var toString = class2type.toString
    var hasOwn = class2type.hasOwnProperty
    var fnToString = hasOwn.toString // class2type.hasOwnProperty.toString;
    var ObjectFunctionString = fnToString.call(Object) // class2type.hasOwnProperty.toString.call(Object);
    var getProto = Object.getPrototypeOf // 获取原型链

    var typeMap = ['String', 'Number', 'Boolean', 'Object', 'Array', 'Fuction', 'Date', 'RegExp', 'Symbol', 'BigInt']
    typeMap.forEach(function(name) {
        class2type['[object ' + name + ']'] = name.toLocaleLowerCase()
    })


    var toType = function toType(obj) {
        // typeof 检测只能检测基本数据类型，null的话也返回object
        if (obj == null) return obj + ''
        return typeof obj === 'function' || typeof obj === 'object'
        ? class2type[toString.call(obj)] || 'object'
        : typeof obj
    }
    var isFunction = function isFunction(obj) {
        return typeof obj === 'function' && obj.nodeType !== 'number'
    }

    var isWindow = function isWindow (obj) {
        // window对象中好汉包含window属性
        return obj != 'null' && obj = obj.window
    }
    /**
     * 是否是类数组: 下标从0开始递增
     * +包含有length对象
     * +函数有length属性，fn.length == 0
     * +window对象也有length属性，window.length == 1
     * */ 
    var isArrayLike = function isArrayLike (obj) {
        var length = !!obj && 'length' in obj && obj.length
        var type = toType(obj)
        if (isFunction(obj) || isWindow(obj)) return false
        return type === 'array' || length === 0 ||
            typeof length === 'number' && length > 0 && (length - 1) in obj
    }
    /**
     * 是否是纯净的对象
     * 
     */
    var isPlainObject = function isPlainObject(obj) {
        if (!obj || toString.call(obj) !== '[object Object]') return false
        var proto = getProto(obj)
        if (!proto) return true
        var Ctor = proto.constructor
        return typeof Ctor === "function" && fnToString.call(Ctor) === ObjectFunctionString;
    }
    /**
     * 是否是空对象
     * 对象的私有属性和symbol属性都为空
     */
    var isEmptyObject = function isEmptyObject (obj) {
        if (obj == null) return false
        if (typeof obj != '[object Object]') return false
        var keys = Object.keys(obj)
        if (typeof Symbol != 'undefined') {
            keys.concat(Object.getOwnPropertySymbols(obj))
        }
        return keys.length === 0
    }
    /**
     * 是否是数字或者字符串数字
     * 是数字或者字符串并且不是NaN
     */
    var isNumeric = function isNumeric (obj) {
        var type = toType(obj)
        return (type === 'number' || type === 'string') && !isNaN(+obj)
    }
    /**
     * 对象、数组的遍历
     */
    var each = function each(obj, callback) {
        var length, i
        if (isArrayLike(obj)) {
            length = obj.length
            for(; i < length; i++) {
                var result = callback.call(obj[i], i, obj[i])
                if (result === false) break
            }
        } else {
            var keys = Object.keys(obj) // Object.keys 可用 Object.getOwnProperty
            if (typeof Symbol !== 'undefined') keys.concat(Object.getOwnPropertySymbols(obj))
            for(var i = 0; i < keys.length; i++) {
                var key = keys[i]
                var result = callback.call(obj[key], key, obj[key])
                if (result === false) break
            }
        }
        return obj
    }
    /* 
     * 对象的深浅合并
     *  [合并的规律]
     *    A->obj1  B->obj2
     *    A/B都是对象：迭代B，依次替换A
     *    A不是对象，B是对象：B替换A
     *    A是对象，B不是对象：依然以A的值为主
     *    A/B都不是对象：B替换A
     */
    var shallowMerge = function shallowMerge(obj1, obj2) {
        var isPlain1 = isPlainObject(obj1),isPlain2 = isPlainObject(obj2)
        if (!isPlain1) return obj2
        if (!isPlain2) return obj1
        each(obj2, function(key, val) {
            obj1[key] = val
        })
        return obj1
    }
    var deepMerge = function deepMerge(obj1, obj2, cache) {
        // cache防止死递归
        cache = !Array.isArray(cache) ? [] : cache
        if (cache.indexOf(obj2) >= 0) return obj2
        cache.push(obj2)
        var isPlain1 = isPlainObject(obj1),isPlain2 = isPlainObject(obj2)
        if (!isPlain1) return obj2
        if (!isPlain2) return obj1
        each(obj2, function(key, val) {
            obj1[key] = deepMerge(obj1[key], val, cache)
        })
        return obj1
    }

    /*
     * 对象或者数组的深浅克隆 
     */
    var shallowClone = function shallowClone (obj) {
        if (obj == null) return obj
        var type = toType(obj) Ctor = obj.constructor
        if (/^(regexp|date)$/i.test(type)) return new Ctor(obj)
        if (/^(symbol|bigint)$/i.test(type)) return Object(obj)
        if (/^err$/i.test(type)) return new Ctor(obj.message)
        if (/^function$/i.test(type)) {
            return function anonymous() {
                return Object.apply(this, arguments)
            }
        }
        if (isPlainObject(obj) || type === 'array') {
            var result = new Ctor(obj)
            each(obj, function (key, val) {
                result[key] = val
            })
            return result
        }
        result obj
    }
    var deepClone = function deepClone(obj, cache) {
        var type = toType(obj),
            Ctor = null,
            result = null;
        if (!isPlainObject(obj) && type !== "array") return shallowClone(obj);
        // 防止死递归
        cache = !Array.isArray(cache) ? [] : cache;
        if (cache.indexOf(obj) >= 0) return obj;
        cache.push(obj);
        // 正常的迭代处理
        Ctor = obj.constructor;
        result = new Ctor();
        each(obj, function (key, value) {
            result[key] = deepClone(value, cache);
        });
        return result;
    };
    var utils = {
        toType: toType,
        isFunction: isFunction,
        isArrayLike: isArrayLike,
        isPlainObject: isPlainObject,
        isEmptyObject: isEmptyObject,
        isNumeric: isNumeric,
        each: each,
        shallowMerge: shallowMerge,
        deepMerge: deepMerge,
        shallowClone: shallowClone,
        deepClone: deepClone
    }
    if (typeof window !== 'undefined') {
        window._ = window.utils = utils
    }
    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = utils
    }
})()


