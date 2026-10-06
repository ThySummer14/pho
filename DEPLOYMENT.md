# GitHub Pages 发布说明

此分支是main/dist已测试生成快照。

- 来源main：4fde5334baab88fc689ae89966d8c37a289f3367
- 来源dist Git tree：523c846c47148924b5e0eec7a47f350ad7b44844
- 27份运行文件与来源逐字节一致
- 93项串行测试通过；音乐时间轴、判定、纪录资格和成就规则没有改变
- 分段/变速/中断恢复反馈在章节条和紧凑横屏判定行可见；结果解释保存资格及本地写入失败
- status2普通浏览器流程已验证；此快照补横屏短状态词，不增加HUD区域
- Pages来源：gh-pages / (root)

## 后续更新

main不会自动同步此生成分支。从最新测试通过的main/dist Git tree生成发布树，补充.nojekyll、原样LICENSE及本说明。以当前gh-pages为父提交，expected_sha保护快进，禁止强推。确认精确提交部署成功并核对运行文件哈希与实际页面。
