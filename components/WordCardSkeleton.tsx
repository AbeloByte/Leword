import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Mirrors the WordCard layout so the feed keeps its shape while loading
 * instead of collapsing to a line of text and then jumping.
 */
export function WordCardSkeleton() {
    return (
        <Card className="[--card-spacing:--spacing(5)]">
            <CardContent className="space-y-3.5">
                <div className="flex items-start justify-between gap-2">
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-md" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3.5 w-4/5" />
                </div>
                <Skeleton className="h-12 w-full rounded-lg" />
                <div className="flex items-center justify-between pt-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-6 w-28 rounded-md" />
                </div>
            </CardContent>
        </Card>
    );
}
