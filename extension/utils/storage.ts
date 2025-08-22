import type { Summary } from "../types";

export class StorageManager {
  private static readonly NOTES_KEY = 'study_extension_notes';

  static async saveNote(summary: Summary): Promise<void> {
    try {
      const existingNotes = await this.getNotes();
      const updatedNotes = [...existingNotes, summary];
      await chrome.storage.local.set({ [this.NOTES_KEY]: updatedNotes });
    } catch (error) {
      console.error('Failed to save note:', error);
      throw error;
    }
  }

  static async getNotes(): Promise<Summary[]> {
    try {
      const result = await chrome.storage.local.get([this.NOTES_KEY]);
      return result[this.NOTES_KEY] || [];
    } catch (error) {
      console.error('Failed to get notes:', error);
      return [];
    }
  }

  static async deleteNote(noteId: string): Promise<void> {
    try {
      const existingNotes = await this.getNotes();
      const updatedNotes = existingNotes.filter(note => note.id !== noteId);
      await chrome.storage.local.set({ [this.NOTES_KEY]: updatedNotes });
    } catch (error) {
      console.error('Failed to delete note:', error);
      throw error;
    }
  }

  static async clearAllNotes(): Promise<void> {
    try {
      await chrome.storage.local.remove([this.NOTES_KEY]);
    } catch (error) {
      console.error('Failed to clear notes:', error);
      throw error;
    }
  }

  static exportNotesAsText(notes: Summary[]): string {
    let exportText = `Study Extension - Exported Notes\n`;
    exportText += `Exported on: ${new Date().toLocaleString()}\n`;
    exportText += `Total notes: ${notes.length}\n\n`;
    exportText += '='.repeat(50) + '\n\n';

    notes.forEach((note, index) => {
      exportText += `${index + 1}. ${note.title}\n`;
      exportText += `Type: ${note.type.toUpperCase()}\n`;
      exportText += `Date: ${new Date(note.timestamp).toLocaleString()}\n`;
      if (note.source) {
        exportText += `Source: ${note.source}\n`;
      }
      exportText += `\nContent:\n${note.content}\n\n`;
      exportText += '-'.repeat(30) + '\n\n';
    });

    return exportText;
  }

  static downloadTextFile(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
