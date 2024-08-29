import img from '@assets/image.jpg'
import * as styles from './css/index.css'
import $ from "jquery"
import _ from 'lodash'

const image = new Image()
image.src = img
image.style.width = '20px'
document.body.appendChild(image)


if (module.hot) {
  module.hot.accept()
}

setTimeout(() => {

}, 1000,);

