type LoadingPanelProps = {
  title?: string;
  description?: string;
};

export function LoadingPanel({
  title = "加载中",
  description = "正在请求数据，请稍候...",
}: LoadingPanelProps) {
  return (
    <div className="mx-auto max-w-5xl rounded-2xl border border-border bg-card px-6 py-14 text-center shadow-sm">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      <p className="mt-4 text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
