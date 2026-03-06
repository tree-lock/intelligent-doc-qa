type LoadingPanelProps = {
  title?: string;
  description?: string;
};

export function LoadingPanel({
  title = "加载中",
  description = "正在请求数据，请稍候...",
}: LoadingPanelProps) {
  return (
    <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
      <p className="mt-4 text-sm font-medium text-slate-900">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}
