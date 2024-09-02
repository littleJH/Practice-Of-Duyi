import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react"
import ErrorBoundary from "./component/07 error boundary/ErrorBoundary"
import Child07 from "./component/07 error boundary/Child07"


function App() {

  const [count, setCount] = useState(1)

  if (count % 2 === 0) {
    useEffect(() => {
      window.alert('useEffect in 2')
    })
  } else {
    useEffect(() => {
      window.alert('useEffect in 1')
    })
  }


  const handleInput = () => {
    console.log('input ...')
  }

  const handleInputCapture = () => {
    console.log('input capture ...')
  }

  return (
    <ErrorBoundary>
      <button onClick={() => setCount(val => val + 1)}>{count} + 1</button>
      <input onInput={handleInput} onChange={handleInput} onInputCapture={handleInputCapture} onChangeCapture={handleInputCapture}></input>
    </ErrorBoundary>
  )
}

export default App