import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import App from "../src/App.jsx";
import { PAGE_ROUTES } from "../src/utils/index.js";

const routes = Object.values(PAGE_ROUTES);

let failed = 0;
for (const route of routes) {
  try {
    const html = renderToString(
      React.createElement(StaticRouter, { location: route }, React.createElement(App))
    );
    if (!html || html.length < 100) {
      console.log(`EMPTY  ${route}`);
      failed += 1;
    } else {
      console.log(`OK     ${route} (${html.length} chars)`);
    }
  } catch (e) {
    failed += 1;
    console.log(`FAIL   ${route} -> ${e.message}`);
  }
}

console.log(failed === 0 ? "\nALL ROUTES RENDER OK" : `\n${failed} ROUTE(S) FAILED`);
