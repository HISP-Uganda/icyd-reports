const express = require("express");
var cors = require("cors");

const { createProxyMiddleware } = require("http-proxy-middleware");

let sessionCookie = "";
const onProxyReq = (proxyReq) => {
    if (sessionCookie) {
        proxyReq.setHeader("cookie", sessionCookie);
    }
};
const onProxyRes = (proxyRes) => {
    const proxyCookie = proxyRes.headers["set-cookie"];
    if (proxyCookie) {
        sessionCookie = proxyCookie;
    }
};
// proxy middleware options
const options = {
    // target: "http://ovcnwa.youthaliveuganda.org", // target host
    target: "https://ovcdhis2.idi.co.ug", // target host
    onProxyReq,
    onProxyRes,
    changeOrigin: true, // needed for virtual hosted sites
    auth: undefined,
    logLevel: "info",
};

// create the proxy (without context)
const exampleProxy = createProxyMiddleware(options);

const app = express();
app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use("/", exampleProxy);
app.listen(3002);
