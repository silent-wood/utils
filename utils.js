(function () {
    var class2type = {}
    var toString = class2type.toString // Object.prototype.toString 检测数据类型
    var hasOwn = class2type.hasOwnProperty // Object.prototype.hasOwnProperty 检测是否私有属性
    var fnToString = hasOwn.toString // Function.prototype.toString 吧函数转换成字符串;
    var ObjectFunctionString = fnToString.call(Object) // => "function Object(){ [native code] }"
    var getProto = Object.getPrototypeOf // 获取当前对象的原型链__proto__
    
    // 简历数据类型检测的映射表 {"[object Array]": "array", ... ...}
    var typeMap = ['String', 'Number', 'Boolean', 'Object', 'Array', 'Fuction', 'Date', 'RegExp', 'Symbol', 'BigInt']
    typeMap.forEach(function(name) {
        class2type['[object ' + name + ']'] = name.toLocaleLowerCase()
    })

    // 返回数据类型的方法
    var toType = function toType(obj) {
        // 传递null/undefined 
        // typeof 检测只能检测基本数据类型，null的话也返回object
        if (obj == null) return obj + ''
        // 基于字面量方式(var/let/const)创造的基本数据类型，直接基于typeof检测即可「性能要高一些」；
        // 剩余的基于Object.prototype.toString.call的方式来检测，把获取的值到映射表中匹配，匹配结果是字符串对应的数据类型；
        return typeof obj === 'function' || typeof obj === 'object'
        ? class2type[toString.call(obj)] || 'object'
        : typeof obj
    }
    var isFunction = function isFunction(obj) {
        // typeof obj.nodeType !== "number" ：防止在部分浏览器中，检测<object>元素对象结果也是"function"，但是它的nodeType=1，处理浏览器兼容问题
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
        // type === "array" 数组
        // length === 0 空的类数组
        // 最后一个条件判断的是非空的类数组「有length属性，并且最大索引在对象中」
        return type === 'array' || length === 0 ||
            typeof length === 'number' && length > 0 && (length - 1) in obj
    }
    /**
     * 是否是纯净的对象
     * 
     */
    var isPlainObject = function isPlainObject(obj) {
        // 不存在或者基于toString检测结果都不是[object Object],那么一定不是纯粹的对象
        if (!obj || toString.call(obj) !== '[object Object]') return false
        // 获取当前值的原型链「直属类的原型链」
        var proto = getProto(obj)
        // Object.create(null):这样创造的对象没有__proto__
        if (!proto) return true
        // Ctor存储原型对象上的constructor属性，没有这个属性就是false
        var Ctor = proto.constructor
        // 条件成立说明原型上的构造函数是Object：obj就是Object的一个实例，并且obj.__proto__===Object.prototype
        return typeof Ctor === "function" && fnToString.call(Ctor) === ObjectFunctionString;
    }
    /**
     * 是否是空对象
     * 对象的私有属性和symbol属性都为空
     */
    var isEmptyObject = function isEmptyObject (obj) {
        if (obj == null) return false
        if (typeof obj !== '[object Object]') return false
        // 是一个对象「纯粹对象或者特殊对象都可以」
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
    // 判断是都是浏览器或者webview
    if (typeof window !== 'undefined') {
        window._ = window.utils = utils
    }
    // 是否是Node 环境
    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = utils
    }
    return utils
})()


