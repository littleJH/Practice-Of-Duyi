// console.log(typeof null); // object
// console.log(typeof undefined); // undefined

// console.log(null + 1); // 1
// console.log(undefined + 1); // NaN

// console.log(typeof []); // object
// console.log(typeof function () {}); // function
// console.log(typeof /abc/); // object

// function func() {}
// // 该函数我是可以正常添加属性和方法的
// func.a = 1; // 添加了一个属性
// func.test = function () {
//   console.log("this is a test function");
// }; // 添加了一个方法
// console.log(func.a); // 1
// func.test(); // this is a test function

// let i = 1;
// let obj = {};
// obj.a = 1000;
// obj.b = [];

// function test(obj) {
//   obj = {}; // 这里就赋值了一个新对象，不再使用原来的对象
//   obj.a = 1000;
// }
// const obj = {};
// console.log(obj); // {}
// test(obj);
// console.log(obj); // {}

// const a = {}; // 内存地址不一样，假设 0x0012ff7c
// const b = {}; // 内存地址不一样，假设 0x0012ff7d
// console.log(a === b); // false

// const a = 1;
// a.b = 2;
// console.log(a.b); // undefined
// a.c = function(){}
// a.c(); // error

let a = 5;
let b = a;
b = 10; // 不影响 a
console.log(a);
console.log(b);
let obj = {};
let obj2 = obj;
obj2.name = "张三"; // 会影响 obj
console.log(obj); // { name: '张三' }
console.log(obj2); // { name: '张三' }
obj2 =  { name: '张三' };
obj2.age = 18; // 不会影响 obj
console.log(obj)
console.log(obj2)