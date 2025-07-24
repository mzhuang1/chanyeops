import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import os from "os";
import path from "path";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from outputs directory for generated reports and charts
app.use("/download", express.static(path.join(process.cwd(), "outputs")));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  const nodeEnv = process.env.NODE_ENV || "development";
  if (nodeEnv === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Configure port and host for production deployment
  const port = parseInt(process.env.PORT || "5000", 10);
  const host = "0.0.0.0"; // Always bind to all interfaces for production compatibility
  
  // Graceful shutdown handling
  process.on('SIGINT', () => {
    console.log('\n正在关闭服务器... / Shutting down server...');
    server.close(() => {
      console.log('服务器已停止 / Server stopped');
      process.exit(0);
    });
  });

  process.on('SIGTERM', () => {
    console.log('\n收到终止信号，正在关闭服务器... / Received termination signal, shutting down server...');
    server.close(() => {
      console.log('服务器已停止 / Server stopped');
      process.exit(0);
    });
  });

  server.listen(port, host, () => {
    log(`serving on port ${port}`);
    if (nodeEnv === "development") {
      console.log(`\n🚀 应用已启动 / Application started:`);
      console.log(`   本地访问 / Local: http://localhost:${port}`);
      const networkInterfaces = os.networkInterfaces();
      const networkAddress = Object.values(networkInterfaces)
        .flat()
        .find(iface => iface && !iface.internal && iface.family === 'IPv4')?.address || 'localhost';
      console.log(`   网络访问 / Network: http://${networkAddress}:${port}`);
      console.log(`\n💡 按 Ctrl+C 停止服务器 / Press Ctrl+C to stop the server\n`);
    } else {
      console.log(`🚀 产业集群智能体系统已启动 / Industrial Cluster AI System started on port ${port}`);
      console.log(`环境 / Environment: ${nodeEnv}`);
    }
  });
})();
