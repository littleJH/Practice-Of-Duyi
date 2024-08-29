import React from 'react'

export default function withLogRef(WrapComponent) {
  class ForwardCom extends React.Component {
    render() {
      const { forwardRef, ...otherProps } = this.props
      // 将来自父组件的ref传递给子组件
      return <WrapComponent {...otherProps} ref={forwardRef}></WrapComponent>
    }
  }

  // 通过 forwardRef 接收来自父组件的 ref
  return forwardRef((props, ref) => {
    return <ForwardCom {...props} forwardRef={ref} ></ForwardCom>
  })
}
