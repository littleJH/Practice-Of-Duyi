const OSS = require('ali-oss')
const path = require("path")
const fs = require('fs')

const targetDir = process.argv[2]
if (!targetDir) {
  console.log('请输入目标文件夹')
  process.exit(1);
}

process.env.OSS_ACCESS_KEY_ID = 'LTAI5tJh5Zdgj86XVxZTm6iG'
process.env.OSS_ACCESS_KEY_SECRET = 'A0CnEYfXAbrJ8wQ9qCiC9EnPkZNtVB'

const client = new OSS({
  // yourregion填写Bucket所在地域。以华东1（杭州）为例，Region填写为oss-cn-hangzhou。
  region: 'oss-cn-shenzhen',
  // 从环境变量中获取访问凭证。运行本代码示例之前，请确保已设置环境变量OSS_ACCESS_KEY_ID和OSS_ACCESS_KEY_SECRET。
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  // 填写Bucket名称。
  bucket: 'jiahe-picbed',
});

// 自定义请求头
const headers = {
  // 指定Object的存储类型。
  'x-oss-storage-class': 'Standard',
  // 指定Object的访问权限。
  'x-oss-object-acl': 'public-read',
  // 通过文件URL访问文件时
  /**
   * 指定Object的展示形式。取值如下：

    Content-Disposition:inline：直接预览文件内容。

    Content-Disposition:attachment：以原文件名的形式下载到浏览器指定路径。

    Content-Disposition:attachment; filename="yourFileName"：以自定义文件名的形式下载到浏览器指定路径。

    yourFileName用于自定义下载后的文件名称，例如example.jpg。
   */
  'Content-Disposition': 'inline"',
  // 指定PutObject操作时是否覆盖同名目标Object。此处设置为true，表示禁止覆盖同名Object。
  'x-oss-forbid-overwrite': 'false',
};

async function put(url) {
  try {
    // 填写OSS文件完整路径和本地文件的完整路径。OSS文件完整路径中不能包含Bucket名称。
    // 如果本地文件的完整路径中未指定本地路径，则默认从示例程序所属项目对应本地路径中上传文件。
    const result = await client.put(`typora-image/${path.basename(url)}`, path.normalize(url)
      // 自定义headers
      , { headers }
    );
    console.log("🚀 ~ put ~ result:", result)

    return result.res.requestUrls
  } catch (e) {
    console.log(e);
  }
}


const jsonFilePath = path.resolve(__dirname, targetDir)

fs.readFile(jsonFilePath, 'utf-8', async (err, data) => {
  if (err) {
    console.error(err);
    return;
  }


  const jsonData = JSON.parse(data);
  console.log("🚀 ~ fs.readFileSync ~ jsonData:", jsonData)

  const urls = {}
  for (const key in jsonData) {
    if (Object.hasOwnProperty.call(jsonData, key)) {
      const requestUrls = await put(jsonData[key])
      urls[key] = requestUrls[0]
    }
  }

  fs.writeFile(path.resolve(__dirname, "uploadResultMap" + '.json'), JSON.stringify(urls), (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log('The file has been saved!');
  })
})


// put();

