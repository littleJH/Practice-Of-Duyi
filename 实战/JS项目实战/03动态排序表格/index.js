(function () {

  /**
 * todo 
 * 1. 单选/多选联动
 * 2. 年龄排序
 * 3. 姓名排序
 */

  class Table {
    rows = []
    selectedRows = []
    selectedAll = false
    constructor(options) {
      const { rowSelector, ctnSelector } = options
      this.rowSelector = rowSelector
      this.ctnSelector = ctnSelector
      this.init()
    }
    init() {
      this.tableCtn = document.querySelector(this.ctnSelector)
      this.rows = Array.from(document.querySelectorAll(this.rowSelector))
      this.getHeaders()
      this.initEvent()
    }

    initEvent() {
      document.querySelector('#checkAll').addEventListener('click', () => {
        this.checkAll()
      })
      this.tableCtn.querySelector('thead tr').addEventListener('click', (e) => {
        if (e.target.tagName !== 'TH') return
        this.sort(e.target.innerText)
      })
    }

    getHeaders() {
      const headers = []
      Array.from(this.tableCtn.querySelectorAll('thead tr th')).forEach((th) => {
        headers.push(th.innerText)
      })
      this.headers = headers
      console.log("🚀 ~ Table ~ getHeaders ~ headers:", headers)
      return headers
    }

    checkAll() {
      this.rows.forEach(row => {
        row.cells[0].childNodes[1].checked = !this.selectedAll

      })
      this.selectedAll = !this.selectedAll
      this.selectedRows = this.rows
    }

    sort(key) {
      const index = this.headers.findIndex((value) => value === key)

      this.rows.sort((a, b) => {
        const regex = /^[+-]?\d+(\.\d+)?$/
        // 数字
        if (regex.test(a.cells[index].innerText)) {
          return Number(a.cells[index].innerText) - Number(b.cells[index].innerText)
        }
        // 字符
        else {
          // 根据中文规则进行比较
          return a.cells[index].innerText.localeCompare(b.cells[index].innerText, 'zh')
        }
      })
      this.refresh()
    }

    refresh() {
      const tbody = this.tableCtn.querySelector('tbody')
      this.rows.forEach(row => {
        tbody.appendChild(row)
      })
    }

  }

  document.addEventListener('DOMContentLoaded', () => {
    new Table({
      ctnSelector: '.table',
      rowSelector: '.table-row',
    })
  })

})()