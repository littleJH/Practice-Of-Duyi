import _ from 'lodash'
import $ from 'jquery'
// import './index.css'

(async function () {
  const cssData = await import('./index.css')
  console.log("🚀 ~ cssData:", cssData)
})()