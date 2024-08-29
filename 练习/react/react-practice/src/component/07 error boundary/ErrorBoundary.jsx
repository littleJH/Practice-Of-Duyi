import React, { Component } from 'react'

export default class ErrorBoundary extends Component {

  constructor(props) {
    super(props)
    this.state = {
      hasError: false
    }
  }


  // 用于记录错误日志
  componentDidCatch(error, info) {
    console.error("🚀 ~ ErrorBoundary ~ componentDidCatch ~ error, info:", error, info)
  }

  // 用于更改错误状态从而渲染错误信息
  static getDerivedStateFromError(error) {
    console.error("🚀 ~ ErrorBoundary ~ getDerivedStateFromError ~ error:", error)
    return {
      hasError: true
    }
  }

  render() {
    return (
      <div>
        {this.state.hasError ? <h1>Something went wrong.</h1> : this.props.children}
      </div>
    )
  }
}
