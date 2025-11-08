import { useState, useRef, useEffect, useMemo } from "react";
import { Send, Bot, User, ChevronLeft, ChevronRight, MapPin, Star, X, Grid3x3, List, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface College {
  id: number;
  name: string;
  city: string;
  state: string;
  examsAccepted: number;
  avgScore: number;
  credits: string;
  highlighted?: boolean;
}

// Original colleges data
const allColleges: College[] = [
  { id: 1, name: "Ohio State University", city: "Columbus", state: "OH", examsAccepted: 28, avgScore: 52, credits: "3-4" },
  { id: 2, name: "Penn State University", city: "University Park", state: "PA", examsAccepted: 25, avgScore: 50, credits: "3-6" },
  { id: 3, name: "University of California, Berkeley", city: "Berkeley", state: "CA", examsAccepted: 22, avgScore: 55, credits: "3" },
  { id: 4, name: "Texas A&M University", city: "College Station", state: "TX", examsAccepted: 30, avgScore: 50, credits: "3-4" },
  { id: 5, name: "University of Michigan", city: "Ann Arbor", state: "MI", examsAccepted: 26, avgScore: 53, credits: "3-4" },
  { id: 6, name: "University of Florida", city: "Gainesville", state: "FL", examsAccepted: 29, avgScore: 50, credits: "3-6" },
];

interface UserExamScore {
  exam: string;
  score: number | null;
}

const LearnerPortal = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [userExamScores, setUserExamScores] = useState<UserExamScore[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatbotSectionRef = useRef<HTMLDivElement>(null);

  // Filter state
  const [selectedState, setSelectedState] = useState<string>("");
  const [zipCode, setZipCode] = useState<string>("");
  const [distance, setDistance] = useState<number>(100);
  const [institutionTypes, setInstitutionTypes] = useState<string[]>([]);
  const [minScore, setMinScore] = useState<number>(50);
  const [minCredits, setMinCredits] = useState<number>(3);

  // Scroll to top when component mounts to ensure chatbot is visible first
  useEffect(() => {
    // Prevent browser scroll restoration
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    
    // Force scroll to top immediately and multiple times to ensure it sticks
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    };
    
    scrollToTop();
    
    // Scroll to top at intervals to override any auto-scroll
    const intervals = [10, 50, 100, 200, 500, 1000].map(delay => 
      setTimeout(scrollToTop, delay)
    );
    
    // Also scroll to chatbot section specifically
    const scrollToChatbot = () => {
      if (chatbotSectionRef.current) {
        chatbotSectionRef.current.scrollIntoView({ behavior: "instant", block: "start" });
      }
    };
    
    const chatbotIntervals = [100, 300, 600].map(delay => 
      setTimeout(scrollToChatbot, delay)
    );
    
    return () => {
      intervals.forEach(clearTimeout);
      chatbotIntervals.forEach(clearTimeout);
    };
  }, []);

  // Removed auto-scroll on message send to prevent browser scrolling

  const suggestedQuestions = [
    "Colleges in California",
    "Biology CLEP acceptance",
    "Compare top schools",
    "Low score requirements",
  ];

  // Filter colleges based on filter state
  const filteredColleges = useMemo(() => {
    return allColleges.filter(college => {
      // State filter
      if (selectedState && college.state !== selectedState) {
        return false;
      }

      // Score filter
      if (college.avgScore < minScore) {
        return false;
      }

      // Credits filter - check if college's credit range meets minimum
      const creditMin = parseInt(college.credits.split("-")[0]);
      if (creditMin < minCredits) {
        return false;
      }

      // Exam filter - if exams are selected, check if college accepts enough exams
      if (userExamScores.length > 0 && college.examsAccepted < userExamScores.length) {
        return false;
      }

      return true;
    });
  }, [selectedState, minScore, minCredits, userExamScores]);

  // Filter handler functions
  const handleInstitutionTypeToggle = (type: string) => {
    setInstitutionTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const clearAllFilters = () => {
    setSelectedState("");
    setZipCode("");
    setDistance(100);
    setInstitutionTypes([]);
    setUserExamScores([]);
    setMinScore(50);
    setMinCredits(3);
  };

  const getAIResponse = (userMessage: string): string => {
    const lower = userMessage.toLowerCase();
    
    if (lower.includes("biology") || lower.includes("science")) {
      // Check if Biology exam is not already selected, then toggle it
      if (!userExamScores.some(e => e.exam === "Biology")) {
        handleExamToggle("Biology");
      }
      return "Great! I found 12 colleges that accept Biology CLEP.\n\nI've applied the filters for you:\n✓ Exam: Biology\n\nThe top results are showing below. Would you like to see colleges with specific minimum scores or credit requirements?";
    }
    
    if (lower.includes("ohio")) {
      setSelectedState("OH");
      return "I found several colleges in Ohio that accept CLEP credits! Ohio State University is one of the top options, accepting 28 out of 34 CLEP exams with an average minimum score of 52.\n\nI've filtered the results to show Ohio colleges. Check them out below!";
    }
    
    if (lower.includes("california") || lower.includes("ca")) {
      setSelectedState("CA");
      return "California has many excellent CLEP-friendly colleges! UC Berkeley and other UC schools accept various CLEP exams.\n\nI've updated the filters to show California colleges. Would you like to narrow down by exam type?";
    }
    
    if (lower.includes("compare")) {
      return "I can help you compare colleges! Just click the checkboxes on the college cards below to add them to your comparison. Once you've selected 2-4 colleges, click the 'Compare' button at the bottom to see a detailed side-by-side view.";
    }
    
    if (lower.includes("score") || lower.includes("good")) {
      return "CLEP exams are scored from 20-80. Most colleges accept scores of 50 or higher, though some require 55 or 60 for certain exams. The average passing score is around 50, which represents the equivalent of a C grade in the corresponding college course.";
    }
    
    if (lower.includes("credits") || lower.includes("earn")) {
      return "You can typically earn 3-6 credits per CLEP exam, depending on the institution and exam. With all 34 CLEP exams available, you could potentially earn up to 120 credits - that's an entire bachelor's degree! Most students use CLEP to earn 15-30 credits.";
    }
    
    return "That's a great question! I can help you find colleges that accept CLEP credits, compare acceptance policies, and answer questions about exams and scoring. Try asking me about specific colleges, states, or exams you're interested in!";
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.reply,
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I had trouble answering that. Try again!",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
    setTimeout(() => handleSend(), 100);
  };

  const toggleCompare = (id: number) => {
    if (selectedForCompare.length >= 4 && !selectedForCompare.includes(id)) return;
    setSelectedForCompare(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const mockExamData = [
    { exam: "Biology", accepted: true, minScore: 50, credits: 4, courseCode: "BIO 101" },
    { exam: "Chemistry", accepted: true, minScore: 55, credits: 3, courseCode: "CHEM 101" },
    { exam: "Calculus", accepted: false, minScore: null, credits: null, courseCode: null },
    { exam: "American Government", accepted: true, minScore: 50, credits: 3, courseCode: "POL 101" },
  ];

  const availableExams = [
    "American Government",
    "History of the United States I",
    "History of the United States II",
    "Introductory Sociology",
    "Social Sciences and History",
    "Western Civilization I",
    "Western Civilization II",
    "College Composition",
    "College Composition Modular",
    "American Literature",
    "Analyzing and Interpreting Literature",
    "English Literature",
    "Human Growth and Development",
    "Introduction to Educational Psychology",
    "Introductory Psychology",
    "Principles of Macroeconomics",
    "Principles of Microeconomics",
    "Biology",
    "Chemistry",
    "Natural Sciences",
    "Calculus",
    "College Algebra",
    "College Mathematics",
    "Precalculus",
    "French Language Level I",
    "French Language Level II",
    "German Language Level I",
    "German Language Level II",
    "Spanish Language Level I",
    "Spanish Language Level II",
    "Financial Accounting",
    "Information Systems",
    "Introductory Business Law",
    "Principles of Management",
    "Principles of Marketing",
    "Spanish With Writing Level I",
    "Spanish With Writing Level II",
    "Humanities"
  ];

  const handleExamToggle = (exam: string) => {
    const existingExam = userExamScores.find(e => e.exam === exam);
    if (existingExam) {
      setUserExamScores(userExamScores.filter(e => e.exam !== exam));
    } else {
      setUserExamScores([...userExamScores, { exam, score: null }]);
    }
  };

  const handleScoreChange = (exam: string, score: string) => {
    const numScore = score === "" ? null : (isNaN(parseInt(score, 10)) ? null : parseInt(score, 10));
    setUserExamScores(userExamScores.map(e => 
      e.exam === exam ? { ...e, score: numScore } : e
    ));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* TOP SECTION - CHATBOT (60% height) */}
      <div ref={chatbotSectionRef} className="h-[60vh] bg-gradient-to-b from-card/50 to-background border-b border-border flex flex-col">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            {/* Welcome Message */}
            {messages.length === 0 && (
              <Card className="p-8 text-center space-y-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 animate-fade-in">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Bot className="h-8 w-8 text-primary-foreground" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">👋 Welcome to the CLEP College Finder!</h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    I'm here to help you find colleges that accept CLEP exams. Try asking me:
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {suggestedQuestions.map((question, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestedQuestion(question)}
                      className="hover-scale"
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </Card>
            )}

            {/* Chat Messages */}
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.sender === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.sender === "ai"
                        ? "bg-gradient-to-br from-primary to-secondary"
                        : "bg-accent"
                    }`}
                  >
                    {message.sender === "ai" ? (
                      <Bot className="h-5 w-5 text-primary-foreground" />
                    ) : (
                      <User className="h-5 w-5 text-accent-foreground" />
                    )}
                  </div>
                  <div
                    className={`flex-1 max-w-[70%] ${
                      message.sender === "user" ? "text-right" : "text-left"
                    }`}
                  >
                    <Card
                      className={`p-4 ${
                        message.sender === "ai"
                          ? "bg-card text-foreground"
                          : "bg-primary/10 text-foreground"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
                    </Card>
                    <p className="text-xs text-muted-foreground mt-1">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <Card className="p-4">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.2s" }} />
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.4s" }} />
                    </div>
                  </Card>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Chat Input (Fixed at bottom of chat section) */}
        <div className="border-t border-border p-4 bg-card/80 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about CLEP acceptance, colleges, or credits..."
                className="flex-1 h-12 text-base"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="h-12 w-12"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Press Enter to send • Shift + Enter for new line
            </p>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION - FILTERS + RESULTS (60% height) */}
      <div className="flex-1 flex min-h-0">
        {/* LEFT SIDEBAR - FILTERS (25% width) */}
        <div
          className={`transition-all duration-300 border-r border-border bg-card overflow-y-auto ${
            filtersCollapsed ? "w-0" : "w-80"
          } flex-shrink-0`}
        >
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Filters</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setFiltersCollapsed(true)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>

            {/* Location Filters */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Location</h4>
              <select 
                className="w-full h-10 px-3 rounded-lg bg-background border border-border focus:border-primary focus:outline-none"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
              >
                <option value="">Select State</option>
                <option value="AL">Alabama</option>
                <option value="AK">Alaska</option>
                <option value="AZ">Arizona</option>
                <option value="AR">Arkansas</option>
                <option value="CA">California</option>
                <option value="CO">Colorado</option>
                <option value="CT">Connecticut</option>
                <option value="DE">Delaware</option>
                <option value="FL">Florida</option>
                <option value="GA">Georgia</option>
                <option value="HI">Hawaii</option>
                <option value="ID">Idaho</option>
                <option value="IL">Illinois</option>
                <option value="IN">Indiana</option>
                <option value="IA">Iowa</option>
                <option value="KS">Kansas</option>
                <option value="KY">Kentucky</option>
                <option value="LA">Louisiana</option>
                <option value="ME">Maine</option>
                <option value="MD">Maryland</option>
                <option value="MA">Massachusetts</option>
                <option value="MI">Michigan</option>
                <option value="MN">Minnesota</option>
                <option value="MS">Mississippi</option>
                <option value="MO">Missouri</option>
                <option value="MT">Montana</option>
                <option value="NE">Nebraska</option>
                <option value="NV">Nevada</option>
                <option value="NH">New Hampshire</option>
                <option value="NJ">New Jersey</option>
                <option value="NM">New Mexico</option>
                <option value="NY">New York</option>
                <option value="NC">North Carolina</option>
                <option value="ND">North Dakota</option>
                <option value="OH">Ohio</option>
                <option value="OK">Oklahoma</option>
                <option value="OR">Oregon</option>
                <option value="PA">Pennsylvania</option>
                <option value="RI">Rhode Island</option>
                <option value="SC">South Carolina</option>
                <option value="SD">South Dakota</option>
                <option value="TN">Tennessee</option>
                <option value="TX">Texas</option>
                <option value="UT">Utah</option>
                <option value="VT">Vermont</option>
                <option value="VA">Virginia</option>
                <option value="WA">Washington</option>
                <option value="WV">West Virginia</option>
                <option value="WI">Wisconsin</option>
                <option value="WY">Wyoming</option>
              </select>
              <Input 
                placeholder="Enter ZIP code" 
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
              />
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Within miles</label>
                <input
                  type="range"
                  min="0"
                  max="500"
                  value={distance}
                  onChange={(e) => setDistance(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span>{distance} miles</span>
                  <span>500</span>
                </div>
              </div>
            </div>

            {/* Institution Type */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Institution Type</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input 
                    type="checkbox" 
                    className="rounded" 
                    checked={institutionTypes.includes("public")}
                    onChange={() => handleInstitutionTypeToggle("public")}
                  />
                  <span>Public</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input 
                    type="checkbox" 
                    className="rounded" 
                    checked={institutionTypes.includes("private")}
                    onChange={() => handleInstitutionTypeToggle("private")}
                  />
                  <span>Private</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input 
                    type="checkbox" 
                    className="rounded" 
                    checked={institutionTypes.includes("2-year")}
                    onChange={() => handleInstitutionTypeToggle("2-year")}
                  />
                  <span>2-Year</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input 
                    type="checkbox" 
                    className="rounded" 
                    checked={institutionTypes.includes("4-year")}
                    onChange={() => handleInstitutionTypeToggle("4-year")}
                  />
                  <span>4-Year</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input 
                    type="checkbox" 
                    className="rounded" 
                    checked={institutionTypes.includes("online")}
                    onChange={() => handleInstitutionTypeToggle("online")}
                  />
                  <span>Online Programs Available</span>
                </label>
              </div>
            </div>

            {/* CLEP Exam Selection */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Filter By Exams & Scores</h4>
              
              {/* Exam Selection Checkboxes with Inline Score Inputs */}
              <div className="max-h-64 overflow-y-auto border border-border rounded-lg p-2 space-y-2">
                {availableExams.map((exam) => {
                  const isSelected = userExamScores.some(e => e.exam === exam);
                  const userExam = userExamScores.find(e => e.exam === exam);
                  return (
                    <div
                      key={exam}
                      className={`flex items-center gap-2 p-1.5 rounded transition-colors ${
                        isSelected ? 'bg-accent/30 border border-border' : 'hover:bg-accent/50'
                      }`}
                    >
                      <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleExamToggle(exam)}
                          className="rounded flex-shrink-0"
                        />
                        <span className="text-sm flex-1 min-w-0 truncate">{exam}</span>
                      </label>
                      {isSelected && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Input
                            type="number"
                            min="20"
                            max="80"
                            placeholder="Score"
                            value={userExam?.score === null ? "" : userExam?.score?.toString() || ""}
                            onChange={(e) => handleScoreChange(exam, e.target.value)}
                            className="h-7 w-20 text-xs"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExamToggle(exam);
                            }}
                            className="h-7 w-7 p-0 flex-shrink-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <p className="text-xs text-muted-foreground">
                {userExamScores.length} exam{userExamScores.length !== 1 ? 's' : ''} selected
                {userExamScores.filter(e => e.score !== null).length > 0 && 
                  ` • ${userExamScores.filter(e => e.score !== null).length} with scores`}
              </p>
            </div>

            {/* Score & Credit Requirements */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Requirements</h4>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Minimum Score: {minScore}</label>
                <input
                  type="range"
                  min="20"
                  max="80"
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Minimum Credits: {minCredits}</label>
                <input
                  type="range"
                  min="0"
                  max="16"
                  value={minCredits}
                  onChange={(e) => setMinCredits(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Filter Actions */}
            <div className="space-y-2 pt-4 border-t">
              <Button className="w-full" onClick={clearAllFilters}>
                Clear All Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Filters Expand Button (when collapsed) */}
        {filtersCollapsed && (
          <button
            onClick={() => setFiltersCollapsed(false)}
            className="fixed left-0 top-[65vh] z-10 bg-card border border-border rounded-r-lg p-2 hover:bg-accent transition-smooth shadow-lg"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {/* RIGHT PANEL - RESULTS (75% width) */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Results Header */}
          <div className="p-4 border-b border-border bg-card/50 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Results</h2>
              <p className="text-sm text-muted-foreground">Showing {filteredColleges.length} college{filteredColleges.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex items-center gap-2">
              <select className="h-9 px-3 rounded-lg bg-background border border-border text-sm">
                <option>Sort by Relevance</option>
                <option>Name A-Z</option>
                <option>Most Exams Accepted</option>
                <option>Lowest Score Required</option>
              </select>
              <div className="flex border border-border rounded-lg">
                <Button
                  size="sm"
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>

          {/* Results Grid/List */}
          <div className="flex-1 overflow-y-auto p-4">
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 gap-4"
                  : "space-y-4"
              }
            >
              {filteredColleges.map((college) => (
                <Card
                  key={college.id}
                  className={`p-4 hover-lift cursor-pointer transition-all ${
                    college.highlighted ? "border-primary shadow-glow" : ""
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{college.name}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {college.city}, {college.state}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="text-muted-foreground hover:text-primary">
                          <Star className="h-4 w-4" />
                        </button>
                        <input
                          type="checkbox"
                          checked={selectedForCompare.includes(college.id)}
                          onChange={() => toggleCompare(college.id)}
                          className="rounded"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Exams</p>
                        <p className="font-semibold">{college.examsAccepted}/34</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg Score</p>
                        <p className="font-semibold">{college.avgScore}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Credits</p>
                        <p className="font-semibold">{college.credits}</p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      onClick={() => setExpandedCard(expandedCard === college.id ? null : college.id)}
                    >
                      {expandedCard === college.id ? "Hide Details" : "View Details"}
                    </Button>

                    {expandedCard === college.id && (
                      <div className="border-t pt-3 space-y-2 animate-fade-in">
                        <p className="text-xs font-semibold">CLEP Acceptance:</p>
                        <div className="border rounded-lg overflow-hidden">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-accent/50">
                                <th className="text-left p-2">Exam</th>
                                <th className="text-left p-2">Score</th>
                                <th className="text-left p-2">Credits</th>
                              </tr>
                            </thead>
                            <tbody>
                              {mockExamData.map((exam, idx) => (
                                <tr key={idx} className="border-t">
                                  <td className="p-2">{exam.exam}</td>
                                  <td className="p-2">
                                    {exam.accepted ? (
                                      <span className="text-green-500">✓ {exam.minScore}</span>
                                    ) : (
                                      <span className="text-red-500">✗ N/A</span>
                                    )}
                                  </td>
                                  <td className="p-2">{exam.credits || "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button size="sm" variant="outline" className="flex-1 text-xs">
                            Contact
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 text-xs">
                            Visit Website
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* STICKY COMPARISON BAR (Bottom) */}
      {selectedForCompare.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border p-4 shadow-lg animate-slide-in-right z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-semibold">Comparing {selectedForCompare.length} colleges</span>
              <div className="flex gap-2">
                {selectedForCompare.map(id => {
                  const college = allColleges.find(c => c.id === id);
                  return (
                    <Badge key={id} variant="secondary" className="flex items-center gap-1 pr-1">
                      {college?.name}
                      <button
                        onClick={() => toggleCompare(id)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSelectedForCompare([])}>
                Clear All
              </Button>
              <Button
                disabled={selectedForCompare.length < 2}
                onClick={() => setShowComparison(true)}
              >
                Compare ({selectedForCompare.length})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* COMPARISON MODAL */}
      <Dialog open={showComparison} onOpenChange={setShowComparison}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>College Comparison</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left sticky left-0 bg-card">CLEP Exam</th>
                  {selectedForCompare.map(id => {
                    const college = allColleges.find(c => c.id === id);
                    return (
                      <th key={id} className="p-3 text-left min-w-[200px]">
                        <div>
                          <p className="font-semibold">{college?.name}</p>
                          <p className="text-xs text-muted-foreground font-normal">
                            {college?.city}, {college?.state}
                          </p>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {mockExamData.map((exam, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-3 font-medium sticky left-0 bg-card">{exam.exam}</td>
                    {selectedForCompare.map(id => (
                      <td key={id} className="p-3">
                        {exam.accepted ? (
                          <div className="text-sm">
                            <span className="text-green-500 font-semibold">✓</span> {exam.minScore} / {exam.credits}cr
                          </div>
                        ) : (
                          <span className="text-red-500 text-sm">✗ Not Accepted</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline">Export PDF</Button>
            <Button variant="outline">Share Link</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LearnerPortal;
