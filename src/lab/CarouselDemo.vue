<script setup>
import HeroCarousel from '../components/HeroCarousel.vue'
import { mediaItems } from '../data/media.js'

const photos = mediaItems.filter((item) => item.type === 'image')
</script>

<template lang="pug">
.carousel-demo
  .carousel-demo-copy
    p.kicker SAME COMPONENT / TWO PLACES
    h3 首頁那組照片，<br>在這裡也能親手操作<span class="period">．</span>
    p 同一個輪播元件讀取圖片資料，左右按鈕與手指滑動會依方向切換；暫停、離開畫面或偏好減少動態時，也會處理自動播放。
  HeroCarousel(:photos="photos")
</template>
