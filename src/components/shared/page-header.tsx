
type PageHeaderProps = {
    title: string;
    description: string;
    children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <div className="grid gap-1 relative">
                <h1 className="text-3xl sm:text-4xl font-black italic tracking-tighter leading-none relative">
                    {title}
                    <span className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full opacity-50" />
                </h1>
                <p className="text-xs uppercase font-bold tracking-[0.25em] text-muted-foreground/60">
                    {description}
                </p>
            </div>
            {children && (
                <div className="sm:ml-auto flex items-center gap-3 animate-fade-in">
                    {children}
                </div>
            )}
        </div>
    );
}
