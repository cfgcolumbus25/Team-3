import { useState, useMemo, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, AlertCircle, Download, Upload, Save, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getUniversityByDiCode } from "@/lib/universityDatabase";
import {
  getInstitutionExamData,
  initializeDefaultExamData,
  updateInstitutionExam,
  saveInstitutionExamData,
  type InstitutionExamData,
} from "@/lib/institutionDataStorage";
import { useNavigate } from "react-router-dom";

interface ExamData {
  id: string;
  name: string;
  minScore: string;
  credits: string;
  courseCode: string;
  lastUpdated: string;
  category: string;
}

const InstitutionDataManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState<ExamData[]>([]);
  const [university, setUniversity] = useState<any>(null);
  const [examData, setExamData] = useState<ExamData[]>([]);
  const [loading, setLoading] = useState(true);

  // Load university and exam data
  useEffect(() => {
    const loadData = async () => {
      if (!user?.institution?.diCode) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const uni = await getUniversityByDiCode(user.institution.diCode);
        setUniversity(uni || null);

        await initializeDefaultExamData(user.institution.diCode);
        const storedData = await getInstitutionExamData(user.institution.diCode);

        // Merge with university database data (prioritize stored data, fallback to database)
        let mergedData: ExamData[] = [];
        
        if (uni) {
          mergedData = uni.clepPolicies.map((policy: any, index: number) => {
            const stored = storedData.find(
              (e: any) => e.examName.toLowerCase() === policy.examName.toLowerCase()
            );
            return {
              id: `exam-${index}`,
              name: policy.examName,
              minScore: stored?.minScore?.toString() || (policy.minimumScore?.toString() || ""),
              credits: stored?.credits?.toString() || (policy.creditsAwarded?.toString() || ""),
              courseCode: stored?.courseCode || (policy.classEquivalent?.toString() || ""),
              lastUpdated: stored?.lastUpdated || "Never",
              category: stored?.category || "General",
            };
          });
        } else {
          mergedData = storedData.map((exam: any, index: number) => ({
            id: `exam-${index}`,
            name: exam.examName,
            minScore: exam.minScore?.toString() || "",
            credits: exam.credits?.toString() || "",
            courseCode: exam.courseCode || "",
            lastUpdated: exam.lastUpdated || "Never",
            category: exam.category || "General",
          }));
        }

        setExamData(mergedData);
        setOriginalData(JSON.parse(JSON.stringify(mergedData))); // Deep copy
      } catch (error) {
        console.error("Error loading exam data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleCellEdit = (examId: string, field: keyof ExamData, value: string) => {
    setExamData((prev) =>
      prev.map((exam) =>
        exam.id === examId ? { ...exam, [field]: value } : exam
      )
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    console.log(user)
    if (!user?.institution?.diCode) {
      toast({
        title: "Error",
        description: "You must be logged in to save changes.",
        variant: "destructive",
      });
      return;
    }

    const institutionDiCode = user.institution.diCode;
    const errors: string[] = [];

    // Save each exam that has been modified
    for (const exam of examData) {
      const original = originalData.find((o) => o.id === exam.id);
      if (!original) continue;

      // Check if this exam has changed
      const hasChanged =
        exam.minScore !== original.minScore ||
        exam.credits !== original.credits ||
        exam.courseCode !== original.courseCode;

      if (hasChanged) {
        const updates: Partial<InstitutionExamData> = {};
        if (exam.minScore !== original.minScore) {
          updates.minScore = exam.minScore;
        }
        if (exam.credits !== original.credits) {
          updates.credits = exam.credits;
        }
        if (exam.courseCode !== original.courseCode) {
          updates.courseCode = exam.courseCode;
        }
        updates.lastUpdated = new Date().toISOString().split("T")[0];

        const success = await updateInstitutionExam(institutionDiCode, exam.name, updates);
        if (!success) {
          errors.push(exam.name);
        }
      }
    }

    if (errors.length > 0) {
      toast({
        title: "Partial Save",
        description: `Saved most changes, but ${errors.length} exam(s) failed to save.`,
        variant: "destructive",
      });
    } else {
    toast({
      title: "Changes saved!",
      description: "Your CLEP data has been updated successfully.",
    });
    }

    // Reload data to reflect saved changes
    const storedData = await getInstitutionExamData(institutionDiCode);
    console.log(storedData)
    let mergedData: ExamData[] = [];
    
    if (university) {
      mergedData = university.clepPolicies.map((policy, index) => {
        const stored = storedData.find(
          (e) => e.examName.toLowerCase() === policy.examName.toLowerCase()
        );
        return {
          id: `exam-${index}`,
          name: policy.examName,
          minScore: stored?.minScore?.toString() || (policy.minimumScore?.toString() || ""),
          credits: stored?.credits?.toString() || (policy.creditsAwarded?.toString() || ""),
          courseCode: stored?.courseCode || (policy.classEquivalent?.toString() || ""),
          lastUpdated: stored?.lastUpdated || "Never",
          category: stored?.category || "General",
        };
      });
    }

    setExamData(mergedData);
    setOriginalData(JSON.parse(JSON.stringify(mergedData)));
    setHasChanges(false);
    setSelectedExams([]);
    navigate("/institution/")
  };

  const handleReset = () => {
    setExamData(JSON.parse(JSON.stringify(originalData))); // Reset to original
    setHasChanges(false);
    toast({
      title: "Changes discarded",
      description: "All unsaved changes have been reset.",
    });
  };

  const handleExport = () => {
    toast({
      title: "Exporting data...",
      description: "Your CSV file will download shortly.",
    });
  };

  const toggleSelectAll = () => {
    if (selectedExams.length === examData.length) {
      setSelectedExams([]);
    } else {
      setSelectedExams(examData.map((e) => e.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedExams((prev) =>
      prev.includes(id) ? prev.filter((examId) => examId !== id) : [...prev, id]
    );
  };

  // Calculate statistics
  const stats = useMemo(() => {
  const totalCount = examData.length;
    const completedCount = examData.filter((e) => e.minScore && e.minScore !== "").length;
    
    // Calculate average minimum score
    const scores = examData
      .map((e) => parseInt(e.minScore))
      .filter((s) => !isNaN(s) && s > 0);
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
      : 0;

    // Find most recent update
    const dates = examData
      .map((e) => e.lastUpdated)
      .filter((d) => d !== "Never")
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    const lastUpdated = dates.length > 0 ? dates[0] : "Never";

    return {
      totalCount,
      completedCount,
      avgScore,
      lastUpdated,
    };
  }, [examData]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="flex">
        <Sidebar role="institution" />
        
        <main className="flex-1 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Manage CLEP Acceptance Data</h1>
            <p className="text-muted-foreground">
              Update your institution's CLEP exam acceptance policies and credit information
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6 shadow-card hover-lift">
              <div className="text-sm text-muted-foreground mb-1">Total Exams Tracked</div>
              <div className="text-3xl font-bold">{stats.totalCount}</div>
            </Card>
            <Card className="p-6 shadow-card hover-lift">
              <div className="text-sm text-muted-foreground mb-1">Accepting Credit</div>
              <div className="text-3xl font-bold text-primary">{stats.completedCount}</div>
            </Card>
            <Card className="p-6 shadow-card hover-lift">
              <div className="text-sm text-muted-foreground mb-1">Average Min Score</div>
              <div className="text-3xl font-bold">{stats.avgScore || "N/A"}</div>
            </Card>
            <Card className="p-6 shadow-card hover-lift">
              <div className="text-sm text-muted-foreground mb-1">Last Update</div>
              <div className="text-lg font-semibold mt-2">
                {stats.lastUpdated === "Never"
                  ? "Never"
                  : new Date(stats.lastUpdated).toLocaleDateString()}
              </div>
            </Card>
          </div>

          {/* Bulk Actions Bar */}
          {hasChanges && (
            <Card className="p-4 mb-6 border-primary/50 shadow-glow animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <AlertCircle className="h-5 w-5 text-warning" />
                  <span className="font-medium">You have unsaved changes</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleReset} className="gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Discard
                  </Button>
                  <Button onClick={handleSave} className="gap-2">
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-6 shadow-card">
            <Tabs defaultValue="all">
              <div className="flex items-center justify-between mb-6">
                <TabsList>
                  <TabsTrigger value="all">All Exams</TabsTrigger>
                  <TabsTrigger value="recent">Recently Updated</TabsTrigger>
                  <TabsTrigger value="needs-review">Needs Review</TabsTrigger>
                </TabsList>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Import
                  </Button>
                </div>
              </div>

              <TabsContent value="all" className="mt-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="pb-3 font-semibold w-12">
                          <input
                            type="checkbox"
                            checked={selectedExams.length === examData.length}
                            onChange={toggleSelectAll}
                            className="rounded"
                          />
                        </th>
                        <th className="pb-3 font-semibold">Exam Name</th>
                        <th className="pb-3 font-semibold">Category</th>
                        <th className="pb-3 font-semibold">Min Score</th>
                        <th className="pb-3 font-semibold">Credits</th>
                        <th className="pb-3 font-semibold">Course Code</th>
                        <th className="pb-3 font-semibold">Last Updated</th>
                        <th className="pb-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {examData.map((exam) => (
                        <tr key={exam.id} className="hover:bg-muted/50 transition-smooth">
                          <td className="py-4">
                            <input
                              type="checkbox"
                              checked={selectedExams.includes(exam.id)}
                              onChange={() => toggleSelect(exam.id)}
                              className="rounded"
                            />
                          </td>
                          <td className="py-4 font-medium">{exam.name}</td>
                          <td className="py-4">
                            <Badge variant="outline">{exam.category}</Badge>
                          </td>
                          <td className="py-4">
                            <Input
                              value={exam.minScore}
                              onChange={(e) => handleCellEdit(exam.id, "minScore", e.target.value)}
                              className="w-20 h-8"
                              placeholder="--"
                            />
                          </td>
                          <td className="py-4">
                            <Input
                              value={exam.credits}
                              onChange={(e) => handleCellEdit(exam.id, "credits", e.target.value)}
                              className="w-20 h-8"
                              placeholder="--"
                            />
                          </td>
                          <td className="py-4">
                            <Input
                              value={exam.courseCode}
                              onChange={(e) => handleCellEdit(exam.id, "courseCode", e.target.value)}
                              className="w-32 h-8"
                              placeholder="--"
                            />
                          </td>
                          <td className="py-4 text-sm text-muted-foreground">
                            {exam.lastUpdated === "Never"
                              ? "Never"
                              : new Date(exam.lastUpdated).toLocaleDateString()}
                          </td>
                          <td className="py-4">
                            {exam.minScore ? (
                              <Badge variant="default" className="gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Complete
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Missing
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="recent">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="pb-3 font-semibold w-12">
                          <input
                            type="checkbox"
                            checked={selectedExams.length === examData.filter(e => {
                              if (e.lastUpdated === "Never") return false;
                              const date = new Date(e.lastUpdated);
                              const thirtyDaysAgo = new Date();
                              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                              return date >= thirtyDaysAgo;
                            }).length}
                            onChange={() => {
                              const recentExams = examData.filter(e => {
                                if (e.lastUpdated === "Never") return false;
                                const date = new Date(e.lastUpdated);
                                const thirtyDaysAgo = new Date();
                                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                                return date >= thirtyDaysAgo;
                              });
                              if (selectedExams.length === recentExams.length) {
                                setSelectedExams([]);
                              } else {
                                setSelectedExams(recentExams.map(e => e.id));
                              }
                            }}
                            className="rounded"
                          />
                        </th>
                        <th className="pb-3 font-semibold">Exam Name</th>
                        <th className="pb-3 font-semibold">Category</th>
                        <th className="pb-3 font-semibold">Min Score</th>
                        <th className="pb-3 font-semibold">Credits</th>
                        <th className="pb-3 font-semibold">Course Code</th>
                        <th className="pb-3 font-semibold">Last Updated</th>
                        <th className="pb-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {examData
                        .filter((exam) => {
                          if (exam.lastUpdated === "Never") return false;
                          const date = new Date(exam.lastUpdated);
                          const thirtyDaysAgo = new Date();
                          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                          return date >= thirtyDaysAgo;
                        })
                        .map((exam) => (
                          <tr key={exam.id} className="hover:bg-muted/50 transition-smooth">
                            <td className="py-4">
                              <input
                                type="checkbox"
                                checked={selectedExams.includes(exam.id)}
                                onChange={() => toggleSelect(exam.id)}
                                className="rounded"
                              />
                            </td>
                            <td className="py-4 font-medium">{exam.name}</td>
                            <td className="py-4">
                              <Badge variant="outline">{exam.category}</Badge>
                            </td>
                            <td className="py-4">
                              <Input
                                value={exam.minScore}
                                onChange={(e) => handleCellEdit(exam.id, "minScore", e.target.value)}
                                className="w-20 h-8"
                                placeholder="--"
                              />
                            </td>
                            <td className="py-4">
                              <Input
                                value={exam.credits}
                                onChange={(e) => handleCellEdit(exam.id, "credits", e.target.value)}
                                className="w-20 h-8"
                                placeholder="--"
                              />
                            </td>
                            <td className="py-4">
                              <Input
                                value={exam.courseCode}
                                onChange={(e) => handleCellEdit(exam.id, "courseCode", e.target.value)}
                                className="w-32 h-8"
                                placeholder="--"
                              />
                            </td>
                            <td className="py-4 text-sm text-muted-foreground">
                              {exam.lastUpdated === "Never"
                                ? "Never"
                                : new Date(exam.lastUpdated).toLocaleDateString()}
                            </td>
                            <td className="py-4">
                              {exam.minScore ? (
                                <Badge variant="default" className="gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Complete
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  Missing
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="needs-review">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="pb-3 font-semibold w-12">
                          <input
                            type="checkbox"
                            checked={selectedExams.length === examData.filter(e => !e.minScore || e.minScore === "").length}
                            onChange={() => {
                              const needsReview = examData.filter(e => !e.minScore || e.minScore === "");
                              if (selectedExams.length === needsReview.length) {
                                setSelectedExams([]);
                              } else {
                                setSelectedExams(needsReview.map(e => e.id));
                              }
                            }}
                            className="rounded"
                          />
                        </th>
                        <th className="pb-3 font-semibold">Exam Name</th>
                        <th className="pb-3 font-semibold">Category</th>
                        <th className="pb-3 font-semibold">Min Score</th>
                        <th className="pb-3 font-semibold">Credits</th>
                        <th className="pb-3 font-semibold">Course Code</th>
                        <th className="pb-3 font-semibold">Last Updated</th>
                        <th className="pb-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {examData
                        .filter((exam) => !exam.minScore || exam.minScore === "")
                        .map((exam) => (
                          <tr key={exam.id} className="hover:bg-muted/50 transition-smooth">
                            <td className="py-4">
                              <input
                                type="checkbox"
                                checked={selectedExams.includes(exam.id)}
                                onChange={() => toggleSelect(exam.id)}
                                className="rounded"
                              />
                            </td>
                            <td className="py-4 font-medium">{exam.name}</td>
                            <td className="py-4">
                              <Badge variant="outline">{exam.category}</Badge>
                            </td>
                            <td className="py-4">
                              <Input
                                value={exam.minScore}
                                onChange={(e) => handleCellEdit(exam.id, "minScore", e.target.value)}
                                className="w-20 h-8"
                                placeholder="--"
                              />
                            </td>
                            <td className="py-4">
                              <Input
                                value={exam.credits}
                                onChange={(e) => handleCellEdit(exam.id, "credits", e.target.value)}
                                className="w-20 h-8"
                                placeholder="--"
                              />
                            </td>
                            <td className="py-4">
                              <Input
                                value={exam.courseCode}
                                onChange={(e) => handleCellEdit(exam.id, "courseCode", e.target.value)}
                                className="w-32 h-8"
                                placeholder="--"
                              />
                            </td>
                            <td className="py-4 text-sm text-muted-foreground">
                              {exam.lastUpdated === "Never"
                                ? "Never"
                                : new Date(exam.lastUpdated).toLocaleDateString()}
                            </td>
                            <td className="py-4">
                              {exam.minScore ? (
                                <Badge variant="default" className="gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Complete
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  Missing
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default InstitutionDataManagement;
