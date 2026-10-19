import React, { useState, useEffect } from 'react';
import {
  FolderArchive,
  Folder,
  FileText,
  FileCode,
  Download,
  Trash2,
  Edit3,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { api } from '../services/api';
import { FileItem, PersonaState } from '../types';

interface FilesViewProps {
  onPersonaReset: (newPersona?: PersonaState) => void;
}

export const FilesView: React.FC<FilesViewProps> = ({ onPersonaReset }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  // Reset modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetType, setResetType] = useState<'full' | 'facts_only' | 'chats_only'>('full');

  const fetchFiles = async () => {
    try {
      const res = await api.getFiles();
      if (res.success) {
        setFiles(res.files);
        // Expand the first date folder automatically
        if (res.files.length > 0) {
          const firstDir = res.files.find((f) => f.type === 'directory');
          if (firstDir) {
            setExpandedFolders((prev) => ({ ...prev, [firstDir.path]: true }));
            if (!selectedFile && firstDir.children && firstDir.children.length > 0) {
              handleSelectFile(firstDir.children[0].path);
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch files:', err);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleSelectFile = async (path: string) => {
    setSelectedFile(path);
    setIsEditing(false);
    setIsLoadingFile(true);
    setStatusMsg(null);

    try {
      const res = await api.getFileContent(path);
      if (res.success) {
        setFileContent(res.content);
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to read file' });
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleSaveFile = async () => {
    if (!selectedFile) return;
    setIsSaving(true);
    setStatusMsg(null);

    try {
      const res = await api.saveFileContent(selectedFile, fileContent);
      if (res.success) {
        setStatusMsg({ type: 'success', text: 'File updated successfully!' });
        setIsEditing(false);
        fetchFiles();
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to save file' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFile = async (path: string) => {
    const isDir = !path.includes('.');
    const confirmMsg = isDir
      ? `Are you sure you want to delete the directory "${path}" and all its logs?`
      : `Are you sure you want to delete file "${path}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.deleteFile(path);
      if (res.success) {
        setStatusMsg({ type: 'success', text: `Deleted ${path} successfully.` });
        if (selectedFile === path || selectedFile?.startsWith(path)) {
          setSelectedFile(null);
          setFileContent('');
        }
        fetchFiles();
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to delete file' });
    }
  };

  const handleDownload = () => {
    if (!selectedFile || !fileContent) return;
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.split('/').pop() || 'chat_log.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderPath]: !prev[folderPath],
    }));
  };

  const handleExecuteReset = async () => {
    try {
      const res = await api.resetBrain(resetType);
      if (res.success) {
        setShowResetModal(false);
        setSelectedFile(null);
        setFileContent('');
        setStatusMsg({ type: 'success', text: res.message });
        onPersonaReset(res.persona);
        fetchFiles();
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Reset failed' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white light:text-slate-900 tracking-tight flex items-center gap-2.5">
            <FolderArchive className="w-6 h-6 text-rose-500" />
            File & Memory Control Center
          </h1>
          <p className="mt-1 text-sm md:text-base text-neutral-300 light:text-slate-600 font-medium">
            Direct CRUD access to date-wise conversation logs (<span className="font-mono text-xs md:text-sm text-rose-400 light:text-rose-700 font-bold">/brain/YYYY-MM-DD/</span>),
            transcripts, and persona configuration files.
          </p>
        </div>

        {/* Top actions with >=44px touch targets */}
        <div className="flex items-center gap-3">
          <button
            onClick={fetchFiles}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white/[0.04] light:bg-slate-100 border border-white/[0.1] light:border-slate-300 text-neutral-300 light:text-slate-700 hover:text-white light:hover:text-black hover:bg-white/[0.08] light:hover:bg-slate-200 transition-colors"
            title="Refresh directory tree"
            aria-label="Refresh directory tree"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowResetModal(true)}
            className="min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/15 light:bg-red-100 border border-red-500/30 light:border-red-300 text-red-300 light:text-red-800 hover:bg-red-500/25 text-xs md:text-sm font-bold transition-colors"
            aria-label="Open Reset and Purge memory dialog"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Reset & Purge</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-between ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/15 light:bg-emerald-100 border border-emerald-500/30 text-emerald-300 light:text-emerald-800'
              : 'bg-red-500/15 light:bg-red-100 border border-red-500/30 text-red-300 light:text-red-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-xs hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Split Pane: File Tree (Left) & File Viewer/Editor (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
        {/* Left Pane: Directory Tree */}
        <div className="lg:col-span-4 rounded-2xl bg-[#141217] light:bg-white border border-white/[0.08] light:border-slate-300 p-4 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08] light:border-slate-200 text-xs md:text-sm font-bold uppercase tracking-wider text-neutral-300 light:text-slate-700">
              <span className="flex items-center gap-1.5">
                <Folder className="w-4 h-4 text-amber-500" />
                Directory: /data/brain/
              </span>
              <span className="font-mono text-neutral-400 light:text-slate-500 text-xs">{files.length} items</span>
            </div>

            <div className="space-y-1.5 overflow-y-auto max-h-[460px] pr-1">
              {files.map((item) => {
                const isDir = item.type === 'directory';
                const isExpanded = expandedFolders[item.path];

                if (isDir) {
                  return (
                    <div key={item.path} className="space-y-1">
                      <div className="flex items-center justify-between group rounded-xl hover:bg-white/[0.06] light:hover:bg-slate-100 p-2 text-xs md:text-sm transition-colors">
                        <button
                          onClick={() => toggleFolder(item.path)}
                          className="min-h-[40px] flex items-center gap-2.5 text-white light:text-slate-900 font-bold flex-1 text-left"
                          aria-label={`Toggle folder ${item.name}`}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-neutral-400 light:text-slate-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-neutral-400 light:text-slate-500" />
                          )}
                          <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                          <span className="font-mono">{item.name}</span>
                          {item.messageCount !== undefined && item.messageCount > 0 && (
                            <span className="text-xs text-neutral-400 light:text-slate-500 font-mono">
                              ({item.messageCount} msgs)
                            </span>
                          )}
                        </button>

                        <button
                          onClick={() => handleDeleteFile(item.path)}
                          className="min-h-[36px] min-w-[36px] flex items-center justify-center text-neutral-400 hover:text-red-400 light:text-slate-500 light:hover:text-red-600 opacity-80 group-hover:opacity-100 transition-opacity"
                          title="Delete folder and day transcript"
                          aria-label={`Delete folder ${item.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Sub-files */}
                      {isExpanded && item.children && (
                        <div className="pl-6 space-y-1">
                          {item.children.map((sub) => {
                            const isSelected = selectedFile === sub.path;
                            return (
                              <div
                                key={sub.path}
                                className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs md:text-sm transition-colors group ${
                                  isSelected
                                    ? 'bg-rose-500/20 text-rose-300 light:bg-rose-100 light:text-rose-800 font-bold border border-rose-500/40'
                                    : 'text-neutral-300 light:text-slate-700 hover:text-white light:hover:text-black hover:bg-white/[0.06] light:hover:bg-slate-100'
                                }`}
                              >
                                <button
                                  onClick={() => handleSelectFile(sub.path)}
                                  className="min-h-[36px] flex items-center gap-2 flex-1 text-left truncate font-mono text-xs md:text-sm"
                                  aria-label={`Select file ${sub.name}`}
                                >
                                  {sub.name.endsWith('.json') ? (
                                    <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
                                  ) : (
                                    <FileText className="w-4 h-4 text-neutral-400 light:text-slate-500 shrink-0" />
                                  )}
                                  <span className="truncate">{sub.name}</span>
                                </button>

                                <button
                                  onClick={() => handleDeleteFile(sub.path)}
                                  className="min-h-[36px] min-w-[36px] flex items-center justify-center text-neutral-400 hover:text-red-400 light:text-slate-500 light:hover:text-red-600 opacity-80 group-hover:opacity-100 transition-opacity"
                                  title="Delete file"
                                  aria-label={`Delete file ${sub.name}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                // Root file (e.g. persona_state.json)
                const isSelected = selectedFile === item.path;
                return (
                  <div
                    key={item.path}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs md:text-sm transition-colors group ${
                      isSelected
                        ? 'bg-rose-500/20 text-rose-300 light:bg-rose-100 light:text-rose-800 font-bold border border-rose-500/40'
                        : 'text-neutral-300 light:text-slate-700 hover:text-white light:hover:text-black hover:bg-white/[0.06] light:hover:bg-slate-100'
                    }`}
                  >
                    <button
                      onClick={() => handleSelectFile(item.path)}
                      className="min-h-[36px] flex items-center gap-2.5 flex-1 text-left truncate font-mono text-xs md:text-sm font-semibold"
                      aria-label={`Select file ${item.name}`}
                    >
                      <FileCode className="w-4 h-4 text-rose-400 light:text-rose-600 shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Pane: File Viewer & Editor */}
        <div className="lg:col-span-8 rounded-2xl bg-[#141217] light:bg-white border border-white/[0.08] light:border-slate-300 p-5 flex flex-col justify-between shadow-sm">
          <div>
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-white/[0.08] light:border-slate-200 gap-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-500" />
                <span className="font-mono text-xs md:text-sm font-bold text-white light:text-slate-900">
                  {selectedFile ? `/data/brain/${selectedFile}` : 'Select a file to inspect'}
                </span>
              </div>

              {selectedFile && (
                <div className="flex items-center gap-2 flex-wrap">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="min-h-[44px] px-4 py-2 text-xs md:text-sm font-semibold text-neutral-300 light:text-slate-600 hover:text-white light:hover:text-black"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveFile}
                        disabled={isSaving}
                        className="min-h-[44px] flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs md:text-sm font-bold shadow-md transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        <span>{isSaving ? 'Saving...' : 'Save File'}</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleDownload}
                        className="min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] light:bg-slate-100 hover:bg-white/[0.12] light:hover:bg-slate-200 text-neutral-200 light:text-slate-800 text-xs md:text-sm font-semibold transition-colors border border-white/[0.08] light:border-slate-300"
                        title="Download raw file"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>

                      <button
                        onClick={() => setIsEditing(true)}
                        className="min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.1] light:bg-slate-200 hover:bg-white/[0.16] light:hover:bg-slate-300 text-white light:text-slate-900 text-xs md:text-sm font-bold transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit Content</span>
                      </button>

                      <button
                        onClick={() => handleDeleteFile(selectedFile)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl bg-red-500/15 light:bg-red-100 hover:bg-red-500/25 text-red-300 light:text-red-700 transition-colors"
                        title="Delete this file"
                        aria-label="Delete this file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Content area */}
            {isLoadingFile ? (
              <div className="h-96 flex items-center justify-center text-sm text-neutral-400 light:text-slate-500">
                <RefreshCw className="w-5 h-5 animate-spin mr-2 text-rose-500" />
                Loading file content...
              </div>
            ) : selectedFile ? (
              <div>
                {isEditing ? (
                  <textarea
                    value={fileContent}
                    onChange={(e) => setFileContent(e.target.value)}
                    rows={18}
                    className="w-full p-4 rounded-xl bg-black/60 light:bg-slate-50 border border-white/[0.15] light:border-slate-300 text-xs md:text-sm font-mono text-emerald-300 light:text-emerald-800 focus:outline-none focus:border-rose-500 resize-y leading-relaxed"
                  />
                ) : (
                  <pre className="p-4 rounded-xl bg-black/50 light:bg-slate-50 border border-white/[0.08] light:border-slate-300 text-xs md:text-sm font-mono text-neutral-100 light:text-slate-900 overflow-x-auto max-h-[460px] overflow-y-auto leading-relaxed">
                    {fileContent || '(Empty file)'}
                  </pre>
                )}
              </div>
            ) : (
              <div className="h-96 flex flex-col items-center justify-center text-center text-neutral-400 light:text-slate-500 space-y-2">
                <Layers className="w-10 h-10 text-neutral-500 light:text-slate-400" />
                <p className="text-base font-bold text-neutral-200 light:text-slate-800">No file selected</p>
                <p className="text-sm max-w-sm">
                  Click on any day folder or file in the left pane to view, edit, download, or delete transcripts.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Safety Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#141217] light:bg-white border border-red-500/40 light:border-red-300 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/15 light:bg-red-100 text-red-400 light:text-red-700">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white light:text-slate-900">Memory Reset & Purge</h3>
                <p className="text-xs md:text-sm text-neutral-300 light:text-slate-600">Select what memory level you wish to wipe</p>
              </div>
            </div>

            <div className="space-y-3">
              <label
                onClick={() => setResetType('facts_only')}
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                  resetType === 'facts_only'
                    ? 'bg-rose-500/15 light:bg-rose-50 border-rose-500 text-white light:text-slate-900'
                    : 'bg-white/[0.03] light:bg-slate-50 border-white/[0.08] light:border-slate-300 text-neutral-200 light:text-slate-800 hover:bg-white/[0.06]'
                }`}
              >
                <input
                  type="radio"
                  name="reset_opt"
                  checked={resetType === 'facts_only'}
                  onChange={() => setResetType('facts_only')}
                  className="mt-1 accent-rose-500"
                />
                <div>
                  <div className="text-sm font-bold">Purge Learned Facts Only</div>
                  <div className="text-xs text-neutral-400 light:text-slate-600 mt-0.5">
                    Clears the Memory Bank facts while keeping daily chat transcripts and personality intact.
                  </div>
                </div>
              </label>

              <label
                onClick={() => setResetType('chats_only')}
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                  resetType === 'chats_only'
                    ? 'bg-rose-500/15 light:bg-rose-50 border-rose-500 text-white light:text-slate-900'
                    : 'bg-white/[0.03] light:bg-slate-50 border-white/[0.08] light:border-slate-300 text-neutral-200 light:text-slate-800 hover:bg-white/[0.06]'
                }`}
              >
                <input
                  type="radio"
                  name="reset_opt"
                  checked={resetType === 'chats_only'}
                  onChange={() => setResetType('chats_only')}
                  className="mt-1 accent-rose-500"
                />
                <div>
                  <div className="text-sm font-bold">Purge All Daily Chat History</div>
                  <div className="text-xs text-neutral-400 light:text-slate-600 mt-0.5">
                    Deletes all YYYY-MM-DD transcripts from the server, but retains persona traits and learned facts.
                  </div>
                </div>
              </label>

              <label
                onClick={() => setResetType('full')}
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                  resetType === 'full'
                    ? 'bg-red-500/20 light:bg-red-50 border-red-500 text-white light:text-slate-900'
                    : 'bg-white/[0.03] light:bg-slate-50 border-white/[0.08] light:border-slate-300 text-neutral-200 light:text-slate-800 hover:bg-white/[0.06]'
                }`}
              >
                <input
                  type="radio"
                  name="reset_opt"
                  checked={resetType === 'full'}
                  onChange={() => setResetType('full')}
                  className="mt-1 accent-red-500"
                />
                <div>
                  <div className="text-sm font-bold text-red-400 light:text-red-700">Complete Persona & Memory Wipe (Blank Slate)</div>
                  <div className="text-xs text-neutral-400 light:text-slate-600 mt-0.5">
                    Irreversibly deletes all chat directories, memory bank, and restores companion to blank slate.
                  </div>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="min-h-[44px] px-5 py-2 text-xs md:text-sm font-semibold text-neutral-300 light:text-slate-600 hover:text-white light:hover:text-black"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteReset}
                className="min-h-[44px] px-6 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs md:text-sm font-bold shadow-md transition-colors"
              >
                Confirm & Purge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
