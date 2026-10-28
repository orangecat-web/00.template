// 主機上限由 PHP 提供；先在瀏覽器縮小大圖，避免要求使用者調整主機。
export function planImageSize(width, height, mode, limits) {
  const maxSide=mode==='design'?1800:2400
  const scale=Math.min(1,maxSide/width,mode==='photo'?maxSide/height:1,Math.sqrt(limits.maxPixels/(width*height)),16384/Math.max(width,height))
  return {width:Math.max(1,Math.floor(width*scale)),height:Math.max(1,Math.floor(height*scale))}
}
const encode=(canvas,quality)=>new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('瀏覽器無法處理這張圖片，請先另存成 JPEG、PNG 或 WebP。')),'image/webp',quality))
async function decode(file) {
  if(typeof createImageBitmap==='function')return createImageBitmap(file)
  const url=URL.createObjectURL(file), image=new Image()
  try {image.src=url;await image.decode();return {source:image,width:image.naturalWidth,height:image.naturalHeight,close:()=>URL.revokeObjectURL(url)}}
  catch(error){URL.revokeObjectURL(url);throw error}
}
export async function prepareImage(file, mode, limits) {
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('請選擇 JPEG、PNG 或 WebP 圖片。')
  if(file.size>50*1024*1024)throw new Error('原始圖片超過 50MB，請先在本機縮小。')
  if(!(limits?.maxBytes>1024 && limits?.maxPixels>=1))throw new Error('目前主機沒有足夠資源處理圖片，請稍後再試。')
  let image
  try {image=await decode(file)} catch {throw new Error('無法讀取圖片，請先在本機另存後再試。')}
  const canvas=document.createElement('canvas')
  try {
    // 已符合主機限制時保留原檔，由 PHP 完成方向校正與最終 WebP 編碼。
    if(file.size<=limits.maxBytes && image.width*image.height<=limits.maxPixels && Math.max(image.width,image.height)<=Math.min(40000,limits.maxDimension))return {file,changed:false}
    let {width,height}=planImageSize(image.width,image.height,mode,limits)
    for(let attempt=0;attempt<10;attempt++) {
      canvas.width=width;canvas.height=height
      const context=canvas.getContext('2d');if(!context)throw new Error('瀏覽器無法建立圖片畫布。')
      context.drawImage(image.source||image,0,0,width,height)
      for(const quality of mode==='design'?[.88,.82,.76]:[.84,.76,.68]) {
        const blob=await encode(canvas,quality)
        if(blob.size<=Math.floor(limits.maxBytes*.95))return {file:new File([blob],file.name,{type:blob.type}),changed:true}
      }
      width=Math.max(1,Math.floor(width*.8));height=Math.max(1,Math.floor(height*.8))
    }
    throw new Error('這張圖片仍超過主機容量限制，請先分段或縮小後再選擇。')
  } finally {image.close?.();canvas.width=canvas.height=1}
}
