"use client";

import React, { useEffect, useRef, useState } from "react";
import { Terminal, Copy, Check } from "lucide-react";

export interface LogEntry {
  id: string;
  timestamp: string;
  step: string;
  message: string;
}

interface JobLogsTerminalProps {
  logs: LogEntry[];
  isRunning?: boolean;
}

export function JobLogsTerminal({ logs, isRunning = false }: JobLogsTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Auto-scroll on new log entries
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const handleCopyLogs = () => {
    const text = logs
      .map((l) => `[${new Date(l.timestamp).toISOString()}] [${l.step}] ${l.message}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-400" />
          <span className="text-slate-300 font-semibold">
            Execution Log Stream (SSE)
          </span>
          {isRunning && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Streaming</span>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleCopyLogs}
          disabled={logs.length === 0}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-40"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy Logs</span>
            </>
          )}
        </button>
      </div>

      {/* Terminal Body */}
      <div
        ref={terminalRef}
        className="p-4 font-mono text-xs text-slate-300 space-y-2 max-h-64 overflow-y-auto leading-relaxed select-text"
      >
        {logs.length === 0 ? (
          <div className="text-slate-500 py-6 text-center">
            Awaiting streaming events from execution cluster...
          </div>
        ) : (
          logs.map((log) => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString();
            return (
              <div key={log.id} className="flex items-start gap-2.5">
                <span className="text-slate-500 shrink-0 text-[11px]">
                  {timeStr}
                </span>
                <span className="text-cobalt-400 font-semibold shrink-0 text-[11px] bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700">
                  {log.step}
                </span>
                <span className="text-slate-200 break-words flex-1">
                  {log.message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
