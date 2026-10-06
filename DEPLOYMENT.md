# GitHub Pages 发布说明

本分支由已测试的 main/dist 生成，入口 index.html 位于根目录。

- 来源 main：7c6aa1a7031bd66dde9dde9311c2dff6b294d973
- 来源 dist Git tree：e03d267e3d20f4b6225c878d2f229889c9b1961c
- 24 份运行文件与来源逐字节一致，包含手机布局与触点序列改进
- 发布前：77 项串行测试、JavaScript 语法与相对路径检查通过
- Pages 来源：gh-pages / (root)
- 首轮真实浏览器检查：360/390/430px 短竖屏与 844×362 横屏，选曲/设置/播放/暂停/继续/结果可操作；不等同于实体 Android 测试
- 此快照补充紧凑布局的音乐版本标签显示

## 后续更新

只提交 main 不会自动更新此生成分支。每次从最新已测试 main 的 dist tree 生成发布树，保留 .nojekyll、来源 LICENSE 原文以及本说明。创建以当前 gh-pages 为父提交的新提交，再用 expected_sha 快进更新，不强推。等待该提交的 Pages 部署成功并验证线上入口与关键流程。不要把仓库根目录当游戏入口。
