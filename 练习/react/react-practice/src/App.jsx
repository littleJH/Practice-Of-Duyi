import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react"
import ErrorBoundary from "./component/07 error boundary/ErrorBoundary"
import Child07 from "./component/07 error boundary/Child07"


function App() {

  const [count, setCount] = useState(1)

  const fetch = useCallback(() => {
    console.log('fetch ...')
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])



  return (
    <ErrorBoundary>
      <button onClick={() => setCount(val => val + 1)}>count + 1</button>
    </ErrorBoundary>
  )
}

export default App