# MimiQuark 技术博客

[![Website](https://img.shields.io/badge/website-online-brightgreen)](https://mimiquark.github.io/)

这是一个采用“个人资料 + 左侧数据栏 + 右侧文章流”布局的静态技术博客，不包含个人简历、求职状态、联系方式或工作经历。

## 页面布局

- 顶部：博客导航、全站搜索和后台入口
- 个人信息：头像、昵称、身份标签、访问量、原创、粉丝、关注和简介
- 左侧栏：个人成就、我的专栏、兴趣领域
- 右侧内容流：文章/项目切换、分类筛选、关键词搜索和详情弹窗

桌面预览见 `preview-desktop.png`，移动端预览见 `preview-mobile.png`。

## 后台管理

正式网址：`https://mimiquark.github.io/`

打开 `https://app.pagescms.org/MimiQuark/MimiQuark.github.io/main` 可以编辑：

- 博客名称、搜索提示、文章流与项目流文案
- 公开昵称、头像、顶部背景图、简介、IP 属地、加入时间和身份标签
- 访问量、原创、粉丝、关注等顶部统计
- 个人成就、我的专栏和兴趣领域
- 项目背景、参与角色、技术栈、问题、解决方法和复盘结果
- 文章分类、标题、摘要、阅读量、点赞、评论、收藏和正文

内容会保存到 `_data/`。提交后 GitHub Actions 会自动部署到 GitHub Pages。

## 本地预览

在项目目录运行任意静态文件服务器后打开首页。不要直接依赖 `file://`，因为浏览器可能阻止读取 JSON 内容。

## 部署

发布分支为 `main`，GitHub Actions 工作流为 `.github/workflows/pages.yml`。
