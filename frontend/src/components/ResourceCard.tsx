import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BadgeConfig {
  label: string;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  className?: string;
}

interface ResourceCardProps {
  title: string;
  subtitle?: string;
  badges?: BadgeConfig[];
  onClick?: () => void;
  footer?: ReactNode;
  className?: string;
}

/**
 * Generic card component for displaying resources (songs, setlists, etc).
 * 
 * @example
 * ```tsx
 * <ResourceCard 
 *   title="Imagine"
 *   subtitle="John Lennon"
 *   badges={[
 *     { label: "Tom: C", variant: "outline", className: "font-mono" },
 *     { label: "Capo: 2ª casa", variant: "outline" }
 *   ]}
 *   onClick={() => navigate(`/songs/${id}`)}
 * />
 * ```
 */
export function ResourceCard({ 
  title, 
  subtitle, 
  badges = [],
  onClick,
  footer,
  className = ""
}: ResourceCardProps) {
  return (
    <Card
      className={`hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {title}
            </h3>
            {subtitle && (
              <p className="text-muted-foreground">{subtitle}</p>
            )}
            {footer && (
              <div className="mt-2">{footer}</div>
            )}
          </div>
          {badges.length > 0 && (
            <div className="flex flex-col items-end gap-2">
              {badges.map((badge, index) => (
                <Badge 
                  key={index} 
                  variant={badge.variant || 'outline'}
                  className={badge.className}
                >
                  {badge.label}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
