import { storeGet, storeSet } from "./kv.js";

export const STORY_VIDEO_KEY = "site:story-video";

export async function getStoryVideo() {
  return (await storeGet(STORY_VIDEO_KEY)) || null;
}

export async function setStoryVideo(data) {
  await storeSet(STORY_VIDEO_KEY, {
    url: data.url,
    contentType: data.contentType || "",
    name: data.name || "",
    updatedAt: new Date().toISOString(),
  });
}

export async function clearStoryVideo() {
  await storeSet(STORY_VIDEO_KEY, null);
}
