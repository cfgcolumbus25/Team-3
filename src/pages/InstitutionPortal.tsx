import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Navigation } from "@/components/Navigation";
import { Sidebar } from "@/components/Sidebar";
import { UploadDocumentModal } from "@/components/UploadDocumentModal";
import { InstitutionChatbot } from "@/components/InstitutionChatbot";
import { useAuth } from "@/contexts/AuthContext";
import { getUniversityByDiCode } from "@/lib/universityDatabase";
import { getInstitutionExamData, initializeDefaultExamData } from "@/lib/institutionDataStorage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Upload, 
  Edit, 
  MessageSquare, 
  Eye, 
  Calendar,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

const InstitutionPortal = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);

  // Get the university data for the logged-in institution
  const university = useMemo(() => {
    if (!user?.institution?.diCode) return null;
    return getUniversityByDiCode(user.institution.diCode);
  }, [user]);

  // Get institution-specific exam data from localStorage
  const institutionExamData = useMemo(() => {
    if (!user?.institution?.id) return [];
    const institutionId = user.institution.id;
    initializeDefaultExamData(institutionId);
    const storedData = getInstitutionExamData(institutionId);
    
    // Merge with university database data (prioritize stored data, fallback to database)
    if (university) {
      return university.clepPolicies.map(policy => {
        const stored = storedData.find(e => 
          e.examName.toLowerCase() === policy.examName.toLowerCase()
        );
        return {
          examName: policy.examName,
          minScore: stored?.minScore || (policy.minimumScore?.toString() || ""),
          credits: stored?.credits || (policy.creditsAwarded?.toString() || ""),
          courseCode: stored?.courseCode || (policy.classEquivalent || ""),
          lastUpdated: stored?.lastUpdated || "Never",
          category: stored?.category || "General"
        };
      });
    }
    return storedData;
  }, [user, university]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalExams = institutionExamData.length;
    const completedExams = institutionExamData.filter(e => e.minScore && e.minScore !== "").length;
    const completionPercentage = totalExams > 0 ? Math.round((completedExams / totalExams) * 100) : 0;
    
    // Find most recent update
    const dates = institutionExamData
      .map(e => e.lastUpdated)
      .filter(d => d !== "Never")
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    const lastUpdated = dates.length > 0 ? dates[0] : "Never";

    return {
      totalExams,
      completedExams,
      completionPercentage,
      lastUpdated
    };
  }, [institutionExamData]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="flex">
        <Sidebar role="institution" />
        
        <main className="flex-1 p-8">
          {/* Status Overview */}
          <Card className="p-6 mb-8 shadow-card hover-lift">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-muted-foreground mb-2">Last Updated</div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-semibold">
                    {stats.lastUpdated === "Never" 
                      ? "Never" 
                      : new Date(stats.lastUpdated).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-2">Data Completion</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{stats.completionPercentage}%</span>
                    <span className="text-muted-foreground">{stats.completedExams} of {stats.totalExams} exams</span>
                  </div>
                  <Progress value={stats.completionPercentage} className="h-2" />
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-2">Status</div>
                <Badge variant={stats.completionPercentage >= 80 ? "default" : "secondary"} className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {stats.completionPercentage >= 80 ? "Up to Date" : "In Progress"}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Update Methods */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Update Your Data</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {/* AI Chatbot */}
              <Card
                className="p-6 shadow-card hover-lift cursor-pointer group"
                onClick={() => setShowChatbot(true)}
              >
                <div className="mb-4 p-4 rounded-lg bg-primary/10 w-fit">
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2">AI Chatbot Assistant</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Chat with our AI to update your data naturally using conversation
                </p>
                <Button className="w-full group-hover:shadow-glow transition-smooth">
                  Start Chatting
                </Button>
              </Card>

              {/* PDF Upload */}
              <Card
                className="p-6 shadow-card hover-lift cursor-pointer group"
                onClick={() => setShowUploadModal(true)}
              >
                <div className="mb-4 p-4 rounded-lg bg-secondary/10 w-fit">
                  <Upload className="h-8 w-8 text-secondary" />
                </div>
                <h3 className="text-lg font-bold mb-2">Upload PDF</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload your policy document and let AI extract the information
                </p>
                <Button variant="secondary" className="w-full group-hover:shadow-glow transition-smooth">
                  Upload Document
                </Button>
              </Card>

              {/* Manual Edit */}
              <Card
                className="p-6 shadow-card hover-lift cursor-pointer group"
                onClick={() => navigate("/institution/data-management")}
              >
                <div className="mb-4 p-4 rounded-lg bg-accent/10 w-fit">
                  <Edit className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-lg font-bold mb-2">Manual Editing</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Edit data directly in a spreadsheet-style interface
                </p>
                <Button variant="outline" className="w-full group-hover:shadow-glow transition-smooth">
                  Edit Manually
                </Button>
              </Card>
            </div>
          </div>

          {/* Data Preview */}
          <Card className="p-6 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Current CLEP Data</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Preview as Learner
                </Button>
                <Button size="sm">Edit All</Button>
              </div>
            </div>

            {/* Sample Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="pb-3 font-semibold">CLEP Exam</th>
                    <th className="pb-3 font-semibold">Min Score</th>
                    <th className="pb-3 font-semibold">Credits</th>
                    <th className="pb-3 font-semibold">Equivalency</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {institutionExamData.slice(0, 20).map((exam, i) => {
                    const isComplete = exam.minScore && exam.minScore !== "";
                    return (
                      <tr key={i} className="hover:bg-muted/50 transition-smooth">
                        <td className="py-4 font-medium">{exam.examName}</td>
                        <td className="py-4">{exam.minScore || "-"}</td>
                        <td className="py-4">{exam.credits || "-"}</td>
                        <td className="py-4">{exam.courseCode || "-"}</td>
                        <td className="py-4">
                          {isComplete ? (
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
                        <td className="py-4">
                          <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedExam(exam)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Button>
                              </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>{exam.examName}</DialogTitle>
                                <DialogDescription>
                                  CLEP exam acceptance policy details
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground">Minimum Score</p>
                                    <p className="text-2xl font-bold">{exam.minScore || "Not set"}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Credits Awarded</p>
                                    <p className="text-2xl font-bold">{exam.credits || "Not set"}</p>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Course Equivalency</p>
                                  <p className="text-lg font-semibold">{exam.courseCode || "Not set"}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Last Updated</p>
                                  <p className="text-sm">
                                    {exam.lastUpdated === "Never" 
                                      ? "Never" 
                                      : new Date(exam.lastUpdated).toLocaleDateString()}
                                  </p>
                                </div>
                                {exam.category && (
                                  <div>
                                    <p className="text-sm text-muted-foreground">Category</p>
                                    <p className="text-sm">{exam.category}</p>
                                  </div>
                                )}
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => navigate("/institution/data-management")}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Details
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </main>
      </div>

      {/* Upload Document Modal */}
      <UploadDocumentModal open={showUploadModal} onOpenChange={setShowUploadModal} />

      {/* Chatbot Sidebar */}
      <InstitutionChatbot open={showChatbot} onOpenChange={setShowChatbot} />
    </div>
  );
};

export default InstitutionPortal;
