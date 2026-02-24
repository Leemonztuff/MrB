
type PageHeaderProps = {
    title: string;
    description: string;
    children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
    return (
        <div className="flex items-center">
            <div className="grid gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                <p className="text-muted-foreground">
                    {description}
                </p>
            </div>
            {children && (
                <div className="ml-auto flex items-center gap-2">
                    {children}
                </div>
            )}
        </div>
    );
}
