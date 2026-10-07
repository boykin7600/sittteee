import test from "node:test";
import assert from "node:assert/strict";

import {
  cleanText,
  normalizePhone,
  safeSession,
} from "../netlify/lib/http.mjs";
import orders, { config as ordersConfig } from "../netlify/functions/orders.mjs";
import webhook, { config as webhookConfig } from "../netlify/functions/telegram-webhook.mjs";
import setup, { config as setupConfig } from "../netlify/functions/telegram-setup.mjs";
import events, { config as eventsConfig } from "../netlify/functions/events.mjs";
import chat, { config as chatConfig } from "../netlify/functions/chat.mjs";
import health, { config as healthConfig } from "../netlify/functions/health.mjs";
import {
  adminMenuKeyboard,
  chatReplyPrompt,
  clientCardKeyboard,
  clientsKeyboard,
  quizLeadKeyboard,
} from "../netlify/lib/telegram.mjs";
import { isPermanentAdmin, PERMANENT_ADMIN_IDS } from "../netlify/lib/data.mjs";
import result, { config as resultConfig } from "../netlify/functions/robokassa-result.mjs";
import success, { config as successConfig } from "../netlify/functions/robokassa-success.mjs";
import fail, { config as failConfig } from "../netlify/functions/robokassa-fail.mjs";
import {
  createPaymentURL,
  money,
  verifyResultSignature,
} from "../netlify/lib/robokassa.mjs";

test("input helpers normalize and constrain public values", () => {
  assert.equal(normalizePhone("+7 (999) 123-45-67"), "79991234567");
  assert.equal(normalizePhone("9991234567"), "79991234567");
  assert.equal(cleanText("  Анна\n  Иванова  "), "Анна Иванова");
  assert.equal(safeSession("12345678-abcd"), "12345678-abcd");
  assert.throws(() => normalizePhone("123"));
  assert.throws(() => safeSession("bad"));
});

test("all functions expose unique public routes", () => {
  const entries = [
    [orders, ordersConfig],
    [webhook, webhookConfig],
    [setup, setupConfig],
    [events, eventsConfig],
    [chat, chatConfig],
    [health, healthConfig],
    [result, resultConfig],
    [success, successConfig],
    [fail, failConfig],
  ];
  assert.ok(entries.every(([handler]) => typeof handler === "function"));
  const paths = entries.map(([, config]) => config.path);
  assert.equal(new Set(paths).size, paths.length);
  assert.ok(paths.every((path) => path.startsWith("/api/")));
});

test("Robokassa payment signatures bind amount, invoice and order", () => {
  const previous = {
    login: process.env.ROBOKASSA_MERCHANT_LOGIN,
    password1: process.env.ROBOKASSA_PASSWORD_1,
    password2: process.env.ROBOKASSA_PASSWORD_2,
  };
  process.env.ROBOKASSA_MERCHANT_LOGIN = "kononovhealth";
  process.env.ROBOKASSA_PASSWORD_1 = "one";
  process.env.ROBOKASSA_PASSWORD_2 = "two";
  assert.equal(money(1799), "1799.00");
  const url = new URL(createPaymentURL({
    amount: 1799,
    invoiceId: 7,
    orderId: "K-000007",
    description: "Order",
  }));
  assert.equal(url.searchParams.get("MerchantLogin"), "kononovhealth");
  assert.equal(url.searchParams.get("OutSum"), "1799.00");
  assert.equal(url.searchParams.get("InvId"), "7");
  assert.equal(url.searchParams.get("Shp_orderId"), "K-000007");
  assert.equal(verifyResultSignature({
    outSum: "1799.00",
    invoiceId: "7",
    orderId: "K-000007",
    signature: "bad",
  }), false);
  if (previous.login === undefined) delete process.env.ROBOKASSA_MERCHANT_LOGIN;
  else process.env.ROBOKASSA_MERCHANT_LOGIN = previous.login;
  if (previous.password1 === undefined) delete process.env.ROBOKASSA_PASSWORD_1;
  else process.env.ROBOKASSA_PASSWORD_1 = previous.password1;
  if (previous.password2 === undefined) delete process.env.ROBOKASSA_PASSWORD_2;
  else process.env.ROBOKASSA_PASSWORD_2 = previous.password2;
});

test("health endpoint never exposes secret values", async () => {
  const response = await health();
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal("token" in body, false);
});

test("orders fail safely before Telegram is configured", async () => {
  const previous = process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_BOT_TOKEN;
  const response = await orders(new Request("https://example.test/api/orders", {
    method: "POST",
    body: "{}",
  }));
  assert.equal(response.status, 503);
  if (previous) process.env.TELEGRAM_BOT_TOKEN = previous;
});

test("Telegram endpoints reject unauthenticated requests", async () => {
  const webhookResponse = await webhook(new Request("https://example.test/api/telegram/webhook", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  }));
  assert.equal(webhookResponse.status, 401);

  const setupResponse = await setup(new Request("https://example.test/api/telegram/setup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ setupKey: "wrong" }),
  }));
  assert.equal(setupResponse.status, 401);
});

test("unknown analytics events are accepted without storage or notifications", async () => {
  const response = await events(new Request("https://example.test/api/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sessionId: "12345678-abcd", type: "not_allowed" }),
  }));
  assert.equal(response.status, 200);
});

test("unsupported chat method is rejected", async () => {
  const response = await chat(new Request("https://example.test/api/chat", { method: "PUT" }));
  assert.equal(response.status, 405);
});

test("Telegram reply action opens a native message field", () => {
  assert.deepEqual(chatReplyPrompt(), {
    force_reply: true,
    selective: true,
    input_field_placeholder: "Напишите сообщение клиенту…",
  });
});

test("Telegram admin menu exposes client CRM navigation", () => {
  assert.deepEqual(adminMenuKeyboard().keyboard[0].map((button) => button.text), ["👥 Клиенты", "ℹ️ Помощь"]);
  assert.equal(adminMenuKeyboard().is_persistent, true);
  assert.equal(quizLeadKeyboard().inline_keyboard[0][0].callback_data, "quizlead:take");
  assert.equal(quizLeadKeyboard().inline_keyboard[0][1].callback_data, "quizlead:done");
  const keyboard = clientsKeyboard([
    { clientId: "C-000001", name: "Анна", phone: "79991234567" },
  ], { page: 0, hasNext: true });
  assert.equal(keyboard.inline_keyboard[0][0].callback_data, "clients:view:C-000001");
  assert.equal(keyboard.inline_keyboard[1][0].callback_data, "clients:list:1");
  assert.equal(clientCardKeyboard().inline_keyboard[0][0].callback_data, "clients:list:0");
});

test("the additional Telegram administrator has permanent access", () => {
  assert.ok(PERMANENT_ADMIN_IDS.includes("994679430"));
  assert.equal(isPermanentAdmin(994679430), true);
  assert.equal(isPermanentAdmin("994679430"), true);
});
