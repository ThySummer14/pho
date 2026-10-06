# GitHub Pages 发布说明

这是由主分支的已测试 dist/ 目录生成的发布快照，页面入口 index.html 位于本分支根目录。

- 来源 main 提交：2bbd87f2d938b2b35a4e81cd039b9e6d32eaa0be
- 来源 dist Git tree：8151899c9bdedb48508f80ab8e924a1cfb2d75e6
- 22 份运行文件与上述来源逐字节一致，未改动游戏逻辑
- 发布前：73 项测试、JavaScript 语法、HTML / 模块 / 音乐相对路径检查通过
- 保留来源仓库的 LICENSE 原文；.nojekyll 用于直接托管静态资源
- Pages 发布源：gh-pages / (root)

## 后续更新

本分支是生成快照。只向 main 提交代码不会更新这个发布快照。

1. 在 main 上完成并提交游戏修改，运行 npm test；项目直接提供 dist/，没有额外构建步骤。
2. 记录已测试的 main 提交和 dist Git tree。检查 index.html、模块、曲谱和音乐文件的相对路径与完整性。
3. 从该提交的 dist Git tree 生成新的发布树；仅补充 .nojekyll、来源 LICENSE 原文和更新后的本发布说明。不要把整个仓库根目录误当游戏入口。
4. 创建以当前 gh-pages 提交为父提交的新发布提交，然后快进更新 gh-pages；保留全部历史，不强推、不覆盖并行更改。
5. 等待该发布提交的 GitHub Pages build and deployment 成功，再验证线上入口、选曲、播放和关键按钮。

源代码与游戏开发继续在 main；本分支只维护发布文件。
