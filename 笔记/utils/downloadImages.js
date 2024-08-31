/**
 * 
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// 获取命令行参数中的文件夹路径
const targetDir = process.argv[2];
if (!targetDir) {
  console.error('请提供要处理的文件夹路径');
  process.exit(1);
}

// 创建图片存储目录
const imageDir = path.resolve(targetDir, '../assets/image');
if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}

// JSON 文件路径
const jsonFilePath = path.resolve(targetDir, '../assets/image/imagePaths.json');
let imagePaths = {};

// 从文件内容中提取图片 URL
function extractImageUrls(content) {
  const regex = /!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/g;
  const urls = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}

// 下载图片，增加重试机制
async function downloadImage(url, dest, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        "headers": {
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "accept-language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
          "cache-control": "no-cache",
          "pragma": "no-cache",
          "priority": "u=0, i",
          "sec-ch-ua": "\"Chromium\";v=\"128\", \"Not;A=Brand\";v=\"24\", \"Google Chrome\";v=\"128\"",
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": "\"Windows\"",
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "none",
          "sec-fetch-user": "?1",
          "upgrade-insecure-requests": "1"
        },
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "GET"
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
      }
      const buffer = await response.buffer();
      fs.writeFileSync(dest, buffer);
      console.log(`Downloaded: ${url} to ${dest}`);
      return true; // 成功后返回 true
    } catch (error) {
      console.error(`Attempt ${attempt} - Error downloading ${url}: ${error.message}`);
      if (attempt === retries) {
        console.error(`Failed to download ${url} after ${retries} attempts`);
        return false; // 达到最大重试次数后返回 false
      }
    }
  }
}

// 更新 JSON 文件
function updateJsonFile() {
  fs.writeFileSync(jsonFilePath, JSON.stringify(imagePaths, null, 2), 'utf8');
  console.log(`Updated image paths in ${jsonFilePath}`);
}

// 处理文件
async function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const urls = extractImageUrls(content);

  for (const url of urls) {
    try {
      const imageName = path.basename(url);
      const localPath = path.join(imageDir, imageName);
      const success = await downloadImage(url, localPath);
      if (success) {
        imagePaths[url] = localPath;
        updateJsonFile(); // 每次成功下载后更新 JSON 文件
      }
    } catch (error) {
      console.error(`Error processing URL ${url}: ${error.message}`);
    }
  }
}

// 处理目录
function processDirectory(dir) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      processDirectory(filePath);
    } else if (['.md', '.mdx'].includes(path.extname(file))) {
      processFile(filePath);
    }
  });
}

// 开始处理指定目录
(async () => {
  try {
    await processDirectory(targetDir);
  } catch (error) {
    console.error(`Error processing directory: ${error.message}`);
  }
})();
