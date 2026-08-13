# CodeBlock-mod.github.io

代码方块（CodeBlock Mod）的官方静态站点，纯 HTML/CSS/JS，可直接用 GitHub Pages 托管。

## 目录结构
```
CodeBlock-mod.github.io/
├── index.html              # 单页站点
├── css/styles.css          # 样式（暗色 redstone 主题）
├── js/main.js              # 终端打字机 / 滚动揭示 / 代码标签（无依赖）
├── assets/
│   ├── images/             # icon.png、code_block.png（复用 mod 自身素材，本地托管）
│   └── downloads/          # codeblock-mod-1.21.11.jar / codeblock-mod-26.2.jar（可直接下载）
└── README.md
```

## 部署到 GitHub Pages
1. 在 GitHub 新建仓库，名称必须是 `CodeBlock-mod.github.io`（账号主页型 Pages）。
   - 若用普通仓库（如 `CodeBlock-mod`），请在仓库 Settings → Pages 里把分支设为 `main`、目录选 `/ (root)`。
2. 把本目录所有文件推送到仓库的 `main` 分支。
3. 稍等 1–2 分钟，访问 `https://codeblock-mod.github.io` 即可。

## 更新下载
重新构建 mod 后，把新 jar 覆盖到 `assets/downloads/` 下对应文件名即可。
当前内置 jar 为 v0.1.0。

## 备注
- 站点内「GitHub」按钮链接为占位 `https://github.com/zhangky/CodeBlock-mod`，请替换成你的真实仓库地址。
- 字体通过 Google Fonts CDN 加载（Outfit / JetBrains Mono），离线时会回退到系统字体。
- ecj 可选附加模组（companion mod）为 JRE 用户提供 Java 编译能力，是独立 mod、单独构建发布；网站下载区的「ecj 编译环境」卡片与之对应。
