# GitHub Pages 发布说明

本分支由已测试的 main/dist 生成，入口 index.html 位于根目录。

- 来源 main：3efa60f79edf29170ac826ef5b41b43c699ab2eb
- 来源 dist Git tree：e2ef2bd93e5f0e58c4482695ffaad06af4961c21
- 24 份运行文件与来源逐字节一致，包含手机布局与触点序列改进
- 发布前：77 项串行测试、JavaScript 语法与相对路径检查通过
- Pages 来源：gh-pages / (root)
- 本次真实窄窗流程检查在部署完成后进行；不等同于实体 Android 测试

## 后续更新

只提交 main 不会自动更新此生成分支。每次从最新已测试 main 的 dist tree 生成发布树，保留 .nojekyll、来源 LICENSE 原文以及本说明。创建以当前 gh-pages 为父提交的新提交，再用 expected_sha 快进更新，不强推。等待该提交的 Pages 部署成功并验证线上入口与关键流程。不要把仓库根目录当游戏入口。
