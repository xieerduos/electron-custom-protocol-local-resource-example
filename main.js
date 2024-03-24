// Modules to control application life and create native browser window
const { app, BrowserWindow, protocol, ipcMain } = require("electron");
const path = require("node:path");
const fs = require("node:fs").promises;

// 注册自定义协议方案为特权协议。
protocol.registerSchemesAsPrivileged([
  {
    scheme: "local-resource", // 要注册的自定义协议方案。
    privileges: {
      secure: true, // 将自定义协议视为安全的，类似于https。
      supportFetchAPI: true, // 允许在该协议上使用Fetch API。
      standard: true, // 将使用此协议的URL视为标准的HTTP(S)URL。
      bypassCSP: true, // 允许协议绕过内容安全策略（CSP）检查。
      stream: true, // 启用对响应的流支持。
    },
  },
]);

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      webSecurity: true,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile("index.html");

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  function convertPath(originalPath) {
    // 检测路径是否以斜杠开头，且之后是单个字母（盘符）跟着一个冒号
    const match = originalPath.match(/^\/([a-zA-Z])\/(.*)$/);
    if (match) {
      // 如果匹配，重构路径为 Windows 格式
      return `${match[1]}:/${match[2]}`;
    } else {
      // 如果不匹配，返回原始路径
      return originalPath;
    }
  }

  // electron 25.0.0以下版本使用（不包含25）
  // protocol.registerBufferProtocol(
  //   "local-resource",
  //   async (request, callback) => {
  //     const url = request.url.replace(
  //       new RegExp(`^local-resource://`, "i"),
  //       ""
  //     );
  //     let decodedUrl = decodeURIComponent(url);

  //     if (process.platform === "win32") {
  //       decodedUrl = decodedUrl.replace("/", ":/").replace(/\//g, "\\\\");
  //     }
  //     const data = fs.readFileSync(decodedUrl);
  //     return callback({ data });
  //   }
  // );

  // 使用自定义的"local-resource"协议处理请求。
  protocol.handle("local-resource", async (request) => {
    // 解码请求URL，去掉协议部分，以获得原始路径。
    // 这里使用正则表达式将"local-resource:/"替换为空字符串，并解码URL编码。
    const decodedUrl = decodeURIComponent(
      request.url.replace(new RegExp(`^local-resource:/`, "i"), "")
    );

    // 打印解码后的URL，以便调试。
    console.log("decodedUrl", decodedUrl);

    // 根据操作系统平台，可能需要转换路径格式。
    // 如果是Windows平台，调用convertPath方法转换路径；否则，直接使用解码后的URL。
    const fullPath =
      process.platform === "win32" ? convertPath(decodedUrl) : decodedUrl;

    // 打印最终的文件路径，以便调试。
    console.log("fullPath", fullPath);

    // 异步读取文件内容。
    const data = await fs.readFile(fullPath);

    // 将读取的文件内容封装在Response对象中返回。
    // 这允许Electron应用加载和显示来自自定义协议URL的内容。
    return new Response(data);
  });

  ipcMain.handle("get-image-path", () => {
    return path.join(__dirname, "example.jpg");
  });

  createWindow();
  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
