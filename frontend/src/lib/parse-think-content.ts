/**
 * 解析消息内容中的 <think>...</think>
 * 返回 { thinkContent, visibleContent }，若无 think 则 thinkContent 为 null。
 */
export function parseThinkContent(content: string): {
  thinkContent: string | null;
  visibleContent: string;
} {
  const thinkRegex = /<think>([\s\S]*?)<\/think>/gi;
  const parts: string[] = [];
  let lastIndex = 0;
  let thinkContent: string | null = null;
  const thinkChunks: string[] = [];

  let match = thinkRegex.exec(content);
  while (match !== null) {
    parts.push(content.slice(lastIndex, match.index));
    thinkChunks.push(match[1].trim());
    lastIndex = match.index + match[0].length;
    match = thinkRegex.exec(content);
  }
  parts.push(content.slice(lastIndex));

  if (thinkChunks.length > 0) {
    thinkContent = thinkChunks.join("\n\n");
  }

  const visibleContent = parts.join("").trim();
  return { thinkContent, visibleContent };
}
