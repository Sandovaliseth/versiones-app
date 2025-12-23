export {};

declare global {
  interface ElectronCreateDraftOptions {
    subject: string;
    body: string;
    to?: string;
    send?: boolean;
    saveToSent?: boolean;
    attachments?: string[];
    silent?: boolean;
  }

  interface Window {
    electronAPI: {
      fileExists(path: string): Promise<boolean>;
      readTextFile(path: string): Promise<any>;
      writeTextFile(path: string, content: string): Promise<any>;
      createDirectory(path: string): Promise<any>;
      copyFile(src: string, dest: string): Promise<any>;
      captureScreenshot(options: { selector?: string; fileName?: string; outputPath?: string }): Promise<any>;
      createOutlookDraft(opts: ElectronCreateDraftOptions): Promise<any>;
      checkOutlookReplies(opts: { subjectContains?: string; sinceMinutes?: number; subjectKeyword?: string }): Promise<any>;
      getDefaultVersionesPath(): Promise<string>;
      computeMd5(path: string): Promise<string>;
      getFileStat(path: string): Promise<{ ok: boolean; mtimeMs?: number; size?: number; error?: string }>;
      runCompilation(...args: any[]): Promise<any>;
      startFileWatch(filePath: string): Promise<{ ok: boolean; watchId?: string; error?: string }>;
      stopFileWatch(watchId: string): Promise<{ ok: boolean; error?: string }>;
      onFileWatchEvent: (cb: (data: { watchId: string; path: string; event: string; timestamp: number }) => void) => () => void;
      findVersionFile(
        rootPath: string,
        options?: {
          hintFile?: string;
          versionBase?: string;
          nombreVersionCliente?: string;
        }
      ): Promise<{ ok: boolean; path?: string; score?: number; reason?: string; error?: string }>;
      findFiles(
        rootPath: string,
        patterns: string[]
      ): Promise<{ ok: boolean; matches: string[]; error?: string }>;
      zipArtifacts(options: {
        files: string[];
        zipName?: string;
        subfolder?: string;
      }): Promise<{ ok: boolean; path?: string; files?: string[]; error?: string }>;
    };
  }
}
