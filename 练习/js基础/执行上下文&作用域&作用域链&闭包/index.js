function foo(a, c, d) {
  console.log(a, b, c, d)
  var b = 2
  function c() {}
  var d = function () {}
  b = 3
}

foo(1, 2, 3)
