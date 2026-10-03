export const securityHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
};

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...securityHeaders, ...extraHeaders },
  });
}

export function methodNotAllowed(allowed) {
  return json(
    { error: "Метод не поддерживается" },
    405,
    { allow: allowed.join(", ") },
  );
}

export async function readJSON(request, maxBytes = 24_000) {
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > maxBytes) {
    throw new PublicError("Слишком большой запрос", 413);
  }
  try {
    return JSON.parse(raw || "{}");
  } catch {
    throw new PublicError("Некорректные данные", 400);
  }
}

export class PublicError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export function cleanText(value, maxLength = 300) {
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function normalizePhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) {
    throw new PublicError("Проверьте номер телефона");
  }
  return digits.length === 10 ? `7${digits}` : digits;
}

export function safeSession(value) {
  const session = cleanText(value, 80);
  if (!/^[a-zA-Z0-9_-]{8,80}$/.test(session)) {
    throw new PublicError("Некорректная сессия");
  }
  return session;
}

export function handleError(error) {
  if (error instanceof PublicError) {
    return json({ error: error.message }, error.status);
  }
  console.error(error);
  return json({ error: "Временная ошибка сервера. Попробуйте ещё раз." }, 500);
}
