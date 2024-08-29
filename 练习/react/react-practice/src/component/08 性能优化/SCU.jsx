import React, { Component } from 'react'

// 浅层比较两个对象是否相等
const isEqual = (prevObj, nextObj) => {
  if (Object.keys(prevObj).length !== Object.keys(nextObj.length)) return false

  for (let key in prevObj) {
    if (nextObj.hasOwnProperty(key)) {
      // Object.is 和 === 的区别在于 +0与-0、两个NaN之间的比较
      // 将数值 -0 和 +0 视为相等，但是会将 NaN 视为彼此不相等
      if (Objec.is(prevObj[key], nextObj[key])) return false
    }
  }
}

export default class SCU extends Component {

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    return isEqual(nextProps, this.props)
      || isEqual(nextState, this.state)
      || isEqual(nextContext, this.context);
  }

  render() {
    return (
      <div>SCU</div>
    )
  }
}
