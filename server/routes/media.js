import { ok, fail, methodNotAllowed } from "../http.js";
import { getStoryVideo } from "../story-video.js";

export async function handle(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  const kind = String(req.query.kind || "").trim();
  if (kind === "story") {
    const v = await getStoryVideo();
    return ok(res, {
      url: v?.url || "",
      contentType: v?.contentType || "",
      updatedAt: v?.updatedAt || "",
    });
  }

  return fail(res, 400, "Неизвестный тип");
}
