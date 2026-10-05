# 第 2 轮 · 霓虹街机与手感迭代 · 2026-10-05

## 当前验证结果

- `npm test`：42/42。包括原判定与生命周期、三档边界、宽窗口 nearest / 等距选择、防误触（不吞有效补敲或相邻节点）、75 ms 派发余量、catch 分数与逐事件连击、精确 80% 的 A 级边界、分模式纪录、练习 / 恢复隔离、短触点音、静音 Miss、场景减动态，以及聚焦按钮 Enter 和设置取消异步解锁。
- `node --check`：app / engine / music / scene / progress 全通过。项目没有 build 或 lint 命令。
- 本轮备份与 `dist/chart.json` 比较完全相同：仍是原创 117 节点 / 64 秒。判定规则有意改变，默认标准新增接住档，挑战保留原 ±40/90 ms。
- 真实 Chromium 整曲：按真实 Web Audio 输出时钟注入 Space / F 事件，包含刻意的 75 / 125 ms 晚拍。实际 98 精准、10 命中、9 接住、零漏拍 / 空击、117 连击、108600 分，与预期完全一致；四章依次出现，结算 S / Full Combo / New Best，并解锁对应成就。此为软件链路自动化，不是人工全连或实体键盘延迟测试。
- 真实浏览器窄屏输入：鼠标一次点击打击区得 1000 分，无 pointerdown + click 双计分。Esc 暂停、菜单按钮 Enter 正常切换难度而不误开局；难度刷新后保留。
- 音乐 40%、音效 55%、warm 音色、+25 ms 判定偏移、+15 ms 画面微调、减少动态效果刷新后全部保留；音色试听按钮无异常，完成后恢复默认设置。
- 320 / 390 / 768 / 1440 px 视口无横向溢出；人工检查首页、游玩、设置、成就及结算截图。窄屏游玩保留固定焦点，较短屏幕使用较小的最小舞台高度。
- 修复 1280×720 首页底栏遮住校准按钮，以及桌面剩余时间与得分标签重叠；320×800、390×844、768×720、1280×720、1440×1000 的校准入口均无遮挡且与底栏分离。
- 真实浏览器校准：无输入正确拒绝改变偏移；按真实输出时钟注入 16 次稳定 +60 ms 敲击，建议 +60 ms、偏差分散 0 ms，点击采用后实际保存，随后归零。校准画面与文案专门引导听音跟拍。此检查验证计算与流程，不代表真人或设备延迟测量。
- 四段均可直接进入练习，实际验证第 2 / 3 / 4 段正确显示各自章节与场景。
- 暖身无输入：0/32、32 漏拍、零分、无评级、个人最佳仍为“尚未演奏”。分段 / 暂停恢复不会覆盖整曲最佳。
- 浏览器 OfflineAudioContext 实际采样：音乐 peak 0.1299，crisp 触点 0.0757、warm 0.0727、精准（含 16 连击奖励）0.0910、catch（含奖励）0.0874，所有采样有限且低于 1；Miss / stray 判定附加音、音效静音均 peak = RMS = 0。实际按下的空击仍有触点，Miss 没有输入时不额外出声。采样检查不等于物理听感评价。

## 检查产物

`output/iteration-2/` 保存本轮基线、桌面与窄屏截图，以及 full run / audio / mobile / section preview / calibration 检查脚本。完整结果在截图 `result-desktop.png`，音频和窄屏结果在 `audio-check.txt`、`mobile-check.txt`、`finish-mobile-check.txt`，校准与入口布局结果在 `calibration-check.txt`、`final-layout-check.txt`。首次带完整等待的窄屏脚本遭浏览器关闭中断；拆分重新运行后，输入 / 设置与最终无输入结算全部通过。

## 验证边界

调研依据是开发者官方资料，没有冒充其他商业音游的实机体验。当前项目已在真实 Chromium 和窄屏模拟验证；Safari、实体手机、蓝牙输出、真人主观听感与初玩趣味性尚未验证。75 ms 派发余量覆盖短暂的事件处理先后差，不保证任意长的主线程停顿。不同设备仍建议校准。

---

# 本轮迭代验证 · 2026-10-05

本轮在本地 Chromium 验证。以下结果与文末旧版本的云端验证分开记录。

## 已通过

- `npm test`：22/22。保留 15 项基线测试，新增音效分级与同调路由、声源生命周期、场景渐变边界、主触点去重、设置快捷键隔离、连击与重开清理、偏好持久化和解锁声音期间失焦取消的回归检查。
- `node --check dist/app.js`、`dist/music.js`、`dist/scene.js`：全部通过。项目无构建 / lint 配置。
- 与本轮开工备份逐文件比较，`dist/engine.js` 和 `dist/chart.json` 完全相同，117 节点与 ±40/±90 ms 判定窗口未变。
- 真实 Chromium 完整 64 秒：使用真实 AudioContext 和输出时间戳，按帧注入 Space 事件，117/117 精准、零空击、117000 分、全连结算；四个乐段标签依次出现。该检查证明软件链路，不是人工首玩或硬件延迟测试。
- 实际浏览器鼠标点击窄屏打击区：一次点击获得 1000 分，未发生 pointerdown + click 双计分。Esc 暂停、四拍恢复、设置内 R 不重开、原生 Escape 关闭设置均通过。
- 音乐 40%、音效 55%、减少动态效果、偏移 +25 ms 刷新后保留；验证结束后恢复默认音量与零偏移。
- 16 秒练习无输入：0/32、32 漏拍、零分，无虚假成功。
- 320 / 390 / 768 / 1440 px 视口均无横向溢出。人工检查桌面首页、游玩、结算以及 390 px 首页、命中、设置、结算截图。
- 浏览器 OfflineAudioContext 实际渲染完整音乐和各类反馈：所有采样有限且非静音；音乐 peak 0.1299、精准反馈（含 16 连击）peak 0.0999、普通反馈 peak 0.0811、漏拍 peak 0.0177、空击 peak 0.0221；均低于 1。音效设为 0 时 peak / RMS 均为 0。此检查不等于真人听感评价。
- 添加本地图标，消除浏览器 favicon 404。当前页面运行无应用异常。

## 产物与复现

`npm start` 后打开 `http://localhost:4173`。截图和 Playwright 检查脚本位于 `output/playwright/`，音频渲染与窄屏交互结果分别记录在 `audio-check.txt` 和 `mobile-flow.txt`。`output/baseline-dist/` 保留本轮修改前的静态文件，便于没有 Git 的当前工作目录对照。

## 仍需真人验证

Safari、实体触屏设备、蓝牙输出延迟、不同扬声器 / 耳机的主观听感，以及新玩家的节奏学习体验。真实系统后台切换仍未在本轮浏览器自动化中确认；失焦、visibilitychange、音频中断与异步解锁取消由生命周期测试覆盖。

---

# 旧版本验证记录 · 2026-10-05

## Passed: Node tests (15)
- 117 nodes, 32 bars, 64 sec; half-beat grid and ≥250 ms spacing
- Monotonic unique route; segment distance proportional to time
- ±40/±90 ms inclusive timing boundaries
- Positive/negative offset applied exactly once
- Early hits do not move route; late hits accepted within window
- No double settlement; empty hits break combo without consuming next note
- Miss flush, no-input run never full combo
- Deterministic replay and 30/60/144 Hz geometry sampling
- Pause-bar rollback and complete reset
- Practice subset scoring
- Calibration median and unstable sample rejection
- Audio lead onset exactly matches all 117 chart beats; repeat scheduling deterministic

## Passed: simulated app lifecycle (4 additional groups)
- Start and repeated Space suppression, pause rollback, focus loss, retry reset, no-input ending
- Delayed audio unlock and double-start protection
- Audio interruption and visibility change stop scheduled sources
- Calibration cancel, manual signed offset/reset, independent practice result

These tests use DOM/audio mocks, not a real browser or human latency.

## Passed: real authenticated cloud Chromium UI · 2026-10-05
- Authorized existing ChatGPT account and exact basic-profile consent completed; owner-private page loaded
- Start screen and live Canvas track visually inspected and real screenshots saved
- Practice launched and ended with 0/32, 32 misses, no false success
- Actual Space input yielded both “早了 64 ms” (700 points) and “精准” (1000 points)
- Escape pause, resume countdown, current-bar score rollback, R restart to zero
- Settings opening pauses the run; +5 ms slider change and reset verified
- Calibration with no taps safely rejected without saving an offset
- Full 64-second run reached 64/64 seconds and 0/117 with 117 misses, correctly showing practice ended rather than success; all four section labels observed

Real tab creation did not change visibility in this automation surface, so actual browser blur/background pause was not established. Those paths and audio suspension are covered only by the simulated lifecycle tests. No claim is made that sound was physically heard.

Visual fixes after inspection: practice-end section label clamped to its own section, result HUD hidden to avoid text competing with summary, calibration time label corrected to 20 beats / 10 seconds.

## Not verified
Actual browser blur/background interruption, MacBook/Safari input/output latency, Bluetooth, subjective listening quality and new-player learning/fun. Engine sampling tests are not hardware latency tests.

## 后续迭代 1：变速练习

- 上游基线：77c6c591，42/42 Node 测试通过。
- 本轮：49/49 测试通过；覆盖四种速度的正负判定边界、偏移、漏拍、回滚、合成主音排程及音高、暂停/继续/R 重试/返回整曲。
- 回归测试发现段落开始浮点误差可能显示上一章，已把章索引限制在本轮起点之后。
- 浏览器验证进行中；Node 生命周期模拟不等于真实设备试玩。未声称已经听测。

## 后续迭代 2：乐句反馈

- 53/53 Node 测试通过。新增均匀偏晚与早晚波动区分、空拍计数、零输入/少样本、四小节范围重试及独立练习记录测试。
- 每格统计 4 小节；推荐依据为失分比例加受限空拍惩罚，相同则选较早的句子。推荐不改变成绩。
- 真实浏览器验证仍受环境阻塞：云浏览器拒绝 localhost（ERR_BLOCKED_BY_CLIENT）；本地 Chromium 在沙箱内无法创建 socket，升级执行在启动测试之前因 bwrap 挂载错误退出。没有截图、真实浏览器通关或实际听感验证结论。
