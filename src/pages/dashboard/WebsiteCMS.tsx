import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save,
  Eye,
  EyeOff,
  ArrowRight,
  ShoppingBag,
  Calendar,
} from "lucide-react";
import { clientService } from "@/services/clients";

interface WebsiteSettings {
  hero: {
    title: string;
    subtitle: string;
  };
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    buttonColor: string;
    buttonTextColor: string;
    accentColor: string;
    borderColor: string;
  };
}

const WebsiteCMS: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<WebsiteSettings>({
    hero: {
      title: "Transform Your Look with Professional Salon Services",
      subtitle:
        "Experience luxury hair styling, beauty treatments, and premium salon products. Our expert stylists and beauty professionals are here to enhance your natural beauty and boost your confidence.",
    },
    theme: {
      primaryColor: "#1e40af",
      secondaryColor: "#64748b",
      backgroundColor: "#ffffff",
      textColor: "#1f2937",
      buttonColor: "#1e40af",
      buttonTextColor: "#ffffff",
      accentColor: "#3b82f6",
      borderColor: "#e5e7eb",
    },
  });
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] =
    useState<WebsiteSettings | null>(null);

  // Load current settings on component mount
  useEffect(() => {
    loadCurrentSettings();
  }, []);

  const loadCurrentSettings = async () => {
    try {
      // Load current website settings from backend
      const response = await clientService.getWebsiteSettings();
      if (response.success) {
        const currentSettings = {
          hero: {
            title: response.data.hero?.title || settings.hero.title,
            subtitle: response.data.hero?.subtitle || settings.hero.subtitle,
          },
          theme: {
            primaryColor:
              response.data.theme?.primaryColor || settings.theme.primaryColor,
            secondaryColor:
              response.data.theme?.secondaryColor ||
              settings.theme.secondaryColor,
            backgroundColor:
              response.data.theme?.backgroundColor ||
              settings.theme.backgroundColor,
            textColor:
              response.data.theme?.textColor || settings.theme.textColor,
            buttonColor:
              response.data.theme?.buttonColor || settings.theme.buttonColor,
            buttonTextColor:
              response.data.theme?.buttonTextColor ||
              settings.theme.buttonTextColor,
            accentColor:
              response.data.theme?.accentColor || settings.theme.accentColor,
            borderColor:
              response.data.theme?.borderColor || settings.theme.borderColor,
          },
        };
        setSettings(currentSettings);
        setOriginalSettings(currentSettings);
      }
    } catch (error) {
      console.error("Error loading website settings:", error);
    }
  };

  const handleSettingChange = (
    section: keyof WebsiteSettings,
    field: string,
    value: string
  ) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await clientService.updateWebsiteSettings({
        hero: settings.hero,
        theme: settings.theme,
      });

      if (response.success) {
        toast({
          title: "Settings Saved!",
          description: "Your website settings have been updated successfully.",
        });
        setHasChanges(false);
        setOriginalSettings(settings);
      } else {
        toast({
          title: "Save Failed",
          description:
            response.message || "Failed to save settings. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Save Failed",
        description: "An error occurred while saving your settings.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (originalSettings) {
      setSettings(originalSettings);
      setHasChanges(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Website CMS</h1>
          <p className="text-gray-600 mt-2">
            Customize your website's appearance and content with live preview
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className="flex items-center space-x-2"
          >
            {isPreviewMode ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            <span>{isPreviewMode ? "Hide Preview" : "Show Preview"}</span>
          </Button>
          {hasChanges && (
            <Button
              variant="outline"
              onClick={handleReset}
              className="text-orange-600 hover:text-orange-700"
            >
              Reset Changes
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{isSaving ? "Saving..." : "Save Changes"}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings Panel */}
        <div className="space-y-6">
          {/* Hero Section Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>Hero Section</span>
                {hasChanges && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 bg-orange-500 rounded-full"
                  />
                )}
              </CardTitle>
              <CardDescription>
                Customize the main hero text and subtitle that appears on your
                website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label
                  htmlFor="hero-title"
                  className="text-sm font-medium text-gray-700"
                >
                  Hero Title
                </Label>
                <Input
                  id="hero-title"
                  value={settings.hero.title}
                  onChange={(e) =>
                    handleSettingChange("hero", "title", e.target.value)
                  }
                  placeholder="Enter your hero title..."
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This is the main headline that visitors see first
                </p>
              </div>

              <div>
                <Label
                  htmlFor="hero-subtitle"
                  className="text-sm font-medium text-gray-700"
                >
                  Hero Subtitle
                </Label>
                <Textarea
                  id="hero-subtitle"
                  value={settings.hero.subtitle}
                  onChange={(e) =>
                    handleSettingChange("hero", "subtitle", e.target.value)
                  }
                  placeholder="Enter your hero subtitle..."
                  rows={4}
                  className="mt-1 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This provides additional context and description
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Theme Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Theme Colors</CardTitle>
              <CardDescription>
                Customize the main colors of your website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="primary-color"
                    className="text-sm font-medium text-gray-700"
                  >
                    Primary Color
                  </Label>
                  <div className="flex items-center space-x-3 mt-1">
                    <Input
                      id="primary-color"
                      type="color"
                      value={settings.theme.primaryColor}
                      onChange={(e) =>
                        handleSettingChange(
                          "theme",
                          "primaryColor",
                          e.target.value
                        )
                      }
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={settings.theme.primaryColor}
                      onChange={(e) =>
                        handleSettingChange(
                          "theme",
                          "primaryColor",
                          e.target.value
                        )
                      }
                      placeholder="#1e40af"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="secondary-color"
                    className="text-sm font-medium text-gray-700"
                  >
                    Secondary Color
                  </Label>
                  <div className="flex items-center space-x-3 mt-1">
                    <Input
                      id="secondary-color"
                      type="color"
                      value={settings.theme.secondaryColor}
                      onChange={(e) =>
                        handleSettingChange(
                          "theme",
                          "secondaryColor",
                          e.target.value
                        )
                      }
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={settings.theme.secondaryColor}
                      onChange={(e) =>
                        handleSettingChange(
                          "theme",
                          "secondaryColor",
                          e.target.value
                        )
                      }
                      placeholder="#64748b"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Background & Text Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Background & Text Colors</CardTitle>
              <CardDescription>
                Customize the background and text colors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="background-color"
                    className="text-sm font-medium text-gray-700"
                  >
                    Background Color
                  </Label>
                  <div className="flex items-center space-x-3 mt-1">
                    <Input
                      id="background-color"
                      type="color"
                      value={settings.theme.backgroundColor}
                      onChange={(e) =>
                        handleSettingChange(
                          "theme",
                          "backgroundColor",
                          e.target.value
                        )
                      }
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={settings.theme.backgroundColor}
                      onChange={(e) =>
                        handleSettingChange(
                          "theme",
                          "backgroundColor",
                          e.target.value
                        )
                      }
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="text-color"
                    className="text-sm font-medium text-gray-700"
                  >
                    Text Color
                  </Label>
                  <div className="flex items-center space-x-3 mt-1">
                    <Input
                      id="text-color"
                      type="color"
                      value={settings.theme.textColor}
                      onChange={(e) =>
                        handleSettingChange(
                          "theme",
                          "textColor",
                          e.target.value
                        )
                      }
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={settings.theme.textColor}
                      onChange={(e) =>
                        handleSettingChange(
                          "theme",
                          "textColor",
                          e.target.value
                        )
                      }
                      placeholder="#1f2937"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Button Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Button Colors</CardTitle>
              <CardDescription>
                Customize the appearance of buttons
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="button-color"
                    className="text-sm font-medium text-gray-700"
                  >
                    Button Background
                  </Label>
                  <div className="flex items-center space-x-3 mt-1">
                    <Input
                      id="button-color"
                      type="color"
                      value={settings.theme.buttonColor}
                      onChange={(e) =>
                        handleSettingChange(
                          "theme",
                          "buttonColor",
                          e.target.value
                        )
                      }
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={settings.theme.buttonColor}
                      onChange={(e) =>
                        handleSettingChange(
                          "theme",
                          "buttonColor",
                          e.target.value
                        )
                      }
                      placeholder="#1e40af"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="button-text-color"
                    className="text-sm font-medium text-gray-700"
                  >
                    Button Text Color
                  </Label>
                  <div className="flex items-center space-x-3 mt-1">
                    <Input
                      id="button-text-color"
                      type="color"
                      value={settings.theme.buttonTextColor}
                      onChange={(e) =>
                        handleSettingChange(
                          "theme",
                          "buttonTextColor",
                          e.target.value
                        )
                      }
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={settings.theme.buttonTextColor}
                      onChange={(e) =>
                        handleSettingChange(
                          "theme",
                          "buttonTextColor",
                          e.target.value
                        )
                      }
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Accent & Border Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Accent & Border Colors</CardTitle>
              <CardDescription>
                Customize accent elements and borders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="accent-color"
                    className="text-sm font-medium text-gray-700"
                  >
                    Accent Color
                  </Label>
                  <div className="flex items-center space-x-3 mt-1">
                    <Input
                      id="accent-color"
                      type="color"
                      value={settings.theme.accentColor}
                      onChange={(e) =>
                        handleSettingChange(
                          "theme",
                          "accentColor",
                          e.target.value
                        )
                      }
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={settings.theme.accentColor}
                      onChange={(e) =>
                        handleSettingChange(
                          "theme",
                          "accentColor",
                          e.target.value
                        )
                      }
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="border-color"
                    className="text-sm font-medium text-gray-700"
                  >
                    Border Color
                  </Label>
                  <div className="flex items-center space-x-3 mt-1">
                    <Input
                      id="border-color"
                      type="color"
                      value={settings.theme.borderColor}
                      onChange={(e) =>
                        handleSettingChange(
                          "theme",
                          "borderColor",
                          e.target.value
                        )
                      }
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={settings.theme.borderColor}
                      onChange={(e) =>
                        handleSettingChange(
                          "theme",
                          "borderColor",
                          e.target.value
                        )
                      }
                      placeholder="#e5e7eb"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>
                See how your changes will look on your website in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="border rounded-lg overflow-hidden"
                style={{ backgroundColor: settings.theme.backgroundColor }}
              >
                {/* Navigation Bar Preview */}
                <div
                  className="border-b px-6 py-4 flex items-center justify-between"
                  style={{
                    backgroundColor: settings.theme.backgroundColor,
                    borderColor: settings.theme.borderColor,
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: settings.theme.primaryColor }}
                    >
                      P
                    </div>
                    <span
                      className="font-semibold"
                      style={{ color: settings.theme.textColor }}
                    >
                      {user?.business_name || "Your Business"}
                    </span>
                  </div>

                  <div
                    className="hidden md:flex items-center space-x-6 text-sm"
                    style={{ color: settings.theme.secondaryColor }}
                  >
                    <span>Home</span>
                    <span>Shop</span>
                    <span>Services</span>
                    <span>About</span>
                    <span>Contact</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                      style={{
                        borderColor: settings.theme.borderColor,
                        color: settings.theme.textColor,
                      }}
                    >
                      <ShoppingBag className="h-4 w-4" />
                      <span>Cart</span>
                    </Button>
                    <Button
                      size="sm"
                      className="flex items-center space-x-2"
                      style={{
                        backgroundColor: settings.theme.buttonColor,
                        color: settings.theme.buttonTextColor,
                      }}
                    >
                      <Calendar className="h-4 w-4" />
                      <span>Book Appointment</span>
                    </Button>
                  </div>
                </div>

                {/* Hero Section Preview */}
                <div className="px-6 py-16 text-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={settings.hero.title + settings.hero.subtitle}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <motion.h1
                        className="text-4xl md:text-5xl font-bold leading-tight"
                        style={{ color: settings.theme.textColor }}
                      >
                        {settings.hero.title || "Enter your hero title..."}
                      </motion.h1>

                      <motion.p
                        className="text-lg max-w-3xl mx-auto leading-relaxed"
                        style={{ color: settings.theme.secondaryColor }}
                      >
                        {settings.hero.subtitle ||
                          "Enter your hero subtitle..."}
                      </motion.p>

                      <motion.div
                        className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4 pt-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Button
                          className="flex items-center space-x-2 px-6 py-3"
                          style={{
                            backgroundColor: settings.theme.buttonColor,
                            color: settings.theme.buttonTextColor,
                          }}
                        >
                          <span>Shop Products</span>
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          className="flex items-center space-x-2 px-6 py-3"
                          style={{
                            borderColor: settings.theme.buttonColor,
                            color: settings.theme.buttonColor,
                          }}
                        >
                          <span>View Services</span>
                        </Button>
                      </motion.div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Preview Controls</CardTitle>
              <CardDescription>
                Test different screen sizes and preview modes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className="flex items-center space-x-2"
                >
                  {isPreviewMode ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span>Toggle Preview</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open(`/website/${user?.subdomain}`, "_blank")
                  }
                  className="flex items-center space-x-2"
                >
                  <span>View Live Site</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WebsiteCMS;
