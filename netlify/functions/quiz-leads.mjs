import { cleanText, handleError, json, methodNotAllowed, normalizePhone, PublicError, readJSON } from "../lib/http.mjs";
import { escapeHTML, notifyAdmins, quizLeadKeyboard, telegramConfigured } from "../lib/telegram.mjs";

const answerLabels = {
  age: {
    "18-24": "18–24 года",
    "25-34": "25–34 года",
    "35-44": "35–44 года",
    "45-plus": "45 лет и старше",
    skip: "не указал(а)",
  },
  wellbeing: {
    steady: "В целом чувствую себя обычно",
    attention: "Хочется внимательнее относиться к себе",
    exploring: "Пока не знаю, с чего начать",
    skip: "Не хочу отвечать",
  },
  reason: {
    women: "Услышала об инозитоле в теме женского самочувствия",
    understand: "Хочу понять, что это за вещество",
    considering: "Рассматриваю БАД и сначала собираю информацию",
    curious: "Стало любопытно, пока без конкретных планов",
  },
  focus: {
    basics: "Что такое инозитол — коротко и понятно",
    product: "Что входит в продукт и как его принимают",
    personal: "Хочет понять, может ли он подойти лично ей",
    overview: "Хочет спокойно разобраться в теме",
  },
};

function selectedAnswer(group, value) {
  const label = answerLabels[group]?.[value];
  if (!label) throw new PublicError("Пожалуйста, пройдите все вопросы ещё раз.");
  return label;
}

export default async (request) => {
  if (request.method !== "POST") return methodNotAllowed(["POST"]);

  try {
    if (!telegramConfigured()) throw new PublicError("Отправка анкет пока не настроена.", 503);
    const body = await readJSON(request, 8_000);
    if (body.quizId !== "inositol-prelanding-v1") throw new PublicError("Неизвестная анкета.");
    if (body.consent !== true) throw new PublicError("Нужно согласие на передачу данных менеджеру.");

    const contactRaw = cleanText(body.contact, 120);
    let contactLine = "Контакт не указан — ответить пользователю напрямую нельзя.";
    if (contactRaw) {
      const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactRaw);
      if (email) {
        contactLine = `📧 <b>E-mail:</b> <code>${escapeHTML(contactRaw)}</code>`;
      } else if (/^[+\d()\s.-]+$/.test(contactRaw)) {
        const contact = `+${normalizePhone(contactRaw)}`;
        contactLine = `📞 <b>Телефон:</b> <code>${escapeHTML(contact)}</code>`;
      } else {
        throw new PublicError("Укажите корректный телефон или адрес e-mail.");
      }
    }

    const answers = body.answers || {};
    const answerLines = [
      `Возраст: ${selectedAnswer("age", answers.age)}`,
      `Самочувствие: ${selectedAnswer("wellbeing", answers.wellbeing)}`,
      `Почему интересен инозитол: ${selectedAnswer("reason", answers.reason)}`,
      `Что хочет прояснить: ${selectedAnswer("focus", answers.focus)}`,
    ];
    const message = [
      "📝 <b>Новая анкета · Знакомство с инозитолом</b>",
      "Источник: прелендинг KONONOV",
      "",
      ...answerLines.map((line) => escapeHTML(line)),
      "",
      contactLine,
      "✅ Пользователь согласился передать выбранные ответы менеджерам бренда в Telegram.",
    ].join("\n");

    const delivery = await notifyAdmins(message, { reply_markup: quizLeadKeyboard() });
    if (!delivery.delivered) {
      return json({ ok: false, error: "Не удалось доставить анкету менеджерам. Попробуйте позже или откройте информацию без отправки." }, 503);
    }
    return json({ ok: true }, 201);
  } catch (error) {
    return handleError(error);
  }
};

export const config = {
  path: "/api/quiz-leads",
  method: "POST",
  rateLimit: { action: "rate_limit", aggregateBy: ["domain", "ip"], windowSize: 60, windowLimit: 8 },
};
