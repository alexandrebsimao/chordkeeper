import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AlertCircle, Mail, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { fetchWithAuth } from "@/lib/auth";

export const UnconfirmedEmailAlert = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAlert, setShowAlert] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkEmailConfirmation = async () => {
      // Don't show on auth pages
      if (location.pathname.startsWith("/auth") || location.pathname.startsWith("/public")) {
        return;
      }

      // Check if alert was dismissed in this session
      const dismissedInSession = sessionStorage.getItem("unconfirmed_email_alert_dismissed");
      if (dismissedInSession === "true") {
        return;
      }

      try {
        // ✅ SEGURANÇA: Usar fetchWithAuth com cookies HttpOnly
        const response = await fetchWithAuth("/api/users/me", {
          method: "GET",
        });

        if (response.ok) {
          const data = await response.json();
          const user = data.data?.attributes;
          
          if (user && user.confirmed === false) {
            setUserEmail(user.email);
            setShowAlert(true);
          }
        }
      } catch (error) {
        console.error("Error checking email confirmation:", error);
      }
    };

    checkEmailConfirmation();
  }, [location.pathname]);

  const handleDismiss = () => {
    setShowAlert(false);
    setDismissed(true);
    sessionStorage.setItem("unconfirmed_email_alert_dismissed", "true");
  };

  const handleResendEmail = () => {
    navigate("/auth/resend-confirmation");
  };

  if (!showAlert || dismissed) {
    return null;
  }

  return (
    <div className="sticky top-14 z-40 px-4 py-3 bg-background border-b">
      <Alert variant="destructive" className="relative">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="pr-8">Email não confirmado</AlertTitle>
        <AlertDescription className="flex flex-col gap-2 mt-2">
          <p className="text-sm">
            Seu email <strong>{userEmail}</strong> ainda não foi confirmado. 
            Verifique sua caixa de entrada e confirme para ter acesso completo.
          </p>
          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleResendEmail}
            >
              <Mail className="mr-2 h-4 w-4" />
              Reenviar Email
            </Button>
          </div>
        </AlertDescription>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </Alert>
    </div>
  );
};
