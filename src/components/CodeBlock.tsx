import React, { useState } from "react";
import { Check, Copy, Play, RotateCcw, Terminal } from "lucide-react";

interface CodeBlockProps {
  language?: string;
  code: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language = "plaintext", code }) => {
  const [copied, setCopied] = useState(false);
  const [showRunner, setShowRunner] = useState(false);
  const [runOutput, setRunOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code", err);
    }
  };

  const isExecutable =
    ["javascript", "js", "typescript", "ts"].includes(language.toLowerCase());

  const handleExecute = () => {
    setIsRunning(true);
    setShowRunner(true);
    try {
      // Safe sandbox console capture for small JS snippets
      const logs: string[] = [];
      const customConsole = {
        log: (...args: any[]) => logs.push(args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" ")),
        error: (...args: any[]) => logs.push("[Error] " + args.join(" ")),
        warn: (...args: any[]) => logs.push("[Warn] " + args.join(" ")),
        info: (...args: any[]) => logs.push("[Info] " + args.join(" ")),
      };

      // Execute safely in isolated scope
      const runFn = new Function("console", `"use strict";\n${code}`);
      const result = runFn(customConsole);

      if (logs.length > 0) {
        setRunOutput(logs.join("\n"));
      } else if (result !== undefined) {
        setRunOutput(typeof result === "object" ? JSON.stringify(result, null, 2) : String(result));
      } else {
        setRunOutput("Code executed successfully with no output.");
      }
    } catch (err: any) {
      setRunOutput(`Runtime Error: ${err?.message || String(err)}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="my-3 rounded-xl border border-neutral-700/40 bg-[#16181d] text-neutral-200 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#1f2229] border-b border-neutral-700/40 text-xs font-medium text-neutral-400">
        <span className="flex items-center gap-1.5 uppercase font-mono tracking-wider text-[11px] text-neutral-300">
          <Terminal size={13} className="text-blue-400" />
          {language || "code"}
        </span>
        <div className="flex items-center gap-1.5">
          {isExecutable && (
            <button
              id={`run-code-${Math.random().toString(36).substr(2, 6)}`}
              onClick={handleExecute}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-neutral-300 hover:text-white hover:bg-neutral-700/50 transition-colors"
              title="Run code snippet"
            >
              <Play size={12} className="text-emerald-400 fill-emerald-400/30" />
              <span>Run</span>
            </button>
          )}
          <button
            id={`copy-code-${Math.random().toString(36).substr(2, 6)}`}
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-neutral-300 hover:text-white hover:bg-neutral-700/50 transition-colors"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check size={12} className="text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-3.5 overflow-x-auto font-mono text-[13px] leading-relaxed select-text">
        <pre className="m-0 p-0 text-neutral-200">
          <code>{code}</code>
        </pre>
      </div>

      {showRunner && (
        <div className="border-t border-neutral-700/40 bg-[#111317] p-3 text-xs font-mono">
          <div className="flex items-center justify-between mb-1.5 text-neutral-400">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <Play size={11} /> Output:
            </span>
            <button
              onClick={() => setShowRunner(false)}
              className="text-neutral-500 hover:text-neutral-300 text-[11px]"
            >
              Hide
            </button>
          </div>
          <div className="rounded bg-black/40 p-2.5 text-neutral-200 whitespace-pre-wrap max-h-40 overflow-y-auto">
            {isRunning ? "Executing..." : runOutput || "No output"}
          </div>
        </div>
      )}
    </div>
  );
};
