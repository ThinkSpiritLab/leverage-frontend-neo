#!/usr/bin/env python3
"""Script to add useHead to all Vue pages missing page titles."""

import re
import os

BASE = '/Users/yuzhe/.openclaw/workspace/projects/leverage-frontend-neo'

def add_use_head_static(filepath, title):
    """Add a static useHead call to a page."""
    with open(filepath, 'r') as f:
        content = f.read()
    
    if 'useHead' in content or 'useSeoMeta' in content:
        print(f'SKIP (already has): {filepath}')
        return False
    
    use_head_code = f"\nuseHead({{ title: '{title}' }})\n"
    
    # Find </script> and insert before it
    pattern = r'(</script>)'
    if re.search(pattern, content):
        new_content = re.sub(pattern, use_head_code + r'\1', content, count=1)
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f'OK static: {filepath} -> {title}')
        return True
    else:
        print(f'ERROR no </script>: {filepath}')
        return False

def add_use_head_computed(filepath, computed_expr, fallback_title):
    """Add a computed useHead call to a page."""
    with open(filepath, 'r') as f:
        content = f.read()
    
    if 'useHead' in content or 'useSeoMeta' in content:
        print(f'SKIP (already has): {filepath}')
        return False
    
    use_head_code = f"\nuseHead(computed(() => ({{ title: {computed_expr} }})))\n"
    
    pattern = r'(</script>)'
    if re.search(pattern, content):
        new_content = re.sub(pattern, use_head_code + r'\1', content, count=1)
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f'OK computed: {filepath}')
        return True
    else:
        print(f'ERROR no </script>: {filepath}')
        return False

count = 0

# ============= nuxt.config.ts: update title + add description =============
nuxt_config = os.path.join(BASE, 'nuxt.config.ts')
with open(nuxt_config, 'r') as f:
    cfg = f.read()

# Update title from 'LevOJ' to 'Leverage OJ' and add description
cfg = cfg.replace("title: 'LevOJ'", "title: 'Leverage OJ'")
if 'description' not in cfg:
    cfg = cfg.replace(
        "{ charset: 'utf-8' },",
        "{ charset: 'utf-8' },\n        { name: 'description', content: '在线评测系统' },"
    )
with open(nuxt_config, 'w') as f:
    f.write(cfg)
print('OK: nuxt.config.ts updated')

# ============= admin layout: add titleTemplate =============
admin_layout = os.path.join(BASE, 'app/layouts/admin.vue')
with open(admin_layout, 'r') as f:
    admin_content = f.read()

if 'useHead' not in admin_content:
    # Find <script setup lang="ts"> and add after it
    admin_content = admin_content.replace(
        '<script setup lang="ts">',
        '<script setup lang="ts">\nuseHead({ titleTemplate: (s) => s ? `${s} — Leverage OJ 管理后台` : \'Leverage OJ 管理后台\' })'
    )
    with open(admin_layout, 'w') as f:
        f.write(admin_content)
    print('OK: admin.vue layout updated')

# ============= Static pages =============
static_pages = [
    ('app/pages/index.vue', 'Leverage OJ'),
    ('app/pages/home.vue', '首页 — Leverage OJ'),
    ('app/pages/download.vue', '下载中心 — Leverage OJ'),
    ('app/pages/login.vue', '登录 — Leverage OJ'),
    ('app/pages/ranklist.vue', '排行榜 — Leverage OJ'),
    ('app/pages/help.vue', '帮助 — Leverage OJ'),
    ('app/pages/user-agreement.vue', '用户协议 — Leverage OJ'),
    ('app/pages/notification.vue', '通知 — Leverage OJ'),
    ('app/pages/problems/index.vue', '题库 — Leverage OJ'),
    ('app/pages/submissions/index.vue', '评测记录 — Leverage OJ'),
    ('app/pages/contests/index.vue', '竞赛列表 — Leverage OJ'),
    ('app/pages/courses/index.vue', '课程列表 — Leverage OJ'),
    ('app/pages/messages/index.vue', '收件箱 — Leverage OJ'),
    ('app/pages/messages/[id].vue', '消息详情 — Leverage OJ'),
    ('app/pages/users/index.vue', '用户列表 — Leverage OJ'),
    ('app/pages/user/edit.vue', '编辑资料 — Leverage OJ'),
    ('app/pages/compete/index.vue', '对战竞技 — Leverage OJ'),
    ('app/pages/compete/room/[id].vue', '对战房间 — Leverage OJ'),
    ('app/pages/compete/gamer/[id].vue', 'Bot 详情 — Leverage OJ'),
    # Admin pages (short title, layout appends suffix)
    ('app/pages/admin/index.vue', '控制台'),
    ('app/pages/admin/task.vue', '任务队列'),
    ('app/pages/admin/setting.vue', '系统设置'),
    ('app/pages/admin/log.vue', '系统日志'),
    ('app/pages/admin/problems/index.vue', '题目管理'),
    ('app/pages/admin/tags/index.vue', '标签管理'),
    ('app/pages/admin/courses/index.vue', '课程管理'),
    ('app/pages/admin/users/index.vue', '用户管理'),
    ('app/pages/admin/submissions/index.vue', '提交记录'),
    ('app/pages/admin/submissions/sus/index.vue', '可疑提交'),
    ('app/pages/admin/rejudge/index.vue', '重测'),
    ('app/pages/admin/rejudge/log.vue', '重测日志'),
    ('app/pages/admin/notifications/index.vue', '通知管理'),
    ('app/pages/admin/contest/index.vue', '竞赛管理'),
]

for rel_path, title in static_pages:
    fp = os.path.join(BASE, rel_path)
    if os.path.exists(fp):
        if add_use_head_static(fp, title):
            count += 1
    else:
        print(f'NOT FOUND: {fp}')

# ============= Dynamic pages =============
# problems/[id].vue
fp = os.path.join(BASE, 'app/pages/problems/[id].vue')
if add_use_head_computed(fp,
    "problem.value?.title ? `${problem.value.title} — Leverage OJ` : '题目 — Leverage OJ'",
    '题目 — Leverage OJ'):
    count += 1

# submissions/[id].vue
fp = os.path.join(BASE, 'app/pages/submissions/[id].vue')
if add_use_head_computed(fp,
    "`提交 #${submissionId.value} — Leverage OJ`",
    '提交 — Leverage OJ'):
    count += 1

# submissions/ce/[id].vue
fp = os.path.join(BASE, 'app/pages/submissions/ce/[id].vue')
if add_use_head_computed(fp,
    "`编译错误 #${submissionId.value} — Leverage OJ`",
    '编译错误 — Leverage OJ'):
    count += 1

# contests/[id].vue
fp = os.path.join(BASE, 'app/pages/contests/[id].vue')
if add_use_head_computed(fp,
    "contest.value?.title ? `${contest.value.title} — Leverage OJ` : '竞赛 — Leverage OJ'",
    '竞赛 — Leverage OJ'):
    count += 1

# contests/[id]/problems/[pid].vue
fp = os.path.join(BASE, 'app/pages/contests/[id]/problems/[pid].vue')
if add_use_head_computed(fp,
    "problem.value?.title ? `${problem.value.title} — Leverage OJ` : '题目 — Leverage OJ'",
    '题目 — Leverage OJ'):
    count += 1

# courses/[id].vue
fp = os.path.join(BASE, 'app/pages/courses/[id].vue')
if add_use_head_computed(fp,
    "course.value?.title ? `${course.value.title} — Leverage OJ` : '课程 — Leverage OJ'",
    '课程 — Leverage OJ'):
    count += 1

# course/[id]/problems/[pid].vue
fp = os.path.join(BASE, 'app/pages/course/[id]/problems/[pid].vue')
if add_use_head_computed(fp,
    "problem.value?.title ? `${problem.value.title} — Leverage OJ` : '题目 — Leverage OJ'",
    '题目 — Leverage OJ'):
    count += 1

# users/[id].vue
fp = os.path.join(BASE, 'app/pages/users/[id].vue')
if add_use_head_computed(fp,
    "user.value?.username ? `${user.value.username} — Leverage OJ` : '用户 — Leverage OJ'",
    '用户 — Leverage OJ'):
    count += 1

# u/[username].vue
fp = os.path.join(BASE, 'app/pages/u/[username].vue')
if add_use_head_static(fp, '用户主页 — Leverage OJ'):
    count += 1

# compete/[id].vue
fp = os.path.join(BASE, 'app/pages/compete/[id].vue')
if add_use_head_computed(fp,
    "game.value?.name ? `${game.value.name} — Leverage OJ` : '游戏 — Leverage OJ'",
    '游戏 — Leverage OJ'):
    count += 1

# compete/matches/[id].vue
fp = os.path.join(BASE, 'app/pages/compete/matches/[id].vue')
if add_use_head_computed(fp,
    "`对战记录 #${matchId.value} — Leverage OJ`",
    '对战记录 — Leverage OJ'):
    count += 1

# admin/problems/[id].vue
fp = os.path.join(BASE, 'app/pages/admin/problems/[id].vue')
if add_use_head_computed(fp,
    "problem.value?.title ? `${problem.value.title}` : '题目编辑'",
    '题目编辑'):
    count += 1

# admin/contests/index.vue
fp = os.path.join(BASE, 'app/pages/admin/contests/index.vue')
if add_use_head_static(fp, '竞赛管理'):
    count += 1

# admin/contests/[id].vue
fp = os.path.join(BASE, 'app/pages/admin/contests/[id].vue')
if add_use_head_computed(fp,
    "contest.value?.title ? `${contest.value.title}` : '竞赛编辑'",
    '竞赛编辑'):
    count += 1

# admin/courses/[id].vue
fp = os.path.join(BASE, 'app/pages/admin/courses/[id].vue')
if add_use_head_static(fp, '课程编辑'):
    count += 1

# admin/user/[id].vue
fp = os.path.join(BASE, 'app/pages/admin/user/[id].vue')
if add_use_head_computed(fp,
    "user.value?.username ? `${user.value.username}` : '用户管理'",
    '用户管理'):
    count += 1

# admin/notifications/[id].vue
fp = os.path.join(BASE, 'app/pages/admin/notifications/[id].vue')
if add_use_head_static(fp, '通知详情'):
    count += 1

# admin/submissions/sus/[hashsum].vue
fp = os.path.join(BASE, 'app/pages/admin/submissions/sus/[hashsum].vue')
if add_use_head_static(fp, '可疑代码'):
    count += 1

# admin/compete/game/[id].vue
fp = os.path.join(BASE, 'app/pages/admin/compete/game/[id].vue')
if add_use_head_computed(fp,
    "game.value?.name ? `${game.value.name}` : '游戏管理'",
    '游戏管理'):
    count += 1

print(f'\nTotal pages updated: {count}')
