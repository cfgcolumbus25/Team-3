import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navigation } from "@/components/Navigation";
import { Sidebar } from "@/components/Sidebar";
import { 
  Bell,
  Mail,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Search,
  Database,
} from "lucide-react";

import { getAllUniversities } from "@/lib/universityDatabase";

export default function AdminPortal() {
  // ✅ Load college data directly from JSON
  const [colleges, setColleges] = useState(() =>
    getAllUniversities().map((u, idx) => ({
      id: idx + 1,
      name: u.name,
      acceptsCLEP: u.acceptsCLEP ? "Yes" : "No",
      minScore: u.avgScore || "-",
      subjects: u.clepPolicies?.length || 0,
      lastUpdated: u.lastUpdated || "Unknown"
    }))
  );

  // ✅ Alerts stay local
  const [alerts, setAlerts] = useState([
    { id: 1, college: "Ohio State University", reason: "Outdated CLEP policy", priority: "high", status: "pending" },
    { id: 2, college: "Miami University", reason: "Missing exam scores", priority: "medium", status: "pending" },
    { id: 3, college: "University of Cincinnati", reason: "Negative feedback received", priority: "high", status: "pending" },
  ]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const handleSendEmail = (id: number) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, status: "sent" } : a));
  };

  const handleDismissAlert = (id: number) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const filteredColleges = colleges.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="flex">
        <Sidebar role="admin" />

        <main className="flex-1 p-8 space-y-8">

          {/* ✅ ALERT SYSTEM */}
          <Card className="p-6 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Bell className="h-6 w-6 text-warning" />
                <h2 className="text-xl font-bold">Alert System</h2>
              </div>
              <Badge>{alerts.length} Active</Badge>
            </div>

            {alerts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No active alerts</p>
            ) : (
              <div className="space-y-4">
                {alerts.map(alert => (
                  <Card
                    key={alert.id}
                    className={`p-4 border-l-4 ${
                      alert.priority === "high"
                        ? "border-destructive bg-destructive/10"
                        : "border-warning bg-warning/10"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="font-semibold">{alert.college}</div>
                        <div className="text-sm text-muted-foreground">{alert.reason}</div>
                        <Badge variant={alert.priority === "high" ? "destructive" : "default"}>
                          {alert.priority.toUpperCase()}
                        </Badge>
                      </div>

                      {alert.status === "pending" ? (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSendEmail(alert.id)}>
                            <Mail className="h-4 w-4 mr-1" /> Send Email
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDismissAlert(alert.id)}>
                            Dismiss
                          </Button>
                        </div>
                      ) : (
                        <span className="flex items-center gap-1 text-green-600 text-sm">
                          <CheckCircle2 className="h-4 w-4" /> Sent
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>

          {/* ✅ COLLEGE DATABASE (from JSON) */}
          <Card className="p-6 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Database className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-bold">College Database</h2>
              </div>

              <div className="relative w-64">
                <Search className="h-4 w-4 text-muted-foreground absolute left-2 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search colleges..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 text-left">College Name</th>
                    <th className="py-3 text-left">Accepts CLEP</th>
                    <th className="py-3 text-left">Min Score</th>
                    <th className="py-3 text-left">Subjects</th>
                    <th className="py-3 text-left">Last Updated</th>
                    <th className="py-3 text-left">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredColleges.map(col => (
                    <tr key={col.id} className="border-b hover:bg-muted/50">
                      <td className="py-3">
                        {editingId === col.id ? (
                          <Input
                            value={col.name}
                            onChange={(e) =>
                              setColleges(colleges.map(c =>
                                c.id === col.id ? { ...c, name: e.target.value } : c
                              ))
                            }
                          />
                        ) : (
                          <span>{col.name}</span>
                        )}
                      </td>

                      <td className="py-3">
                        {editingId === col.id ? (
                          <select
                            className="border rounded p-1"
                            value={col.acceptsCLEP}
                            onChange={(e) =>
                              setColleges(colleges.map(c =>
                                c.id === col.id ? { ...c, acceptsCLEP: e.target.value } : c
                              ))
                            }
                          >
                            <option>Yes</option>
                            <option>No</option>
                            <option>Partial</option>
                          </select>
                        ) : (
                          <Badge
                            variant={
                              col.acceptsCLEP === "Yes"
                                ? "default"
                                : col.acceptsCLEP === "Partial"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {col.acceptsCLEP}
                          </Badge>
                        )}
                      </td>

                      <td className="py-3">{col.minScore}</td>
                      <td className="py-3">{col.subjects}</td>
                      <td className="py-3 text-muted-foreground">{col.lastUpdated}</td>

                      <td className="py-3">
                        {editingId === col.id ? (
                          <Button size="sm" onClick={() => setEditingId(null)}>
                            Save
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => setEditingId(col.id)}>
                            <Edit3 className="h-4 w-4 mr-1" /> Edit
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

        </main>
      </div>
    </div>
  );
}
