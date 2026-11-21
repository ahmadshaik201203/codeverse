'use client';

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Code2, MonitorPlay, Play, RefreshCw, TerminalSquare } from 'lucide-react';
import FileTabs, { WorkspaceFile } from './FileTabs';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-ivory-warm/60 font-mono text-[11px] text-ink-faint">
      Loading editor…
    </div>
  ),
});

interface SandboxedEditorProps {
  files: WorkspaceFile[];
  activeFileName: string;
  onSelectFile: (fileName: string) => void;
  onChangeFile: (fileName: string, value: string) => void;
}

export default function SandboxedEditor({
  files,
  activeFileName,
  onSelectFile,
  onChangeFile,
}: SandboxedEditorProps) {
  const [previewHtml, setPreviewHtml] = useState('');
  const [consoleLines, setConsoleLines] = useState<string[]>([
    '[sandbox] Ready. Click Run code to render the preview.',
  ]);

  const activeFile = useMemo(
    () => files.find((file) => file.name === activeFileName) || files[0],
    [files, activeFileName],
  );

  const getFile = (name: string) => files.find((file) => file.name === name)?.value || '';

  const compilePreview = () => {
    const html = getFile('index.html');
    const css = getFile('styles.css');
    const js = getFile('script.js');

    const compiled = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      margin: 0;
      font-family: 'Bodoni Moda', serif;
      background: #f4f2ed;
      color: #252827;
    }
    ${css}
  </style>
</head>
<body>
  ${html}
  <script>
    const originalLog = console.log;
    const originalError = console.error;
    console.log = (...args) => {
      window.parent.postMessage({ type: 'sandbox-log', payload: args.map(String).join(' ') }, '*');
      originalLog(...args);
    };
    console.error = (...args) => {
      window.parent.postMessage({ type: 'sandbox-error', payload: args.map(String).join(' ') }, '*');
      originalError(...args);
    };
    try {
      ${js}
    } catch (err) {
      console.error(err?.message || String(err));
    }
  </script>
</body>
</html>`;

    setPreviewHtml(compiled);
    setConsoleLines((prev) => [...prev, `[sandbox] Rendered preview at ${new Date().toLocaleTimeString()}`]);
  };

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;
      if (event.data.type === 'sandbox-log') {
        setConsoleLines((prev) => [...prev, `[log] ${event.data.payload}`]);
      }
      if (event.data.type === 'sandbox-error') {
        setConsoleLines((prev) => [...prev, `[error] ${event.data.payload}`]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <div className="flex min-h-[420px] min-w-0 flex-1 flex-col border-b border-ink/10 lg:min-h-0 lg:border-b-0 lg:border-r">
        <div className="flex shrink-0 items-center justify-between border-b border-ink/10 bg-ivory-warm/60 px-4 py-2">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
            <Code2 className="h-3.5 w-3.5 text-forest" aria-hidden="true" />
            Web editor
          </div>
          <button
            type="button"
            onClick={compilePreview}
            className="inline-flex items-center gap-1.5 rounded-[7px] border border-forest/25 bg-forest/[0.08] px-3 py-1.5 text-[11px] font-medium text-forest-deep transition-colors hover:bg-forest/[0.14]"
          >
            <Play className="h-3 w-3" aria-hidden="true" />
            Run code
          </button>
        </div>

        <FileTabs files={files} activeFileName={activeFileName} onSelectFile={onSelectFile} />

        <div className="min-h-0 flex-1">
          <MonacoEditor
            height="100%"
            language={activeFile.language}
            theme="vs"
            value={activeFile.value}
            path={activeFile.name}
            options={{
              minimap: { enabled: true },
              fontSize: 13,
              lineHeight: 22,
              fontFamily: 'var(--font-bodoni), "Bodoni Moda", serif',
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 16, bottom: 16 },
            }}
            onChange={(value) => onChangeFile(activeFile.name, value || '')}
          />
        </div>
      </div>

      <div className="flex h-[440px] shrink-0 flex-col bg-ivory-warm/50 lg:h-auto lg:w-[38%] lg:min-w-[320px]">
        <div className="flex shrink-0 items-center justify-between border-b border-ink/10 bg-ivory-warm/60 px-4 py-2">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
            <MonitorPlay className="h-3.5 w-3.5 text-forest" aria-hidden="true" />
            Live preview
          </div>
          <button
            type="button"
            onClick={() => {
              setPreviewHtml('');
              setConsoleLines(['[sandbox] Preview reset.']);
            }}
            className="text-ink-faint transition-colors hover:text-ink"
            title="Reset preview"
            aria-label="Reset preview"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        <iframe
          title="CodeVerse sandbox preview"
          srcDoc={
            previewHtml ||
            '<body style="background:#f4f2ed;color:#8a918c;font-family:\'Bodoni Moda\',serif;font-size:13px;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:24px;box-sizing:border-box;">Click Run code to render your project preview.</body>'
          }
          sandbox="allow-scripts"
          className="flex-1 border-0 bg-white"
        />

        <div className="flex h-40 shrink-0 flex-col border-t border-ink/10 bg-ivory-warm/70">
          <div className="flex items-center gap-2 border-b border-ink/10 px-3 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-faint">
            <TerminalSquare className="h-3.5 w-3.5 text-forest" aria-hidden="true" />
            Console output
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto p-3" aria-live="polite">
            {consoleLines.map((line, index) => (
              <div
                key={`${line}-${index}`}
                className={`font-mono text-[11px] leading-relaxed ${
                  line.includes('[error]') ? 'text-[var(--color-danger)]' : 'text-ink-muted'
                }`}
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
