import browser from "webextension-polyfill";
import { PostMessage } from "../common/CommonType";
import { postToMisskey } from "./MisskeyAPI";

browser.runtime.onMessage.addListener((message: unknown, _sender) => {
  if (message && (message as any).type == "post") {
    const { text, attachments, options } = message as PostMessage;
    return postToMisskey(text, attachments, options);
  }
});
