# 颖响力知识库网站

静态网站源码仓库，用于构建并发布 `颖响力知识库` 到 GitHub Pages。

公开访问地址：

- GitHub Pages: `https://ziqiguo02-prog.github.io/main/`

本地开发：

```bash
npm run build
npm run serve
```

后台启动：

```bash
npm run serve:bg
```

常用管理命令：

```bash
npm run serve:status
npm run serve:stop
```

发布方式：

- GitHub Pages 发布源使用 `main` 分支下的 `docs/` 目录。
- 发布前先运行 `npm run build`，再将 `dist/` 内容同步到 `docs/`。
