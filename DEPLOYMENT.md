# GitHub Pages 发布说明

此分支为 main/dist 的已测试生成快照，入口在根目录。

- 来源 main：e6f765adcc4acf29875f346c7849852aaec7e908
- 来源 dist Git tree：c44f08fb4596d2b72704c3afb03b833ae271699d
- 27 份运行文件与来源逐字节一致
- 93项串行测试、语法和相对路径检查通过
- 本次仅说明分段/变速/中断恢复状态与结果保存规则；没有改变判定、时间轴、成绩资格或成就条件
- 纸墨及其他曲目风格保留；真实浏览器缩放对照不能替代实体手机测试，原生拖拽异常根因仍未确定
- Pages来源：gh-pages / (root)

## 后续更新

main 不会自动同步本分支。每次从最新已测试 main/dist Git tree 生成，补充 .nojekyll、原样 LICENSE 与本说明。以当前 gh-pages 为父提交，用 expected_sha 快进更新，禁止强推。等待该精确提交的 Pages 部署成功，再核对所有运行文件哈希与页面流程。
