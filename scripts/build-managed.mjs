// 跨平台建置命令，避免 Windows 使用者需要另裝環境變數工具。
import { execFileSync } from 'node:child_process'
execFileSync(process.execPath,['scripts/check-project-data.mjs'],{stdio:'inherit'})
await import('./export-portfolio-seed.mjs')
process.env.VITE_PORTFOLIO_MODE=process.argv.includes('--static')?'static':'managed'
const { build }=await import('vite')
const index=process.argv.indexOf('--outDir')
await build(index>=0 ? {build:{outDir:process.argv[index+1]}} : {})
