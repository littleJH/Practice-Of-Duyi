import React, { useEffect } from 'react'


/**
 * 抽离日志逻辑
 * @param {*} Component 接收一个组件 
 * @returns 返回一个新组件
 */
export default function withLog(Component) {
  return function (props) {
    useEffect(() => {
      console.log(`${Component.name} has been created`)
      return () => {
        console.log(`${Component.name} has been destroied`)
      }
    }, [])

    return <Component {...props}></Component>
  }
}
