
type PageHeaderProps = {
    title: string;
    description: string;
    children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-2">
            <div className="grid gap-1">
                <h1 className="text-3xl sm:text-4xl font-black italic tracking-tighter leading-none">{title}</h1>
                <p className="text-xs uppercase font-bold tracking-[0.2em] text-muted-foreground/60">
                    {description}
                </p>
            </div>
            {children && (
                <div className="sm:ml-auto flex items-center gap-3">
                    {children}
                </div>
            )}
        </div>
    );
}
