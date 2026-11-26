#!/usr/bin/env python3
from pathlib import Path

path = Path(__file__).resolve().parents[1] / "src/views/live/composables/useChat.ts"
text = path.read_text(encoding="utf-8")

text = text.replace(
    """  function waitForSdkReady(timeoutMs = 15000) {
    if (imReady.value) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {""",
    """  function waitForSdkReady(timeoutMs = 15000) {
    if (imReady.value) {
      return Promise.resolve(undefined);
    }
    return new Promise<void>((resolve, reject) => {""",
)

old = """    const requestParams = {
      conversationID: `GROUP${groupID.value}`,
      direction: 0,
    };

    if (nextReqId) {
      requestParams.nextReqMessageID = nextReqId;
    }"""

new = """    const requestParams: {
      conversationID: string;
      direction: number;
      nextReqMessageID?: string;
    } = {
      conversationID: `GROUP${groupID.value}`,
      direction: 0,
    };

    if (nextReqId) {
      requestParams.nextReqMessageID = nextReqId;
    }"""

if old not in text:
    raise SystemExit("useChat requestParams block not found")
text = text.replace(old, new, 1)

path.write_text(text, encoding="utf-8", newline="\n")
print("useChat.ts patched")
