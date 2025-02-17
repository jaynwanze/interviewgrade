'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export const MatchedCandidatesView = ({
    skillGapMessage,
    topThree,
    percentiles,
    topProspect,
    candidatesToWatch,
    matched,
}) => {
    function handleContact(candidateId: string) {
        alert(`Contacting candidate ${candidateId}... (mock)`);
    }

    function handleViewProfile(candidateId: string) {
        alert(`Viewing profile for candidate ${candidateId}... (mock)`);
    }

    return (
        <>
            {/* Skill Gap */}
            {skillGapMessage && (
                <Card className="border-red-400">
                    <CardHeader>
                        <CardTitle className="text-red-500">Skill Gaps Detected</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-red-600">{skillGapMessage}</p>
                    </CardContent>
                </Card>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Leaderboard (Top 3) */}
                <Card>
                    <CardHeader>
                        <CardTitle>Leaderboard (Top 3)</CardTitle>
                        <CardDescription>
                            Highest overall scores among matched candidates
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {topThree.length === 0 ? (
                            <p>No matches found.</p>
                        ) : (
                            <div className="space-y-3">
                                {topThree.map((cand, idx) => (
                                    <div
                                        key={cand.id}
                                        className="flex items-center justify-between bg-muted/50 p-2 rounded"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-bold">#{idx + 1}</span>
                                            <Avatar>
                                                {cand.avatarUrl ? (
                                                    <AvatarImage src={cand.avatarUrl} alt={cand.name} />
                                                ) : (
                                                    <AvatarFallback>
                                                        {cand.name.slice(0, 2)}
                                                    </AvatarFallback>
                                                )}
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{cand.name}</p>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Badge variant="secondary">
                                                            Score {cand.score}/100
                                                        </Badge>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Candidate’s aggregated performance rating.</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                                {percentiles[cand.id] && (
                                                    <span className="text-xs text-muted-foreground ml-2">
                                                        ({percentiles[cand.id].toFixed(1)}%ile)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="link"
                                                size="sm"
                                                onClick={() => handleViewProfile(cand.id)}
                                            >
                                                View Profile
                                            </Button>
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={() => handleContact(cand.id)}
                                            >
                                                Contact
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top Prospect */}
                {topProspect && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Prospect</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    {topProspect.avatarUrl ? (
                                        <AvatarImage
                                            src={topProspect.avatarUrl}
                                            alt={topProspect.name}
                                        />
                                    ) : (
                                        <AvatarFallback>
                                            {topProspect.name.slice(0, 2)}
                                        </AvatarFallback>
                                    )}
                                </Avatar>
                                <div>
                                    <p className="font-medium">{topProspect.name}</p>
                                    <Badge variant="secondary">
                                        Score {topProspect.score}/100
                                    </Badge>
                                    {percentiles[topProspect.id] && (
                                        <span className="text-xs text-muted-foreground ml-2">
                                            ({percentiles[topProspect.id].toFixed(1)}%ile)
                                        </span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex gap-2">
                            <Button
                                variant="link"
                                size="sm"
                                onClick={() => handleViewProfile(topProspect.id)}
                            >
                                View Profile
                            </Button>
                            <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleContact(topProspect.id)}
                            >
                                Contact
                            </Button>
                        </CardFooter>
                    </Card>
                )}

                {/* Candidates to Watch */}
                {candidatesToWatch.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Candidates to Watch</CardTitle>
                            <CardDescription>
                                Potential prospects near the top 3
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {candidatesToWatch.map((cand) => (
                                <div
                                    key={cand.id}
                                    className="flex items-center justify-between bg-muted/50 p-2 rounded"
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            {cand.avatarUrl ? (
                                                <AvatarImage src={cand.avatarUrl} alt={cand.name} />
                                            ) : (
                                                <AvatarFallback>{cand.name.slice(0, 2)}</AvatarFallback>
                                            )}
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{cand.name}</p>
                                            <Badge variant="secondary">Score {cand.score}/100</Badge>
                                            {percentiles[cand.id] && (
                                                <span className="text-xs text-muted-foreground ml-2">
                                                    ({percentiles[cand.id].toFixed(1)}%ile)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="link"
                                            size="sm"
                                            onClick={() => handleViewProfile(cand.id)}
                                        >
                                            View
                                        </Button>
                                        <Button
                                            variant="default"
                                            size="sm"
                                            onClick={() => handleContact(cand.id)}
                                        >
                                            Contact
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Full List */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Matched Candidates</CardTitle>
                        <CardDescription>
                            Full listing of everyone who meets your preferences
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {matched.length === 0 ? (
                            <p className="text-sm">No matches found.</p>
                        ) : (
                            matched.map((cand) => (
                                <div
                                    key={cand.id}
                                    className="flex items-center justify-between p-2 rounded hover:bg-muted/50"
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            {cand.avatarUrl ? (
                                                <AvatarImage src={cand.avatarUrl} alt={cand.name} />
                                            ) : (
                                                <AvatarFallback>{cand.name.slice(0, 2)}</AvatarFallback>
                                            )}
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{cand.name}</p>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <Badge variant="secondary">Score {cand.score}</Badge>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Numeric rating out of 100.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                            {percentiles[cand.id] && (
                                                <span className="text-xs text-muted-foreground ml-2">
                                                    ~{percentiles[cand.id].toFixed(1)}%ile
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="link"
                                            size="sm"
                                            onClick={() => handleViewProfile(cand.id)}
                                        >
                                            View
                                        </Button>
                                        <Button
                                            variant="default"
                                            size="sm"
                                            onClick={() => handleContact(cand.id)}
                                        >
                                            Contact
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
};
