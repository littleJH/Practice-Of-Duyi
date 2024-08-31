/**
 * 替换当前文件夹下所有 .md 文件中所有 <img /> 标签为 Markdown 语法中的 ![]() 格式
 * 
 */

const fs = require('fs');
const path = require('path');

const mode = process.argv[2];
if (!mode) {
  console.log('请输入参数，1为替换图片格式，2为替换图片链接')
  return
}

// Function to replace <img /> tags with ![]() format
function replaceImgTags(content) {
  return content.replace(/<img\s+[^>]*src="([^"]+)"[^>]*>/gi, (match, src) => {
    // Extract alt text if available
    const altMatch = match.match(/alt="([^"]*)"/i);
    const altText = altMatch ? altMatch[1] : '';
    return `![${altText}](${src})`;
  });
}

function replaceImageLink(content, jsonFilePath) {
  // 定义正则表达式，用于匹配图片链接的格式
  const regex = /!\[.*?\]\((.*?)\)/g;



  // 使用replace方法替换匹配的图片链接为新链接
  const replacedString = content.replace(regex, (match, url) => {
    let newLink

    const json = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    for (const key in json) {
      if (Object.prototype.hasOwnProperty.call(json, key)) {
        if (json[key] === match) {
          newLink = json[key]
        }
      }
    }
    return `![${path.basename(newLink)}](${newLink})`;
  });

  return replacedString;
}

// Function to process files in the directory
function processDirectory(dir, jsonFilePath) {
  fs.readdir(dir, (err, files) => {
    if (err) {
      console.error(`Error reading directory: ${err}`);
      return;
    }

    files.forEach(file => {
      const filePath = path.join(dir, file);

      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error(`Error getting stats of file: ${err}`);
          return;
        }

        if (stats.isDirectory()) {
          // Recursively process subdirectories
          processDirectory(filePath);
        } else if (path.extname(file) === '.md' || path.extname(file) === '.mdx') {
          // Process markdown files
          fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
              console.error(`Error reading file: ${err}`);
              return;
            }

            let updatedContent
            switch (mode) {
              case "1":
                updatedContent = replaceImgTags(data)
                break;
              case "2":
                updatedContent = replaceImageLink(data, jsonFilePath)
                break;
              default:
                console.log('请输入正确的jsonFilePath')
                return
            }

            fs.writeFile(filePath, updatedContent, 'utf8', err => {
              if (err) {
                console.error(`Error writing file: ${err}`);
                return;
              }

              console.log(`Processed file: ${filePath}`);
            });
          });
        }
      });
    });
  });
}


if (mode == "2") {
  const jsonFilePath = process.argv[3];
  if (!jsonFilePath) {
    console.log('请输入新旧链接的json文件路径')
    return
  }
}


// Start processing the current directory
processDirectory(process.cwd(), jsonFilePath);
