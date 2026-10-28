// 把目前已公開的作品轉成首次匯入資料；之後發布不再依賴重建。
import { readFileSync, writeFileSync } from 'node:fs'
import { mergeGithubProjects } from '../src/utils/githubProjects.js'
const read = name => JSON.parse(readFileSync(new URL(`../src/data/${name}.json`, import.meta.url), 'utf8'))
const base = [['web','projects-web'],['graphic','projects-graphic'],['product-photo','projects-product-photo']].flatMap(([category, file]) => read(file).map(p => ({...p, categoryIds:[category], ...(p.externalUrl && !p.externalLabel ? {externalLabel:'查看上線網站'} : {})})))
let featured = 0
const projects = mergeGithubProjects(base, read('github-snapshot').repositories, read('github')).map((p, i) => {
  const source=p.image || p.detailImage || ''; const folder=source.slice(0,source.lastIndexOf('/')+1)
  return {...p, ...(p.gallery ? {gallery:p.gallery.map(item=>({...item,src:item.src.startsWith('/') ? item.src : folder+item.src}))} : {}), featured:!!p.featured && ++featured<=3,sortOrder:i,featuredOrder:i}
})
writeFileSync(new URL('../portfolio-server/seed.json',import.meta.url), JSON.stringify({schema:1, projects},null,2)+'\n')
console.log(`管理後台首次匯入資料：${projects.length} 件作品。`)
