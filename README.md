# electron-custom-protocol-example-local-resource

Electron 允许你通过自定义的方法加载本地文件，例如图片、音频和视频。

## 一、在应用启动前设置

在你的应用完全启动之前，你需要告诉 Electron 你想用一个特别的方式来处理本地文件。这就像是给你的应用设置一个特殊的通行证，允许它以一个安全的方式访问本地文件。

```js
const fs = require("node:fs").promises; // 引入文件系统模块，用于操作文件

// 我们需要注册一个特别的名称（比如"local-resource"）作为我们的“通行证”。
protocol.registerSchemesAsPrivileged([
  {
    scheme: "local-resource",
    privileges: {
      secure: true, // 让 Electron 信任这个方式就像信任网站的 HTTPS 一样
      supportFetchAPI: true, // 允许我们像在网页上那样请求资源
      standard: true, // 让这种方式的网址看起来像普通的网址
      bypassCSP: true, // 允许我们绕过一些安全限制
      stream: true, // 允许我们以流的形式读取文件，这对于大文件很有用
    },
  },
]);
```

## 二、处理你的自定义方式

一旦你的应用准备好了，你需要告诉 Electron 如何通过你的特殊“通行证”加载文件。

```js
const fs = require("node:fs").promises; // 用于异步读取文件

app.whenReady().then(() => {
  // 一个辅助函数，用于处理不同操作系统的文件路径问题
  function convertPath(originalPath) {
    const match = originalPath.match(/^\/([a-zA-Z])\/(.*)$/);
    if (match) {
      // 为 Windows 系统转换路径格式
      return `${match[1]}:/${match[2]}`;
    } else {
      return originalPath; // 其他系统直接使用原始路径
    }
  }

  // 告诉 Electron 如何响应你的特殊方式的请求
  protocol.handle("local-resource", async (request) => {
    const decodedUrl = decodeURIComponent(
      request.url.replace(new RegExp(`^local-resource:/`, "i"), "")
    );

    const fullPath =
      process.platform === "win32" ? convertPath(decodedUrl) : decodedUrl;

    const data = await fs.readFile(fullPath); // 异步读取文件内容
    return new Response(data); // 将文件内容作为响应返回
  });
});
```

## 三、在页面中使用你的自定义方式

最后，当你想在你的应用的界面中显示这些本地文件时，只需要在文件的路径前加上你设置的特殊“通行证”即可。

```html
<!-- 显示一张图片 -->
<img style="width: 100vw" src="local-resource://你的文件路径" />
```

或者，如果你想在 JavaScript 中动态加载：

```js
window.addEventListener("DOMContentLoaded", async () => {
  const imageUrl = "你的文件路径"; // 获取图片的路径
  const el = document.querySelector("#app"); // 找到页面上的某个元素
  el.innerHTML = `<img style="width: 100vw" src="local-resource://${imageUrl}" />`; // 设置元素内容为图片
});
```

通过这些步骤，你可以安全且灵活地在 Electron 应用中加载和显示本地文件。
