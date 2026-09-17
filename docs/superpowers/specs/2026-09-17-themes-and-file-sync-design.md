# 设计文档：新增两个主题 + 导入文件双向同步

日期：2026-09-17
状态：已确认，待编写实现计划

## 背景

「纸墨」是一个纯前端、可离线运行的 Markdown 笔记 PWA（无构建步骤，原生 HTML/CSS/JS +
marked + DOMPurify，本地化以保证离线可用）。数据存放在浏览器 IndexedDB，不经过服务器。

本次要做两件相互独立的事：

1. **新增两个主题**：在现有「纸张 E-Ink」和「手绘蜡笔」之外，增加「复古打字机」与「森系自然」。
2. **导入文件双向同步**：解决「导入网页后，本地 `.md` 文件被修改，网页内那份不会更新」的问题。

两件事分别设计、分别实现，各自独立，互不依赖。

## 已确认的决策

| 决策点 | 结论 |
| --- | --- |
| 新主题方向 | 复古打字机（Typewriter）+ 森系自然（Forest） |
| 字体策略 | 只用系统字体，不内嵌 webfont（保持零依赖与离线承诺） |
| 主题菜单 | 拆成两级：先选风格，再选浅色/深色 |
| 同步范围 | 双向同步（本地→网页 拉取，网页→本地 写回） |
| 目标平台 | 全平台；Chromium 用文件句柄实现真同步，Safari/iOS 降级 |
| 反向关联 | 要做（网页新建的笔记可另存为本地文件并建立关联） |

## 根本约束（必须理解）

网页是沙箱环境，**无法主动监听本地磁盘上某个文件的改动**。所谓「同步」只能由用户动作
触发「重新读取/写入一次文件」。因此本设计不承诺任何后台自动写入，也不承诺无用户交互的
实时感知。

文件句柄（`FileSystemFileHandle`）可通过 `showOpenFilePicker` / `showSaveFilePicker` 获取，
可结构化克隆后存入 IndexedDB，并可跨会话保留。该能力**仅 Chromium 内核支持**
（桌面 Chrome/Edge、安卓 Chrome），**iOS Safari 不支持**。因此全平台方案必须做能力分级。

---

# 第一部分：两个新主题

## 1.1 机制（沿用现有架构）

现有主题由两个属性决定：

- `data-theme`：`light` / `dark`
- `data-style`：`''`（纸张）/ `sketch`（手绘）

主题实现方式为：在 `styles.css` 中定义 CSS 变量（`--bg`、`--paper`、`--ink`、`--accent`、
`--border`、`--shadow-sm`、字体变量等），再用 `[data-style="..."]` 选择器覆盖具体组件的
结构样式（圆角、边框、阴影、装饰）。

新增主题沿用完全相同的机制：

- 新增 `data-style="typewriter"`（复古打字机）
- 新增 `data-style="forest"`（森系自然）

每个新主题都提供浅色与深色两套变量，即最终共有 4 种风格 × 2 种明暗 = 8 种组合。

## 1.2 复古打字机 `typewriter`

**浅色**

- 应用底：泛黄打字纸 `#F6F1E2`
- 内容面：纸白 `#FCF9F0`
- 主文字：墨色 `#2A241C`
- 次级/弱文字：褐灰
- 强调：印章红 `#A8321E`
- 边框：深褐 `#3B3228`

**深色**

- 应用底：旧墨黑 `#16140F`
- 内容面：`#1E1B14`
- 主文字：`#E8E0C8`
- 强调：`#D9705C`

**字体**

- 正文/等宽：`"Courier New", Courier, "American Typewriter", Menlo, monospace`
- 中文回退：`"Songti SC", "STSong", "SimSun", serif`
- UI：系统无衬线

**结构特征**

- 小圆角（2–4px），不使用大圆角
- **双线边框**：`border: 3px double` 用于卡片、面板、对话框、按钮
- 正文等宽呈现，标题增加字距（`letter-spacing`）
- 分隔线用双线，呈现 `***` 的打字机质感
- 标签做成「邮票/印章」样式：直角小方块、细边框、字距放大
- FAB 为双圈圆钮
- 纸面叠加极淡横格纹（`repeating-linear-gradient`）营造打字纸质感

## 1.3 森系自然 `forest`

**浅色**

- 应用底：米绿 `#F1F5EC`
- 内容面：纸白 `#FAFCF6`
- 主文字：`#232F1E`
- 强调：苔绿 `#4C7A3F`
- 边框：`#DCE5D2`

**深色**

- 应用底：夜林 `#111A12`
- 内容面：`#18211A`
- 主文字：`#DCE8D4`
- 强调：`#8FBF7A`

**字体**

- UI：系统无衬线
- 正文：柔和宋体/衬线回退

**结构特征**

- 大圆角（16–20px），柔和圆润
- 多层柔和阴影，不使用硬边偏移阴影
- 笔记卡片左侧 3px 绿色色条
- 标题左侧绿色短竖线
- 分隔线为绿色点线
- 标签为浅绿圆角块
- FAB 使用绿色渐变

## 1.4 主题菜单改为两级

当前 `showThemePicker()` 平铺 4 项。改为两级：

1. 第一级：选择**风格**——纸张 / 手绘 / 打字机 / 森系（当前风格带勾选）
2. 第二级：选择**明暗**——浅色 / 深色（当前明暗带勾选）

复用现有 `showSheet(title, items)` 组件即可，无需新 UI 组件。

右上角月亮按钮行为不变：在当前风格内切换浅色/深色。

`applyTheme(theme, style)` 需额外按「风格 + 明暗」组合更新
`<meta name="theme-color">`，因为不同风格的纸面色不同，不能只按明暗判断。

---

# 第二部分：导入文件双向同步

## 2.1 数据模型

IndexedDB 版本由 **2 升到 3**，新增对象存储 `sources`（`keyPath: 'noteId'`）。

`source` 记录结构：

```
{
  noteId:       string,   // 关联的笔记 id
  name:         string,   // 来源文件名，如 "report.md"
  lastModified: number,   // 最近一次同步时文件的修改时间
  size:         number,   // 最近一次同步时文件的字节数
  contentHash:  string,   // 最近一次同步时文件内容的哈希（用于判断是否变化）
                          // 用轻量字符串哈希（FNV-1a / djb2）即可，无需 crypto.subtle
  syncedAt:     number,   // 最近一次同步时间戳
  handle?:      FileSystemFileHandle  // 仅 Chromium；可结构化克隆
}
```

关键约束：

- `handle` 只存放在 `sources` 中，**不写入笔记对象**，避免污染笔记数据与导出
- JSON 备份时**剔除 `handle`**（无法 JSON 序列化）。恢复备份后仍保留来源文件名等元数据，
  但句柄丢失，需用户重新关联后才能同步
- 笔记对象本身不新增字段

## 2.2 导入流程

`importMD` 改为两条分支：

- **Chromium（支持 `window.showOpenFilePicker`）**：使用 `showOpenFilePicker` 选取文件，
  取得 `FileSystemFileHandle`，读取内容创建笔记，并把句柄写入 `sources`，建立关联
- **Safari/iOS（不支持）**：沿用现有 `<input type="file">`，仅记录 `name`、`lastModified`、
  `size`、`contentHash`，无句柄

两种分支都保持现有的标题提取规则（正文首个 `# 标题` 优先，否则用文件名）。

## 2.3 单向同步（本地 → 网页，全平台可用）

**UI**：编辑器顶部显示「来源条」：`📄 report.md · 已同步` + `🔄 同步` 按钮。
无来源关联的笔记不显示该条。

**Chromium 路径**

1. `handle.queryPermission({ mode: 'readwrite' })`
2. 非 `granted` 则调用 `requestPermission`（点击即用户手势，允许弹权限框）
3. 读取文件，计算 `contentHash`，与 `sources.contentHash` 比对
4. 未变化 → 提示「已是最新」；有变化 → 进入冲突判定

**Safari 路径**

1. 点击「同步」触发 `<input type=file>`
2. 用户选中文件后，按文件名匹配来源
3. 读取内容并比对哈希，后续逻辑同上

**冲突判定与处理**

- **冲突判定**：`hashString(note.content) !== source.contentHash`（网页内容已偏离最近一次同步基线）
  **且**文件内容也变了 → 冲突
  - 不用 `note.updatedAt > source.syncedAt` 判定：自动保存、`closeEditor` 等空保存都会刷新
    `updatedAt`，会误报冲突；`contentHash` 才能准确表达「网页内容相对基线是否真的变了」
  - `syncedAt` 仅作元数据（供启动/批量检测做时间快速筛选），不参与冲突判定
- 冲突时弹窗三选一：
  - **用文件覆盖**（destructive）：以文件内容覆盖笔记，覆盖本地未保存的网页改动
  - **保留网页版**：不动笔记，仅更新 `sources` 元数据（把文件当前状态记为已同步基线）
  - **都保留**：新建一篇副本笔记承载文件内容，原笔记不变
- 不做三路合并（不存储基线正文，避免额外存储开销）

**批量与启动检测**

- 「更多」菜单增加「同步所有来源」
  - Chromium：遍历所有来源，逐个用句柄比对并同步
  - Safari：无法静默读取多个文件，该菜单项隐藏；只能逐篇在来源条上点「同步」手动选择文件
- Chromium 启动时，对权限已为 granted 的句柄静默比对哈希；发现变化则提示
  「N 篇本地文件已更新」并提供一键同步入口
- 权限未授予时不弹窗、不报错，仅在菜单中保留手动入口

## 2.4 写回（网页 → 本地，仅 Chromium）

- 来源条增加 `⬆ 写回` 按钮
- 调用 `handle.createWritable()` 写入 `note.content`（需 `readwrite` 权限）
- 写回前检查文件是否被外部修改（`lastModified` / 哈希与 `sources` 基线不符）→ 先警告再写
- 写回成功后更新 `sources` 的 `lastModified`、`size`、`contentHash`、`syncedAt`
- Safari 无写回能力：按钮隐藏，改用现有「导出为 .md」作为等价手动方案

## 2.5 反向关联（另存为本地文件并关联）

- 编辑器菜单增加「另存为本地文件并关联」
- 使用 `showSaveFilePicker` 新建文件，写入当前笔记内容，取得句柄并存入 `sources`
- 之后该笔记即可使用「同步」与「写回」，双向闭环
- 仅 Chromium 可用；Safari 下隐藏该项

## 2.6 权限与降级原则

- 所有 Chromium 专属能力做能力检测（`'showOpenFilePicker' in window` 等），缺失时
  隐藏或降级，**绝不抛错**
- 句柄权限：`queryPermission` 为 `granted` 时直接读取；否则在用户点击时
  `requestPermission`
- 不做任何后台自动写入；一切写文件操作都必须由用户点击触发
- 读操作失败（权限拒绝、文件被删/移动、用户取消）时给出可读提示，不影响笔记数据

## 2.7 版本与测试

版本号统一升级到 **v13**（三处必须同步）：

- `app.js` 的 `APP_VERSION`
- `sw.js` 的 `CACHE`（`zhimo-notes-v13`）
- `version.json`

测试（Playwright，现有 `scripts/` 下的测试脚本风格）：

- 两级主题切换：校验 `data-style` 与 `data-theme` 属性、`localStorage` 持久化
- 来源条渲染：有来源的笔记显示来源条与按钮
- 同名覆盖流程：mock `<input type=file>` 走 Safari 降级路径，验证同步与冲突弹窗
- 降级测试：在无 `showOpenFilePicker` 的环境下，Chromium 专属按钮不出现且不报错

文件句柄相关逻辑无法在 headless 环境完整测试，依赖能力检测分支的降级测试覆盖。
（句柄路径本身可用假句柄注入 `currentSource.handle` 做有限覆盖：假句柄不可结构化克隆，
无法写入 IndexedDB，但 `syncCurrentSource` 只读 `currentSource`，足以测试同步与权限拒绝分支。）

## 2.8 已知限制

- **共享句柄**：冲突时选「都保留」会把原来源的 `handle` 复制给新笔记，于是两篇笔记指向同一
  本地文件。两篇都可「写回」时即 last-writer-wins，后写者覆盖先写者。当前接受这一行为
  （副本承载的就是该文件的内容，是文件的自然归属），后续如需可在写回前检测另一篇笔记的改动
- **冲突面板的「用本地文件覆盖」是破坏性操作**（会丢弃网页上的未同步改动），已用 `danger`
  样式标注
- 不做三路合并，冲突只能整篇取舍

## 2.9 备份兼容性

- 备份 JSON 增加可选的 `sources` 数组（已剔除 `handle`）
- 旧备份（无 `sources`）恢复后一切照常，只是笔记没有来源关联
- 恢复新备份后，来源文件名等信息保留，句柄需重新关联

## 非目标（本次不做）

- 文件夹级批量同步（授权整个目录扫描 `.md`）
- 三路合并 / 行级 diff 合并
- 后台自动写入本地文件
- 内嵌 webfont
- 云端同步
