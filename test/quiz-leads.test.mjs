import test from 'node:test';
import assert from 'node:assert/strict';
import quizLeads, {config} from '../netlify/functions/quiz-leads.mjs';
import webhook from '../netlify/functions/telegram-webhook.mjs';
import {quizLeadKeyboard} from '../netlify/lib/telegram.mjs';
import {PERMANENT_ADMIN_IDS} from '../netlify/lib/data.mjs';

test('quiz lead function imports and rejects unsupported methods', async () => {
  const response = await quizLeads(new Request('https://example.test/api/quiz-leads'));
  assert.equal(response.status, 405);
  assert.equal(config.path, '/api/quiz-leads');
});

test('quiz notification buttons support taking and completing a lead', () => {
  assert.deepEqual(quizLeadKeyboard().inline_keyboard[0].map(b => b.callback_data), ['quizlead:take','quizlead:done']);
});

test('quiz callbacks update status safely without sending real messages', async () => {
  const originalFetch = globalThis.fetch;
  const oldToken = process.env.TELEGRAM_BOT_TOKEN;
  const oldSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  process.env.TELEGRAM_BOT_TOKEN = 'test-token';
  process.env.TELEGRAM_WEBHOOK_SECRET = 'test-secret';
  const calls = [];
  globalThis.fetch = async (url, options) => {
    assert.match(String(url), /^https:\/\/api\.telegram\.org\/bottest-token\//);
    calls.push({url: String(url), body: JSON.parse(options.body)});
    return new Response(JSON.stringify({ok:true,result:true}), {status:200});
  };
  try {
    for (const action of ['take','done']) {
      calls.length = 0;
      const response = await webhook(new Request('https://example.test/api/telegram/webhook', {
        method:'POST', headers:{'content-type':'application/json','x-telegram-bot-api-secret-token':'test-secret'},
        body:JSON.stringify({callback_query:{id:'test-callback',from:{id:PERMANENT_ADMIN_IDS[0]},data:`quizlead:${action}`,message:{message_id:1,chat:{id:PERMANENT_ADMIN_IDS[0]},text:'Анкета <пример> & контакт\n\nСтатус обработки: В работе'}}})
      }));
      assert.equal(response.status,200);
      const edit = calls.find(c => c.url.endsWith('/editMessageText')).body;
      assert.match(edit.text,/Анкета &lt;пример&gt; &amp; контакт/);
      assert.equal((edit.text.match(/Статус обработки:/g)||[]).length,1);
      assert.match(edit.text,action === 'take' ? /В работе$/ : /Завершено$/);
      assert.equal(edit.reply_markup.inline_keyboard.length, action === 'take' ? 1 : 0);
      assert.ok(calls.some(c=>c.url.endsWith('/answerCallbackQuery')));
    }
  } finally {
    globalThis.fetch = originalFetch;
    if(oldToken===undefined) delete process.env.TELEGRAM_BOT_TOKEN; else process.env.TELEGRAM_BOT_TOKEN=oldToken;
    if(oldSecret===undefined) delete process.env.TELEGRAM_WEBHOOK_SECRET; else process.env.TELEGRAM_WEBHOOK_SECRET=oldSecret;
  }
});
