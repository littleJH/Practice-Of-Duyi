import * as path from 'path'
import { defineConfig } from 'rspress/config'
import fileTree from 'rspress-plugin-file-tree'

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  title: '嘉禾的个人网站',
  description: '嘉禾的个人网站',
  icon: '/logo.jpg',
  outDir: path.resolve(__dirname, '../note_build'),
  logo: {
    light: '/logo.jpg',
    dark: '/logo.jpg',
  },
  plugins: [
    fileTree({
      initialExpandDepth: 1,
    }),
  ],
  themeConfig: {
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/littleJH',
      },
    ],
    outlineTitle: '目录',
    prevPageText: '上一页',
    nextPageText: '下一页',
  },
})
