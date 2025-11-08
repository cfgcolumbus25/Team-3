import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Mail, Users, Shield, Database, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminSettings = () => {
  const { toast } = useToast();
  const [defaultMinScore, setDefaultMinScore] = useState("50");
  const [defaultCredits, setDefaultCredits] = useState("3");
  const [stalenessThreshold, setStalenessThreshold] = useState("180");
  
  const [showInput, setShowInput] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  const handleSaveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your changes have been saved successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="flex">
        <Sidebar role="admin" />
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Admin Settings</h1>
              <p className="text-muted-foreground mt-1">
                Configure system-wide settings and preferences
              </p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="system">System</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="alerts">Alerts</TabsTrigger>
                <TabsTrigger value="audit">Audit</TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <Card className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Admin Profile
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Manage your admin account settings
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input defaultValue="Admin User" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" defaultValue="admin@modernstates.org" />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Input value="System Administrator" disabled />
                    </div>
                    <div className="flex items-center gap-4">
                      <Button variant="outline">Change Password</Button>
                      <Button variant="outline">Upload Profile Picture</Button>
                    </div>
                    <div className="flex items-center justify-between border-t pt-4">
                      <div>
                        <Label>Two-Factor Authentication</Label>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                  <Button onClick={handleSaveSettings}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Profile
                  </Button>
                </Card>
              </TabsContent>

              <TabsContent value="system">
                <Card className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      System Configuration
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Set default values and system-wide parameters
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Default Minimum Score</Label>
                      <Input
                        type="number"
                        value={defaultMinScore}
                        onChange={(e) => setDefaultMinScore(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Used when institution doesn't specify a minimum score
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Default Credit Value</Label>
                      <Input
                        type="number"
                        value={defaultCredits}
                        onChange={(e) => setDefaultCredits(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Default credits awarded per exam
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Data Staleness Threshold (days)</Label>
                      <Input
                        type="number"
                        value={stalenessThreshold}
                        onChange={(e) => setStalenessThreshold(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Flag data older than this many days
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Acceptable Score Range</Label>
                      <div className="flex gap-4">
                        <Input type="number" placeholder="Min (20)" defaultValue="20" />
                        <Input type="number" placeholder="Max (80)" defaultValue="80" />
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleSaveSettings}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Configuration
                  </Button>
                </Card>
              </TabsContent>

              <TabsContent value="email">
                <Card className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Email Management
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Configure email templates and notification settings
                    </p>
                  </div>
                  <div className="space-y-4">
                    {/* New subject input */}
                        <div className="space-y-2">
                            <Label>Email Subject</Label>
                            <Input
                            type="text"
                            placeholder="Reminder: Please update your CLEP credit information"
                            defaultValue="Reminder: Please update your CLEP credit information"
                            />
                        </div>

                        {/* Existing email body */}
                        <div className="space-y-2">
                            <Label>Reminder Email Template</Label>
                            <Textarea
                            rows={6}
                            defaultValue={`Dear {institution_name},\n\nWe noticed your CLEP acceptance data hasn't been updated in {days_since_update} days. Please review and update your information to ensure learners have access to current policies. 
                                          \n\n Follow this link to log in and update your information: https://modernstates.com/institution \n\n Thank you! \n\nBest,\nModern States Team`}
                            />
                        </div>
                    <div className="flex gap-2">
                      <Button variant="outline">Preview Email</Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowInput(!showInput)}
                        >
                        Send Test Email
                      </Button>
                    </div>
                    {showInput && (
                        <div className="flex gap-2 mt-2">
                        <Input
                            type="email"
                            placeholder="Enter email address"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            className="flex-1"
                        />
                        <Button
                            onClick={() => {
                                const hardcodedEmail = "ajiang0210@gmail.com";
                                console.log("Sending test email to:", hardcodedEmail);
                            }}
                        >
                            Send
                        </Button>
                        </div>
                    )}
                    <div className="space-y-2">
                      <Label>Email Schedule</Label>
                      <select className="w-full h-10 px-3 rounded-lg bg-background border border-border">
                        <option>Weekly on Monday</option>
                        <option>Bi-weekly</option>
                        <option>Monthly</option>
                        <option>Quarterly</option>
                      </select>
                    </div>
                  </div>
                  <Button onClick={handleSaveSettings}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Email Settings
                  </Button>
                </Card>
              </TabsContent>

              <TabsContent value="users">
                <Card className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        User Management
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Manage institution user accounts
                      </p>
                    </div>
                    <Button>Add New User</Button>
                  </div>
                  <div className="border rounded-lg">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-3">Institution</th>
                          <th className="text-left p-3">Email</th>
                          <th className="text-left p-3">Last Login</th>
                          <th className="text-left p-3">Status</th>
                          <th className="text-left p-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border/50">
                          <td className="p-3">Ohio State University</td>
                          <td className="p-3">admin@osu.edu</td>
                          <td className="p-3 text-sm text-muted-foreground">2024-02-15</td>
                          <td className="p-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-500">
                              Active
                            </span>
                          </td>
                          <td className="p-3">
                            <Button size="sm" variant="ghost">Edit</Button>
                          </td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="p-3">Penn State</td>
                          <td className="p-3">admin@psu.edu</td>
                          <td className="p-3 text-sm text-muted-foreground">2024-02-10</td>
                          <td className="p-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-500">
                              Active
                            </span>
                          </td>
                          <td className="p-3">
                            <Button size="sm" variant="ghost">Edit</Button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="alerts">
                <Card className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Alert Configuration
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Configure alert thresholds and notifications
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label>Data older than 90 days</Label>
                        <p className="text-sm text-muted-foreground">Show yellow alert</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label>Data older than 180 days</Label>
                        <p className="text-sm text-muted-foreground">Show red alert</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label>Missing required fields</Label>
                        <p className="text-sm text-muted-foreground">Immediate alert</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label>Email notifications for alerts</Label>
                        <p className="text-sm text-muted-foreground">Send to admin email</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                  <Button onClick={handleSaveSettings}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Alert Settings
                  </Button>
                </Card>
              </TabsContent>

              <TabsContent value="audit">
                <Card className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold">Audit & Compliance</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      View system audit logs and compliance settings
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <Input placeholder="Search audit logs..." />
                      <Button variant="outline">Filter</Button>
                      <Button variant="outline">Export Logs</Button>
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-accent/50 p-3 border-b">
                        <p className="text-sm font-medium">Recent Activity</p>
                      </div>
                      <div className="divide-y">
                        <div className="p-3 text-sm">
                          <div className="flex justify-between">
                            <span>Admin override applied to Biology exam</span>
                            <span className="text-muted-foreground">2024-02-15 14:32</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            User: admin@modernstates.org • Institution: Ohio State
                          </p>
                        </div>
                        <div className="p-3 text-sm">
                          <div className="flex justify-between">
                            <span>New institution added</span>
                            <span className="text-muted-foreground">2024-02-14 10:15</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            User: admin@modernstates.org • Institution: Miami University
                          </p>
                        </div>
                        <div className="p-3 text-sm">
                          <div className="flex justify-between">
                            <span>Bulk email sent to 45 institutions</span>
                            <span className="text-muted-foreground">2024-02-13 09:00</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            User: admin@modernstates.org • Type: Reminder
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminSettings;
