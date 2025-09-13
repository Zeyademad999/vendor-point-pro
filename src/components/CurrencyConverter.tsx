import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowRightLeft,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Euro,
  PoundSterling,
  Calculator,
  Settings,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  lastUpdated: string;
  change: number;
}

interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

const CurrencyConverter: React.FC = () => {
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("EGP");
  const [amount, setAmount] = useState("");
  const [convertedAmount, setConvertedAmount] = useState("");
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [customRates, setCustomRates] = useState<Record<string, number>>({});
  const [useCustomRates, setUseCustomRates] = useState(false);
  const { toast } = useToast();

  const currencies: Currency[] = [
    { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
    { code: "EGP", name: "Egyptian Pound", symbol: "EGP", flag: "🇪🇬" },
    { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
    { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧" },
    { code: "CAD", name: "Canadian Dollar", symbol: "C$", flag: "🇨🇦" },
    { code: "AED", name: "UAE Dirham", symbol: "AED", flag: "🇦🇪" },
    { code: "SAR", name: "Saudi Riyal", symbol: "SAR", flag: "🇸🇦" },
  ];

  // Mock exchange rates (in real app, these would come from an API)
  const mockRates: Record<string, Record<string, number>> = {
    USD: {
      EGP: 30.85,
      EUR: 0.85,
      GBP: 0.73,
      CAD: 1.25,
      AED: 3.67,
      SAR: 3.75,
    },
    EGP: {
      USD: 0.032,
      EUR: 0.028,
      GBP: 0.024,
      CAD: 0.041,
      AED: 0.119,
      SAR: 0.122,
    },
    EUR: {
      USD: 1.18,
      EGP: 36.4,
      GBP: 0.86,
      CAD: 1.47,
      AED: 4.33,
      SAR: 4.42,
    },
  };

  const getCurrencyIcon = (code: string) => {
    switch (code) {
      case "USD":
        return <DollarSign className="h-4 w-4" />;
      case "EUR":
        return <Euro className="h-4 w-4" />;
      case "GBP":
        return <PoundSterling className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const fetchExchangeRate = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const rate =
        useCustomRates && customRates[`${fromCurrency}_${toCurrency}`]
          ? customRates[`${fromCurrency}_${toCurrency}`]
          : mockRates[fromCurrency]?.[toCurrency] || 1;

      const change = Math.random() * 0.1 - 0.05; // Random change between -5% and +5%

      setExchangeRate({
        from: fromCurrency,
        to: toCurrency,
        rate,
        lastUpdated: new Date().toISOString(),
        change,
      });

      if (amount) {
        convertAmount();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch exchange rate",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const convertAmount = () => {
    if (!amount || !exchangeRate) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return;

    const converted = numAmount * exchangeRate.rate;
    setConvertedAmount(converted.toFixed(2));
  };

  useEffect(() => {
    fetchExchangeRate();
  }, [fromCurrency, toCurrency, useCustomRates, customRates]);

  useEffect(() => {
    if (exchangeRate) {
      convertAmount();
    }
  }, [amount, exchangeRate]);

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setAmount(convertedAmount);
    setConvertedAmount(amount);
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Currency Converter</h2>
          <p className="text-gray-600">
            Convert between different currencies with live rates
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchExchangeRate}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Rates
          </Button>
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Currency Settings</DialogTitle>
                <DialogDescription>
                  Configure custom exchange rates and preferences
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Use Custom Rates</Label>
                  <input
                    type="checkbox"
                    checked={useCustomRates}
                    onChange={(e) => setUseCustomRates(e.target.checked)}
                    className="rounded"
                  />
                </div>
                {useCustomRates && (
                  <div className="space-y-2">
                    <Label>Custom Rates</Label>
                    {Object.entries(customRates).map(([key, rate]) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-sm font-mono">{key}</span>
                        <Input
                          type="number"
                          value={rate}
                          onChange={(e) =>
                            setCustomRates((prev) => ({
                              ...prev,
                              [key]: parseFloat(e.target.value) || 0,
                            }))
                          }
                          className="flex-1"
                        />
                      </div>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const newKey = `${fromCurrency}_${toCurrency}`;
                        setCustomRates((prev) => ({
                          ...prev,
                          [newKey]: 1,
                        }));
                      }}
                    >
                      Add Custom Rate
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Converter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Currency Converter
            </CardTitle>
            <CardDescription>
              Convert between different currencies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From</Label>
                <Select value={fromCurrency} onValueChange={setFromCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        <div className="flex items-center gap-2">
                          <span>{currency.flag}</span>
                          <span>{currency.code}</span>
                          <span className="text-gray-500">
                            - {currency.name}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>To</Label>
                <Select value={toCurrency} onValueChange={setToCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        <div className="flex items-center gap-2">
                          <span>{currency.flag}</span>
                          <span>{currency.code}</span>
                          <span className="text-gray-500">
                            - {currency.name}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={swapCurrencies}
                className="flex items-center gap-2"
              >
                <ArrowRightLeft className="h-4 w-4" />
                Swap
              </Button>
            </div>

            {convertedAmount && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-green-600 mb-1">
                    Converted Amount
                  </p>
                  <p className="text-2xl font-bold text-green-800">
                    {convertedAmount} {toCurrency}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exchange Rate Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getCurrencyIcon(fromCurrency)}
              Exchange Rate
            </CardTitle>
            <CardDescription>Current exchange rate information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {exchangeRate ? (
              <>
                <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-600 mb-1">Current Rate</p>
                  <p className="text-3xl font-bold text-blue-800">
                    1 {exchangeRate.from} = {exchangeRate.rate.toFixed(4)}{" "}
                    {exchangeRate.to}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">24h Change</span>
                    <div className="flex items-center gap-2">
                      {getChangeIcon(exchangeRate.change)}
                      <span
                        className={`text-sm font-medium ${getChangeColor(
                          exchangeRate.change
                        )}`}
                      >
                        {exchangeRate.change > 0 ? "+" : ""}
                        {(exchangeRate.change * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Updated</span>
                    <span className="text-sm font-medium">
                      {new Date(exchangeRate.lastUpdated).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Rate Source</span>
                    <Badge variant="outline">
                      {useCustomRates ? "Custom" : "Live API"}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">Quick Conversions</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span>10 {fromCurrency}</span>
                      <span className="font-medium">
                        {(10 * exchangeRate.rate).toFixed(2)} {toCurrency}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>100 {fromCurrency}</span>
                      <span className="font-medium">
                        {(100 * exchangeRate.rate).toFixed(2)} {toCurrency}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>1000 {fromCurrency}</span>
                      <span className="font-medium">
                        {(1000 * exchangeRate.rate).toFixed(2)} {toCurrency}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>10000 {fromCurrency}</span>
                      <span className="font-medium">
                        {(10000 * exchangeRate.rate).toFixed(2)} {toCurrency}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center p-8">
                <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No exchange rate data available</p>
                <Button
                  variant="outline"
                  onClick={fetchExchangeRate}
                  className="mt-4"
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Load Exchange Rate"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Currency History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Conversions</CardTitle>
          <CardDescription>Your recent currency conversions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {amount && convertedAmount && exchangeRate && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {amount} {fromCurrency}
                    </span>
                    <ArrowRightLeft className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">
                      {convertedAmount} {toCurrency}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    Rate: {exchangeRate.rate.toFixed(4)}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>
            )}
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">No conversion history yet</p>
              <p className="text-xs">
                Start converting currencies to see your history
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CurrencyConverter;
