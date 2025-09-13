import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail,
  Send,
  Settings,
  Template,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: "receipt" | "booking" | "promotion" | "notification";
  variables: string[];
  lastUsed: string;
}

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  recipients: number;
  sent: number;
  status: "draft" | "scheduled" | "sending" | "sent" | "failed";
  scheduledDate: string;
  createdAt: string;
}

const EmailManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState("templates");
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null);
  const { toast } = useToast();

  // Mock data
  const [templates, setTemplates] = useState<EmailTemplate[]>([
    {
      id: "1",
      name: "Receipt Confirmation",
      subject: "Your Receipt - {{businessName}}",
      content: "Dear {{customerName}},\n\nThank you for your purchase!\n\nReceipt #{{receiptNumber}}\nTotal: {{total}}\n\nBest regards,\n{{businessName}}",
      type: "receipt",
      variables: ["customerName", "receiptNumber", "total", "businessName"],
      lastUsed: "2024-01-15",
    },
    {
      id: "2",
      name: "Booking Confirmation",
      subject: "Booking Confirmed - {{serviceName}}",
      content: "Dear {{customerName}},\n\nYour booking has been confirmed!\n\nService: {{serviceName}}\nDate: {{bookingDate}}\nTime: {{bookingTime}}\n\nSee you soon!\n{{businessName}}",
      type: "booking",
      variables: ["customerName", "serviceName", "bookingDate", "bookingTime", "businessName"],
      lastUsed: "2024-01-14",
    },
  ]);

  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([
    {
      id: "1",
      name: "New Year Promotion",
      subject: "🎉 New Year Special - 20% Off All Services!",
      content: "Happy New Year! Get 20% off all services this month.",
      recipients: 150,
      sent: 150,
      status: "sent",
      scheduledDate: "2024-01-01",
      createdAt: "2023-12-28",
    },
  ]);

  const [templateForm, setTemplateForm] = useState({
    name: "",
    subject: "",
    content: "",
    type: "receipt" as const,
  });

  const [campaignForm, setCampaignForm] = useState({
    name: "",
    subject: "",
    content: "",
    scheduledDate: "",
  });

  const handleSaveTemplate = () => {
    if (!templateForm.name || !templateForm.subject || !templateForm.content) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const newTemplate: EmailTemplate = {
      id: editingTemplate?.id || Date.now().toString(),
      name: templateForm.name,
      subject: templateForm.subject,
      content: templateForm.content,
      type: templateForm.type,
      variables: extractVariables(templateForm.content + templateForm.subject),
      lastUsed: new Date().toISOString().split('T')[0],
    };

    if (editingTemplate) {
      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? newTemplate : t));
    } else {
      setTemplates(prev => [...prev, newTemplate]);
    }

    setShowTemplateDialog(false);
    setEditingTemplate(null);
    setTemplateForm({ name: "", subject: "", content: "", type: "receipt" });
    
    toast({
      title: "Template Saved",
      description: `Template "${newTemplate.name}" has been saved`,
    });
  };

  const handleSaveCampaign = () => {
    if (!campaignForm.name || !campaignForm.subject || !campaignForm.content) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const newCampaign: EmailCampaign = {
      id: editingCampaign?.id || Date.now().toString(),
      name: campaignForm.name,
      subject: campaignForm.subject,
      content: campaignForm.content,
      recipients: 0, // Would be calculated from customer list
      sent: 0,
      status: "draft",
      scheduledDate: campaignForm.scheduledDate,
      createdAt: new Date().toISOString().split('T')[0],
    };

    if (editingCampaign) {
      setCampaigns(prev => prev.map(c => c.id === editingCampaign.id ? newCampaign : c));
    } else {
      setCampaigns(prev => [...prev, newCampaign]);
    }

    setShowCampaignDialog(false);
    setEditingCampaign(null);
    setCampaignForm({ name: "", subject: "", content: "", scheduledDate: "" });
    
    toast({
      title: "Campaign Saved",
      description: `Campaign "${newCampaign.name}" has been saved`,
    });
  };

  const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{\{([^}]+)\}\}/g);
    return matches ? matches.map(match => match.slice(2, -2)) : [];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent": return "bg-green-100 text-green-800";
      case "sending": return "bg-blue-100 text-blue-800";
      case "scheduled": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "receipt": return <Receipt className="h-4 w-4" />;
      case "booking": return <Clock className="h-4 w-4" />;
      case "promotion": return <Send className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Manager</h2>
          <p className="text-gray-600">Manage email templates and campaigns</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setEditingTemplate(null);
              setTemplateForm({ name: "", subject: "", content: "", type: "receipt" });
              setShowTemplateDialog(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Template
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setEditingCampaign(null);
              setCampaignForm({ name: "", subject: "", content: "", scheduledDate: "" });
              setShowCampaignDialog(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Campaign
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Template className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(template.type)}
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                    </div>
                    <Badge variant="outline">{template.type}</Badge>
                  </div>
                  <CardDescription>{template.subject}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <p>Variables: {template.variables.length}</p>
                    <p>Last used: {template.lastUsed}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingTemplate(template);
                        setTemplateForm({
                          name: template.name,
                          subject: template.subject,
                          content: template.content,
                          type: template.type,
                        });
                        setShowTemplateDialog(true);
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: "Email Sent",
                          description: `Template "${template.name}" sent successfully`,
                        });
                      }}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Send
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{campaign.name}</h3>
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{campaign.subject}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Recipients: {campaign.recipients}</span>
                        <span>Sent: {campaign.sent}</span>
                        <span>Created: {campaign.createdAt}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>Configure your email service settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SMTP Server</Label>
                  <Input placeholder="smtp.gmail.com" />
                </div>
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input placeholder="587" />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input placeholder="your-email@domain.com" />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
              </div>
              <Button>
                <Settings className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Edit Template" : "Create New Template"}
            </DialogTitle>
            <DialogDescription>
              Create email templates with variables for dynamic content
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="e.g., Receipt Confirmation"
                />
              </div>
              <div className="space-y-2">
                <Label>Template Type</Label>
                <Select
                  value={templateForm.type}
                  onValueChange={(type: "receipt" | "booking" | "promotion" | "notification") =>
                    setTemplateForm({ ...templateForm, type })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receipt">Receipt</SelectItem>
                    <SelectItem value="booking">Booking</SelectItem>
                    <SelectItem value="promotion">Promotion</SelectItem>
                    <SelectItem value="notification">Notification</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Subject Line</Label>
              <Input
                value={templateForm.subject}
                onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                placeholder="e.g., Your Receipt - {{businessName}}"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Email Content</Label>
              <Textarea
                value={templateForm.content}
                onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                placeholder="Dear {{customerName}}, ..."
                rows={8}
              />
            </div>
            
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Available Variables:</strong> {{customerName}}, {{businessName}}, {{receiptNumber}}, {{total}}, {{serviceName}}, {{bookingDate}}, {{bookingTime}}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleSaveTemplate} className="flex-1">
                {editingTemplate ? "Update Template" : "Create Template"}
              </Button>
              <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Campaign Dialog */}
      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCampaign ? "Edit Campaign" : "Create New Campaign"}
            </DialogTitle>
            <DialogDescription>
              Create email campaigns to send to your customers
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Campaign Name</Label>
              <Input
                value={campaignForm.name}
                onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                placeholder="e.g., New Year Promotion"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Subject Line</Label>
              <Input
                value={campaignForm.subject}
                onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                placeholder="e.g., 🎉 Special Offer Just for You!"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Email Content</Label>
              <Textarea
                value={campaignForm.content}
                onChange={(e) => setCampaignForm({ ...campaignForm, content: e.target.value })}
                placeholder="Write your email content here..."
                rows={8}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Schedule Date (Optional)</Label>
              <Input
                type="datetime-local"
                value={campaignForm.scheduledDate}
                onChange={(e) => setCampaignForm({ ...campaignForm, scheduledDate: e.target.value })}
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleSaveCampaign} className="flex-1">
                {editingCampaign ? "Update Campaign" : "Create Campaign"}
              </Button>
              <Button variant="outline" onClick={() => setShowCampaignDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailManager;
