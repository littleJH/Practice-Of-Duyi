<template>
  <div class="container">
    <div class="btns">
      <button @click="prev">prev</button>
      <button @click="next">next</button>
    </div>
    <transition
      :name="`image-${direction}`"
      enter-active-class="image-enter-active"
      leave-active-class="image-leave-active"
    >
      <img class="image" :src="curImage" :key="curIndex" />
    </transition>
  </div>
</template>

<script>
export default {
  data() {
    return {
      images: [
        "https://10.idqqimg.com/eth/ajNVdqHZLLAJib8odhz8Th2Z4Gat0axooYaxANJlaLEwTomre0hx8Y5yib6FxDZxsgiaYG1W2ETbrU/130?tp=webp",
        "https://10.idqqimg.com/eth/ajNVdqHZLLDqYf0PtFibF9JNOnRbAw7DicWPicmfRkQwPeK2mnZ7ZJzZFdsCwCWdcwhEqoVphXiaDHE/130?tp=webp",
        "https://thirdqq.qlogo.cn/g?b=sdk&k=LaERpMuX1ZjWTQmhrhst6Q&s=100&t=0&tp=webp",
        "https://10.idqqimg.com/eth/ajNVdqHZLLDXIjdTYsqbfkxiaibd3lYGEgfiaEwficYfK2ogZDicCxaKibVibGA2Cj2ltgOvCm1tbRs1iac/130?tp=webp",
        "https://thirdqq.qlogo.cn/g?b=sdk&k=pfIficic6WRliaLULZudVI5Tw&s=640&t=1600139160&tp=webp",
      ],
      curIndex: 0,
      direction: "next",
    };
  },
  computed: {
    curImage() {
      return this.images[this.curIndex];
    },
    maxIndex() {
      return this.images.length - 1;
    },
  },
  methods: {
    next() {
      this.curIndex++;
      if (this.curIndex > this.maxIndex) {
        this.curIndex = 0;
      }
      this.direction = "next";
    },
    prev() {
      this.curIndex--;
      if (this.curIndex < 0) {
        this.curIndex = this.maxIndex;
      }
      this.direction = "prev";
    },
  },
};
</script>

<style>
.container {
  text-align: center;
}
.btns button {
  margin: 1em 0.5em;
}
.image {
  position: absolute;
  top: 100px;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  left: 50%;
  margin-left: -100px;
}
.image-next-enter,
.image-prev-leave-to {
  opacity: 0;
  transform: translateX(200px);
}
.image-next-leave-to,
.image-prev-enter {
  opacity: 0;
  transform: translateX(-200px);
}
.image-enter-active,
.image-leave-active {
  transition: 0.5s;
}
</style>

