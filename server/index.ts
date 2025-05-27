import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Middleware para logging de requisições
app.use((req, res, next) => {
  log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  log(`Headers: ${JSON.stringify(req.headers)}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
  try {
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      log(`Error: ${message}`);
      log(`Stack: ${err.stack}`);

      res.status(status).json({ message });
    });

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const port = 3000;
    server.listen(port, () => {
      log(`Servidor rodando em http://localhost:${port}`);
      log(`Ambiente: ${app.get("env")}`);
    });

    // Tratamento de erros não capturados
    process.on('uncaughtException', (err) => {
      log(`Erro não capturado: ${err.message}`);
      log(`Stack: ${err.stack}`);
    });

    process.on('unhandledRejection', (reason, promise) => {
      log(`Promessa rejeitada não tratada: ${reason}`);
    });

  } catch (error) {
    log(`Erro ao iniciar o servidor: ${error.message}`);
    log(`Stack: ${error.stack}`);
    process.exit(1);
  }
})();
