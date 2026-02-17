'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { UpgradePrompt, ProBadge } from '@/components/ProFeatureGateDialog';
import { FileText, Lock, Sparkles, Crown, CheckCircle } from 'lucide-react';

interface ResumeAnalysisCardProps {
  isPro: boolean;
  resumeUrl?: string | null;
  resumeMetadata?: {
    skills?: string[];
    experience?: string[];
    education?: string[];
    keywords?: string[];
  } | null;
}

export function ResumeAnalysisCard({
  isPro,
  resumeUrl,
  resumeMetadata,
}: ResumeAnalysisCardProps) {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!isPro) {
      setShowUpgrade(true);
      return;
    }

    if (!resumeUrl) {
      return;
    }

    setIsAnalyzing(true);
    try {
      // Trigger resume analysis
      const res = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeUrl }),
      });

      if (!res.ok) {
        throw new Error('Failed to analyze resume');
      }

      // Refresh the page to show new data
      window.location.reload();
    } catch (error) {
      console.error('Error analyzing resume:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!resumeUrl) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resume Analysis
          </CardTitle>
          <CardDescription>
            Upload your resume first to get AI-powered analysis
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!isPro) {
    return (
      <>
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/50 to-orange-50/50 dark:from-yellow-950/20 dark:to-orange-950/20" />
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Resume Analysis
              </CardTitle>
              <ProBadge />
            </div>
            <CardDescription>
              Get AI-powered insights to improve your resume
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                Keyword optimization suggestions
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                Skills gap analysis
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                ATS compatibility check
              </div>
            </div>
            <Button
              onClick={() => setShowUpgrade(true)}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            >
              <Crown className="mr-2 h-4 w-4" />
              Unlock Resume Analysis
            </Button>
          </CardContent>
        </Card>

        <UpgradePrompt
          open={showUpgrade}
          onOpenChange={setShowUpgrade}
          feature="Resume Keyword Analysis"
          description="Get AI-powered analysis of your resume with keyword optimization suggestions, skills gap analysis, and ATS compatibility tips."
        />
      </>
    );
  }

  // Pro user with analysis
  if (resumeMetadata && Object.keys(resumeMetadata).length > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resume Analysis
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardTitle>
          <CardDescription>
            AI-powered insights from your resume
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {resumeMetadata.skills && resumeMetadata.skills.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Detected Skills</h4>
              <div className="flex flex-wrap gap-2">
                {resumeMetadata.skills.slice(0, 10).map((skill, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {resumeMetadata.keywords && resumeMetadata.keywords.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Key Keywords</h4>
              <div className="flex flex-wrap gap-2">
                {resumeMetadata.keywords.slice(0, 8).map((keyword, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Button
            variant="outline"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? 'Analyzing...' : 'Re-analyze Resume'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Pro user without analysis yet
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Resume Analysis
        </CardTitle>
        <CardDescription>
          Get AI-powered insights to improve your resume
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleAnalyze} disabled={isAnalyzing}>
          {isAnalyzing ? 'Analyzing...' : 'Analyze My Resume'}
        </Button>
      </CardContent>
    </Card>
  );
}
