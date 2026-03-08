type LoadingPanelProps = {
  title?: string;
  description?: string;
  variant?: "page" | "inline";
};

export function LoadingPanel({
  title = "加载中",
  description = "正在请求数据，请稍候...",
  variant = "inline",
}: LoadingPanelProps) {
  const isPage = variant === "page";
  return (
    <div
      className={
        isPage
          ? "mx-auto max-w-5xl rounded-2xl border border-border bg-card px-8 py-20 text-center shadow-sm"
          : "mx-auto max-w-5xl rounded-2xl border border-border bg-card px-6 py-14 text-center shadow-sm"
      }
    >
      <div
        className={
          isPage
            ? "mx-auto h-12 w-12 animate-spin rounded-full border-2 border-border border-t-primary"
            : "mx-auto h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary"
        }
      />
      <p
        className={
          isPage
            ? "mt-5 text-lg font-medium text-foreground"
            : "mt-4 text-sm font-medium text-foreground"
        }
      >
        {title}
      </p>
      <p
        className={
          isPage
            ? "mt-2 text-sm text-muted-foreground"
            : "mt-1 text-xs text-muted-foreground"
        }
      >
        {description}
      </p>
    </div>
  );
}
