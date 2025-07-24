# 产业集群智能体 FastAPI Backend

专业的产业集群分析FastAPI后端服务，集成LangChain、MCP协议和远程文件读取功能。

## 🚀 功能特性

### 核心功能
- **智能体系统**: 基于LangChain的多工具智能体
- **MCP协议支持**: Model Context Protocol文档处理
- **远程文件读取**: 支持多服务器文件访问
- **专业报告生成**: HTML格式的产业分析报告
- **图表生成**: ECharts配置自动生成
- **语义搜索**: 文档内容语义检索

### API服务
- **Chat API** (`/api/chat`): 智能对话和文件分析
- **Agent API** (`/api/agent`): 智能体任务执行
- **MCP API** (`/api/mcp`): 文档处理和知识管理

## 📦 安装和配置

### 1. 环境要求
- Python 3.8+
- OpenAI API Key
- 可选: MCP服务器

### 2. 快速启动
```bash
# 进入FastAPI目录
cd backend_fastapi

# 运行启动脚本(自动安装依赖)
python start_fastapi.py
```

### 3. 手动安装
```bash
# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/macOS
# 或 venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt

# 启动服务器
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. 环境配置
复制 `.env.example` 到 `.env` 并配置您的API密钥:

```bash
cp .env.example .env
# 编辑 .env 文件，填入实际的API密钥和服务器配置
```

## 🔧 配置说明

### 远程服务器配置
在 `services/file_reader.py` 中配置远程服务器:

```python
self.remote_servers = {
    "server1": {
        "base_url": "http://your-server:8080",
        "auth_token": "your_token",
        "username": "your_username", 
        "password": "your_password"
    }
}
```

### MCP服务器配置
设置 `MCP_SERVER_URL` 环境变量指向您的MCP服务器。

## 📚 API文档

### Chat API 示例

```python
# 智能对话
POST /api/chat/
{
    "session_id": "user123",
    "user_input": "分析景德镇陶瓷产业发展现状",
    "context": {}
}

# 文件分析
POST /api/chat/analyze-file
{
    "session_id": "user123", 
    "file_reference": "server1:/data/report.pdf",
    "analysis_type": "comprehensive"
}
```

### Agent API 示例

```python
# 执行智能体任务
POST /api/agent/execute
{
    "user_input": "生成陶瓷产业数据图表",
    "session_id": "user123"
}

# 处理远程文件
POST /api/agent/process-remote-file
{
    "server_name": "server1",
    "file_path": "/data/industry_report.pdf",
    "processing_type": "analysis"
}
```

### MCP API 示例

```python
# MCP查询
POST /api/mcp/query
{
    "query": "景德镇陶瓷产业发展趋势",
    "context": {},
    "session_id": "user123"
}

# 文档处理
POST /api/mcp/documents/process
{
    "document_path": "/path/to/document.pdf",
    "document_type": "pdf"
}
```

## 🛠️ 集成指南

### 与Node.js前端集成

在Node.js后端中调用FastAPI服务:

```javascript
// 调用FastAPI智能体
const response = await fetch('http://localhost:8000/api/agent/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        user_input: "生成产业分析报告",
        session_id: "nodejs_session"
    })
});

const result = await response.json();
```

### 文件读取集成

```javascript
// 读取远程服务器文件
const fileResponse = await fetch('http://localhost:8000/api/agent/process-remote-file', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        server_name: "server1",
        file_path: "/data/analysis.xlsx",
        processing_type: "data_extraction"
    })
});
```

## 📊 服务监控

### 健康检查
- FastAPI: `GET http://localhost:8000/health`
- MCP服务器: `GET http://localhost:8000/api/mcp/health` 
- 远程服务器: `GET http://localhost:8000/api/agent/servers/status`

### 服务状态
```bash
# 检查所有服务状态
curl http://localhost:8000/api/agent/servers/status
```

## 🔒 安全配置

1. **API密钥管理**: 使用环境变量存储敏感信息
2. **服务器认证**: 配置远程服务器的认证令牌
3. **CORS设置**: 根据需要调整跨域设置
4. **文件上传限制**: 配置文件大小和类型限制

## 🚨 故障排除

### 常见问题

1. **依赖安装失败**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt --force-reinstall
   ```

2. **OpenAI API错误**
   - 检查API密钥是否正确
   - 确认账户余额充足

3. **远程服务器连接失败**
   - 检查服务器URL和认证信息
   - 确认网络连接和防火墙设置

4. **MCP服务器不可用**
   - 启动MCP服务器或配置为可选服务
   - 检查MCP_SERVER_URL环境变量

### 日志查看
```bash
# 查看服务器日志
tail -f logs/fastapi.log
```

## 🔄 开发指南

### 添加新的工具
1. 在 `services/` 目录创建新服务
2. 在 `agent/agent_executor.py` 中注册工具
3. 在相应API路由中添加端点

### 扩展文件读取
1. 在 `services/file_reader.py` 中添加新的服务器配置
2. 实现特定的认证和文件格式处理

### MCP协议扩展
1. 在 `services/mcp_client.py` 中添加新的MCP方法
2. 在 `api/mcp_api.py` 中暴露相应的API端点

## 📞 技术支持

如需技术支持或功能建议，请联系开发团队或提交issue。

---

**产业集群智能体 FastAPI Backend v1.0.0**  
*专业的产业分析AI服务平台*