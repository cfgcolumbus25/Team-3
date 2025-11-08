import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Extracted constants
const VALID_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const UPLOAD_STAGES = [
  { progress: 20, message: "Uploading file...", delay: 800 },
  { progress: 40, message: "Extracting text...", delay: 1000 },
  { progress: 60, message: "Identifying CLEP exams...", delay: 1200 },
  { progress: 80, message: "Parsing scores and credits...", delay: 1000 },
  { progress: 100, message: "Validating data...", delay: 800 },
];

interface UploadDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ExtractedData {
  exam: string;
  minScore: number;
  newMinScore?: number;
  credits: number;
  newCredits?: number;
  confidence: number;
  status: "changed" | "new" | "unchanged" | "needs-review";
}

export const UploadDocumentModal = ({ open, onOpenChange }: UploadDocumentModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [filterTab, setFilterTab] = useState<"all" | "changes" | "new" | "review">("all");
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = (selectedFile: File) => {
    if (!VALID_FILE_TYPES.includes(selectedFile.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, DOCX, XLSX, or CSV file.",
        variant: "destructive",
      });
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB.",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const simulateUpload = async () => {
    setUploading(true);
    setProgress(0);

    for (const stage of UPLOAD_STAGES) {
      await new Promise(resolve => setTimeout(resolve, stage.delay));
      setProgress(stage.progress);
      setStage(stage.message);
    }

    // Simulate extracted data
    const mockData: ExtractedData[] = [
      { exam: "Biology", minScore: 50, newMinScore: 52, credits: 4, newCredits: 3, confidence: 95, status: "changed" },
      { exam: "Chemistry", minScore: 55, credits: 3, confidence: 98, status: "unchanged" },
      { exam: "Calculus", minScore: 60, credits: 4, confidence: 87, status: "new" },
      { exam: "History I", minScore: 50, credits: 3, confidence: 92, status: "unchanged" },
      { exam: "English Composition", minScore: 50, credits: 3, confidence: 78, status: "needs-review" },
      { exam: "Psychology", minScore: 55, newMinScore: 50, credits: 3, confidence: 94, status: "changed" },
    ];

    setExtractedData(mockData);
    setSelectedRows(mockData.map((_, idx) => idx).filter(idx => mockData[idx].confidence >= 90));
    setShowResults(true);
    setUploading(false);
  };

  const handleApprove = () => {
    const approvedCount = selectedRows.length;
    toast({
      title: "✅ Successfully updated!",
      description: `Updated ${approvedCount} CLEP exam policies`,
    });
    setTimeout(() => {
      onOpenChange(false);
      resetModal();
    }, 2000);
  };

  const resetModal = () => {
    setFile(null);
    setUploading(false);
    setProgress(0);
    setStage("");
    setExtractedData([]);
    setShowResults(false);
    setSelectedRows([]);
    setFilterTab("all");
  };

  const toggleRow = (idx: number) => {
    setSelectedRows(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const getFilteredData = () => {
    switch (filterTab) {
      case "changes":
        return extractedData.filter(d => d.status === "changed");
      case "new":
        return extractedData.filter(d => d.status === "new");
      case "review":
        return extractedData.filter(d => d.confidence < 90);
      default:
        return extractedData;
    }
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 90) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (confidence >= 70) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      changed: "bg-orange-500/10 text-orange-500",
      new: "bg-green-500/10 text-green-500",
      unchanged: "bg-gray-500/10 text-gray-500",
      "needs-review": "bg-red-500/10 text-red-500",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
      </span>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload CLEP Acceptance Document
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Upload a PDF, Word document, or spreadsheet with your CLEP policies
          </p>
        </DialogHeader>

        {!file && !showResults && (
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
              dragActive
                ? "border-primary bg-primary/10 scale-[1.02]"
                : "border-border hover:border-primary hover:bg-accent/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Drag and drop your file here</h3>
            <p className="text-sm text-muted-foreground mb-4">or</p>
            <label>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.docx,.xlsx,.csv"
                onChange={handleFileInputChange}
              />
              <Button asChild className="cursor-pointer">
                <span>Browse Files</span>
              </Button>
            </label>
            <p className="text-xs text-muted-foreground mt-4">
              Supported: PDF, DOCX, XLSX, CSV • Max size: 10MB
            </p>
          </div>
        )}

        {file && !uploading && !showResults && (
          <div className="space-y-4">
            <div className="border rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setFile(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button onClick={simulateUpload} className="flex-1">
                Upload & Process
              </Button>
              <Button variant="outline" onClick={() => setFile(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {uploading && (
          <div className="space-y-4 py-8">
            <div className="text-center">
              <p className="text-lg font-semibold mb-2">{stage}</p>
              <div className="w-full bg-border rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">{progress}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                ⏱️ Estimated time: {Math.ceil((100 - progress) / 3)} seconds
              </p>
            </div>
          </div>
        )}

        {showResults && (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-500">Document Processed Successfully!</h3>
                <p className="text-sm text-muted-foreground">
                  We found information for {extractedData.length} CLEP exams in your document.
                  Review the extracted data below and approve changes.
                </p>
              </div>
            </div>

            <div className="flex gap-2 border-b">
              {[
                { key: "all", label: "All" },
                { key: "changes", label: "Changes Only" },
                { key: "new", label: "New Data" },
                { key: "review", label: "Needs Review" },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilterTab(tab.key as any)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    filterTab === tab.key
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-accent/50">
                  <tr>
                    <th className="p-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedRows.length === extractedData.length}
                        onChange={(e) =>
                          setSelectedRows(e.target.checked ? extractedData.map((_, i) => i) : [])
                        }
                        className="rounded"
                      />
                    </th>
                    <th className="p-3 text-left font-semibold">Exam Name</th>
                    <th className="p-3 text-left font-semibold">Min Score</th>
                    <th className="p-3 text-left font-semibold">Credits</th>
                    <th className="p-3 text-left font-semibold">Confidence</th>
                    <th className="p-3 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredData().map((data, idx) => {
                    const originalIdx = extractedData.indexOf(data);
                    return (
                      <tr
                        key={idx}
                        className={`border-t ${
                          data.confidence >= 90
                            ? "bg-green-500/5"
                            : data.confidence >= 70
                            ? "bg-yellow-500/5"
                            : "bg-red-500/5"
                        }`}
                      >
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedRows.includes(originalIdx)}
                            onChange={() => toggleRow(originalIdx)}
                            className="rounded"
                          />
                        </td>
                        <td className="p-3 font-medium">{data.exam}</td>
                        <td className="p-3">
                          {data.newMinScore ? (
                            <span className="text-orange-500">
                              {data.minScore} → {data.newMinScore}
                            </span>
                          ) : (
                            data.minScore
                          )}
                        </td>
                        <td className="p-3">
                          {data.newCredits ? (
                            <span className="text-orange-500">
                              {data.credits} → {data.newCredits}
                            </span>
                          ) : (
                            data.credits
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {getConfidenceIcon(data.confidence)}
                            <span className="text-sm">{data.confidence}%</span>
                          </div>
                        </td>
                        <td className="p-3">{getStatusBadge(data.status)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="outline" onClick={resetModal}>
                ← Back to Upload
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleApprove} disabled={selectedRows.length === 0}>
                  Approve Selected ({selectedRows.length})
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
