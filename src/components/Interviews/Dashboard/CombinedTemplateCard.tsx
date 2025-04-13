'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InterviewAnalytics } from "@/types";
import { cn } from "@/utils/cn";
import { getBadgeColor } from "@/utils/getBadgeColour";
import { ArrowRightIcon } from "lucide-react";
import { useState } from "react";
// import { DotLottieReact } from '@lottiefiles/dotlottie-react';
// Helper to determine progress color based on current vs. target
const getProgressColor = (current: number, target: number): string => {
    const percent = (current / target) * 100;
    if (percent >= 100) return 'bg-green-500';
    if (percent >= 75) return 'bg-lime-500';
    if (percent >= 50) return 'bg-yellow-500';
    if (percent >= 25) return 'bg-orange-500';
    return 'bg-red-500';
};

// Inline Target Editor: Allows editing the target score inline.
const InlineTargetEditor = ({
    target,
    onSave,
}: {
    target: number;
    onSave: (newTarget: number) => void;
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [newTarget, setNewTarget] = useState(target);

    const handleSave = () => {
        onSave(newTarget);
        setIsEditing(false);
    };

    return isEditing ? (
        <div className="flex items-center gap-2">
            <Input
                type="number"
                value={newTarget}
                onChange={(e) => setNewTarget(Number(e.target.value))}
                className="w-16"
            />
            <Button size="sm" onClick={handleSave}>
                Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
            </Button>
        </div>
    ) : (
        <div className="flex items-center gap-2">
            <p className="text-sm">Target: {target}%</p>
            <Button size="sm" variant="link" onClick={() => setIsEditing(true)}>
                Edit
            </Button>
        </div>
    );
};

type CombinedTemplateCardProps = {
    template: InterviewAnalytics;
    onView: (id: string) => void;
};

export function CombinedTemplateCard({ template, onView }: CombinedTemplateCardProps) {
    // Retrieve the current score (defaulting to 0) and set a default target of 80
    const currentScore = template.avg_overall_grade ?? 0;
    // For now, we assume targetScore is not stored in the DB and use a default:
    const [targetScore, setTargetScore] = useState(80);
    const progressPercent = Math.min(Math.round((currentScore / targetScore) * 100), 100);
    const progressColor = getProgressColor(currentScore, targetScore);

    const colorClass =
        currentScore !== null ? getBadgeColor(currentScore) : 'bg-gray-200 text-gray-600';

    return (
        <Card className="mx-2  shadow-md hover:shadow-lg transition-shadow h-full flex flex-col">
            <CardHeader className="flex items-center space-x-2">
                <CardTitle className="text-lg">{template.interview_title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 justify-between">
                {template.img_url && (
                    <iframe src={template.img_url}></iframe>
                )}
                <div className="space-y-2 p-3 text-center">
                    <p className="text-sm text-muted-foreground">Current Grade Avg.</p>

                    <Badge className={cn('rounded-md px-2 py-1 text-lg', colorClass)} >
                        {Math.round(currentScore)}%
                    </Badge>
                </div>
                {/* <div className="mb-4">
                    <Progress
                        value={progressPercent}
                        className="w-full"
                        style={{ backgroundColor: '#e5e7eb' }}
                    />
                    <p className="text-xs text-right mt-1">{progressPercent}% of target</p>
                </div>
                <div className="mb-4">
                    <InlineTargetEditor target={targetScore} onSave={(newTarget) => setTargetScore(newTarget)} />
                </div> */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        onView(template.interview_template_id || template.template_id || "")
                    }
                    className="mt-2 flex items-center justify-center"
                >
                    View Skill
                    <ArrowRightIcon className="ml-2 w-4 h-4" />
                </Button>
            </CardContent>
        </Card>
    );
}
