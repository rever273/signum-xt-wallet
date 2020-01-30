const pkg = require("../package.json");

module.exports = {
  manifest_version: 2,
  name: "Thanos Wallet - Tezos Glove",
  version: pkg.version,

  icons: {
    "16": "misc/icon-16.png",
    "19": "misc/icon-19.png",
    "38": "misc/icon-38.png",
    "128": "misc/icon-128.png"
  },

  description: "",
  homepage_url: "https://github.com/madfish-solutions/thanos",
  short_name: "Thanos Wallet",

  permissions: [
    "http://*/*",
    "https://*/*",
    "activeTab",
    "storage",
    "unlimitedStorage",
    "clipboardWrite"
    // "webRequest",
    // "<all_urls>"
  ],
  content_security_policy: "script-src 'self' 'unsafe-eval'; object-src 'self'",

  "__chrome|firefox__author": "abhijithvijayan",
  __opera__developer: {
    name: "abhijithvijayan"
  },

  __firefox__applications: {
    gecko: { id: "{754FB1AD-CC3B-4856-B6A0-7786F8CA9D17}" }
  },

  __chrome__minimum_chrome_version: "49",
  __opera__minimum_opera_version: "36",

  default_locale: "en",

  browser_action: {
    default_popup: "popup.html",
    default_icon: {
      "16": "misc/icon-16.png",
      "19": "misc/icon-19.png",
      "38": "misc/icon-38.png",
      "128": "misc/icon-128.png"
    },
    default_title: "Thanos Wallet",
    "__chrome|opera__chrome_style": false,
    __firefox__browser_style: false
  },

  "__chrome|opera__options_page": "options.html",

  options_ui: {
    page: "options.html",
    open_in_tab: true,
    __chrome__chrome_style: false
  },

  background: {
    scripts: ["scripts/background.js"],
    "__chrome|opera__persistent": false
  }

  // content_scripts: [
  //   {
  //     matches: ["http://*/*", "https://*/*"],
  //     js: ["js/contentScript.bundle.js"]
  //   }
  // ]
};
