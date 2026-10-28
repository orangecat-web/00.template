import test from 'node:test'
import assert from 'node:assert/strict'
import { planImageSize } from '../src/admin/prepare-image.js'
test('照片與長圖依主機像素預算縮小，維持比例且不放大小圖',()=>{
  const limits={maxPixels:5000000}
  for(const [width,height] of [[6000,4000],[4000,6000],[2000,20000],[400,300]]) {
    for(const mode of ['photo','design']) {
      const size=planImageSize(width,height,mode,limits)
      assert.ok(size.width<=width && size.height<=height)
      assert.ok(size.width*size.height<=limits.maxPixels)
      assert.ok(Math.max(size.width,size.height)<=16384)
      assert.ok(Math.abs(size.width/size.height-width/height)<.01)
      if(mode==='photo')assert.ok(Math.max(size.width,size.height)<=2400)
    }
  }
  assert.deepEqual(planImageSize(300,6000,'design',limits),{width:300,height:6000})
})
