import React, { Component } from 'react'


class ChildDom extends Component {

  log() {
    console.log('this is child component')
  }

  render() {
    return (
      <div>ChildDom</div>
    )
  }
}




export default class Ref extends Component {
  constructor() {
    super()
    this.ref = React.createRef()
  }

  componentDidMount() {
    this.ref.current.log()
  }

  log() {
    console.log('this is ref com')
  }
  render() {
    return (
      <div><ChildDom ref={this.ref}></ChildDom></div>
    )
  }
}
