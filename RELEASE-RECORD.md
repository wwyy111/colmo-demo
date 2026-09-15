# 发布与回退记录

## 代码备份
- 私有备份仓库：https://github.com/wwyy111/colmo-demo
- 远端名：backup；分支：feat/wakeup-strategy-page
- origin 保留为原作者仓库，不向它推送。

## 最新发布（2026-09-15）
- 页面版本：e9b2b8d
- 页面：https://creaitor.cn/COLMO/demo/ai-1/
- 更新范围：仅 ai-1 晨间唤醒；交互一场景呈现及全程声音状态修复。
- 发布前备份：/root/colmo-ai-1-backups/pre-e9b2b8d/ai-1
- 线上 strategy.js SHA-256 与本地一致；冲突语音返回 HTTP 200。
- 已保存本地 Git 版本；本次未同步 GitHub。

## 历史已发布版本
- 版本：bd38e42
- 页面：https://creaitor.cn/COLMO/demo/ai-1/
- 服务器页面目录：/www/wwwroot/creaite.cn/COLMO/demo/ai-1
- 发布前旧版备份：/root/colmo-ai-1-backups/layout-bd38e42/ai-1
- 本次新建 GitHub 私有仓库未重新发布网站。

## 后续操作约定
1. 本地修改、检查并保存 Git 版本。
2. 同步 GitHub 与发布网站分别征求用户确认。
3. 发布前备份准确的页面目录，记录版本及备份路径；仅更新获准的场景。
4. 发布后检查线上页面与素材。
5. 回退前确认目标版本，备份当前线上目录，再恢复指定备份或发布指定 Git 版本；不重置本地工作区，不操作其他场景。
6. 登录凭证不写进仓库。
