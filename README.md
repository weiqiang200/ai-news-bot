# AI资讯订阅机器人

从Twitter获取AI相关资讯，每3天翻译发送到QQ邮箱。

## 订阅的账号

| 账号 | 说明 |
|------|------|
| @AnthropicAI | Anthropic官方 |
| @OpenAI | OpenAI官方 |
| @DeepMind | DeepMind官方 |
| @ylecun | Yann LeCun (Meta首席AI科学家) |
| @AndrewYNg | 吴恩达 (AI教育者) |
| @goodfellow_ian | Ian Goodfellow (GAN作者) |
| @demishassabis | Demis Hassabis (DeepMind CEO) |
| @JeffDean | Jeff Dean (Google AI) |
| @drfeifei | 李飞飞 (斯坦福教授) |
| @sama | Sam Altman (OpenAI CEO) |

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，填入你的配置：

```bash
cp .env.example .env
```

编辑 `.env`：

```env
# QQ邮箱配置
QQ_EMAIL=your-email@qq.com
QQ_AUTH_CODE=your-smtp-authorization-code

# 邮件接收者
RECIPIENT_EMAIL=recipient@example.com

# RSSHub (可选：自建实例)
RSSHUB_URL=https://rsshub.app
```

### 3. 获取QQ邮箱SMTP授权码

1. 登录 [QQ邮箱](https://mail.qq.com)
2. 进入 设置 → 账户
3. 开启 SMTP 服务
4. 生成授权码

### 4. 本地运行测试

```bash
npm test
```

## 部署到GitHub Actions

### 1. 创建GitHub仓库

### 2. 添加Secrets

在仓库 Settings → Secrets中添加：

| Secret Name | Description |
|-------------|-------------|
| QQ_EMAIL | 你的QQ邮箱 |
| QQ_AUTH_CODE | QQ邮箱SMTP授权码 |
| RECIPIENT_EMAIL | 邮件接收者 |

### 3. 手动触发测试

在GitHub Actions页面点击 "Run workflow"

## 本地定时运行

如果你想在本地定时运行，可以使用 cron 或 pm2：

```bash
# 使用 pm2
pm2 start src/index.js --name ai-news-bot
pm2 cron restart ai-news-bot "0 0 */3 * *"
```

## 项目结构

```
ai-news-bot/
├── package.json
├── .env.example
├── .github/
│   └── workflows/
│       └── schedule.yml    # GitHub Actions定时任务
└── src/
    ├── index.js            # 主入口
    ├── fetcher.js          # RSS获取
    ├── translator.js       # 翻译模块
    └── mailer.js           # 邮件发送
```

## 技术栈

- **Node.js** - 运行环境
- **rss-parser** - RSS解析
- **axios** - HTTP请求
- **google-translate-api** - 翻译
- **nodemailer** - 邮件发送
- **date-fns** - 日期处理
- **GitHub Actions** - 定时任务

## License

MIT
