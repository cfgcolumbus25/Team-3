import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { LoginDropdown } from "@/components/LoginDropdown.tsx";
import { 
  GraduationCap, 
  Shield, 
  Building2, 
  BookOpen, 
  ArrowRight,
  CheckCircle2,
  DollarSign
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: BookOpen,
      title: "34 CLEP Exams Tracked",
      description: "Complete coverage of all College-Level Examination Program exams"
    },
    {
      icon: Building2,
      title: "2,500+ Institutions",
      description: "Comprehensive database of colleges and universities nationwide"
    },
    {
      icon: Shield,
      title: "Verified Data",
      description: "Institution-verified acceptance policies and credit equivalencies"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
                <Link to="/" className="flex items-center gap-2">
                <img 
                    src="public/ModernStates.png"       // path to the PNG in the public folder
                    alt="Modern States Logo" 
                    className="h-12 w-16"
                />
                <span className="font-bold text-xl">Modern States</span>
                </Link>
            </div>
            <div className="flex items-center gap-3">
              <LoginDropdown />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="gradient-hero">
        <div className="container mx-auto px-4 pt-6 pb-20 md:pt-8 md:pb-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="mb-4">
              Trusted by Thousands of Students
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                Turn CLEP Scores into Opportunities
            </h1>
            {/* Statistics Section */}
            <div className="flex flex-col md:flex-row justify-center items-center gap-12 mt-12 text-center">
            {/* CLEP Exams (left) */}
            <div className="flex flex-col items-center">
                <BookOpen className="h-10 w-10 text-primary mb-2" />
                <span className="text-4xl md:text-5xl font-bold text-foreground">140,000+</span>
                <span className="text-sm md:text-base text-muted-foreground max-w-xs">
                CLEP exams attempted
                </span>
            </div>

            {/* Learners (center) */}
            <div className="flex flex-col items-center">
                <GraduationCap className="h-10 w-10 text-primary mb-2" />
                <span className="text-4xl md:text-5xl font-bold text-foreground">600,000+</span>
                <span className="text-sm md:text-base text-muted-foreground max-w-xs">
                learners have taken Modern States courses
                </span>
            </div>

            {/* Tuition Savings (right) */}
            <div className="flex flex-col items-center">
                <DollarSign className="h-10 w-10 text-primary mb-2" />
                <span className="text-4xl md:text-5xl font-bold text-foreground">$175M</span>
                <span className="text-sm md:text-base text-muted-foreground max-w-xs">
                estimated tuition and fee savings
                </span>
            </div>
            </div>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Discover which colleges accept your CLEP exam credits. Search institutions, 
              compare acceptance policies, and make informed decisions about your education.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button 
                size="lg" 
                className="text-lg h-12 px-8 shadow-lg hover:shadow-xl transition-smooth"
                onClick={() => navigate('/learner')}
              >
                Start Searching
                <ArrowRight className="ml-0.5 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="flex justify-center -mt-12">
        <a href="#stats" className="animate-bounce">
            <ArrowRight className="h-10 w-10 text-primary rotate-90 cursor-pointer" />
        </a>
      </div>
      <div id="stats" className="flex flex-col items-center">
                {/* CLEP Exams, Learners, Tuition Savings */}
      </div>
      <div className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {features.map((feature, i) => (
            <Card key={i} className="p-8 shadow-card hover:shadow-card-hover transition-smooth text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <feature.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>

        {/* Three Portals Section */}
        <div className="space-y-12">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold mb-4">Choose Your Portal</h2>
            <p className="text-lg text-muted-foreground">
              Whether you're a student, institution, or administrator, we have the tool for you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Learner Portal */}
            <Card className="p-8 shadow-card hover:shadow-card-hover transition-smooth group cursor-pointer" 
                  onClick={() => navigate('/learner')}>
              <div className="mb-6 p-4 rounded-xl bg-primary/10 w-fit">
                <GraduationCap className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Learner Portal</h3>
              <p className="text-muted-foreground mb-6">
                Search colleges, compare credit policies, and see where your CLEP exams are accepted.
              </p>
              <ul className="space-y-2 mb-6">
                {['Advanced filtering', 'Side-by-side comparison', 'AI chat assistant', 'Save favorites'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button className="w-full group-hover:shadow-lg transition-smooth">
                Explore Portal
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Card>

            {/* Institution Portal */}
            <Card className="p-8 shadow-card hover:shadow-card-hover transition-smooth group cursor-pointer"
                  onClick={() => navigate('/login/institution')}>
              <div className="mb-6 p-4 rounded-xl bg-secondary/10 w-fit">
                <Building2 className="h-10 w-10 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Institution Portal</h3>
              <p className="text-muted-foreground mb-6">
                Update and manage how your institution accepts CLEP exams with easy-to-use tools.
              </p>
              <ul className="space-y-2 mb-6">
                {['AI chatbot updates', 'PDF document upload', 'Manual editing', 'Preview mode'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-secondary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button variant="secondary" className="w-full group-hover:shadow-lg transition-smooth">
                Access Portal
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Card>

            {/* Admin Portal */}
            <Card className="p-8 shadow-card hover:shadow-card-hover transition-smooth group cursor-pointer"
                  onClick={() => navigate('/login/admin')}>
              <div className="mb-6 p-4 rounded-xl bg-accent/10 w-fit">
                <Shield className="h-10 w-10 text-accent" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Admin Portal</h3>
              <p className="text-muted-foreground mb-6">
                Monitor system health, manage data quality, and communicate with institutions.
              </p>
              <ul className="space-y-2 mb-6">
                {['KPI dashboard', 'Alert system', 'Email tracking', 'Data override'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button className="w-full group-hover:shadow-lg transition-smooth">
                Admin Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-card/50 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="font-semibold">Modern States CLEP Tool</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Modern States. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;