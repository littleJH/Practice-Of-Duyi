import React from 'react'
import propTypes from 'prop-types'

export default function Child01(props) {
  console.log(propTypes)
  return (
    <div>index</div>
  )
}

Child01.propTypes = {
  /**
   * 
   * @param {*} props props 对象
   * @param {*} propName 当前 prop
   * @param {*} componentNmae 组件名称
   */
  scores: function (props, propFullName, componentName) {
    if (typeof props[propName] !== 'number') {
      return new Error(
        'Invalid prop `' + propFullName + '` supplied to' +
        ' `' + componentName + '`. Validation failed.'
      );
    }
  },
  Children: propTypes.element.isRequired
}
