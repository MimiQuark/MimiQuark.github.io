# MimiQuark 工程笔记

[![Website](https://img.shields.io/badge/website-online-brightgreen)](https://mimiquark.github.io/)

这是一个采用“个人资料 + 左侧分类栏 + 右侧文章流”布局的静态技术博客。页面不展示求职、学历、联系方式或简历内容，只记录文章、项目归档与工程复盘。

## 页面布局

- 顶部：博客导航、全站搜索和后台入口
- 顶部背景：可从后台配置文字，也可以上传自定义封面图
- 博客资料：头像、昵称、写作标签、简介和真实站点访问量
- 左侧栏：文章分类和写作方向
- 右侧内容流：文章/项目切换、分类筛选、关键词搜索和详情弹窗

桌面预览见 `preview-desktop.png`，移动端预览见 `preview-mobile.png`。

## 后台管理

正式网址：`https://mimiquark.github.io/`

打开 `https://app.pagescms.org/MimiQuark/MimiQuark.github.io/main` 可以编辑：

- 顶部背景文字、博客名称、搜索提示和内容流文案
- 公开昵称、头像、顶部背景图、写作标签和简介
- 总访问量使用的计数空间、计数键和接口失败时的显示值
- 文章分类和写作方向
- 项目背景、技术栈、问题、解决方法和复盘结果
- 文章分类、标题、摘要、阅读量、点赞、评论、收藏和正文

总访问量由 CounterAPI 在每次网站访问时实际累加，不再使用静态截图数字。

内容会保存到 `_data/`。提交后 GitHub Actions 会自动部署到 GitHub Pages。

## 本地预览

在项目目录运行任意静态文件服务器后打开首页。不要直接依赖 `file://`，因为浏览器可能阻止读取 JSON 内容。

## 部署

发布分支为 `main`，GitHub Actions 工作流为 `.github/workflows/pages.yml`。