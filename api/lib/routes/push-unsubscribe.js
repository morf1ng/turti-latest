import { ok, fail, methodNotAllowed, readJson } from "../http.js";
import { storeGet, storeSet } from "../kv.js";

export async function handle(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  try {
    const body = await readJson(req);
    const endpoint = body.endpoint;
    if (!endpoint) return fail(res, 400, "endpoint required");

    const subs = (await storeGet("push:subs")) || [];
    await storeSet(
      "push:subs",
      subs.filter((s) => s.endpoint !== endpoint)
    );
    ok(res, { removed: true });
  } catch (e) {
    fail(res, 500, e.message);
  }
}
