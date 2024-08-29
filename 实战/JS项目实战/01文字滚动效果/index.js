(function () {
  const itemsArr = Array.from(document.querySelectorAll('.list li'))
  const ctn = document.querySelector('.list')
  const newItem = itemsArr[0].cloneNode(true)
  clone(ctn, newItem)
  const len = itemsArr.length;


  let index = 1
  setInterval(() => {
    if (index < len) {
      scroll()
    }
  }, 1000)

  function clone(target, element) {
    target.appendChild(element)
    itemsArr.push(element)
  }

  function scroll() {
    index === 1 && scrollToTop()
    itemsArr[index].scrollIntoView({
      behavior: 'smooth'
    })
    index++
    if (index === len) index = 1
  }

  function scrollToTop() {
    ctn.scrollIntoView()
  }
})()