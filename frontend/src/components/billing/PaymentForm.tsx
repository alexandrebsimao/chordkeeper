import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type PaymentMethod = "credit_card" | "pix" | "boleto" | "debit_card";

export interface PaymentData {
  method: PaymentMethod;
  number?: string;
  expiryMonth?: string;
  expiryYear?: string;
  ccv?: string;
  holderName?: string;
  brand?: string;
  last4?: string;
  token?: string;
}

export interface CustomerData {
  name: string;
  document: string; // CPF/CNPJ
  phone: string;
}

interface PaymentFormProps {
  onSubmit: (paymentData: PaymentData, customerData: CustomerData) => Promise<void>;
  loading?: boolean;
  submitButtonText?: string;
  currentCustomerName?: string;
  showCustomerFields?: boolean;
}

const PaymentForm = ({
  onSubmit,
  loading = false,
  submitButtonText = "Processar Pagamento",
  currentCustomerName = "",
  showCustomerFields = true,
}: PaymentFormProps) => {
  const { toast } = useToast();

  // Customer data
  const [customerName, setCustomerName] = useState(currentCustomerName);
  const [customerDocument, setCustomerDocument] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Payment method selection
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("credit_card");

  // Credit card fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardBrand, setCardBrand] = useState("");

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Detect card brand from number
  useEffect(() => {
    const brand = detectCardBrand(cardNumber);
    setCardBrand(brand);
  }, [cardNumber]);

  // Format card number as user types
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\s/g, "");
    value = value.replace(/[^\d]/g, "");
    value = value.slice(0, 16);
    
    // Add spaces every 4 digits
    const formatted = value.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
  };

  // Format expiry month (MM)
  const handleExpiryMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    value = value.slice(0, 2);
    
    if (value.length > 0) {
      const month = parseInt(value);
      if (month > 12) {
        setExpiryMonth("12");
      } else {
        setExpiryMonth(value);
      }
    } else {
      setExpiryMonth("");
    }
  };

  // Format expiry year (YY)
  const handleExpiryYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    value = value.slice(0, 2);
    setExpiryYear(value);
  };

  // Format CVV (only numbers, max 4)
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCvv(value);
  };

  // Format phone as (XX) XXXXX-XXXX
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    value = value.slice(0, 11);
    
    if (value.length > 0) {
      if (value.length <= 2) {
        value = `(${value}`;
      } else if (value.length <= 7) {
        value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
      } else {
        value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
      }
    }
    
    setCustomerPhone(value);
  };

  // Format CPF as XXX.XXX.XXX-XX
  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    value = value.slice(0, 14); // Support CNPJ
    
    if (value.length <= 11) {
      // CPF format
      if (value.length > 0) {
        if (value.length <= 3) {
          value = value;
        } else if (value.length <= 6) {
          value = `${value.slice(0, 3)}.${value.slice(3)}`;
        } else if (value.length <= 9) {
          value = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6)}`;
        } else {
          value = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9)}`;
        }
      }
    } else {
      // CNPJ format
      if (value.length <= 4) {
        value = value;
      } else if (value.length <= 8) {
        value = `${value.slice(0, 2)}.${value.slice(2)}`;
      } else if (value.length <= 12) {
        value = `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5, 8)}/${value.slice(8)}`;
      } else {
        value = `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5, 8)}/${value.slice(8, 12)}-${value.slice(12)}`;
      }
    }
    
    setCustomerDocument(value);
  };

  const detectCardBrand = (number: string): string => {
    const cleanNumber = number.replace(/\s/g, "");
    
    if (/^4\d{12}(\d{3})?$/.test(cleanNumber)) return "visa";
    if (/^5[1-5]\d{14}$|^2[2-7]\d{14}$/.test(cleanNumber)) return "mastercard";
    if (/^3[47]\d{13}$/.test(cleanNumber)) return "amex";
    if (/^6(?:011|5)\d{12}$/.test(cleanNumber)) return "discover";
    if (/^30[0-5]\d{11}$|^3[68]\d{12}$/.test(cleanNumber)) return "diners";
    
    return "";
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (showCustomerFields) {
      if (!customerName.trim()) newErrors.customerName = "Nome é obrigatório";
      if (!customerDocument.trim()) newErrors.customerDocument = "Documento é obrigatório";
      if (!customerPhone.trim()) newErrors.customerPhone = "Telefone é obrigatório";
    }

    if (paymentMethod === "credit_card") {
      const cleanCardNumber = cardNumber.replace(/\s/g, "");
      if (!cleanCardNumber) newErrors.cardNumber = "Número do cartão é obrigatório";
      if (cleanCardNumber.length < 13) newErrors.cardNumber = "Número do cartão inválido";
      if (!cardHolder.trim()) newErrors.cardHolder = "Nome do titular é obrigatório";
      if (!expiryMonth) newErrors.expiryMonth = "Validade é obrigatória";
      if (parseInt(expiryMonth) > 12) newErrors.expiryMonth = "Mês inválido";
      if (!expiryYear) newErrors.expiryYear = "Ano é obrigatório";
      if (!cvv) newErrors.cvv = "CVV é obrigatório";
      if (cvv.length < 3) newErrors.cvv = "CVV inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Erros no formulário",
        description: "Corrija os erros antes de prosseguir.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const paymentData: PaymentData = {
        method: paymentMethod,
      };

      if (paymentMethod === "credit_card") {
        const cleanCardNumber = cardNumber.replace(/\s/g, "");
        paymentData.number = cleanCardNumber;
        paymentData.holderName = cardHolder;
        paymentData.expiryMonth = expiryMonth;
        paymentData.expiryYear = expiryYear;
        paymentData.ccv = cvv;
        paymentData.brand = cardBrand;
        paymentData.last4 = cleanCardNumber.slice(-4);
      }

      const customerData: CustomerData = {
        name: customerName,
        document: customerDocument.replace(/\D/g, ""),
        phone: customerPhone.replace(/\D/g, ""),
      };

      await onSubmit(paymentData, customerData);

      // Clear form on success
      if (paymentMethod === "credit_card") {
        setCardNumber("");
        setCardHolder("");
        setExpiryMonth("");
        setExpiryYear("");
        setCvv("");
        setCardBrand("");
      }
    } catch (error: any) {
      console.error("Erro ao submeter pagamento:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormSubmitting = loading || isSubmitting;

  return (
    <div className="space-y-4">
      {/* Customer Data Section */}
      {showCustomerFields && (
        <Card>
          <CardHeader>
            <CardTitle>Dados Pessoais</CardTitle>
            <CardDescription>Informações para a cobrança</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="customerName">Nome *</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="João Silva"
                  disabled={isFormSubmitting}
                  className={errors.customerName ? "border-red-500" : ""}
                />
                {errors.customerName && <span className="text-xs text-red-500">{errors.customerName}</span>}
              </div>
              <div>
                <Label htmlFor="customerDocument">CPF/CNPJ *</Label>
                <Input
                  id="customerDocument"
                  value={customerDocument}
                  onChange={handleDocumentChange}
                  placeholder="123.456.789-01"
                  disabled={isFormSubmitting}
                  className={errors.customerDocument ? "border-red-500" : ""}
                />
                {errors.customerDocument && <span className="text-xs text-red-500">{errors.customerDocument}</span>}
              </div>
              <div>
                <Label htmlFor="customerPhone">Telefone *</Label>
                <Input
                  id="customerPhone"
                  value={customerPhone}
                  onChange={handlePhoneChange}
                  placeholder="(11) 98765-4321"
                  disabled={isFormSubmitting}
                  className={errors.customerPhone ? "border-red-500" : ""}
                />
                {errors.customerPhone && <span className="text-xs text-red-500">{errors.customerPhone}</span>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Method Section */}
      <Card>
        <CardHeader>
          <CardTitle>Método de Pagamento</CardTitle>
          <CardDescription>Escolha como deseja pagar sua assinatura</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Info: apenas cartão de crédito suporta recorrência */}
          {/* <div className="bg-amber-50 border border-amber-200 p-3 rounded text-sm text-amber-800">
            ℹ️ <strong>Apenas Cartão de Crédito</strong> suporta assinaturas recorrentes. PIX, Boleto e Débito funcionam apenas para pagamentos únicos.
          </div> */}

          <div>
            <Label htmlFor="paymentMethod">Forma de Pagamento *</Label>
            <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)} disabled>
              <SelectTrigger id="paymentMethod" disabled>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit_card">💳 Cartão de Crédito</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Credit Card Form */}
          {paymentMethod === "credit_card" && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cardNumber">Número do Cartão *</Label>
                  <Input
                    id="cardNumber"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="4111 1111 1111 1111"
                    maxLength={19}
                    disabled={isFormSubmitting}
                    className={errors.cardNumber ? "border-red-500" : ""}
                  />
                  {errors.cardNumber && <span className="text-xs text-red-500">{errors.cardNumber}</span>}
                  {cardBrand && <span className="text-xs text-gray-500 mt-1 block">Detectado: {cardBrand.toUpperCase()}</span>}
                </div>
                <div>
                  <Label htmlFor="cardHolder">Nome do Titular *</Label>
                  <Input
                    id="cardHolder"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                    placeholder="JOÃO DA SILVA"
                    disabled={isFormSubmitting}
                    className={errors.cardHolder ? "border-red-500" : ""}
                  />
                  {errors.cardHolder && <span className="text-xs text-red-500">{errors.cardHolder}</span>}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <Label htmlFor="expiryMonth">Mês *</Label>
                  <Input
                    id="expiryMonth"
                    value={expiryMonth}
                    onChange={handleExpiryMonthChange}
                    placeholder="MM"
                    maxLength={2}
                    disabled={isFormSubmitting}
                    className={errors.expiryMonth ? "border-red-500" : ""}
                  />
                  {errors.expiryMonth && <span className="text-xs text-red-500">{errors.expiryMonth}</span>}
                </div>
                <div>
                  <Label htmlFor="expiryYear">Ano *</Label>
                  <Input
                    id="expiryYear"
                    value={expiryYear}
                    onChange={handleExpiryYearChange}
                    placeholder="YY"
                    maxLength={2}
                    disabled={isFormSubmitting}
                    className={errors.expiryYear ? "border-red-500" : ""}
                  />
                  {errors.expiryYear && <span className="text-xs text-red-500">{errors.expiryYear}</span>}
                </div>
                <div className="col-span-2">
                  <Label htmlFor="cvv">CVV *</Label>
                  <Input
                    id="cvv"
                    value={cvv}
                    onChange={handleCvvChange}
                    placeholder="123"
                    maxLength={4}
                    type="password"
                    disabled={isFormSubmitting}
                    className={errors.cvv ? "border-red-500" : ""}
                  />
                  {errors.cvv && <span className="text-xs text-red-500">{errors.cvv}</span>}
                </div>
              </div>

              <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
                ℹ️ Seus dados de cartão são criptografados e seguros. Nunca armazenamos o número completo.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={isFormSubmitting}
        className="w-full"
        size="lg"
      >
        {isFormSubmitting ? "Processando..." : submitButtonText}
      </Button>

      {/* Security Info */}
      <div className="text-xs text-gray-500 text-center">
        🔒 Pagamento seguro com Asaas | SSL Encriptado
      </div>
    </div>
  );
};

export default PaymentForm;
