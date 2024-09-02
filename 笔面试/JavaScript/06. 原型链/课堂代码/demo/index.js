// const obj = {};
// console.log(obj.__proto__);

// const person = {
//   arm: 2,
//   legs: 2,
//   walk() {
//     console.log("walking");
//   },
// };

// const john = Object.create(person, {
//   name: {
//     value: "John",
//     enumerable: true,
//   },
//   age: {
//     value: 18,
//     enumerable: true,
//   },
// });
// console.log(john.__proto__ === person); // true

// function Computer(name, price) {
//   // 1. 创建一个普通的对象
//   // const obj = {};

//   // 2. 设置该对象的原型对象
//   // obj.__proto__ = Computer.prototype;

//   // 3. 设置 this 的指向，指向该 obj
//   // this ---> obj
//   this.name = name; // {name: "华为"}
//   this.price = price; // {name: "华为", price: 5000}

//   // 4. 如果代码里面没有返回对象，那么返回该 this
//   // return this;
// }
// const huawei = new Computer("华为", 5000);
// console.log(huawei);

// class Computer {
//   constructor(name, price) {
//     this.name = name;
//     this.price = price;
//   }
// }
// const huawei = new Computer("华为", 5000);
// console.log(huawei);

// function Computer(){}
// const c = new Computer();
// console.log(c.__proto__ === Computer.prototype);
// console.log(c.constructor === Computer);
// console.log(c.constructor === Computer.prototype.constructor);
// console.log("-------");
// console.log([].__proto__ === Array.prototype);
// console.log([].constructor === Array);
// console.log("-------");
// console.log(1..__proto__ === Number.prototype);
// console.log(1..constructor === Number);
// console.log("-------");
// console.log(true.__proto__ === Boolean.prototype);
// console.log(true.constructor === Boolean);

// function Computer(){}
// const c = new Computer();
// console.log(c.__proto__.__proto__.__proto__)
// console.log(Computer.constructor.constructor);
// console.log(Computer.__proto__ === Function.prototype);
// new Computer.prototype();
// console.log(Computer.prototype.prototype);

// console.log(c.__proto__.__proto__ === {}.__proto__);

// const result = 1..toFixed(3);
// console.log(result, typeof result);
// // Number.prototype.zhangsan = function(){}
// class myNum extends Number{
//     constructor(...args){
//         super(...args);
//     }
//     zhangsan(){}
// }
// const i = new myNum(1);
// i.zhangsan();

// function Computer() {}
// const c = new Computer();
// // console.log(Object.getPrototypeOf(c) === c.__proto__);
// // console.log(c instanceof Computer);
// // console.log(c instanceof Array);
// // console.log([] instanceof Array);

// console.log(Computer.prototype.isPrototypeOf(c)); // true
// console.log(Computer.prototype.isPrototypeOf([])); // false
// console.log(Array.prototype.isPrototypeOf([])); // true

const person = {
  arm: 2,
  legs: 2,
  walk() {
    console.log("walking");
  },
};

const john = Object.create(person, {
  name: {
    value: "John",
    enumerable: true,
  },
  age: {
    value: 18,
    enumerable: true,
  },
});
console.log(john.hasOwnProperty("name")); // true
console.log(john.hasOwnProperty("arms")); // false
