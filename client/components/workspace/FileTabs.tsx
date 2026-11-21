'use client';

import React from 'react';
import { FileCode2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface WorkspaceFile {
  name: string;
  language: string;
  value: string;
}

interface FileTabsProps {
  files: WorkspaceFile[];
  activeFileName: string;
  onSelectFile: (fileName: string) => void;
}

export default function FileTabs({ files, activeFileName, onSelectFile }: FileTabsProps) {
  return (
    <div role="tablist" aria-label="Workspace files" className="flex overflow-x-auto border-b border-ink/10 bg-ivory-warm/60 no-scrollbar">
      {files.map((file) => {
        const isActive = file.name === activeFileName;

        return (
          <button
            key={file.name}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelectFile(file.name)}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-r border-ink/10 px-4 py-2.5 font-mono text-[11.5px] transition-colors duration-150',
              isActive
                ? 'border-t-2 border-t-forest bg-ivory-warm text-ink'
                : 'border-t-2 border-t-transparent text-ink-faint hover:bg-ivory-warm/70 hover:text-ink-soft',
            )}
          >
            <FileCode2 className={cn('h-3.5 w-3.5', isActive ? 'text-forest' : 'text-ink-faint')} aria-hidden="true" />
            {file.name}
          </button>
        );
      })}
    </div>
  );
}
