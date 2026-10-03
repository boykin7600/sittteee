import { getStore } from "@netlify/blobs";

const store = () => getStore({ name: "kononov-crm", consistency: "strong" });
const pad = (value) => String(value).padStart(6, "0");

// Permanent administrators receive every order, support message and site event.
// Telegram only allows a bot to message a person after that person has pressed Start.
export const PERMANENT_ADMIN_IDS = Object.freeze(["994679430"]);

function environmentAdminIds() {
  return String(process.env.PRIMARY_ADMIN_ID || process.env.TELEGRAM_ADMIN_CHAT_ID || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function isPermanentAdmin(userId) {
  return PERMANENT_ADMIN_IDS.includes(String(userId));
}

export async function getJSON(key) {
  return store().get(key, { type: "json", consistency: "strong" });
}

export async function putJSON(key, value, options = {}) {
  return store().setJSON(key, value, options);
}

export async function remove(key) {
  return store().delete(key);
}

export async function nextNumber(name) {
  const key = `counter/${name}`;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const current = await store().getWithMetadata(key, {
      type: "json",
      consistency: "strong",
    });

    if (!current) {
      const created = await store().setJSON(key, { value: 1 }, { onlyIfNew: true });
      if (created.modified) return 1;
      continue;
    }

    const value = Number(current.data?.value || 0) + 1;
    const updated = await store().setJSON(
      key,
      { value },
      { onlyIfMatch: current.etag },
    );
    if (updated.modified) return value;
  }
  throw new Error(`Could not allocate ${name} number`);
}

export async function updateJSON(key, updater, fallback = null) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const current = await store().getWithMetadata(key, {
      type: "json",
      consistency: "strong",
    });
    const next = await updater(current?.data ?? fallback);
    const result = current
      ? await store().setJSON(key, next, { onlyIfMatch: current.etag })
      : await store().setJSON(key, next, { onlyIfNew: true });
    if (result.modified) return next;
  }
  throw new Error(`Could not update ${key}`);
}

export async function findOrCreateClient({ name, phone, city }) {
  const phoneKey = `client-phone/${phone}`;
  const existing = await getJSON(phoneKey);
  if (existing?.clientId) {
    const client = await updateJSON(
      `client/${existing.clientId}`,
      (current) => ({
        ...current,
        name: name || current?.name || "",
        city: city || current?.city || "",
        phone,
        updatedAt: new Date().toISOString(),
      }),
      {},
    );
    return client;
  }

  const number = await nextNumber("clients");
  const clientId = `C-${pad(number)}`;
  const mapping = await putJSON(phoneKey, { clientId }, { onlyIfNew: true });
  if (!mapping.modified) {
    const winner = await getJSON(phoneKey);
    return getJSON(`client/${winner.clientId}`);
  }

  const client = {
    clientId,
    number,
    name,
    phone,
    city,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await putJSON(`client/${clientId}`, client, { onlyIfNew: true });
  return client;
}

export async function createOrder(payload) {
  const number = await nextNumber("orders");
  const orderId = `K-${pad(number)}`;
  const order = {
    ...payload,
    orderId,
    number,
    status: "new",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await putJSON(`order/${orderId}`, order, { onlyIfNew: true });
  return order;
}

export async function listClients({ limit = 8, offset = 0 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 8, 1), 20);
  const safeOffset = Math.max(Number(offset) || 0, 0);
  const { blobs } = await store().list({ prefix: "client/" });
  const clients = (await Promise.all(blobs.map((blob) => getJSON(blob.key))))
    .filter((client) => client?.clientId)
    .sort((left, right) => {
      const leftDate = new Date(left.updatedAt || left.createdAt || 0).getTime();
      const rightDate = new Date(right.updatedAt || right.createdAt || 0).getTime();
      return rightDate - leftDate;
    });
  return {
    clients: clients.slice(safeOffset, safeOffset + safeLimit),
    total: clients.length,
    offset: safeOffset,
    limit: safeLimit,
  };
}

export async function getClientOrders(clientId, limit = 10) {
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 20);
  const { blobs } = await store().list({ prefix: "order/" });
  const orders = (await Promise.all(blobs.map((blob) => getJSON(blob.key))))
    .filter((order) => order?.clientId === clientId)
    .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));
  return {
    orders: orders.slice(0, safeLimit),
    total: orders.length,
  };
}

export async function updateOrder(orderId, patch) {
  return updateJSON(`order/${orderId}`, (current) => {
    if (!current) throw new Error("Order not found");
    return { ...current, ...patch, updatedAt: new Date().toISOString() };
  });
}

export async function appendChatMessage(sessionId, message, identity = null) {
  return updateJSON(
    `chat/${sessionId}`,
    (current) => ({
      sessionId,
      identity: identity || current?.identity || null,
      messages: [...(current?.messages || []), message].slice(-200),
      updatedAt: new Date().toISOString(),
    }),
    { sessionId, identity, messages: [] },
  );
}

export async function listAdmins() {
  const ids = new Set([...PERMANENT_ADMIN_IDS, ...environmentAdminIds()]);
  const { blobs } = await store().list({ prefix: "admin/" });
  for (const blob of blobs) {
    const admin = await getJSON(blob.key);
    if (admin?.active && admin?.chatId) ids.add(String(admin.chatId));
  }
  return [...ids];
}

export async function isAdmin(userId) {
  const id = String(userId);
  if (isPermanentAdmin(id) || environmentAdminIds().includes(id)) return true;
  const admin = await getJSON(`admin/${id}`);
  return Boolean(admin?.active);
}

export { pad };
