import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, Crown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PlanLimitBadgeProps {
  current: number;
  limit: number | "unlimited";
  resourceName: string;
  planName?: string;
}

export function PlanLimitBadge({ current, limit, resourceName, planName }: PlanLimitBadgeProps) {
  const isUnlimited = limit === "unlimited" || limit === Infinity;
  const percentage = isUnlimited ? 0 : (current / (limit as number)) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  return (
    <div className="flex items-center gap-2">
      {isUnlimited ? (
        <Badge variant="default" className="gap-1">
          <Crown className="h-3 w-3" />
          Ilimitado
        </Badge>
      ) : (
        <>
          <Badge 
            variant={isAtLimit ? "destructive" : isNearLimit ? "secondary" : "outline"}
            className="gap-1"
          >
            {isAtLimit ? (
              <AlertCircle className="h-3 w-3" />
            ) : isNearLimit ? (
              <AlertCircle className="h-3 w-3" />
            ) : (
              <CheckCircle className="h-3 w-3" />
            )}
            {current} / {limit}
          </Badge>
        </>
      )}
    </div>
  );
}

interface PlanUsageCardProps {
  songsCount: number;
  songsLimit: number | "unlimited";
  setlistsCount: number;
  setlistsLimit: number | "unlimited";
  planName: string;
  onUpgrade?: () => void;
}

export function PlanUsageCard({ 
  songsCount, 
  songsLimit, 
  setlistsCount, 
  setlistsLimit, 
  planName,
  onUpgrade 
}: PlanUsageCardProps) {
  const songsUnlimited = songsLimit === "unlimited" || songsLimit === Infinity;
  const setlistsUnlimited = setlistsLimit === "unlimited" || setlistsLimit === Infinity;
  
  const songsPercentage = songsUnlimited ? 0 : (songsCount / (songsLimit as number)) * 100;
  const setlistsPercentage = setlistsUnlimited ? 0 : (setlistsCount / (setlistsLimit as number)) * 100;
  
  const needsUpgrade = songsPercentage >= 80 || setlistsPercentage >= 80;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Uso do Plano</span>
          <Badge variant="outline">{planName}</Badge>
        </CardTitle>
        <CardDescription>
          Acompanhe o uso dos recursos do seu plano
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Songs Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Músicas</span>
            {songsUnlimited ? (
              <Badge variant="default" className="gap-1">
                <Crown className="h-3 w-3" />
                Ilimitado
              </Badge>
            ) : (
              <span className="text-sm text-muted-foreground">
                {songsCount} / {songsLimit}
              </span>
            )}
          </div>
          {!songsUnlimited && (
            <Progress 
              value={songsPercentage} 
              className={songsPercentage >= 100 ? "bg-red-100" : songsPercentage >= 80 ? "bg-yellow-100" : ""}
            />
          )}
        </div>

        {/* Setlists Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Setlists</span>
            {setlistsUnlimited ? (
              <Badge variant="default" className="gap-1">
                <Crown className="h-3 w-3" />
                Ilimitado
              </Badge>
            ) : (
              <span className="text-sm text-muted-foreground">
                {setlistsCount} / {setlistsLimit}
              </span>
            )}
          </div>
          {!setlistsUnlimited && (
            <Progress 
              value={setlistsPercentage}
              className={setlistsPercentage >= 100 ? "bg-red-100" : setlistsPercentage >= 80 ? "bg-yellow-100" : ""}
            />
          )}
        </div>

        {/* Upgrade CTA */}
        {needsUpgrade && onUpgrade && (
          <div className="pt-2 border-t">
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1 space-y-2">
                <p className="text-sm text-amber-900">
                  Você está próximo do limite do seu plano
                </p>
                <Button 
                  size="sm" 
                  onClick={onUpgrade}
                  className="w-full"
                >
                  Fazer Upgrade
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
