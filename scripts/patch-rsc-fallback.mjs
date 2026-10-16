import fs from "node:fs";

const file = new URL("../node_modules/next/dist/client/components/router-reducer/fetch-server-response.js", import.meta.url);
const source = fs.readFileSync(file, "utf8");
if (source.includes("const pageUrl =")) {
  console.log("rsc html fallback already patched");
  process.exit(0);
}

const open = "async function fetchServerResponse(url, options) {";
const marked = `${open}
    const pageUrl = "" + (url && url.href ? url.href : url);`;
if (!source.includes(open)) {
  console.error("fetchServerResponse not found");
  process.exit(1);
}

const broken = `        return {
            flightData: url.toString(),
            canonicalUrl: undefined,
            couldBeIntercepted: false,
            prerendered: false,
            postponed: false,
            staleTime: -1
        };`;
const fixed = "        return doMpaNavigation(pageUrl);";
if (!source.includes(broken)) {
  console.error("rsc catch fallback not found");
  process.exit(1);
}

const next = source.replace(open, marked).replace(broken, fixed);
fs.writeFileSync(file, next);
console.log("patched rsc fallback to keep the html url");
