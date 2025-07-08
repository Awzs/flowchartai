'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Plus, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  onCreateNew: () => void;
}

export function EmptyState({ onCreateNew }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <Card className="max-w-lg w-full">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-10 w-10 text-blue-600" />
            </div>
          </div>

          <h3 className="text-xl font-normal text-gray-900 mb-3">
            No flowcharts yet
          </h3>

          <p className="text-gray-600 mb-8 leading-relaxed font-normal">
            Create your first AI-powered flowchart to get started. Design,
            collaborate, and bring your ideas to life with intelligent
            assistance.
          </p>

          <div className="space-y-3">
            <Button onClick={onCreateNew} className="w-full font-normal">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Flowchart
            </Button>

            <Button
              variant="outline"
              onClick={onCreateNew}
              className="w-full font-normal"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Start with Blank Canvas
            </Button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 font-normal">
              💡 <span className="font-normal">Pro tip:</span> Use AI assistance
              to convert text descriptions into beautiful flowcharts
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
