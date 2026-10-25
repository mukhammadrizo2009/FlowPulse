import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { notesApi } from '../../api/endpoints';

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickNoteOpen, setQuickNoteOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTags, setNoteTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveQuickNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() && !noteContent.trim()) return;

    setIsSaving(true);
    try {
      await notesApi.create({
        title: noteTitle.trim() || 'Quick Idea',
        content: noteContent.trim(),
        tags: noteTags.trim(),
        is_pinned: false,
      });
      setNoteTitle('');
      setNoteContent('');
      setNoteTags('');
      setQuickNoteOpen(false);
    } catch {
      // ignore
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-100 dark:bg-surface-950 text-surface-900 dark:text-surface-100 flex transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main layout container */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Navbar */}
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenQuickNote={() => setQuickNoteOpen(true)}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          <Outlet />
        </main>
      </div>

      {/* Global Quick Note Modal */}
      <Modal
        isOpen={quickNoteOpen}
        onClose={() => setQuickNoteOpen(false)}
        title="Capture Quick Idea / Brain Dump"
        description="Jot down a fleeting thought before it escapes."
      >
        <form onSubmit={handleSaveQuickNote} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-surface-600 dark:text-surface-300 mb-1">
              Title (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Next architecture idea..."
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-600 dark:text-surface-300 mb-1">
              Note Content
            </label>
            <textarea
              rows={4}
              required
              placeholder="Write your note, idea, or observation..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-600 dark:text-surface-300 mb-1">
              Tags (Comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. learning, idea, urgent"
              value={noteTags}
              onChange={(e) => setNoteTags(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setQuickNoteOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving}>
              Save Note
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
