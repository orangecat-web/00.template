process.env.VITE_PORTFOLIO_MODE='managed'
const { createServer }=await import('vite')
const server=await createServer({server:{open:false,host:'0.0.0.0'}})
await server.listen();server.printUrls()
