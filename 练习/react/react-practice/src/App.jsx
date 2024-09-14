import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react"
import ErrorBoundary from "./component/07 error boundary/ErrorBoundary"
import Child07 from "./component/07 error boundary/Child07"


function App() {

  const [isShow, setIsShow] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    console.log('App useEffect')
    return () => {
      console.log('App useEffect return')
    }
  }, [])


  return (
    <ErrorBoundary>
      <button onClick={() => setIsShow(!isShow)}>toggle</button>
      <button onClick={() => inputRef.current.remove()}>remove</button>
      {
        isShow && <input ref={inputRef}></input>
      }
    </ErrorBoundary>
  )
}

export default App