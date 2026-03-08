/**
 * MinerU 支持的文件扩展名，与 backend/app/services/mineru_client.py SUPPORTED_EXTENSIONS 保持一致。
 */
const MINERU_SUPPORTED_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".png",
  ".jpg",
  ".jpeg",
  ".html",
];

const EXT_SET = new Set<string>(
  MINERU_SUPPORTED_EXTENSIONS.map((e) => e.toLowerCase()),
);

/** 未配置 MinerU 时引导用户去配置的提示文案（文档页与配置页共用） */
export const MINERU_REQUIRED_MESSAGE =
  "上传 PDF、Word、PPT、图片、HTML 需先配置 MinerU，请填写 API Token";

/**
 * 判断文件是否可由 MinerU 解析（PDF、Word、PPT、图片、HTML）。
 * 与后端 mineru_client.is_mineru_supported 逻辑一致。
 */
export function isMineruSupportedFile(filename: string): boolean {
  const lastDot = filename.lastIndexOf(".");
  const ext = lastDot >= 0 ? filename.slice(lastDot).toLowerCase() : "";
  return EXT_SET.has(ext);
}
