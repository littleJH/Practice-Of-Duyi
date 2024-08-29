const fs = require('fs')
const path = require('path')

const targetDir = process.argv[2] || '.'
console.log('🚀 ~ targetDir:', targetDir)

const directories = './实战/JS项目实战'

const files = {
  'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${targetDir}</title>
    <link rel="stylesheet" href="./index.css" />
    <script src="./index.js" defer></script>
  </head>
  <body>
    <div class="container"></div>
  </body>
</html>`,

  'index.js': `(function () {

})()`,

  'index.css': `* {
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

.container {
  width: 100vw;
  height: 100vh;
}
`,
}

const dirPath = path.join(directories, targetDir)
if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true })
  console.log(`Directory created: ${dirPath}`)
}

Object.keys(files).forEach((file) => {
  const filePath = path.join(dirPath, file)
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, files[file])
    console.log(`File created: ${filePath}`)
  }
})

console.log(`Project structure created successfully in ${targetDir}.`)
