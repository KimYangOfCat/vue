/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 * 不对该文件进行类型检查，因为 Flow 不能很好地动态访问 Array 原型方法。
 */

import { def } from '../util/index'

const arrayProto = Array.prototype
export const arrayMethods = Object.create(arrayProto)

const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

/**
 * Intercept mutating methods and emit events
 * 拦截异常方法并触发事件
 */
methodsToPatch.forEach(function (method) {
  // cache original method
  // 缓存原始方法
  const original = arrayProto[method]
  def(arrayMethods, method, function mutator (...args) {
    const result = original.apply(this, args)
    const ob = this.__ob__
    let inserted
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
        break
    }
    if (inserted) ob.observeArray(inserted)
    // notify change
    // 通知变更
    ob.dep.notify()
    return result
  })
})
