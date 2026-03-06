import type { DocumentItem } from "../../types";

const MOCK_REQUEST_DELAY_MS = 900;

export type SendChatMessagePayload = {
  message: string;
  documents: DocumentItem[];
};

export type SendChatMessageResult = {
  content: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function sendChatMessage(
  payload: SendChatMessagePayload,
): Promise<SendChatMessageResult> {
  await sleep(MOCK_REQUEST_DELAY_MS);

  const { message, documents } = payload;
  const docsSummary =
    documents.length > 0
      ? `当前已关联 ${documents.length} 篇文档（${documents
          .slice(0, 2)
          .map((doc) => doc.name)
          .join("、")}）`
      : "当前未关联文档";

  return {
    content: `已收到你的问题："${message}"。${docsSummary}。我会基于这些内容继续回答，并可按你的要求展开成步骤清单。`,
  };
}
