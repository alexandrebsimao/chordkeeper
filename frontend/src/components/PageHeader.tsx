import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

/**
 * Standardized page header component with title, description and optional action button.
 * 
 * @example
 * ```tsx
 * <PageHeader 
 *   title="Minhas Cifras"
 *   description="Gerencie e acesse suas cifras favoritas"
 *   action={canEdit() && <Button>Nova Cifra</Button>}
 * />
 * ```
 */
export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
