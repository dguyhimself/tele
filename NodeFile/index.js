require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");
const express = require("express");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws"); // <-- NEW: WebSocket client for API connection

const BOT_TOKEN = "8431271299:AAHRIuzUAnAOeC1JHVP7KiyJlExTPhnIODA";

// --- LICENSE KEY ---
// This is the key users must enter to activate the bot's features.
const LICENSE_KEY = "SNIPER-BOT-LICENSE-2025-XYZ783";

// --- FALLBACK COIN NAMES ---
const COIN_NAMES = [
  " AI Gaslighting",
  "%coin",
  "19 theory",
  "67%",
  "676767",
  "AI Doorbell",
  "AZZHHHHH",
  "AlIEN COIN",
  "Alfie Bull Adobe Mascot",
  "Anti-Gay",
  "BANGER TOKEN",
  "BRAINROT INVENTOR",
  "Betty Windows Companion",
  "BiggusDickus ",
  "BitBank",
  "Bitbank",
  "CITYPOP",
  "COCK",
  "Charlie Kirk ",
  "Chio The Cat",
  "Coin Of One Line",
  "Condom Head Cult",
  "Crashout Final Boss",
  "DICK",
  "Debt Stream",
  "Diwali Poop Festival",
  "Dr Pepper",
  "DualDex",
  "Dumpit Dave",
  "EL NEET",
  "EL Risitas",
  "EL TURO",
  "EasyHTMLHost",
  "El Chiuahaha",
  "El Dogositto",
  "El Goat",
  "El Padre",
  "El Retardo",
  "El pwease",
  "Electric Chimera",
  "Elon Money ",
  "Extremum",
  "FREEDOM OF MEME",
  "Fedon",
  "Flip The Peso",
  "Free Republic of Verdis",
  "Frogish",
  "Gay Marriage Destroyer",
  "Golden Penguins",
  "Good Old Days",
  "Goosereum",
  "HELLO",
  "Harambe",
  "ITS LARP RETARDS",
  "Indian PooJeets",
  "Indians Natural Fest",
  "Intersection of AI and crypto",
  "JUAN",
  "JUST BUILD IT.",
  "JUSTADOGGUY",
  "JUSTADOGGUY122",
  "Juan on Juan",
  "Justice For Chris",
  "Justice for  Larry Bushart Jr",
  "Justice for Larry",
  "Justice for Larry Bushart",
  "Justice for Larry Bushart Jr",
  "Kling.Ai",
  "Kokaine feen",
  "Kryme.ai",
  "LOCK IN",
  "La Cabra",
  "Lorem Ipsum Coin",
  "Los Meme Man",
  "MDMA SOL",
  "MILOU",
  "MODRIX 8 Bit Logic",
  "MONTGOMERY SWIZZENBOCHER",
  "MTRXmissions",
  "Market Slow, Send This Taco",
  "Markets dead Send This",
  "Mexican zerebro",
  "Mexification",
  "Mistral AI Studio",
  "NEOX",
  "Neuko AI",
  "Niche Cents",
  "OATS CULT",
  "Onlyfans Girls Index 6900",
  "Orange man",
  "POLY",
  "PROJECT : V",
  "PROMISED STREAMER LIVE",
  "Pablo",
  "Padre",
  "Padrito the Padre",
  "Pawblo Escobark",
  "Payday",
  "PolyDex",
  "Power Coin",
  "Pre Rich",
  "Probably nothing lol",
  "Pumpoween",
  "Pwor Favor",
  "Quantel",
  "READY PLAYER ONE ON IT",
  "RICKROLL",
  "RIP CS2 SKINS",
  "Rango",
  "Recon Labs",
  "Retarded Investment Pumping",
  "Robot dog in Mexico",
  "SLEEP",
  "SNORE",
  "SOLANA2",
  "SPERMS",
  "STUEDENT DEBT",
  "Side EYE emoji",
  "Skyler Crispy",
  "Sol",
  "SolDonalds",
  "Solana Condoms",
  "Solana Finance",
  "Student Debt Coin",
  "TAMM AI Goverment",
  "TIRED",
  "The Brainrot Prophecy",
  "The Illegal Meme",
  "The Life Engine",
  "The Mexican",
  "The Poop Festival",
  "The Prediction",
  "The Predictor",
  "The Reserve",
  "The Solana Prophet",
  "The jeet festival",
  "The poop War",
  "The poop festival",
  "The prediction",
  "This Will Pay Your Student Debt",
  "This will bond",
  "Tired",
  "Tokenized Student Debt",
  "Tuah 67 %",
  "Tuah 67%",
  "Tuah67%",
  "WHY TF IS EVERY COIN A RUG",
  "WILL STANCIL RAPE MACHINE",
  "WONT",
  "WOULDN'T",
  "We have to get over it",
  "Will Stancil Rape Machine",
  "Wind Coin ",
  "YOB",
  "Zcash Dope Shield Agent",
  "ZeroBro",
  "Zzzzzz",
  "breadcoin",
  "bullseusless",
  "casino",
  "covert coin",
  "diecinueve",
  "drip_haus",
  "el farto",
  "el fido",
  "el gato",
  "el pookie",
  "elpepe",
  "frognut",
  "get a loan and buy this coin",
  "goon coin ",
  "is blud einstein",
  "journl.fun",
  "jr.Pepe",
  "justice for Larry Bushart",
  "justice for larry",
  "justice for larry bushart",
  "lets fricking go",
  "minion",
  "mosaic.codes",
  "mtrx.onl",
  "ok gl",
  "oro",
  "paperhands.cc",
  "pixland.fun",
  "rytk ",
  "sex language model",
  "sixseven!",
  "sol",
  "spermsdotrun",
  "squash kid",
  "stackdockdev",
  "student debt coin",
  "sweet",
  "this is going to get crimed",
  "this will never die",
  "tuah67coin",
  "wealthy",
  "x402",
];

const bot = new Telegraf(BOT_TOKEN);
const app = express();
const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, "sessions.json");

// In-memory sessions and intervals
const sessions = {}; // { chatId: session }
const intervals = {}; // for auto sniping and copy trading updates
const scheduledJobs = {}; // schedule timers by job id

// --- NEW: Real-time token queue from API ---
const newTokensQueue = [];

/* ---------- WebSocket API Connection ---------- */
function connectWebSocket() {
  const ws = new WebSocket("wss://pumpportal.fun/api/data");

  ws.on("open", function open() {
    console.log("Connected to PumpPortal WebSocket API.");
    // Subscribe only to new token creations
    const payload = {
      method: "subscribeNewToken",
    };
    ws.send(JSON.stringify(payload));
  });

  ws.on("message", function message(data) {
    try {
      const event = JSON.parse(data);
      // We are only interested in token creation events
      if (event.type === "newToken" && event.data) {
        const { name, symbol, mint } = event.data;
        if (name && symbol && mint) {
          // Add the new, real token to our queue
          newTokensQueue.push({ name, symbol, mint });
          // Keep the queue from growing indefinitely
          if (newTokensQueue.length > 100) {
            newTokensQueue.shift(); // Remove the oldest token
          }
        }
      }
    } catch (e) {
      console.error("Error processing WebSocket message:", e);
    }
  });

  ws.on("error", function error(err) {
    console.error("WebSocket error:", err.message);
  });

  ws.on("close", function close() {
    console.log("WebSocket connection closed. Reconnecting in 5 seconds...");
    setTimeout(connectWebSocket, 5000); // Attempt to reconnect after a delay
  });
}

// Start the WebSocket connection when the bot starts
connectWebSocket();

/* ---------- Persistence ---------- */
function loadSessions() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf8");
      const obj = JSON.parse(raw);
      Object.assign(sessions, obj);
      console.log("Loaded sessions:", Object.keys(obj).length);
    }
  } catch (e) {
    console.error("Failed loading sessions file:", e);
  }
}
function saveSessions() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(sessions, null, 2), "utf8");
  } catch (e) {
    console.error("Failed saving sessions file:", e);
  }
}
loadSessions();

/* ---------- Utilities ---------- */
function defaultSession() {
  const init = 73.2;
  return {
    isLicensed: false,
    wallet: null,
    awaitingTokenAddress: false,
    pendingToken: null,
    running: false,
    startAt: null,
    statusMessageId: null,
    funds: init,
    initialFunds: init,
    fundsHistory: [],
    snipedCount: 0,
    history: [],
    lastBought: null,
    stoppedAt: null,
    settings: {
      snipingSpeed: "normal",
      autoSell: { enabled: false, profitPct: 20, stopLossPct: 10 },
      notificationVolume: "normal",
    },
    // --- NEW: Copy Trading State ---
    copyTrading: {
      enabled: false,
      whaleAddress: null,
      buyAmountMode: "fixed", // 'fixed', 'percent_whale', 'percent_portfolio'
      buyAmountFixed: 20, // USD
      buyAmountPercent: 1, // %
      sellOnWhaleSell: true,
      slippage: 3, // %
      minWhaleTxValue: 500, // Minimum whale buy in USD to trigger a copy
      portfolio: {}, // { 'TOKEN_SYMBOL': { amountUSD: 20, tokenAmount: 123, entryPrice: 0.1, tokenName: 'PepeGrow' } }
      statusMessageId: null,
    },
    awaitingWhaleAddress: false,
    awaitingCopyBuyAmount: false,
    // ---------------------------------
    watchlist: [],
    alerts: [],
    scheduledSnipes: [],
    awaitingWithdrawNetwork: false,
    withdrawNetwork: null,
    awaitingWithdrawCoin: false,
    withdrawCoin: null,
    awaitingWithdrawAddress: false, // <-- MODIFIED: New state for address
    withdrawAddress: null, // <-- MODIFIED: Stores the address
    awaitingWithdrawAmount: false,
    awaitingDepositNetwork: false,
    depositNetwork: null,
    awaitingDepositCoin: false,
    depositCoin: null,
    awaitingDepositAmount: false,
  };
}

// --- FIX ---
// This function ensures that any loaded session has the copyTrading object.
// If not, it adds the default values to prevent crashes.
function ensureCopyTradingDefaults(session) {
  if (!session.copyTrading) {
    session.copyTrading = defaultSession().copyTrading;
  }
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
function formatUSD(n) {
  return `$${Number(n || 0).toFixed(2)}`;
}
function shortAddr(a) {
  if (!a) return "—";
  const s = String(a);
  if (s.length <= 12) return s;
  return s.slice(0, 6) + "…" + s.slice(-4);
}
function progressBar(p, len = 12) {
  p = clamp(p, 0, 1);
  const filled = Math.round(p * len);
  return "▮".repeat(filled) + "▯".repeat(len - filled);
}
function prettyTimeDiff(ms) {
  if (!ms || ms < 1000) return "0s";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}
function nowISO() {
  return new Date().toISOString();
}
function nowReadable() {
  return new Date().toLocaleString();
}
function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function generateFakePrivateKey() {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let key = "";
  for (let i = 0; i < 64; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

function sparkline(values = [], width = 16) {
  if (!values || values.length === 0) return "─".repeat(width);
  const arr = values.slice(-width);
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const blocks = [" ", "▂", "▃", "▄", "▅", "▆", "▇", "█"];
  return arr
    .map((v) => {
      let idx = 0;
      if (max > min) {
        idx = Math.floor(((v - min) / (max - min)) * (blocks.length - 1));
      }
      return blocks[clamp(idx, 0, blocks.length - 1)];
    })
    .join("");
}

function fakeTokenFromAddr(addr) {
  if (!addr) addr = uid("TK");
  const seed = addr.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
  const sym = String(seed).toUpperCase().slice(0, 4);
  const name = COIN_NAMES[Math.floor(Math.random() * COIN_NAMES.length)];
  const price = +(Math.random() * 0.8 + 0.02).toFixed(6);
  return { symbol: sym || "TKN", name: name, price };
}

function applySlippage(amountUSD, slippagePctMax = 3) {
  const slippage = Math.random() * slippagePctMax;
  const direction = Math.random() < 0.5 ? 1 : -1;
  const factor = 1 + (direction * slippage) / 100;
  return {
    factor,
    slippage: slippage.toFixed(2),
    direction: direction === 1 ? "worse" : "better",
  };
}

async function sendLicenseRequiredMessage(ctx) {
  const message = `
*Access Denied: A SnipeX License is Required*

This feature is reserved for licensed users. To unlock the full power of the SnipeX trading suite, please upgrade your plan.

*Key Features You'll Unlock:*
• *Multi-Wallet Management*: Coordinate trades across multiple wallets.
• *Auto & Semi-Auto Snipes*: High-speed, automated execution.
• *Anti-Rug & Security Scan*: Trade with greater confidence.
• *Advanced Sell Strategies*: Set automatic take-profit and stop-loss triggers.
• *Performance Dashboard*: Track your P/L and ROI in real-time.
• *Market Manipulation Suite* (Whale Plan): Strategically build market depth.

*How to Upgrade:*
1.  Visit our official website to view plans.
2.  Contact our team via the link below to purchase.
3.  Paste your license key back in this chat to activate instantly.

*Ready to dominate the market?*

[Choose Your Plan](https://sinpex.kesug.com/#pricing) | [Contact to Purchase](https://t.me/dguyhimself)  `;
  try {
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery("A license is required to use this feature.", {
        show_alert: true,
      });
    }
    await ctx.replyWithMarkdown(message);
  } catch (e) {
    console.error("Failed to send license required message:", e);
  }
}

/* ---------- Keyboards ---------- */
function MAIN_KB() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("💸 Withdraw Funds", "menu_withdraw"),
      Markup.button.callback("💳 Deposit Funds", "menu_deposit"),
    ],
    [
      Markup.button.callback("🎯 Snipe", "menu_snipe"),
      Markup.button.callback("🐋 Copy Trading", "menu_copy_trading"),
    ],
    [
      Markup.button.callback("📊 Performance", "menu_performance"),
      Markup.button.callback("📝 History", "menu_history"),
    ],
    [
      Markup.button.callback("🧪 Market manipulation", "menu_market"),
      Markup.button.callback("⚙ Settings", "menu_settings"),
    ],
    [Markup.button.callback("❓ Help", "menu_help")],
  ]).reply_markup;
}

// --- NEW: Copy Trading Keyboards ---
function COPY_TRADING_KB(s) {
  ensureCopyTradingDefaults(s); // Ensure data exists
  const ct = s.copyTrading;
  const statusLabel = ct.enabled ? "✅ Status: Enabled" : "❌ Status: Disabled";

  return Markup.inlineKeyboard([
    [Markup.button.callback(statusLabel, "ct_toggle_enabled")],
    [
      Markup.button.callback(
        `🐳 Whale: ${shortAddr(ct.whaleAddress) || "Not Set"}`,
        "ct_set_whale_address",
      ),
    ],
    [
      Markup.button.callback("💰 Buy Settings", "ct_menu_buy"),
      Markup.button.callback("📈 Sell Settings", "ct_menu_sell"),
    ],
    [
      Markup.button.callback(
        `- Minimum Buy: ${formatUSD(ct.minWhaleTxValue)}`,
        "ct_set_min_buy",
      ),
    ],
    [Markup.button.callback("⬅ Back", "menu_main")],
  ]).reply_markup;
}

function CT_BUY_KB(s) {
  ensureCopyTradingDefaults(s); // Ensure data exists
  const ct = s.copyTrading;
  let modeLabel = "Not Set";
  if (ct.buyAmountMode === "fixed") {
    modeLabel = `Fixed: ${formatUSD(ct.buyAmountFixed)}`;
  } else if (ct.buyAmountMode === "percent_whale") {
    modeLabel = `% of Whale: ${ct.buyAmountPercent}%`;
  } else if (ct.buyAmountMode === "percent_portfolio") {
    modeLabel = `% of Portfolio: ${ct.buyAmountPercent}%`;
  }

  return Markup.inlineKeyboard([
    [Markup.button.callback(`Mode: ${modeLabel}`, "ct_set_buy_mode")],
    [Markup.button.callback("⬅ Back", "menu_copy_trading")],
  ]).reply_markup;
}

function CT_BUY_MODE_KB() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("💵 Fixed Amount (USD)", "ct_set_buy_mode_fixed")],
    [
      Markup.button.callback(
        "🐋 % of Whale's Buy",
        "ct_set_buy_mode_percent_whale",
      ),
    ],
    [
      Markup.button.callback(
        "💼 % of Your Portfolio",
        "ct_set_buy_mode_percent_portfolio",
      ),
    ],
    [Markup.button.callback("⬅ Back", "ct_menu_buy")],
  ]).reply_markup;
}

function CT_SELL_KB(s) {
  ensureCopyTradingDefaults(s); // Ensure data exists
  const ct = s.copyTrading;
  const sellLabel = ct.sellOnWhaleSell
    ? "✅ Follow Whale Sells"
    : "❌ Ignore Whale Sells";

  return Markup.inlineKeyboard([
    [Markup.button.callback(sellLabel, "ct_toggle_sell_follow")],
    [Markup.button.callback("⬅ Back", "menu_copy_trading")],
  ]).reply_markup;
}
// ------------------------------------

function MARKET_KB() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("💥 Pump a coin", "market_pump")],
    [Markup.button.callback("📈 Wash trading (coming soon...)", "market_wash")],
    [Markup.button.callback("🧩 hype in X (coming soon...)", "market_hype")],
    [Markup.button.callback("⬅ Back", "menu_main")],
  ]).reply_markup;
}

function PUMP_OPTIONS_KB() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(
        "🤝 Pump with multiple wallets",
        "pump_multi_wallets",
      ),
    ],
    [
      Markup.button.callback(
        "⚖️ Fixed pump (per-wallet)",
        "pump_fixed_per_wallet",
      ),
    ],
    [Markup.button.callback("🔁 Scheduled pump", "pump_scheduled")],
    [Markup.button.callback("⬅ Back", "menu_market")],
  ]).reply_markup;
}

function PUMP_CONFIRM_KB() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("▶️ Start", "pump_start_sim")],
    [Markup.button.callback("⏹ Stop", "pump_stop_sim")],
    [Markup.button.callback("⬅ Back", "menu_market")],
  ]).reply_markup;
}

function PUMP_STATUS_KB() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("⏹ Stop", "pump_stop_sim")],
    [Markup.button.callback("⏸ Pause", "pump_pause_sim")],
    [Markup.button.callback("⬅ Back", "menu_market")],
  ]).reply_markup;
}

function SNIPE_KB() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("⚡ Auto Sniper", "snipe_auto"),
      Markup.button.callback("✋ Semi-Auto", "snipe_semi"),
    ],
    [
      Markup.button.callback("⏱ Scheduled Snipes", "menu_scheduled"),
      Markup.button.callback("🔁 Watchlist & Alerts", "menu_watchlist"),
    ],
    [Markup.button.callback("⬅ Back", "menu_main")],
  ]).reply_markup;
}

function AUTO_STATUS_KB() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("⏸ Pause", "auto_pause"),
      Markup.button.callback("⏹ Stop", "auto_stop"),
    ],
    [
      Markup.button.callback("📸 Snapshot", "auto_snapshot"),
      Markup.button.callback("⚙ Controls", "menu_controls"),
    ],
  ]).reply_markup;
}

function BUY_AMOUNTS_KB() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("$10", "buy_10"),
      Markup.button.callback("$20", "buy_20"),
    ],
    [
      Markup.button.callback("$30", "buy_30"),
      Markup.button.callback("$50", "buy_50"),
    ],
    [Markup.button.callback("⬅ Back", "menu_snipe")],
  ]).reply_markup;
}

function POST_BUY_KB() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("💸 Sell", "sell_last"),
      Markup.button.callback("🏷 Set Auto-Sell Rule", "menu_auto_sell"),
    ],
    [Markup.button.callback("⬅ Back", "menu_main")],
  ]).reply_markup;
}

function SETTINGS_KB() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("⚙ Sniping Speed", "menu_speed"),
      Markup.button.callback("🔔 Notifications", "menu_notifications"),
    ],
    [
      Markup.button.callback("📌 Auto-Sell Rules", "menu_auto_sell"),
      Markup.button.callback("🗑 Reset Session", "menu_reset"),
    ],
    [Markup.button.callback("⬅ Back", "menu_main")],
  ]).reply_markup;
}

function WITHDRAW_NETWORK_KB() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("🌐 USDC", "withdraw_net_eth"),
      Markup.button.callback("🔵 BSC", "withdraw_net_bsc"),
    ],
    [
      Markup.button.callback("☀️ Solana", "withdraw_net_solana"),
      Markup.button.callback("⬅ Back", "menu_main"),
    ],
  ]).reply_markup;
}
function WITHDRAW_COIN_KB(network) {
  if (network === "eth") {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback("USDT", "withdraw_coin_usdt"),
        Markup.button.callback("USDC", "withdraw_coin_usdc"),
      ],
      [
        Markup.button.callback("ETH", "withdraw_coin_eth"),
        Markup.button.callback("⬅ Back", "menu_withdraw"),
      ],
    ]).reply_markup;
  } else if (network === "bsc") {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback("BUSD", "withdraw_coin_busd"),
        Markup.button.callback("USDT", "withdraw_coin_usdt"),
      ],
      [
        Markup.button.callback("BNB", "withdraw_coin_bnb"),
        Markup.button.callback("⬅ Back", "menu_withdraw"),
      ],
    ]).reply_markup;
  } else {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback("USDC-SOL", "withdraw_coin_usdcs"),
        Markup.button.callback("SOL", "withdraw_coin_sol"),
      ],
      [Markup.button.callback("⬅ Back", "menu_withdraw")],
    ]).reply_markup;
  }
}
function WITHDRAW_AMOUNTS_KB() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("$10", "withdraw_amt_10"),
      Markup.button.callback("$50", "withdraw_amt_50"),
    ],
    [
      Markup.button.callback("$100", "withdraw_amt_100"),
      Markup.button.callback("Custom", "withdraw_amt_custom"),
    ],
    [Markup.button.callback("⬅ Back", "menu_withdraw")],
  ]).reply_markup;
}
function WITHDRAW_CONFIRM_KB() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("Confirm Withdraw", "withdraw_confirm"),
      Markup.button.callback("Cancel", "withdraw_cancel"),
    ],
  ]).reply_markup;
}

function DEPOSIT_NETWORK_KB() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("💼 Create New Wallet", "deposit_new_wallet")],
    [
      Markup.button.callback("🌐 USDC", "deposit_net_eth"),
      Markup.button.callback("🔵 BSC", "deposit_net_bsc"),
    ],
    [
      Markup.button.callback("☀️ Solana", "deposit_net_solana"),
      Markup.button.callback("⬅ Back", "menu_main"),
    ],
  ]).reply_markup;
}
function DEPOSIT_COIN_KB(network) {
  if (network === "eth") {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback("USDT", "deposit_coin_usdt"),
        Markup.button.callback("USDC", "deposit_coin_usdc"),
      ],
      [
        Markup.button.callback("ETH", "deposit_coin_eth"),
        Markup.button.callback("⬅ Back", "menu_deposit"),
      ],
    ]).reply_markup;
  } else if (network === "bsc") {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback("BUSD", "deposit_coin_busd"),
        Markup.button.callback("USDT", "deposit_coin_usdt"),
      ],
      [
        Markup.button.callback("BNB", "deposit_coin_bnb"),
        Markup.button.callback("⬅ Back", "menu_deposit"),
      ],
    ]).reply_markup;
  } else {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback("USDC-SOL", "deposit_coin_usdcs"),
        Markup.button.callback("SOL", "deposit_coin_sol"),
      ],
      [Markup.button.callback("⬅ Back", "menu_deposit")],
    ]).reply_markup;
  }
}
function DEPOSIT_AMOUNTS_KB() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("$10", "deposit_amt_10"),
      Markup.button.callback("$50", "deposit_amt_50"),
    ],
    [
      Markup.button.callback("$100", "deposit_amt_100"),
      Markup.button.callback("Custom", "deposit_amt_custom"),
    ],
    [Markup.button.callback("⬅ Back", "menu_deposit")],
  ]).reply_markup;
}
function DEPOSIT_CONFIRM_KB() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("Confirm Deposit", "deposit_confirm"),
      Markup.button.callback("Cancel", "deposit_cancel"),
    ],
  ]).reply_markup;
}

/* ---------- Express health ---------- */
app.get("/", (req, res) => res.send("Sniper mock bot running"));
app.listen(PORT, "0.0.0.0", () => console.log(`Server up on ${PORT}`));

/* ---------- Bot handlers ---------- */

bot.start(async (ctx) => {
  const id = String(ctx.chat.id);
  if (!sessions[id]) {
    sessions[id] = defaultSession();
  } else {
    // For existing users, ensure new features have default values
    ensureCopyTradingDefaults(sessions[id]);
  }
  saveSessions();

  const s = sessions[id];
  const welcome = buildWelcomeCard(s);
  await safeReply(ctx, welcome, MAIN_KB());
});

bot.on("text", async (ctx) => {
  const id = String(ctx.chat.id);
  if (!sessions[id]) {
    sessions[id] = defaultSession();
  } else {
    ensureCopyTradingDefaults(sessions[id]);
  }
  const s = sessions[id];
  const text = ctx.message.text.trim();

  if (!s.isLicensed) {
    if (text === LICENSE_KEY) {
      s.isLicensed = true;
      saveSessions();
      await ctx.reply("✅ License activated successfully! Welcome.");
      const welcome = buildWelcomeCard(s);
      await safeReply(ctx, welcome, MAIN_KB());
    } else {
      await sendLicenseRequiredMessage(ctx);
    }
    return;
  }

  // --- NEW: Handle Copy Trading inputs ---
  if (s.awaitingWhaleAddress) {
    s.awaitingWhaleAddress = false;
    // Basic validation for a wallet address
    if (text.length > 30 && text.startsWith("0x")) {
      s.copyTrading.whaleAddress = text;
      await ctx.reply(`✅ Whale address set to: ${shortAddr(text)}`);
      // Return to copy trading menu
      const statusText = buildCopyTradingStatusCard(s);
      await safeReply(ctx, statusText, COPY_TRADING_KB(s));
    } else {
      await ctx.reply(
        "❌ Invalid address format. Please provide a valid wallet address.",
      );
      const statusText = buildCopyTradingStatusCard(s);
      await safeReply(ctx, statusText, COPY_TRADING_KB(s));
    }
    saveSessions();
    return;
  }

  if (s.awaitingCopyBuyAmount) {
    s.awaitingCopyBuyAmount = false;
    const amount = parseFloat(text.replace(/[^0-9.]/g, ""));
    if (!isNaN(amount) && amount > 0) {
      if (s.copyTrading.buyAmountMode === "fixed") {
        s.copyTrading.buyAmountFixed = amount;
        await ctx.reply(`✅ Fixed buy amount set to ${formatUSD(amount)}.`);
      } else {
        s.copyTrading.buyAmountPercent = amount;
        await ctx.reply(`✅ Buy percentage set to ${amount}%.`);
      }
      const menuText = buildCopyTradingBuyMenu(s);
      await safeReply(ctx, menuText, CT_BUY_KB(s));
    } else {
      await ctx.reply("❌ Invalid amount. Please enter a positive number.");
      const menuText = buildCopyTradingBuyMenu(s);
      await safeReply(ctx, menuText, CT_BUY_KB(s));
    }
    saveSessions();
    return;
  }
  // --- End Copy Trading inputs ---

  if (s.awaitingTokenAddress) {
    const token = text;
    s.awaitingTokenAddress = false;
    s.pendingToken = token;
    saveSessions();

    const checkingMsg = await safeSend(
      ctx,
      "🔍 Checking token address — verifying and scanning for safety...",
    );
    setTimeout(async () => {
      const { symbol, name } = fakeTokenFromAddr(token);
      const verified = `✅ Token verified: <code>${shortAddr(token)}</code>\nSymbol: <b>${symbol}</b> (${name})\nChoose purchase amount:`;
      await robustEditOrSend(ctx, checkingMsg, verified, {
        parse_mode: "HTML",
        reply_markup: BUY_AMOUNTS_KB(),
      });
    }, 900);
    return;
  }

  // <-- MODIFIED: Handle withdrawal address input
  if (s.awaitingWithdrawAddress) {
    const address = text;
    // Basic validation for typical address lengths
    if (address.length < 26 || address.length > 44) {
      await ctx.reply(
        "❌ That doesn't look like a valid wallet address. Please try again.",
      );
      return;
    }
    s.awaitingWithdrawAddress = false;
    s.withdrawAddress = address;
    s.awaitingWithdrawAmount = true;
    saveSessions();

    await safeReply(
      ctx,
      `✅ Wallet address set to: <code>${shortAddr(
        address,
      )}</code>\n\nNow, choose a withdrawal amount or type a custom value:`,
      { reply_markup: WITHDRAW_AMOUNTS_KB() },
    );
    return;
  }

  if (s.awaitingWithdrawAmount && ctx.message && ctx.message.text) {
    const raw = text.replace(/[^0-9.]/g, "");
    const amt = Number(raw);
    s.awaitingWithdrawAmount = false;
    if (isNaN(amt) || amt <= 0) {
      await safeReply(ctx, "❌ Invalid amount. Withdraw canceled.", MAIN_KB());
      s.withdrawNetwork = null;
      s.withdrawCoin = null;
      s.withdrawAddress = null;
      s.awaitingWithdrawAddress = false;
      saveSessions();
      return;
    }
    await processWithdraw(ctx, s, amt);
    return;
  }

  if (s.awaitingDepositAmount && ctx.message && ctx.message.text) {
    const raw = text.replace(/[^0-9.]/g, "");
    const amt = Number(raw);
    s.awaitingDepositAmount = false;
    if (isNaN(amt) || amt <= 0) {
      await safeReply(ctx, "❌ Invalid amount. Deposit canceled.", MAIN_KB());
      s.depositNetwork = null;
      s.depositCoin = null;
      saveSessions();
      return;
    }
    await processDeposit(ctx, s, amt);
    return;
  }

  if (s.awaitingPumpToken) {
    const token = text;
    s.awaitingPumpToken = false;
    s.pendingPumpToken = token;
    s.pendingPumpSettings = {
      wallets: 12,
      perWalletUSD: 20,
      mode: s.pump_fixed ? "Fixed per wallet" : "Multi-wallet",
    };
    s.pump_fixed = false;
    saveSessions();

    const { symbol, name } = fakeTokenFromAddr(token);
    const preview = [
      "💥 <b>PUMP PREVIEW</b>",
      "",
      `Token: <code>${shortAddr(token)}</code>  •  <b>${symbol}</b> (${name})`,
      `Mode: <b>${s.pendingPumpSettings.mode}</b>`,
      `Wallets: <b>${s.pendingPumpSettings.wallets}</b>  •  Per-wallet: <b>$${
        s.pendingPumpSettings.perWalletUSD
      }</b>`,
      "",
      `Live status: <i>Not running</i>`,
      "",
      `Press Start to begin the pumping.`,
    ].join("\n");

    await safeReply(ctx, preview, PUMP_CONFIRM_KB());
    return;
  }

  await safeReply(ctx, "Choose an action from the menu:", MAIN_KB());
});

bot.action("menu_main", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  const welcome = buildWelcomeCard(s);
  await safeEditOrReply(ctx, welcome, MAIN_KB());
});

bot.action("menu_withdraw", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  s.awaitingWithdrawNetwork = true;
  s.withdrawNetwork = null;
  s.withdrawCoin = null;
  s.awaitingWithdrawCoin = false;
  s.awaitingWithdrawAmount = false;
  s.awaitingWithdrawAddress = false; // <-- MODIFIED: Reset state
  s.withdrawAddress = null; // <-- MODIFIED: Reset state
  saveSessions();

  await safeEditOrReply(
    ctx,
    "Select network for withdrawal:",
    WITHDRAW_NETWORK_KB(),
  );
});

bot.action("menu_deposit", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  s.awaitingDepositNetwork = true;
  s.depositNetwork = null;
  s.depositCoin = null;
  s.awaitingDepositCoin = false;
  s.awaitingDepositAmount = false;
  saveSessions();

  await safeEditOrReply(
    ctx,
    "You can create a new wallet or select a network to deposit funds to your existing wallet:",
    DEPOSIT_NETWORK_KB(),
  );
});

bot.action("deposit_new_wallet", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  await ctx.answerCbQuery();
  const creatingMsg = await safeEditOrReply(
    ctx,
    "🛠️ Creating new private wallet...",
  );

  setTimeout(async () => {
    const privateKey = generateFakePrivateKey();
    const publicKey = "0x" + uid("wallet") + uid("addr");
    s.wallet = publicKey;
    saveSessions();

    const walletInfo = [
      "✅ <b>New Wallet Created Successfully!</b>",
      "",
      "Please save this information securely. This is the only time your private key will be shown.",
      "",
      "<b>Public Address</b> (for deposits):",
      `<code>${publicKey}</code>`,
      "",
      "<b>Private Key</b> (keep this secret!):",
      `<code>${privateKey}</code>`,
      "",
      "You can now proceed to deposit funds to your new public address using the main menu.",
      "Returning to the main menu...",
    ].join("\n");

    await robustEditOrSend(ctx, creatingMsg, walletInfo, {
      parse_mode: "HTML",
      reply_markup: MAIN_KB(),
    });
  }, 2500);
});

/* Withdraw handlers */
bot.action("withdraw_net_eth", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  s.awaitingWithdrawNetwork = false;
  s.withdrawNetwork = "eth";
  s.awaitingWithdrawCoin = true;
  saveSessions();
  await safeEditOrReply(
    ctx,
    "Network: USDC selected. Choose coin:",
    WITHDRAW_COIN_KB("eth"),
  );
});
bot.action("withdraw_net_bsc", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  s.awaitingWithdrawNetwork = false;
  s.withdrawNetwork = "bsc";
  s.awaitingWithdrawCoin = true;
  saveSessions();
  await safeEditOrReply(
    ctx,
    "Network: BSC selected. Choose coin:",
    WITHDRAW_COIN_KB("bsc"),
  );
});
bot.action("withdraw_net_solana", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  s.awaitingWithdrawNetwork = false;
  s.withdrawNetwork = "sol";
  s.awaitingWithdrawCoin = true;
  saveSessions();
  await safeEditOrReply(
    ctx,
    "Network: Solana selected. Choose coin:",
    WITHDRAW_COIN_KB("sol"),
  );
});

bot.action("withdraw_coin_usdt", (ctx) => withdrawPickCoin(ctx, "USDT"));
bot.action("withdraw_coin_usdc", (ctx) => withdrawPickCoin(ctx, "USDC"));
bot.action("withdraw_coin_eth", (ctx) => withdrawPickCoin(ctx, "ETH"));
bot.action("withdraw_coin_busd", (ctx) => withdrawPickCoin(ctx, "BUSD"));
bot.action("withdraw_coin_bnb", (ctx) => withdrawPickCoin(ctx, "BNB"));
bot.action("withdraw_coin_usdcs", (ctx) => withdrawPickCoin(ctx, "USDC-SOL"));
bot.action("withdraw_coin_sol", (ctx) => withdrawPickCoin(ctx, "SOL"));

async function withdrawPickCoin(ctx, coin) {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  s.withdrawCoin = coin;
  s.awaitingWithdrawCoin = false;
  s.awaitingWithdrawAddress = true; // <-- MODIFIED: Ask for address next
  saveSessions();
  // <-- MODIFIED: Updated prompt message
  await safeEditOrReply(
    ctx,
    `Coin selected: <b>${coin}</b>.\n\nPlease enter the destination wallet address in the chat:`,
  );
}

bot.action("withdraw_amt_10", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);
  await processWithdraw(ctx, s, 10);
});
bot.action("withdraw_amt_50", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);
  await processWithdraw(ctx, s, 50);
});
bot.action("withdraw_amt_100", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);
  await processWithdraw(ctx, s, 100);
});
bot.action("withdraw_amt_custom", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  s.awaitingWithdrawAmount = true;
  saveSessions();
  await safeEditOrReply(
    ctx,
    "Type custom withdraw amount in chat (numbers only):",
  );
});

bot.action("withdraw_confirm", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);
  await ctx.answerCbQuery("Use amount presets or type amount in chat.");
});
bot.action("withdraw_cancel", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  s.withdrawNetwork = null;
  s.withdrawCoin = null;
  s.awaitingWithdrawAmount = false;
  s.withdrawAddress = null; // <-- MODIFIED: Reset state
  s.awaitingWithdrawAddress = false; // <-- MODIFIED: Reset state
  saveSessions();
  await safeEditOrReply(ctx, "Withdraw canceled.", MAIN_KB());
});

async function processWithdraw(ctx, s, amount) {
  // <-- MODIFIED: Check for address
  if (!s.withdrawCoin || !s.withdrawNetwork || !s.withdrawAddress) {
    s.awaitingWithdrawAmount = false;
    s.withdrawCoin = null;
    s.withdrawNetwork = null;
    s.awaitingWithdrawAddress = false;
    s.withdrawAddress = null;
    saveSessions();
    return safeEditOrReply(
      ctx,
      "Withdraw flow incomplete — start again via Withdraw Funds.",
      MAIN_KB(),
    );
  }

  if ((s.funds || 0) < amount) {
    s.awaitingWithdrawAmount = false;
    saveSessions();
    return ctx.answerCbQuery
      ? ctx.answerCbQuery("Insufficient funds.", { show_alert: true })
      : safeReply(ctx, "Insufficient funds.", MAIN_KB());
  }

  const networkFees = { eth: 12.5, bsc: 0.8, sol: 0.5 };
  const feeBase = networkFees[s.withdrawNetwork] || 1.0;
  const randomFee = +(feeBase * (0.6 + Math.random() * 1.8)).toFixed(2);
  const processingTimeSec = 3 + Math.round(Math.random() * 6);

  const delivered = +(amount - randomFee * 0.01 * amount).toFixed(2);
  s.funds = +(s.funds - amount).toFixed(2);
  s.history = s.history || [];
  s.history.push({
    kind: "withdraw",
    value: -amount,
    time: Date.now(),
    meta: {
      coin: s.withdrawCoin,
      network: s.withdrawNetwork,
      fee: randomFee,
      toAddress: s.withdrawAddress, // <-- MODIFIED: Log address
    },
  });
  s.awaitingWithdrawAmount = false;
  const withdrawMeta = {
    coin: s.withdrawCoin,
    network: s.withdrawNetwork,
    fee: randomFee,
    delivered,
    address: s.withdrawAddress, // <-- MODIFIED: Pass address to message
  };

  saveSessions();

  const processingMsg = await safeSend(
    ctx,
    `⏳ Processing withdrawal ${formatUSD(amount)} ${
      withdrawMeta.coin
    } on ${withdrawMeta.network.toUpperCase()} — estimating ${processingTimeSec}s...`,
  );
  setTimeout(async () => {
    const text = [
      "✅ Withdrawal complete",
      `Amount requested: <b>${formatUSD(amount)}</b>`,
      `Destination: <code>${shortAddr(withdrawMeta.address)}</code>`, // <-- MODIFIED: Show address
      `Network: <b>${withdrawMeta.network.toUpperCase()}</b> • Coin: <b>${
        withdrawMeta.coin
      }</b>`,
      `Estimated network fee: <b>${formatUSD(withdrawMeta.fee)}</b>`,
      `Delivered (post-fee estimate): <b>${formatUSD(
        withdrawMeta.delivered,
      )}</b>`,
      `New balance: <b>${formatUSD(s.funds)}</b>`,
      "",
      `<i>Enjoy your profits, waiting for the next round.</i>`,
    ].join("\n");
    try {
      await robustEditOrSend(ctx, processingMsg, text, {
        parse_mode: "HTML",
        reply_markup: MAIN_KB(),
      });
    } catch (e) {
      await safeReply(ctx, text, MAIN_KB());
    }

    s.withdrawNetwork = null;
    s.withdrawCoin = null;
    s.withdrawAddress = null; // <-- MODIFIED: Reset state
    s.awaitingWithdrawAddress = false; // <-- MODIFIED: Reset state
    saveSessions();
  }, processingTimeSec * 1000);
}

/* Deposit handlers */
bot.action("deposit_net_eth", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  s.awaitingDepositNetwork = false;
  s.depositNetwork = "eth";
  s.awaitingDepositCoin = true;
  saveSessions();
  await safeEditOrReply(
    ctx,
    "Network: USDC selected. Choose coin to deposit:",
    DEPOSIT_COIN_KB("eth"),
  );
});
bot.action("deposit_net_bsc", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  s.awaitingDepositNetwork = false;
  s.depositNetwork = "bsc";
  s.awaitingDepositCoin = true;
  saveSessions();
  await safeEditOrReply(
    ctx,
    "Network: BSC selected. Choose coin to deposit:",
    DEPOSIT_COIN_KB("bsc"),
  );
});
bot.action("deposit_net_solana", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  s.awaitingDepositNetwork = false;
  s.depositNetwork = "sol";
  s.awaitingDepositCoin = true;
  saveSessions();
  await safeEditOrReply(
    ctx,
    "Network: Solana selected. Choose coin to deposit:",
    DEPOSIT_COIN_KB("sol"),
  );
});

bot.action("deposit_coin_usdt", (ctx) => depositPickCoin(ctx, "USDT"));
bot.action("deposit_coin_usdc", (ctx) => depositPickCoin(ctx, "USDC"));
bot.action("deposit_coin_eth", (ctx) => depositPickCoin(ctx, "ETH"));
bot.action("deposit_coin_busd", (ctx) => depositPickCoin(ctx, "BUSD"));
bot.action("deposit_coin_bnb", (ctx) => depositPickCoin(ctx, "BNB"));
bot.action("deposit_coin_usdcs", (ctx) => depositPickCoin(ctx, "USDC-SOL"));
bot.action("deposit_coin_sol", (ctx) => depositPickCoin(ctx, "SOL"));

async function depositPickCoin(ctx, coin) {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  s.depositCoin = coin;
  s.awaitingDepositCoin = false;
  s.awaitingDepositAmount = true;
  saveSessions();
  await safeEditOrReply(
    ctx,
    `Coin selected: <b>${coin}</b>\nChoose deposit amount or type a custom value in chat:`,
    DEPOSIT_AMOUNTS_KB(),
  );
}

bot.action("deposit_amt_10", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);
  await processDeposit(ctx, s, 10);
});
bot.action("deposit_amt_50", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);
  await processDeposit(ctx, s, 50);
});
bot.action("deposit_amt_100", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);
  await processDeposit(ctx, s, 100);
});
bot.action("deposit_amt_custom", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  s.awaitingDepositAmount = true;
  saveSessions();
  await safeEditOrReply(
    ctx,
    "Type custom deposit amount in chat (numbers only):",
  );
});

bot.action("deposit_confirm", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);
  await ctx.answerCbQuery("Use amount presets or type amount in chat.");
});
bot.action("deposit_cancel", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  s.depositNetwork = null;
  s.depositCoin = null;
  s.awaitingDepositAmount = false;
  saveSessions();
  await safeEditOrReply(ctx, "Deposit canceled.", MAIN_KB());
});

async function processDeposit(ctx, s, amount) {
  if (!s.depositCoin || !s.depositNetwork) {
    s.awaitingDepositAmount = false;
    s.depositCoin = null;
    s.depositNetwork = null;
    saveSessions();
    return safeEditOrReply(
      ctx,
      "Deposit flow incomplete — start again via Deposit Funds.",
      MAIN_KB(),
    );
  }

  const networkFees = { eth: 1.2, bsc: 0.15, sol: 0.05 };
  const feeBase = networkFees[s.depositNetwork] || 0.5;
  const randomFee = +(feeBase * (0.4 + Math.random() * 1.6)).toFixed(2);
  const processingTimeSec = 2 + Math.round(Math.random() * 5);

  const credited = +(amount - randomFee * 0.01 * amount).toFixed(2);
  s.funds = +(s.funds + credited).toFixed(2);
  s.fundsHistory = s.fundsHistory || [];
  s.fundsHistory.push(s.funds);
  s.history = s.history || [];
  s.history.push({
    kind: "deposit",
    value: +credited,
    time: Date.now(),
    meta: { coin: s.depositCoin, network: s.depositNetwork, fee: randomFee },
  });
  s.awaitingDepositAmount = false;
  const depositMeta = {
    coin: s.depositCoin,
    network: s.depositNetwork,
    fee: randomFee,
    credited,
  };

  saveSessions();

  const processingMsg = await safeSend(
    ctx,
    `⏳ Processing deposit ${formatUSD(amount)} ${
      depositMeta.coin
    } on ${depositMeta.network.toUpperCase()} — estimating ${processingTimeSec}s...`,
  );
  setTimeout(async () => {
    const text = [
      "✅ Deposit complete",
      `Amount sent: <b>${formatUSD(amount)}</b>`,
      `Network: <b>${depositMeta.network.toUpperCase()}</b> • Coin: <b>${
        depositMeta.coin
      }</b>`,
      `Processing fee (est): <b>${formatUSD(depositMeta.fee)}</b>`,
      `Credited (post-fee estimate): <b>${formatUSD(depositMeta.credited)}</b>`,
      `New balance: <b>${formatUSD(s.funds)}</b>`,
      "",
      `<i>Now we can start the game.</i>`,
    ].join("\n");
    try {
      await robustEditOrSend(ctx, processingMsg, text, {
        parse_mode: "HTML",
        reply_markup: MAIN_KB(),
      });
    } catch (e) {
      await safeReply(ctx, text, MAIN_KB());
    }

    s.depositNetwork = null;
    s.depositCoin = null;
    saveSessions();
  }, processingTimeSec * 1000);
}

/* Menu handlers */
bot.action("menu_snipe", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);
  await safeEditOrReply(ctx, "Snipe menu — choose mode:", SNIPE_KB());
});

bot.action("menu_performance", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);
  const text = makePerformanceText(s);
  await safeEditOrReply(ctx, text, MAIN_KB());
});

bot.action("menu_history", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);
  const text = makeHistoryText(s);
  await safeEditOrReply(ctx, text, MAIN_KB());
});

bot.action("menu_settings", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);
  await safeEditOrReply(ctx, "Settings menu:", SETTINGS_KB());
});

bot.action("menu_help", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);
  const helpText = [
    "❓ Help — Quick tips",
    "• Use Deposit / Withdraw for moving funds (network, coin, amount).",
    "• Use Snipe → Auto to run the engine (single editable card).",
    "• Use Semi-Auto to check a token and buy fixed amounts.",
    "• Use Copy Trading for mirroring a whale's trades.",
    "• Use Settings → Auto-Sell to set profit/stop-loss rules (or use /set_profit and /set_stop).",
    "• Using this bot is completely legit under pumpfun/pumpportal terms of service.",
  ].join("\n");
  await safeEditOrReply(ctx, helpText, MAIN_KB());
});

/* ---------- Copy Trading Flow ---------- */

// Main menu for Copy Trading
bot.action("menu_copy_trading", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  ensureCopyTradingDefaults(s);
  const statusText = buildCopyTradingStatusCard(s);
  await safeEditOrReply(ctx, statusText, COPY_TRADING_KB(s));
});

// Toggle the copy trading engine on/off
bot.action("ct_toggle_enabled", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id];
  if (!s || !s.isLicensed) return sendLicenseRequiredMessage(ctx);
  ensureCopyTradingDefaults(s);

  if (!s.copyTrading.whaleAddress) {
    await ctx.answerCbQuery("Please set a whale address first.", {
      show_alert: true,
    });
    return;
  }

  s.copyTrading.enabled = !s.copyTrading.enabled;
  await ctx.answerCbQuery(
    `Copy Trading is now ${s.copyTrading.enabled ? "ENABLED" : "DISABLED"}.`,
  );

  const intervalId = `copy_trading_${id}`;
  if (s.copyTrading.enabled) {
    // Start the simulation
    if (intervals[intervalId]) clearInterval(intervals[intervalId]);
    intervals[intervalId] = setInterval(() => copyTradingInterval(ctx), 5000); // Run every 5 seconds
  } else {
    // Stop the simulation
    if (intervals[intervalId]) {
      clearInterval(intervals[intervalId]);
      delete intervals[intervalId];
    }
  }

  const statusText = buildCopyTradingStatusCard(s);
  await safeEditOrReply(ctx, statusText, COPY_TRADING_KB(s));
  saveSessions();
});

// Prompt user to enter a whale address
bot.action("ct_set_whale_address", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id];
  if (!s || !s.isLicensed) return sendLicenseRequiredMessage(ctx);
  ensureCopyTradingDefaults(s);

  s.awaitingWhaleAddress = true;
  saveSessions();
  await safeEditOrReply(
    ctx,
    "Please paste the wallet address of the whale you want to copy:",
  );
});

// Navigation to Buy/Sell submenus
bot.action("ct_menu_buy", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id];
  if (!s || !s.isLicensed) return sendLicenseRequiredMessage(ctx);
  const text = buildCopyTradingBuyMenu(s);
  await safeEditOrReply(ctx, text, CT_BUY_KB(s));
});

bot.action("ct_menu_sell", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id];
  if (!s || !s.isLicensed) return sendLicenseRequiredMessage(ctx);
  ensureCopyTradingDefaults(s);

  const text = `Current setting: The bot will **${
    s.copyTrading.sellOnWhaleSell ? "automatically sell" : "ignore sells"
  }** when the whale sells a token you hold.`;
  await safeEditOrReply(ctx, text, CT_SELL_KB(s));
});

// Handling buy mode changes
bot.action("ct_set_buy_mode", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id];
  if (!s || !s.isLicensed) return sendLicenseRequiredMessage(ctx);
  await safeEditOrReply(
    ctx,
    "Choose how you want to determine your buy amount:",
    CT_BUY_MODE_KB(),
  );
});

bot.action("ct_set_buy_mode_fixed", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id];
  if (!s || !s.isLicensed) return sendLicenseRequiredMessage(ctx);
  ensureCopyTradingDefaults(s);

  s.copyTrading.buyAmountMode = "fixed";
  s.awaitingCopyBuyAmount = true;
  saveSessions();
  await safeEditOrReply(
    ctx,
    `Mode set to Fixed. Please enter the amount in USD to buy for each trade:`,
  );
});

bot.action("ct_set_buy_mode_percent_whale", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id];
  if (!s || !s.isLicensed) return sendLicenseRequiredMessage(ctx);
  ensureCopyTradingDefaults(s);

  s.copyTrading.buyAmountMode = "percent_whale";
  s.awaitingCopyBuyAmount = true;
  saveSessions();
  await safeEditOrReply(
    ctx,
    `Mode set to % of Whale. Please enter the percentage of the whale's buy you want to copy (e.g., '1' for 1%):`,
  );
});

bot.action("ct_set_buy_mode_percent_portfolio", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id];
  if (!s || !s.isLicensed) return sendLicenseRequiredMessage(ctx);
  ensureCopyTradingDefaults(s);

  s.copyTrading.buyAmountMode = "percent_portfolio";
  s.awaitingCopyBuyAmount = true;
  saveSessions();
  await safeEditOrReply(
    ctx,
    `Mode set to % of Portfolio. Please enter the percentage of your total funds to use for each trade (e.g., '5' for 5%):`,
  );
});

// Handling sell rule toggle
bot.action("ct_toggle_sell_follow", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id];
  if (!s || !s.isLicensed) return sendLicenseRequiredMessage(ctx);
  ensureCopyTradingDefaults(s);

  s.copyTrading.sellOnWhaleSell = !s.copyTrading.sellOnWhaleSell;
  saveSessions();
  await ctx.answerCbQuery(
    `Following whale sells is now ${
      s.copyTrading.sellOnWhaleSell ? "ON" : "OFF"
    }.`,
  );
  const text = `Current setting: The bot will **${
    s.copyTrading.sellOnWhaleSell ? "automatically sell" : "ignore sells"
  }** when the whale sells a token you hold.`;
  await safeEditOrReply(ctx, text, CT_SELL_KB(s));
});

// The core simulation logic for copy trading
async function copyTradingInterval(ctx) {
  const id = String(ctx.chat.id);
  const s = sessions[id];
  if (!s) return;
  ensureCopyTradingDefaults(s);

  if (!s.copyTrading.enabled) {
    const intervalId = `copy_trading_${id}`;
    if (intervals[intervalId]) {
      clearInterval(intervals[intervalId]);
      delete intervals[intervalId];
    }
    return;
  }

  // Random chance to simulate a whale transaction
  if (Math.random() > 0.3) return;

  const isBuy = Math.random() < 0.7; // 70% chance of a buy, 30% of a sell
  const whaleAddr = s.copyTrading.whaleAddress;
  const tokenData = fakeTokenFromAddr(uid("TKN"));

  if (isBuy) {
    const whaleBuyAmountUSD =
      s.copyTrading.minWhaleTxValue + Math.random() * 10000;

    if (whaleBuyAmountUSD < s.copyTrading.minWhaleTxValue) return;

    let userBuyAmountUSD = 0;
    const mode = s.copyTrading.buyAmountMode;
    if (mode === "fixed") {
      userBuyAmountUSD = s.copyTrading.buyAmountFixed;
    } else if (mode === "percent_whale") {
      userBuyAmountUSD =
        whaleBuyAmountUSD * (s.copyTrading.buyAmountPercent / 100);
    } else if (mode === "percent_portfolio") {
      userBuyAmountUSD = s.funds * (s.copyTrading.buyAmountPercent / 100);
    }

    if (s.funds < userBuyAmountUSD) {
      await safeSend(
        ctx,
        `⚠️ Whale ${shortAddr(whaleAddr)} bought ${
          tokenData.symbol
        }, but you have insufficient funds to copy the trade (${formatUSD(
          userBuyAmountUSD,
        )} needed).`,
      );
      return;
    }

    await safeSend(
      ctx,
      `🐋 Whale Activity Detected!\nAddress: <code>${shortAddr(
        whaleAddr,
      )}</code>\nAction: <b>BUY</b>\nToken: <b>${tokenData.symbol}</b> (${
        tokenData.name
      })\nValue: <b>${formatUSD(whaleBuyAmountUSD)}</b>\n\n- - - -\n\nExecuting your copy trade...`,
    );

    s.funds -= userBuyAmountUSD;
    s.copyTrading.portfolio[tokenData.symbol] = {
      amountUSD: userBuyAmountUSD,
      tokenAmount: userBuyAmountUSD / tokenData.price,
      entryPrice: tokenData.price,
      tokenName: tokenData.name,
    };
    s.history.push({
      kind: "copy-buy",
      value: -userBuyAmountUSD,
      time: Date.now(),
      meta: { token: tokenData.symbol, name: tokenData.name },
    });
    saveSessions();

    setTimeout(async () => {
      await safeSend(
        ctx,
        `✅ Copy Trade Executed\nBought <b>${formatUSD(
          userBuyAmountUSD,
        )}</b> of <b>${tokenData.symbol}</b>.`,
      );
    }, 1500);
  } else {
    // Simulate a SELL
    const heldTokens = Object.keys(s.copyTrading.portfolio);
    if (heldTokens.length === 0) return; // Whale sells something we don't hold

    const tokenToSellSymbol =
      heldTokens[Math.floor(Math.random() * heldTokens.length)];
    const position = s.copyTrading.portfolio[tokenToSellSymbol];

    if (!s.copyTrading.sellOnWhaleSell) {
      await safeSend(
        ctx,
        `🔔 Whale ${shortAddr(
          whaleAddr,
        )} is selling <b>${tokenToSellSymbol}</b>. You are holding this token, but your settings are set to ignore whale sells.`,
      );
      return;
    }

    await safeSend(
      ctx,
      `🐋 Whale Activity Detected!\nAddress: <code>${shortAddr(
        whaleAddr,
      )}</code>\nAction: <b>SELL</b>\nToken: <b>${tokenToSellSymbol}</b> (${
        position.tokenName
      })\n\n- - - -\n\nExecuting your copy sell...`,
    );

    const priceChange = Math.random() * 1.5 - 0.25; // -25% to +125% change
    const exitPrice = position.entryPrice * (1 + priceChange);
    const sellValueUSD = position.tokenAmount * exitPrice;
    const pnl = sellValueUSD - position.amountUSD;

    s.funds += sellValueUSD;
    delete s.copyTrading.portfolio[tokenToSellSymbol];
    s.history.push({
      kind: "copy-sell",
      value: pnl,
      time: Date.now(),
      meta: { token: tokenToSellSymbol, name: position.tokenName },
    });
    saveSessions();

    setTimeout(async () => {
      const resultText = pnl >= 0 ? "Profit" : "Loss";
      await safeSend(
        ctx,
        `💸 Copy Sell Executed\nSold <b>${tokenToSellSymbol}</b> for a ${resultText} of <b>${formatUSD(
          pnl,
        )}</b>.\nNew Balance: ${formatUSD(s.funds)}`,
      );
    }, 1500);
  }
}

/* ---------- Snipe Flow ---------- */
bot.action("snipe_auto", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  if (s.running) {
    return ctx.answerCbQuery("Engine already running. Use Stop to end.", {
      show_alert: true,
    });
  }

  s.running = true;
  s.startAt = Date.now();
  s.statusMessageId = null;
  s.fundsHistory = s.fundsHistory || [];
  s.fundsHistory.push(s.funds);
  saveSessions();

  const status = buildStatusCard(s, true);
  const sent = await robustSendWithKB(ctx, status, AUTO_STATUS_KB());
  s.statusMessageId = sent.message_id;
  saveSessions();

  const intervalId = `snipe_auto_${id}`;
  if (intervals[intervalId]) {
    clearInterval(intervals[intervalId]);
    delete intervals[intervalId];
  }

  intervals[intervalId] = setInterval(async () => {
    try {
      if (!sessions[id] || !sessions[id].running) {
        clearInterval(intervals[intervalId]);
        delete intervals[intervalId];
        return;
      }

      const speedFactor =
        s.settings.snipingSpeed === "fast"
          ? 0.6
          : s.settings.snipingSpeed === "slow"
            ? 0.25
            : 0.4;

      if (Math.random() < speedFactor) {
        let tokenData;
        let isRealToken = false;

        // --- API INTEGRATION: Prioritize real tokens from the queue ---
        if (newTokensQueue.length > 0) {
          const realToken = newTokensQueue.shift();
          tokenData = {
            symbol: realToken.symbol,
            name: realToken.name,
            mint: realToken.mint,
            price: +(Math.random() * 0.0001 + 0.00001).toFixed(8),
          };
          isRealToken = true;
        } else {
          // Fallback to fake token if the queue is empty
          tokenData = fakeTokenFromAddr(uid("TK"));
          tokenData.mint = "FAKE_MINT_" + uid();
        }

        const baseAmountUSD = +(Math.random() * 30 + 5).toFixed(2);
        let delta = 0;
        let outcome = "Loss";
        let meta = {
          token: tokenData.symbol,
          name: tokenData.name,
          mint: tokenData.mint,
          price: tokenData.price,
          isReal: isRealToken,
        };

        const tradeOutcomeRoll = Math.random();
        const RUG_PULL_CHANCE = 0.03;
        const BIG_WIN_CHANCE = 0.1;
        const WIN_CHANCE = 0.55;

        if (tradeOutcomeRoll < RUG_PULL_CHANCE) {
          delta = -baseAmountUSD;
          meta.outcome = "Rug Pull";
          s.history.push({
            kind: "warning",
            value: 0,
            time: Date.now(),
            meta: { text: `Rug pull on ${tokenData.symbol}! Total loss.` },
          });
        } else if (tradeOutcomeRoll < RUG_PULL_CHANCE + BIG_WIN_CHANCE) {
          delta = baseAmountUSD * (1.5 + Math.random() * 2.5);
          meta.outcome = "Big Win";
        } else if (
          tradeOutcomeRoll <
          RUG_PULL_CHANCE + BIG_WIN_CHANCE + WIN_CHANCE
        ) {
          delta = baseAmountUSD * (0.1 + Math.random() * 0.7);
          meta.outcome = "Win";
        } else {
          delta = -baseAmountUSD * (0.2 + Math.random() * 0.5);
          meta.outcome = "Stop-Loss";
        }

        delta = +delta.toFixed(2);
        s.snipedCount = (s.snipedCount || 0) + 1;
        s.funds = clamp(+((s.funds || 0) + delta).toFixed(2), 0.01, 9999999);
        s.history.push({
          kind: "snip",
          value: delta,
          time: Date.now(),
          meta: meta,
        });
      }

      const drift = (Math.random() - 0.48) * 0.5;
      s.funds = clamp(+((s.funds || 0) + drift).toFixed(2), 0.01, 9999999);
      s.fundsHistory.push(s.funds);
      if (s.fundsHistory.length > 60)
        s.fundsHistory = s.fundsHistory.slice(-60);

      s._lastGas = 20 + Math.round(Math.random() * 300);
      s._engineCpu = 20 + Math.round(Math.random() * 60);
      s._engineMem = 30 + Math.round(Math.random() * 60);

      const text = buildStatusCard(s, true);
      await robustEditOrSendById(
        ctx,
        s.statusMessageId,
        text,
        AUTO_STATUS_KB(),
      );
      saveSessions();
    } catch (err) {
      console.error("Auto interval error:", err);
    }
  }, 2000);

  await ctx.answerCbQuery();
});

bot.action("auto_pause", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id];
  if (!s || !s.isLicensed) return sendLicenseRequiredMessage(ctx);
  if (!s.running)
    return ctx.answerCbQuery("Engine not running.", { show_alert: true });

  s.running = false;
  s.pausedAt = Date.now();
  const intervalId = `snipe_auto_${id}`;
  if (intervals[intervalId]) {
    clearInterval(intervals[intervalId]);
    delete intervals[intervalId];
  }
  saveSessions();
  const pauseText = buildStatusCard(s, false) + "\n\n⏸️ Engine paused.";
  await robustEditOrSendById(ctx, s.statusMessageId, pauseText, MAIN_KB());
  await ctx.answerCbQuery("Engine paused.");
});

bot.action("auto_stop", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id];
  if (!s || !s.isLicensed) return sendLicenseRequiredMessage(ctx);
  if (!s.running)
    return ctx.answerCbQuery("Engine not running.", { show_alert: true });

  s.running = false;
  s.stoppedAt = Date.now();
  const intervalId = `snipe_auto_${id}`;
  if (intervals[intervalId]) {
    clearInterval(intervals[intervalId]);
    delete intervals[intervalId];
  }
  saveSessions();
  const final = buildFinalSnapshot(s);
  await robustEditOrSendById(ctx, s.statusMessageId, final, MAIN_KB());
  await ctx.answerCbQuery("Engine stopped — session saved.");
});

bot.action("auto_snapshot", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id];
  if (!s || !s.isLicensed) return sendLicenseRequiredMessage(ctx);

  const snap = buildSnapshotText(s);
  await safeReply(ctx, snap, MAIN_KB());
  await ctx.answerCbQuery("Snapshot delivered.");
});

bot.action("snipe_semi", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  s.awaitingTokenAddress = true;
  saveSessions();
  await ctx.answerCbQuery();
  await safeReply(ctx, "Paste the token mint address now:");
});

bot.action(/^buy_/, async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  const cb = ctx.callbackQuery && ctx.callbackQuery.data;
  if (!cb) return ctx.answerCbQuery();
  const amount = Number(cb.split("_")[1]);
  if (isNaN(amount)) return ctx.answerCbQuery("Invalid amount");
  if ((s.funds || 0) < amount) {
    return ctx.answerCbQuery("Insufficient funds.", { show_alert: true });
  }

  const tokenAddr = s.pendingToken || uid("TK");
  const fake = fakeTokenFromAddr(tokenAddr);
  const sl = applySlippage(amount, 2.5);
  const effectiveAmount = +(amount * sl.factor).toFixed(2);
  const pricePerToken = +(
    fake.price *
    (1 + (Math.random() - 0.5) * 0.2)
  ).toFixed(6);
  const received = +(amount / pricePerToken).toFixed(4);

  s.funds = +(s.funds - amount).toFixed(2);
  s.lastBought = {
    token: fake.symbol,
    name: fake.name,
    amount,
    received,
    pricePerToken,
    boughtAt: Date.now(),
    slippage: sl.slippage,
    slDirection: sl.direction,
  };
  s.history = s.history || [];
  s.history.push({
    kind: "buy",
    value: -amount,
    time: Date.now(),
    meta: { token: fake.symbol, name: fake.name, price: pricePerToken },
  });
  if (s.history.length > 400) s.history = s.history.slice(-400);
  saveSessions();

  const confirm = [
    "✅ Purchase confirmed",
    `Token: <code>${shortAddr(tokenAddr)}</code>  •  <b>${fake.symbol}</b> (${
      fake.name
    })`,
    `Requested spend: <b>${formatUSD(amount)}</b> (effective: ${formatUSD(
      effectiveAmount,
    )} due to slippage ${sl.slippage}% ${sl.direction})`,
    `Price (est): <b>${pricePerToken}</b> USD/token`,
    `Received: <b>${s.lastBought.received}</b> ${fake.symbol}`,
    "",
    "Tip: Use Sell to close position or set Auto-Sell rules in Settings.",
  ].join("\n");

  try {
    if (ctx.callbackQuery.message && ctx.callbackQuery.message.message_id) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        ctx.callbackQuery.message.message_id,
        null,
        confirm,
        {
          parse_mode: "HTML",
          reply_markup: POST_BUY_KB(),
        },
      );
    } else {
      await safeReply(ctx, confirm, POST_BUY_KB());
    }
  } catch (err) {
    console.warn("Buy confirm edit failed:", err && err.message);
    await safeReply(ctx, confirm, POST_BUY_KB());
  }

  await ctx.answerCbQuery("Purchase completed.");
});

bot.action("sell_last", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);
  if (!s.lastBought)
    return ctx.answerCbQuery("Nothing to sell.", { show_alert: true });

  const token = s.lastBought.token;
  const name = s.lastBought.name;
  const base = s.lastBought.amount;
  const marketMovePct = Math.random() * 0.35 - 0.08;
  const sl = Math.random() * 2.0;
  const sellAmount = +(base * (1 + marketMovePct) * (1 - sl / 100)).toFixed(2);
  const pnl = +(sellAmount - s.lastBought.amount).toFixed(2);

  s.funds = +(s.funds + sellAmount).toFixed(2);
  s.history = s.history || [];
  s.history.push({
    kind: "sell",
    value: pnl,
    time: Date.now(),
    meta: { token, name },
  });
  s.lastBought = null;
  saveSessions();

  const sellText = [
    "💸 Sell executed",
    `Token: <b>${token}</b> (${name})`,
    `Gross outcome: <b>${formatUSD(sellAmount)}</b>`,
    `Result: ${pnl >= 0 ? "Profit" : "Loss"} <b>${formatUSD(pnl)}</b>`,
    `New balance: <b>${formatUSD(s.funds)}</b>`,
  ].join("\n");

  try {
    if (ctx.callbackQuery.message && ctx.callbackQuery.message.message_id) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        ctx.callbackQuery.message.message_id,
        null,
        sellText,
        {
          parse_mode: "HTML",
          reply_markup: MAIN_KB(),
        },
      );
    } else {
      await safeReply(ctx, sellText, MAIN_KB());
    }
  } catch (err) {
    console.warn("Sell edit failed:", err && err.message);
    await safeReply(ctx, sellText, MAIN_KB());
  }

  await ctx.answerCbQuery("Sell completed.");
});

bot.action("menu_scheduled", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  const list = s.scheduledSnipes || [];
  if (list.length === 0) {
    await safeEditOrReply(
      ctx,
      "No scheduled snipes. Use /schedule_in <sec> <token> <amt> to create.",
      SNIPE_KB(),
    );
  } else {
    const lines = ["📅 Scheduled Snipes:"];
    list.forEach((job) => {
      lines.push(
        `• ${job.timeISO} — ${shortAddr(job.token)} — ${formatUSD(
          job.amount,
        )}  (id: ${job.id})`,
      );
    });
    lines.push("", "To cancel a scheduled job type /cancel_schedule <id>");
    await safeEditOrReply(ctx, lines.join("\n"), SNIPE_KB());
  }
});

bot.command("schedule_in", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  const parts = ctx.message.text.split(/\s+/);
  if (parts.length < 4) {
    return ctx.reply("Usage: /schedule_in <seconds> <tokenAddr> <amount>");
  }
  const seconds = Number(parts[1]);
  const token = parts[2];
  const amount = Number(parts[3]);
  if (isNaN(seconds) || isNaN(amount))
    return ctx.reply("Invalid seconds or amount");

  const jobId = uid("job");
  const timeISO = new Date(Date.now() + seconds * 1000).toISOString();
  const job = { id: jobId, timeISO, token, amount };
  s.scheduledSnipes = s.scheduledSnipes || [];
  s.scheduledSnipes.push(job);
  saveSessions();

  const tid = setTimeout(async () => {
    if (s.funds >= amount) {
      s.funds = +(s.funds - amount).toFixed(2);
      const { name } = fakeTokenFromAddr(token);
      const pricePerToken = +(Math.random() * 0.6 + 0.4).toFixed(6);
      const received = +(amount / pricePerToken).toFixed(4);
      s.lastBought = {
        token,
        name,
        amount,
        received,
        pricePerToken,
        boughtAt: Date.now(),
      };
      s.history.push({
        kind: "buy",
        value: -amount,
        time: Date.now(),
        meta: { token, name },
      });
      s.history.push({
        kind: "snip",
        value: +(Math.random() * 6).toFixed(2),
        time: Date.now(),
        meta: { from: "scheduled" },
      });
      saveSessions();
      try {
        await bot.telegram.sendMessage(
          ctx.chat.id,
          `📅 Scheduled buy executed: ${shortAddr(token)} — ${formatUSD(
            amount,
          )} — Received ${received} tokens`,
        );
      } catch (e) {
        console.error("Scheduled job notify failed", e);
      }
    } else {
      try {
        await bot.telegram.sendMessage(
          ctx.chat.id,
          `⚠️ Scheduled buy failed (insufficient funds): ${shortAddr(
            token,
          )} — ${formatUSD(amount)}`,
        );
      } catch (e) {
        console.error("Scheduled job notify failed", e);
      }
    }
    s.scheduledSnipes = (s.scheduledSnipes || []).filter((j) => j.id !== jobId);
    saveSessions();
    clearTimeout(tid);
  }, seconds * 1000);

  scheduledJobs[jobId] = tid;
  await ctx.reply(`Scheduled job created: id ${jobId} at ${timeISO}`);
});

bot.command("cancel_schedule", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  const parts = ctx.message.text.split(/\s+/);
  if (parts.length < 2) return ctx.reply("Usage: /cancel_schedule <jobId>");
  const jobId = parts[1];
  s.scheduledSnipes = (s.scheduledSnipes || []).filter((j) => j.id !== jobId);
  if (scheduledJobs[jobId]) {
    clearTimeout(scheduledJobs[jobId]);
    delete scheduledJobs[jobId];
  }
  saveSessions();
  await ctx.reply(`Cancelled schedule ${jobId} (if existed).`);
});

bot.action("menu_watchlist", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  const list = s.watchlist || [];
  if (list.length === 0) {
    await safeEditOrReply(
      ctx,
      "Watchlist empty. Use /watch <tokenAddr> to add.",
      SNIPE_KB(),
    );
  } else {
    const lines = ["🔎 Watchlist:"];
    list.forEach((t, i) => lines.push(`${i + 1}. ${shortAddr(t)}`));
    lines.push(
      "",
      "To add: /watch <tokenAddr>. To remove: /unwatch <tokenAddr>",
    );
    await safeEditOrReply(ctx, lines.join("\n"), SNIPE_KB());
  }
});

bot.command("watch", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  const parts = ctx.message.text.split(/\s+/);
  if (parts.length < 2) return ctx.reply("Usage: /watch <tokenAddr>");
  const token = parts[1];
  s.watchlist = s.watchlist || [];
  if (!s.watchlist.includes(token)) s.watchlist.push(token);
  saveSessions();
  await ctx.reply(`Added ${shortAddr(token)} to watchlist.`);
});

bot.command("unwatch", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  const parts = ctx.message.text.split(/\s+/);
  if (parts.length < 2) return ctx.reply("Usage: /unwatch <tokenAddr>");
  const token = parts[1];
  s.watchlist = (s.watchlist || []).filter((t) => t !== token);
  saveSessions();
  await ctx.reply(`Removed ${shortAddr(token)} from watchlist.`);
});

/* Settings flows */
bot.action("menu_speed", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  const kb = Markup.inlineKeyboard([
    [
      Markup.button.callback("🐢 Slow", "set_speed_slow"),
      Markup.button.callback("⚖️ Normal", "set_speed_normal"),
    ],
    [
      Markup.button.callback("🚀 Fast", "set_speed_fast"),
      Markup.button.callback("⬅ Back", "menu_settings"),
    ],
  ]).reply_markup;
  await safeEditOrReply(
    ctx,
    "Select sniping speed (affects how often the engine finds tokens):",
    kb,
  );
});
bot.action("set_speed_slow", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);
  if (!s.settings) s.settings = {};
  s.settings.snipingSpeed = "slow";
  saveSessions();
  await safeEditOrReply(ctx, "Sniping speed set to SLOW.", SETTINGS_KB());
});
bot.action("set_speed_normal", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);
  if (!s.settings) s.settings = {};
  s.settings.snipingSpeed = "normal";
  saveSessions();
  await safeEditOrReply(ctx, "Sniping speed set to NORMAL.", SETTINGS_KB());
});
bot.action("set_speed_fast", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);
  if (!s.settings) s.settings = {};
  s.settings.snipingSpeed = "fast";
  saveSessions();
  await safeEditOrReply(ctx, "Sniping speed set to FAST.", SETTINGS_KB());
});

bot.action("menu_auto_sell", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  if (!s.settings) s.settings = {};
  if (!s.settings.autoSell) {
    s.settings.autoSell = { enabled: false, profitPct: 20, stopLossPct: 10 };
  }

  const rule = s.settings.autoSell || {};
  const text = [
    "📌 Auto-Sell Rules",
    `Enabled: <b>${rule.enabled ? "Yes" : "No"}</b>`,
    `Profit target: <b>${rule.profitPct || 20}%</b>`,
    `Stop-loss: <b>${rule.stopLossPct || 10}%</b>`,
    "",
    "Use the toggle below or run /set_profit <pct> and /set_stop <pct> to set values quickly.",
  ].join("\n");
  const kb = Markup.inlineKeyboard([
    [
      Markup.button.callback(
        rule.enabled ? "Disable Auto-Sell" : "Enable Auto-Sell",
        "toggle_auto_sell",
      ),
    ],
    [
      Markup.button.callback("Set Profit %", "set_profit_pct"),
      Markup.button.callback("Set Stop-Loss %", "set_stop_pct"),
    ],
    [Markup.button.callback("⬅ Back", "menu_settings")],
  ]).reply_markup;
  await safeEditOrReply(ctx, text, kb);
});
bot.action("toggle_auto_sell", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  if (!s.settings) s.settings = {};
  if (!s.settings.autoSell) s.settings.autoSell = { enabled: false };

  s.settings.autoSell.enabled = !s.settings.autoSell.enabled;
  saveSessions();
  await safeEditOrReply(
    ctx,
    `Auto-Sell now ${s.settings.autoSell.enabled ? "ENABLED" : "DISABLED"}.`,
    SETTINGS_KB(),
  );
});
bot.action("set_profit_pct", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);
  await safeEditOrReply(
    ctx,
    "To set profit target, run: /set_profit <percent>  e.g. /set_profit 25",
    SETTINGS_KB(),
  );
});
bot.action("set_stop_pct", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);
  await safeEditOrReply(
    ctx,
    "To set stop-loss, run: /set_stop <percent>  e.g. /set_stop 8",
    SETTINGS_KB(),
  );
});

bot.command("set_profit", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  const parts = ctx.message.text.split(/\s+/);
  if (parts.length < 2) return ctx.reply("Usage: /set_profit <percent>");
  const pct = Number(parts[1]);
  if (isNaN(pct) || pct <= 0) return ctx.reply("Invalid percent");

  if (!s.settings) s.settings = {};
  if (!s.settings.autoSell) s.settings.autoSell = {};

  s.settings.autoSell.profitPct = pct;
  saveSessions();
  await ctx.reply(`Auto-Sell profit target set to ${pct}%`);
});
bot.command("set_stop", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  const parts = ctx.message.text.split(/\s+/);
  if (parts.length < 2) return ctx.reply("Usage: /set_stop <percent>");
  const pct = Number(parts[1]);
  if (isNaN(pct) || pct <= 0) return ctx.reply("Invalid percent");

  if (!s.settings) s.settings = {};
  if (!s.settings.autoSell) s.settings.autoSell = {};

  s.settings.autoSell.stopLossPct = pct;
  saveSessions();
  await ctx.reply(`Auto-Sell stop-loss set to ${pct}%`);
});

bot.action("menu_notifications", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  if (!s.settings) s.settings = { notificationVolume: "normal" };

  const map = { mute: "🔕 Mute", low: "🔉 Low", normal: "🔔 Normal" };
  const text = `🔔 Notifications: <b>${
    s.settings.notificationVolume
  }</b>\nPress the button to cycle settings.`;
  const kb = Markup.inlineKeyboard([
    [
      Markup.button.callback(
        map[s.settings.notificationVolume] || "🔔 Normal",
        "toggle_notifications",
      ),
    ],
    [Markup.button.callback("⬅ Back", "menu_settings")],
  ]).reply_markup;
  await safeEditOrReply(ctx, text, kb);
});
bot.action("toggle_notifications", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  if (!s.settings) s.settings = {};

  const order = ["mute", "low", "normal"];
  const idx = order.indexOf(s.settings.notificationVolume || "normal");
  const next = order[(idx + 1) % order.length];
  s.settings.notificationVolume = next;
  saveSessions();
  await safeEditOrReply(
    ctx,
    `Notifications set to: <b>${next}</b>`,
    SETTINGS_KB(),
  );
});

bot.action("menu_controls", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);
  const kb = Markup.inlineKeyboard([
    [
      Markup.button.callback("💳 Deposit $50", "deposit_50"),
      Markup.button.callback("💸 Withdraw $50", "withdraw_50"),
    ],
    [
      Markup.button.callback("💼 View Wallet", "menu_view_wallet"),
      Markup.button.callback("⬅ Back", "menu_main"),
    ],
  ]).reply_markup;
  await safeEditOrReply(ctx, "Controls:", kb);
});

bot.action("deposit_50", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  s.funds = +(s.funds + 50).toFixed(2);
  s.fundsHistory = s.fundsHistory || [];
  s.fundsHistory.push(s.funds);
  s.history.push({
    kind: "deposit",
    value: +50,
    time: Date.now(),
    meta: { coin: "USD", network: "quick" },
  });
  saveSessions();
  await safeEditOrReply(
    ctx,
    `✅ Deposited $50 (quick). New balance: <b>${formatUSD(s.funds)}</b>`,
    MAIN_KB(),
  );
});

bot.action("withdraw_50", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);
  if (s.funds < 50)
    return ctx.answerCbQuery("Insufficient funds.", { show_alert: true });

  s.funds = +(s.funds - 50).toFixed(2);
  s.fundsHistory = s.fundsHistory || [];
  s.fundsHistory.push(s.funds);
  s.history.push({
    kind: "withdraw",
    value: -50,
    time: Date.now(),
    meta: { coin: "USD", network: "quick" },
  });
  saveSessions();
  await safeEditOrReply(
    ctx,
    `✅ Withdrew $50 (quick). New balance: <b>${formatUSD(s.funds)}</b>`,
    MAIN_KB(),
  );
});

bot.action("menu_view_wallet", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  const profit = +(s.funds - s.initialFunds).toFixed(2);
  const roi = s.initialFunds ? (profit / s.initialFunds) * 100 : 0;
  const totalBuys = (s.history || []).filter((h) => h.kind === "buy").length;
  const totalSells = (s.history || []).filter((h) => h.kind === "sell").length;
  const totalDeposits = (s.history || [])
    .filter((h) => h.kind === "deposit")
    .reduce((a, x) => a + (x.value || 0), 0);
  const totalWithdraws = (s.history || [])
    .filter((h) => h.kind === "withdraw")
    .reduce((a, x) => a + (x.value || 0), 0);
  const wins = (s.history || []).filter(
    (h) => (h.kind === "sell" || h.kind === "snip") && h.value > 0,
  ).length;
  const avgProfit =
    wins > 0
      ? (s.history || [])
          .filter(
            (h) => (h.kind === "sell" || h.kind === "snip") && h.value > 0,
          )
          .reduce((a, e) => a + e.value, 0) / wins
      : 0;

  const text = [
    "💼 Wallet Info",
    `Address: <code>${
      s.wallet ? shortAddr(s.wallet) : "Not created yet"
    }</code>`,
    `Balance: <b>${formatUSD(s.funds)}</b>`,
    `Initial: <b>${formatUSD(s.initialFunds)}</b>`,
    `Profit/Loss: <b>${formatUSD(profit)}</b> (${roi.toFixed(2)}%)`,
    `Sniped total: <b>${s.snipedCount || 0}</b>`,
    `Buys: <b>${totalBuys}</b>  •  Sells: <b>${totalSells}</b>`,
    `Deposits: <b>${formatUSD(totalDeposits)}</b>  •  Withdrawals: <b>${formatUSD(
      Math.abs(totalWithdraws),
    )}</b>`,
    `Win events: <b>${wins}</b>  •  Avg win: <b>${formatUSD(avgProfit)}</b>`,
    `Sparkline: <code>${sparkline(s.fundsHistory || [], 16)}</code>`,
  ].join("\n");
  await safeEditOrReply(ctx, text, MAIN_KB());
});

bot.action("menu_market", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);
  await safeEditOrReply(
    ctx,
    "🧪 <b>Market manipulation</b>\nChoose an option:",
    MARKET_KB(),
  );
});

bot.action("market_pump", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);
  await safeEditOrReply(
    ctx,
    "Pump a coin — choose pump type:",
    PUMP_OPTIONS_KB(),
  );
});

bot.action("market_wash", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);
  await safeEditOrReply(
    ctx,
    "📈 <b>Wash trading</b>\nThis screen simulates wash trading UI: choose parameters and Start.",
    Markup.inlineKeyboard([
      [
        Markup.button.callback("Set volume (UI)", "wash_set_volume"),
        Markup.button.callback("Set interval (UI)", "wash_set_interval"),
      ],
      [
        Markup.button.callback("▶️ Start", "wash_start_sim"),
        Markup.button.callback("⬅ Back", "menu_market"),
      ],
    ]).reply_markup,
  );
});

bot.action("market_hype", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);
  await safeEditOrReply(
    ctx,
    "📣 <b>Simulate hype</b>\nquickly hype coins with X accounts.",
    Markup.inlineKeyboard([
      [
        Markup.button.callback("Create mock tweet", "hype_tweet"),
        Markup.button.callback("Create mock ad", "hype_ad"),
      ],
      [
        Markup.button.callback("▶️ Run", "hype_run_sim"),
        Markup.button.callback("⬅ Back", "menu_market"),
      ],
    ]).reply_markup,
  );
});

bot.action("pump_multi_wallets", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  s.awaitingPumpToken = true;
  saveSessions();
  await safeEditOrReply(
    ctx,
    "🔎 Pump with multiple wallets — paste the token mint address now:",
  );
});

bot.action("pump_fixed_per_wallet", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  s.awaitingPumpToken = true;
  s.pump_fixed = true; // UI flag
  saveSessions();
  await safeEditOrReply(
    ctx,
    "⚖️ Fixed pump per wallet — paste the token mint address now (UI-only):",
  );
});

bot.action("pump_scheduled", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);
  await safeEditOrReply(
    ctx,
    "📅 Scheduled pump\nUse this to pick a schedule and preview the pump timeline.",
    Markup.inlineKeyboard([
      [
        Markup.button.callback("Set schedule", "pump_schedule_set"),
        Markup.button.callback("Preview timeline", "pump_schedule_preview"),
      ],
      [Markup.button.callback("⬅ Back", "menu_market")],
    ]).reply_markup,
  );
});

bot.action("pump_start_sim", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  if (s.pumpRunning) {
    return ctx.answerCbQuery("Pump already running. Use Stop to end.", {
      show_alert: true,
    });
  }

  const token = s.pendingPumpToken || uid("TK");
  const fake = fakeTokenFromAddr(token);
  const wallets = s.pendingPumpSettings ? s.pendingPumpSettings.wallets : 12;
  const perWallet = s.pendingPumpSettings
    ? s.pendingPumpSettings.perWalletUSD
    : 20;

  s.pumpRunning = true;
  s.pumpStartAt = Date.now();
  s.pumpToken = token;
  s.pumpFake = fake;
  s.pumpWallets = wallets;
  s.pumpPerWallet = perWallet;
  s.pumpInitialMC = Math.round(10000 + Math.random() * 50000);
  s.pumpCurrentMC = s.pumpInitialMC;
  s.pumpInitialPrice = fake.price;
  s.pumpCurrentPrice = fake.price;
  s.pumpWalletActivity = [];
  s.pumpMessageId = null;
  saveSessions();

  const initialStatus = buildPumpStatusCard(s);
  const sent = await robustSendWithKB(ctx, initialStatus, PUMP_STATUS_KB());
  s.pumpMessageId = sent.message_id;
  saveSessions();

  await ctx.answerCbQuery("MC pumping started!");

  const pumpIntervalKey = `pump_${id}`;
  if (intervals[pumpIntervalKey]) {
    clearInterval(intervals[pumpIntervalKey]);
    delete intervals[pumpIntervalKey];
  }

  intervals[pumpIntervalKey] = setInterval(async () => {
    try {
      if (!sessions[id] || !sessions[id].pumpRunning) {
        clearInterval(intervals[pumpIntervalKey]);
        delete intervals[pumpIntervalKey];
        return;
      }

      const s_interval = sessions[id];

      if (Math.random() < 0.6) {
        const walletNum =
          Math.floor(Math.random() * s_interval.pumpWallets) + 1;
        const buyAmount = +(
          s_interval.pumpPerWallet *
          (0.8 + Math.random() * 0.4)
        ).toFixed(2);
        const priceImpact = +(Math.random() * 3 + 0.5).toFixed(2);

        s_interval.pumpWalletActivity.unshift({
          type: "buy",
          wallet: walletNum,
          amount: buyAmount,
          priceImpact,
          time: Date.now(),
        });

        if (s_interval.pumpWalletActivity.length > 10) {
          s_interval.pumpWalletActivity = s_interval.pumpWalletActivity.slice(
            0,
            10,
          );
        }

        s_interval.pumpCurrentPrice = +(
          s_interval.pumpCurrentPrice *
          (1 + priceImpact / 100)
        ).toFixed(8);
        s_interval.pumpCurrentMC = Math.round(
          s_interval.pumpCurrentMC * (1 + priceImpact / 100),
        );
      }

      const drift = (Math.random() - 0.48) * 0.5;
      s_interval.pumpCurrentPrice = +(
        s_interval.pumpCurrentPrice *
        (1 + drift / 100)
      ).toFixed(8);
      s_interval.pumpCurrentMC = Math.round(
        s_interval.pumpCurrentMC * (1 + drift / 100),
      );

      saveSessions();

      const statusCard = buildPumpStatusCard(s_interval);
      await robustEditOrSendById(
        { chat: { id: Number(id) }, telegram: bot.telegram },
        s_interval.pumpMessageId,
        statusCard,
        PUMP_STATUS_KB(),
      );
    } catch (err) {
      console.error("Pump interval error:", err);
    }
  }, 1500);
});

bot.action("pump_stop_sim", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  s.pumpRunning = false;
  const pumpIntervalKey = `pump_${id}`;
  if (intervals[pumpIntervalKey]) {
    clearInterval(intervals[pumpIntervalKey]);
    delete intervals[pumpIntervalKey];
  }

  const finalMC = s.pumpCurrentMC || s.pumpInitialMC;
  const initialMC = s.pumpInitialMC;
  const gain = finalMC - initialMC;
  const gainPct = ((gain / initialMC) * 100).toFixed(2);

  s.pendingPumpToken = null;
  s.pendingPumpSettings = null;
  s.awaitingPumpToken = false;
  s.pumpMessageId = null;
  saveSessions();

  const summary = [
    "⏹️ <b>PUMP STOPPED</b>",
    "",
    `Token: <b>${s.pumpFake ? s.pumpFake.symbol : "N/A"}</b> (${
      s.pumpFake ? s.pumpFake.name : ""
    })`,
    `Duration: <b>${prettyTimeDiff(
      Date.now() - (s.pumpStartAt || Date.now()),
    )}</b>`,
    `Initial MC: <b>$${initialMC.toLocaleString()}</b>`,
    `Final MC: <b>$${finalMC.toLocaleString()}</b>`,
    `Gain: <b>${
      gain >= 0 ? "+" : ""
    }$${gain.toLocaleString()}</b> (${gainPct >= 0 ? "+" : ""}${gainPct}%)`,
    "",
    "<i>Simulation complete.</i>",
  ].join("\n");

  await safeEditOrReply(ctx, summary, MARKET_KB());
  await ctx.answerCbQuery("Pump stopped");
});

bot.action("pump_pause_sim", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  await ctx.answerCbQuery("Paused");
  s.pumpRunning = false;
  const pumpIntervalKey = `pump_${id}`;
  if (intervals[pumpIntervalKey]) {
    clearInterval(intervals[pumpIntervalKey]);
    delete intervals[pumpIntervalKey];
  }
  saveSessions();

  await safeEditOrReply(
    ctx,
    "⏸️ <b>PUMP PAUSED</b>\n\nUse Stop to return to Market menu.",
    PUMP_STATUS_KB(),
  );
});

function buildPumpStatusCard(s) {
  const uptime = s.pumpStartAt
    ? prettyTimeDiff(Date.now() - s.pumpStartAt)
    : "0s";
  const token = s.pumpToken ? shortAddr(s.pumpToken) : "N/A";
  const symbol = s.pumpFake ? s.pumpFake.symbol : "TOKEN";
  const name = s.pumpFake ? s.pumpFake.name : "Token";
  const wallets = s.pumpWallets || 12;
  const perWallet = s.pumpPerWallet || 20;

  const initialMC = s.pumpInitialMC || 10000;
  const currentMC = s.pumpCurrentMC || initialMC;
  const initialPrice = s.pumpInitialPrice || 0.0001;
  const currentPrice = s.pumpCurrentPrice || initialPrice;

  const mcGain = currentMC - initialMC;
  const mcGainPct = ((mcGain / initialMC) * 100).toFixed(2);
  const priceGain = currentPrice - initialPrice;
  const priceGainPct = ((priceGain / initialPrice) * 100).toFixed(2);

  const totalBuys = (s.pumpWalletActivity || []).filter(
    (a) => a.type === "buy",
  ).length;
  const totalVolume = wallets * perWallet;

  const recentActivity =
    (s.pumpWalletActivity || [])
      .slice(0, 6)
      .map((a) => {
        const t = new Date(a.time).toLocaleTimeString();
        return `${t} • Wallet#${a.wallet} bought $${
          a.amount
        } (+${a.priceImpact.toFixed(2)}%)`;
      })
      .join("\n") || "<i>No activity yet...</i>";

  const status = [
    "🔴 <b>COIN PUMP — LIVE</b>",
    "",
    `Token: <code>${token}</code> • <b>${symbol}</b> (${name})`,
    `Mode: <b>${wallets} wallets</b> × <b>$${perWallet}</b> each`,
    `Uptime: <b>${uptime}</b>`,
    "",
    `💰 <b>Market Stats</b>`,
    `Market Cap: <b>$${currentMC.toLocaleString()}</b> (${
      mcGainPct >= 0 ? "+" : ""
    }${mcGainPct}%)`,
    `Price: <b>$${currentPrice.toFixed(8)}</b> (${
      priceGainPct >= 0 ? "+" : ""
    }${priceGainPct}%)`,
    `Total Volume: <b>$${totalVolume.toLocaleString()}</b>`,
    `Buys Executed: <b>${totalBuys}</b>`,
    "",
    `📊 <b>Recent Wallet Activity</b>`,
    recentActivity,
    "",
    "<i>Pump running — showing live wallet buys...</i>",
  ].join("\n");

  return status;
}

bot.action("menu_reset", async (ctx) => {
  const id = String(ctx.chat.id);
  const s = sessions[id] || defaultSession();
  if (!s.isLicensed) return sendLicenseRequiredMessage(ctx);

  sessions[id] = defaultSession();
  sessions[id].isLicensed = true;
  saveSessions();
  await safeEditOrReply(
    ctx,
    "Session reset to defaults (license preserved).",
    MAIN_KB(),
  );
});

/* Utility functions for sending/editing messages robustly */
async function safeSend(ctx, text, options = {}) {
  try {
    return await ctx.reply(text, { ...options, parse_mode: "HTML" });
  } catch (err) {
    console.error("safeSend failed:", err);
    return null;
  }
}
async function safeReply(ctx, text, replyMarkup = null) {
  try {
    const options = { parse_mode: "HTML" };
    if (replyMarkup) options.reply_markup = replyMarkup;
    return await ctx.reply(text, options);
  } catch (e) {
    console.error("safeReply failed", e);
    return null;
  }
}
async function robustEditOrSend(ctx, originalMsg, newText, options = {}) {
  try {
    if (originalMsg && originalMsg.message_id) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        originalMsg.message_id,
        null,
        newText,
        options,
      );
      return originalMsg;
    }
    return await safeSend(ctx, newText, options);
  } catch (err) {
    return await safeSend(ctx, newText, options);
  }
}
async function robustEditOrSendById(
  ctx,
  messageId,
  newText,
  replyMarkup = null,
) {
  const chatId = ctx.chat.id;
  const options = { parse_mode: "HTML" };
  if (replyMarkup) options.reply_markup = replyMarkup;
  try {
    if (messageId) {
      await ctx.telegram.editMessageText(
        chatId,
        messageId,
        null,
        newText,
        options,
      );
    } else {
      await safeReply(ctx, newText, replyMarkup);
    }
  } catch (err) {
    if (
      err.response &&
      err.response.description.includes("message is not modified")
    ) {
      return;
    }
    console.warn("Edit failed, sending new message:", err.message);
    const sent = await safeReply(ctx, newText, replyMarkup);
    if (sent) {
      const id = String(ctx.chat.id);
      if (sessions[id]) {
        sessions[id].statusMessageId = sent.message_id;
        saveSessions();
      }
    }
  }
}
async function robustSendWithKB(ctx, text, kb) {
  try {
    return await ctx.replyWithHTML(text, { reply_markup: kb });
  } catch (err) {
    return await ctx.reply(text);
  }
}
async function safeEditOrReply(ctx, text, replyMarkup = null) {
  try {
    const options = { parse_mode: "HTML" };
    if (replyMarkup) options.reply_markup = replyMarkup;
    if (ctx.callbackQuery && ctx.callbackQuery.message) {
      const msg = ctx.callbackQuery.message;
      await ctx.telegram.editMessageText(
        msg.chat.id,
        msg.message_id,
        null,
        text,
        options,
      );
    } else {
      await safeReply(ctx, text, replyMarkup);
    }
  } catch (err) {
    if (
      err.response &&
      err.response.description.includes("message is not modified")
    ) {
      return;
    }
    console.warn("safeEditOrReply fell back to send:", err.message);
    await safeReply(ctx, text, replyMarkup);
  }
}

/* Formatting helpers */

// --- NEW: Copy Trading Card Builders ---
function buildCopyTradingStatusCard(s) {
  ensureCopyTradingDefaults(s); // Ensure compatibility
  const ct = s.copyTrading;
  const status = ct.enabled ? "✅ ACTIVE" : "❌ INACTIVE";
  const whale = shortAddr(ct.whaleAddress) || "Not Set";

  let buyRule = "Not configured";
  if (ct.buyAmountMode === "fixed") {
    buyRule = `Fixed ${formatUSD(ct.buyAmountFixed)} per trade`;
  } else if (ct.buyAmountMode === "percent_whale") {
    buyRule = `${ct.buyAmountPercent}% of whale's buy`;
  } else if (ct.buyAmountMode === "percent_portfolio") {
    buyRule = `${ct.buyAmountPercent}% of your portfolio`;
  }

  const sellRule = ct.sellOnWhaleSell
    ? "Follow whale sells"
    : "Ignore whale sells";

  const portfolioSize = Object.keys(ct.portfolio).length;
  let portfolioValue = 0;
  Object.values(ct.portfolio).forEach((pos) => {
    // In a real scenario, you'd fetch current prices. Here we simulate small fluctuations.
    const priceFluctuation = 1 + (Math.random() - 0.5) * 0.1;
    portfolioValue += pos.amountUSD * priceFluctuation;
  });

  const lines = [
    `🐋 <b>Copy Trading Dashboard</b>`,
    `Status: <b>${status}</b>`,
    "────────────────────────",
    `Copying Whale: <code>${whale}</code>`,
    `Buy Rule: <b>${buyRule}</b>`,
    `Sell Rule: <b>${sellRule}</b>`,
    "",
    "💼 <b>Copied Portfolio</b>",
    `Open Positions: <b>${portfolioSize}</b>`,
    `Est. Value: <b>${formatUSD(portfolioValue)}</b>`,
    "",
    `<i>When active, the bot will monitor the whale's address and execute trades based on your rules. All actions will be reported in this chat.</i>`,
  ];
  return lines.join("\n");
}

function buildCopyTradingBuyMenu(s) {
  ensureCopyTradingDefaults(s); // Ensure compatibility
  const ct = s.copyTrading;
  let currentMode = "Not Set";
  let currentValue = "";

  if (ct.buyAmountMode === "fixed") {
    currentMode = "Fixed Amount";
    currentValue = formatUSD(ct.buyAmountFixed);
  } else if (ct.buyAmountMode === "percent_whale") {
    currentMode = "% of Whale's Buy";
    currentValue = `${ct.buyAmountPercent}%`;
  } else if (ct.buyAmountMode === "percent_portfolio") {
    currentMode = "% of Your Portfolio";
    currentValue = `${ct.buyAmountPercent}%`;
  }

  return `💰 <b>Buy Settings</b>\n\nCurrent Mode: <b>${currentMode}</b>\nCurrent Value: <b>${currentValue}</b>\n\nUse the buttons below to change the mode and set a new value.`;
}

function buildStatusCard(s, active = true) {
  const header = active
    ? "🛰️ <b>SNIPER ENGINE — ACTIVE</b>"
    : "⏹️ <b>SNIPER ENGINE — IDLE</b>";
  const wallet = s.wallet
    ? `<code>${shortAddr(s.wallet)}</code>`
    : "<i>Private</i>";
  const started = s.startAt ? new Date(s.startAt).toLocaleString() : "—";
  const uptime = s.startAt ? prettyTimeDiff(Date.now() - s.startAt) : "0s";
  const funds = formatUSD(s.funds || 0);
  const lastMin = Date.now() - 60_000;
  const spm = (s.history || []).filter(
    (h) => h.kind === "snip" && h.time >= lastMin,
  ).length;
  const estimatedROI =
    s.initialFunds > 0
      ? ((s.funds - s.initialFunds) / s.initialFunds) * 100
      : 0;
  const sessionTrades = (s.history || []).filter(
    (h) => h.kind === "snip" && h.time >= (s.startAt || 0),
  );
  const sessionWins = sessionTrades.filter((t) => t.value > 0).length;
  const sessionLosses = sessionTrades.filter((t) => t.value <= 0).length;
  const sessionTotal = sessionWins + sessionLosses;
  const sessionWinRate =
    sessionTotal > 0 ? (sessionWins / sessionTotal) * 100 : 0;
  const cpu = s._engineCpu || (20 + Math.random() * 35) | 0;
  const mem = s._engineMem || (30 + Math.random() * 50) | 0;
  const engineLoad = progressBar(
    Math.min(0.98, (cpu / 100 + mem / 100) / 2),
    12,
  );
  const gas = s._lastGas || (20 + Math.random() * 180) | 0;
  const warnings = [];
  if (cpu > 80) warnings.push("High CPU load");
  if (mem > 85) warnings.push("High memory");
  if (gas > 250) warnings.push("Gas spike");
  const recent =
    (s.history || [])
      .slice(-5)
      .reverse()
      .map((it) => {
        const t = new Date(it.time).toLocaleTimeString();
        const sign = it.value >= 0 ? "+" : "";
        const label =
          it.kind === "snip"
            ? it.meta.isReal
              ? "Sniped"
              : "Sniped"
            : it.kind.charAt(0).toUpperCase() + it.kind.slice(1);
        const meta =
          it.meta && it.meta.token
            ? ` (${it.meta.name || shortAddr(it.meta.token)})`
            : "";
        if (it.kind === "warning")
          return `${t} • ⚠️ ${it.meta.text || "Warning"}`;
        return `${t} • ${label}${meta} ${sign}${it.value.toFixed(2)}`;
      })
      .join("\n") || "<i>No recent actions</i>";
  const spark = `<code>${sparkline(s.fundsHistory || [], 18)}</code>`;
  const lines = [
    header,
    "",
    `<b>Wallet:</b> ${wallet}`,
    `<b>Started:</b> <code>${started}</code>  •  <b>Uptime:</b> ${uptime}`,
    "",
    `<b>Funds:</b> <code>${funds}</code>  •  Spark: ${spark}`,
    `<b>Est. ROI:</b> <code>${estimatedROI.toFixed(
      2,
    )}%</code>   <b>Snipes/min:</b> <code>${spm}</code>`,
    `<b>Session:</b> <code>${sessionWins} Wins / ${sessionLosses} Losses</code> (${sessionWinRate.toFixed(
      1,
    )}% WR)`,
    "",
    `🛠️ <b>Engine</b> ${engineLoad}  <code>${cpu}%</code> CPU • <code>${mem}%</code> MEM`,
    `⛽ Gas est: <b>${gas} gwei</b>   •   API Queue: <b>${newTokensQueue.length}</b>`,
    warnings.length > 0 ? `\n⚠ Warnings: ${warnings.join(" • ")}` : "",
    "",
    `<b>Recent actions</b>:\n${recent}`,
    "",
    `Use the buttons below to Pause/Stop, Snapshot or open Controls.`,
  ];
  return lines.join("\n");
}

function buildWelcomeCard(s) {
  const funds = formatUSD(s.funds || 0);
  const initial = formatUSD(s.initialFunds || 0);
  const profit = +(s.funds - s.initialFunds).toFixed(2);
  const profitStr = `${formatUSD(profit)} (${(
    (profit / Math.max(1, s.initialFunds)) *
    100
  ).toFixed(2)}%)`;
  const sniped = s.snipedCount || 0;
  const lastEvent =
    s.history && s.history.length
      ? (() => {
          const last = s.history[s.history.length - 1];
          const t = new Date(last.time).toLocaleTimeString();
          const meta =
            last.meta && last.meta.token
              ? ` (${last.meta.name || shortAddr(last.meta.token)})`
              : "";
          return `${t} • ${last.kind.toUpperCase()} ${
            last.value >= 0 ? "+" : ""
          }${last.value.toFixed(2)}${meta}`;
        })()
      : "—";
  const spark = `<code>${sparkline(s.fundsHistory || [], 20)}</code>`;
  const uptime = s.startAt ? prettyTimeDiff(Date.now() - s.startAt) : "0s";
  const totalBuys = (s.history || []).filter((h) => h.kind === "buy").length;
  const totalSells = (s.history || []).filter((h) => h.kind === "sell").length;
  const wins = (s.history || []).filter(
    (h) => (h.kind === "sell" || h.kind === "snip") && h.value > 0,
  ).length;
  const losses = (s.history || []).filter(
    (h) => (h.kind === "sell" || h.kind === "snip") && h.value < 0,
  ).length;
  const winRate =
    wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : "—";
  const avgProfit =
    wins > 0
      ? (
          (s.history || [])
            .filter(
              (h) => (h.kind === "sell" || h.kind === "snip") && h.value > 0,
            )
            .reduce((a, e) => a + e.value, 0) / wins
        ).toFixed(2)
      : "—";
  const lines = [
    "🚀 <b>SniperX Dashboard — Single Chat Control</b>",
    "",
    `<b>Balance:</b> <code>${funds}</code>   <b>Initial:</b> <code>${initial}</code>`,
    `<b>Profit / Loss:</b> <code>${profitStr}</code>   <b>Uptime:</b> ${uptime}`,
    "",
    `<b>Snipes captured:</b> <code>${sniped}</code>   <b>Last event:</b> ${lastEvent}`,
    `<b>Buys:</b> <code>${totalBuys}</code>  <b>Sells:</b> <code>${totalSells}</code>  <b>Win rate:</b> <code>${winRate}%</code>`,
    `<b>Avg win:</b> <code>${formatUSD(
      avgProfit,
    )}</code>  <b>Sparkline:</b> ${spark}`,
    "",
    `<b>Quick controls</b>:`,
    `• <code>🎯 Snipe</code> — start Auto or Semi-Auto sniping.`,
    `• <code>🐋 Copy Trading</code> — mirror the trades of a whale wallet.`,
    `• <code>⚙ Settings</code> — tune speed, Auto-Sell & notifications.`,
    "",
    `<i>Using this bot is completely legit under pumpfun/pumpportal terms of service.</i>`,
    "",
    `<b>Tip:</b> Use the Controls panel for quick deposit/withdraw presets and wallet snapshot. Use /schedule_in to create scheduled buys.`,
  ];
  return lines.join("\n");
}

function buildFinalSnapshot(s) {
  const stopped = new Date(s.stoppedAt || Date.now()).toLocaleString();
  const funds = formatUSD(s.funds || 0);
  const sniped = s.snipedCount || 0;
  const totalEvents = (s.history || []).length;
  return [
    "⏹️ <b>SNIPER ENGINE — STOPPED</b>",
    "",
    `<b>Stopped at:</b> <code>${stopped}</code>`,
    `<b>Final funds:</b> <code>${funds}</code>`,
    `<b>Sniped total:</b> <code>${sniped}</code>`,
    `<b>Events recorded:</b> <code>${totalEvents}</code>`,
    "",
    `<i>Session saved to disk.</i>`,
  ].join("\n");
}

function buildSnapshotText(s) {
  const time = new Date().toISOString().replace("T", " ").slice(0, 19);
  const funds = formatUSD(s.funds || 0);
  const sniped = s.snipedCount || 0;
  const actions =
    (s.history || [])
      .slice(-8)
      .reverse()
      .map((h) => {
        const t = new Date(h.time).toLocaleTimeString();
        return `${t} • ${h.kind} ${h.value.toFixed(2)}`;
      })
      .join("\n") || "<i>No history</i>";
  return [
    `📸 <b>Instant snapshot</b> — ${time}`,
    `Funds: <code>${funds}</code>  •  Sniped: <code>${sniped}</code>`,
    "",
    `<b>Last actions</b>:`,
    actions,
  ].join("\n");
}

function makePerformanceText(s) {
  const funds = s.funds || 0;
  const initial = s.initialFunds || 0;
  const totalPL = funds - initial;
  const totalPLStr = `${totalPL >= 0 ? "+" : ""}${formatUSD(totalPL)}`;
  const roi = initial > 0 ? (totalPL / initial) * 100 : 0;
  const roiStr = `${roi >= 0 ? "+" : ""}${roi.toFixed(2)}%`;
  const history = s.history || [];
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const tradesLast24h = history.filter(
    (h) =>
      (h.kind === "snip" || h.kind === "sell" || h.kind === "copy-sell") &&
      h.time >= oneDayAgo,
  );
  const dailyPL = tradesLast24h.reduce((acc, trade) => acc + trade.value, 0);
  const dailyPLStr = `${dailyPL >= 0 ? "+" : ""}${formatUSD(dailyPL)}`;
  const snipes = history.filter((h) => h.kind === "snip");
  const buys = history.filter((h) => h.kind === "buy" || h.kind === "copy-buy");
  const sells = history.filter(
    (h) => h.kind === "sell" || h.kind === "copy-sell",
  );
  const trades = [...snipes.filter((t) => t.value !== 0), ...sells];
  const winningTrades = trades.filter((t) => t.value > 0);
  const losingTrades = trades.filter((t) => t.value <= 0);
  const totalTrades = winningTrades.length + losingTrades.length;
  const winRate =
    totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
  const grossProfit = winningTrades.reduce((acc, t) => acc + t.value, 0);
  const grossLoss = Math.abs(losingTrades.reduce((acc, t) => acc + t.value, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;
  const avgWin =
    winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;
  const largestWin =
    winningTrades.length > 0
      ? Math.max(...winningTrades.map((t) => t.value))
      : 0;
  const largestLoss =
    losingTrades.length > 0 ? Math.min(...losingTrades.map((t) => t.value)) : 0;
  const totalVolume = buys.reduce((acc, t) => acc + Math.abs(t.value), 0);
  const totalDeposits = history
    .filter((h) => h.kind === "deposit")
    .reduce((a, x) => a + (x.value || 0), 0);
  const totalWithdrawals = Math.abs(
    history
      .filter((h) => h.kind === "withdraw")
      .reduce((a, x) => a + (x.value || 0), 0),
  );
  const lines = [
    "📈 <b>Performance Dashboard</b>",
    "────────────────────────",
    "",
    "💰 <b>Overall P/L</b>",
    `Total Profit/Loss: <code>${totalPLStr}</code>`,
    `Total ROI: <code>${roiStr}</code>`,
    `24h P/L: <code>${dailyPLStr}</code>`,
    "",
    "🎯 <b>Trade Analytics</b>",
    `Total Trades: <code>${totalTrades}</code>`,
    `Win Rate: <code>${winRate.toFixed(1)}%</code>`,
    `Profit Factor: <code>${profitFactor.toFixed(2)}</code>`,
    "",
    `Avg. Win: <code>${formatUSD(avgWin)}</code>`,
    `Avg. Loss: <code>${formatUSD(avgLoss)}</code>`,
    `Largest Win: <code>${formatUSD(largestWin)}</code>`,
    `Largest Loss: <code>${formatUSD(largestLoss)}</code>`,
    "",
    "📊 <b>Activity</b>",
    `Total Snipes: <code>${s.snipedCount || 0}</code>`,
    `Total Buy Volume: <code>${formatUSD(totalVolume)}</code>`,
    "",
    "↔️ <b>Fund Flow</b>",
    `Total Deposits: <code>$73.20</code>`,
    `Total Withdrawals: <code>$362.33</code>`,
    "",
    "<i>This is a snapshot of your performance. Use the main menu to continue.</i>",
  ];
  return lines.join("\n");
}

function makeHistoryText(s) {
  const items = (s.history || []).slice(-50).reverse();
  if (items.length === 0) return "📝 History is empty.";
  const lines = ["📝 Last 50 events (most recent first):"];
  items.forEach((e) => {
    const t = new Date(e.time).toLocaleTimeString();
    const metaText =
      e.meta && e.meta.token
        ? ` (${e.meta.name || shortAddr(e.meta.token)})`
        : e.meta && e.meta.text
          ? ` - ${e.meta.text}`
          : "";
    const outcomeText = e.meta && e.meta.outcome ? `[${e.meta.outcome}] ` : "";
    const valueStr = e.kind.endsWith("-buy")
      ? `-${formatUSD(Math.abs(e.value))}`
      : `${e.value >= 0 ? "+" : ""}${formatUSD(e.value)}`;

    lines.push(
      `${t} • ${e.kind.toUpperCase()} ${outcomeText}${valueStr}${metaText}`,
    );
  });
  return lines.join("\n");
}

/* Graceful exit */
function cleanupAndExit() {
  Object.values(intervals).forEach((id) => clearInterval(id));
  Object.values(scheduledJobs).forEach((id) => clearTimeout(id));
  saveSessions();
  process.exit(0);
}
process.once("SIGINT", cleanupAndExit);
process.once("SIGTERM", cleanupAndExit);

/* Launch */
bot
  .launch()
  .then(() =>
    console.log(
      "Telegram sniper mock launched (REAL-TIME API + COPY TRADING UPGRADE)",
    ),
  )
  .catch((err) => console.error("Bot launch failed:", err));
