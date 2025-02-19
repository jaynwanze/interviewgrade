'use client';

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
import { ArrowDown, ArrowUp } from 'lucide-react';

export interface StatsProps {
  tokensLeft: number;
  incomingPipeline: number;    // Replacing `newCandidatesThisWeek`
  unlockedCandidates: number; // Replacing `activeSearches` 
}

export function StatisticsView({
  stats,
  weekDelta,
}: {
  stats: StatsProps;
  weekDelta: number;
}) {
  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        {/* 1) Tokens */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Your Tokens</CardTitle>
            <CardDescription>
              Token usage for unlocking candidates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-xl font-semibold">{stats.tokensLeft}</span>
              {stats.tokensLeft < 3 && (
                <Badge variant="destructive" className="text-xs">
                  Low
                </Badge>
              )}
            </div>
          </CardContent>
          {stats.tokensLeft < 3 && (
            <CardFooter>
              <Button variant="outline" size="sm">
                Purchase More
              </Button>
            </CardFooter>
          )}
        </Card>

        {/* 2) Incoming Pipeline */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Incoming Pipeline</CardTitle>
            <CardDescription>
              Newly matched candidates this week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-xl font-semibold">
              {stats.incomingPipeline}
            </span>
          </CardContent>
        </Card>

        {/* 3) Unlocked Candidates */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Unlocked Candidates</CardTitle>
            <CardDescription>
              How many you’ve already unlocked
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-xl font-semibold">
              {stats.unlockedCandidates}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Trend Over Time */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Score Trend vs. Last Week</CardTitle>
          <CardDescription>How your candidate average changed</CardDescription>
        </CardHeader>
        <CardContent>
          {weekDelta > 0 ? (
            <div className="flex items-center gap-2">
              <ArrowUp className="h-4 w-4 text-green-600" />
              <span className="text-green-600 font-semibold">
                +{weekDelta.toFixed(1)} points
              </span>
            </div>
          ) : weekDelta < 0 ? (
            <div className="flex items-center gap-2">
              <ArrowDown className="h-4 w-4 text-red-600" />
              <span className="text-red-600 font-semibold">
                {weekDelta.toFixed(1)} points
              </span>
            </div>
          ) : (
            <span>No change from last week</span>
          )}
        </CardContent>
      </Card>
    </>
  );
}
