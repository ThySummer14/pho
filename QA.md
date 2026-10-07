# Latest revision verification

后续多曲目版：93/93 Node 测试通过，三个 MP3 与 REAPER WAV 前 20 秒解码对齐为 0 样本偏移。真实浏览器与听感仍未验证；下方早期记录只对应原始单曲版本，不代表本轮 UI 已验证。

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

## 后续迭代 3：原创曲库、原版音乐与独立场景

- 63/63 测试通过。每个新节点都在获准最终乐谱中找到匹配的声部、时间与音高；三谱总数/长度/间隔序列都不同。
- 每曲在 75/100/115% 的事件时钟模拟中可全连；原速 master 分段采样偏移、取消加载防复活、长曲成绩隔离和新场景有限几何均测试通过。
- 三首实际 REAPER MP3 已打包。正常原速使用 AudioBufferSourceNode；它与判定共享 AudioContext，不另设媒体时钟。原速不会触发练习合成器。
- 非原速用乐谱合成练习版，界面明确标注。100 ms 检查、350 ms 前瞻，避免一次排程全部长曲声源；长时间线程阻塞跳过过期音符，不瞬间补播成噪声。
- FFmpeg 将最终 MP3 和最终 REAPER WAV 前 20 秒解码为 8 kHz 单声道，±100 ms 范围互相关峰值均为 0 样本；相关系数均 >0.99998。见 audio-alignment.json。未覆盖整曲每一音的人耳对齐、浏览器 MP3 解码差异、物理设备延迟。
- 云浏览器 localhost 拒绝及 Chromium 沙箱阻塞未解决，因此不宣称真实浏览器试玩通过，也没有本轮截图。

## 后续迭代 4：加载竞争与失效恢复

- 67/67 串行 Node 测试通过，测试并发固定为 1，减轻共享机器负担。
- 新选曲会取代正在加载的旧选曲；点回当前曲可取消待加载曲，失败后保持原曲可用。
- 歌曲加载时停用开始/暖身按钮；音频加载显示文字提示。取消旧解码后启动的新演奏不会被旧请求覆盖或停止。
- master 请求失败和长度不符均在进入游戏前停止，不悄悄切换到简化音色；重试可正常启动。
- 解码缓存只保留一首原版，避免三首长音乐的 PCM 同时常驻。
- UI 实机检查依然受同一环境阻塞，67 项并不替代浏览器试玩。

## 后续迭代 5：触屏加载退出与读谱提示（2026-10-06）

- 73/73 串行 Node 测试通过，语法与 diff 空白检查通过。
- 音乐/校准启动等待时显示可点击的“取消加载”，不再要求触屏用户通过 Esc 或设置间接退出；取消后延迟的声音解锁不能复活旧演奏。加载文字在窄屏用独立字号与宽度。
- 下一音提示按谱面声部显示拨弦、长笛、琶音、主旋律或钟声应答；区分半拍、单拍、切分与留白。仍可判定的迟到音按当前 BPM、速度和真实判定窗保留在提示中，不再固定裁掉超过 0.3 拍的音。
- 倒数时隐藏下一音提示，避免与大号倒数叠在一起。以上不更改谱面、判定窗口或计分。
- 当前仍未完成真实浏览器/移动设备试玩。Pages 是否可部署到私有仓库仍需从账户实际设置核实；没有把这些测试等同于上线验证。

## 手机适配（2026-10-06，发布前检查）

- 77/77 串行测试通过。新增完整触点序列验证：down→up→leave→click 只结算一次；拖出、cancel、失去 capture、第二触点和重复 down 不产生额外音符；键盘/辅助点击可用。
- 节奏仍在按下时按原始事件时间戳结算。取消或拖走不追溯撤销已发生的一次命中，也不会在松手时再结算。
- 移除手机首页固定 900px 与游戏固定 600px 高度。首页自然滚动，演奏使用动态视口；增加短竖屏、横屏与安全区规则，放大文字和按钮。
- Canvas 监听实际尺寸变化，避免首页/演奏高度变化后内部位图与 CSS 大小不一致。
- 真实窄窗检查将在 Pages 部署后进行；桌面窄窗不能等同于实体 Android 或触屏设备。此前桌面流程通过不代表本次新增手机布局已完成实机验证。

### 手机版首轮线上检查

Pages run 37411371930 成功后，使用普通 Chromium 窗口缩放/调整尺寸（150% 浏览器缩放，不使用 DeviceToolbar）验证 CSS 视口 360×505、390×505、430×505，以及 844×362 横屏：无横向溢出；首页可滚动；所有可见首页按钮≥44px；设置可滚动并关闭；庭院原版加载、短练、结果滚动、暂停/四拍继续和返回选曲均可操作。Canvas 内部尺寸随 CSS 尺寸/像素倍率正确变化。完整鼠标点击只增加一次空拍。

线上检查发现短屏的紧凑分数规则同时隐藏了音乐版本标签，已补独立布局，确保“REAPER 原版/练习合成版”仍可见。下一次部署后复核。以上为真实浏览器窄窗/鼠标测试，不是实体 Android 触控、安全区硬件或系统字体缩放测试；真实多指/cancel 序列覆盖来自单元测试。

## 纸墨庭院主题（2026-10-06）

- 82/82 串行测试通过；原有 77 项手机/判定/生命周期测试继续通过。
- 仅 Bossa《庭院明信片》启用；测试确认设置往返、切换 Synthwave 与原始曲目后恢复各自风格。
- 主墨色、强调色、辅助文本、精准/接住/漏拍色相对纸色的计算对比度均≥4.5:1；形状/文本继续区分反馈，不只依赖颜色。
- 360×505、390×844、430×800、844×362 的模拟 Canvas 命令检查：坐标有限、save/restore 平衡、背景操作数<370；仅32条固定纸纹，最多12个同时绘制的墨晕，无放射碎片或全屏闪光。
- 减少动态效果时背景在不同时刻完全一致，命中墨晕的位置/形状不扩张，只按原反馈寿命淡出。
- 没有修改任何音乐、谱面、判定引擎或成绩存储规则。运行文件与 Pages 快照将在部署后逐项核对；本主题真实浏览器画面尚待部署后确认。

### 纸墨主题首轮真实浏览器检查

部署 37414878225 成功后，在 500×757 CSS 视口验证选「庭院」后纸色背景/深色轨道、设置浅色控件、原版音乐启动与17秒暖身流程。所有设置按钮仍≥44px，无横向溢出。观察到装饰朱印在该尺寸落到精准率 HUD 后方，因此仅保留首页朱印，游戏时不绘制；新增回归测试后共83项通过。后续部署将复核这项更改。

## Canvas 尺寸回调加固

在真实浏览器反复调整窗口宽度的检查中，再次观察到 Chromium 错误9。没有证据能把原因确定为游戏、扩展或环境资源问题。代码审查发现既有 resize/ResizeObserver 路径即使尺寸不变也重新赋值 canvas.width/height；浏览器会因此清空或重新分配位图。

新增 resizeCanvas 只写入实际改变的整数像素尺寸，保留原有最大2倍DPR与逻辑坐标变换。重复50次相同回调仅发生首次两次尺寸赋值；快速竖横屏往返、500→1100→500窄窗恢复、不同DPR与零尺寸均有回归测试。87项测试通过。这个加固消除一项确定的重复分配，不把它说成已证明的崩溃根因；部署后的普通浏览器恢复测试另行记录。

## 非拖拽对照与练习状态反馈（2026-10-06）

- 普通窗口按钮将 CSS 视口500×757切换到1180×757；正常浏览器200%缩放跨到590×378，再恢复100%到1180×757。每一步设置均可打开/关闭，没有复现快照超时或错误9。键盘窗口恢复未实际缩回500，因此这不是此前原生拖拽路径的完全同条件复现，不能据此宣布原问题修复，也不是实体手机测试。
- 93项串行测试通过。持续HUD反馈区分分段/变速/中断恢复，已有速度信息保留。测试覆盖暂停、四拍倒数、恢复、再次暂停、重开、换曲与本地保存失败。
- recordRun 的纪录资格和成就条件未修改：练习及恢复不更新整曲最佳，16连击成就仍可能解锁并保存。结果文案解释这些规则；失败的本地写入不会被描述为保存成功。
- 新反馈部署后的浏览器布局/实际按钮检查待进行；不将上述CPU测试当作真机测试。

### 练习状态线上检查与横屏补充

部署37430610467的新字节（status2）中，普通浏览器验证分段启动→暂停→恢复的四拍倒数与持续状态、结果页不更新整曲最佳说明，以及再来一次清除恢复状态，均通过。横屏原布局隐藏章节条/顶栏，因此在始终保留的判定/速度行用等长“恢复/变速”替换“暖身”标签；完整曲恢复则显示“中断恢复”。不增加新HUD区域或改变计分。相关生命周期测试覆盖这些词与速度并存。

## 2026-10-07 input-clock resilience

Extracted and tested the audible-clock mapping used by both drawing and input. Missing, zero, stale, malformed or throwing getOutputTimestamp implementations retain the existing calibrated currentTime fallback instead of terminating the frame loop. Delayed input keeps the original event timestamp; legacy epoch timestamps are normalized. No latency estimate is guessed and saved offsets are unchanged. Reference: https://www.w3.org/TR/webaudio/#dom-audiocontext-getoutputtimestamp

Focused settings/pause controls now retain native keyboard activation rather than consuming Space as an accidental note. The hit pad remains a rhythm input. All 97 tests pass, including output-clock faults, timestamp mapping and real app lifecycle. Physical phone/audio latency remains unmeasured.
