import { Tool } from '../types.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export const readFileTool: Tool = {
  name: 'read_file',
  description: 'Read the contents of a file from the filesystem',
  parameters: [
    {
      name: 'path',
      type: 'string',
      description: 'The path to the file to read',
      required: true
    }
  ],
  async execute({ path: filePath }) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error: any) {
      return `Error reading file: ${error.message}`;
    }
  }
};

export const writeFileTool: Tool = {
  name: 'write_file',
  description: 'Write content to a file. Creates the file if it does not exist.',
  parameters: [
    {
      name: 'path',
      type: 'string',
      description: 'The path to the file to write',
      required: true
    },
    {
      name: 'content',
      type: 'string',
      description: 'The content to write to the file',
      required: true
    }
  ],
  async execute({ path: filePath, content }) {
    try {
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');
      return `File written successfully: ${filePath}`;
    } catch (error: any) {
      return `Error writing file: ${error.message}`;
    }
  }
};

export const listFilesTool: Tool = {
  name: 'list_files',
  description: 'List files and directories in a given path',
  parameters: [
    {
      name: 'path',
      type: 'string',
      description: 'The directory path to list',
      required: true
    },
    {
      name: 'recursive',
      type: 'boolean',
      description: 'Whether to list recursively',
      required: false
    }
  ],
  async execute({ path: dirPath, recursive = false }) {
    try {
      if (recursive) {
        const results: string[] = [];
        async function walk(dir: string) {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              results.push(`[DIR] ${fullPath}`);
              await walk(fullPath);
            } else {
              results.push(fullPath);
            }
          }
        }
        await walk(dirPath);
        return results.join('\n');
      } else {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        return entries
          .map(e => e.isDirectory() ? `[DIR] ${e.name}` : e.name)
          .join('\n');
      }
    } catch (error: any) {
      return `Error listing files: ${error.message}`;
    }
  }
};

export const deleteFileTool: Tool = {
  name: 'delete_file',
  description: 'Delete a file from the filesystem',
  parameters: [
    {
      name: 'path',
      type: 'string',
      description: 'The path to the file to delete',
      required: true
    }
  ],
  async execute({ path: filePath }) {
    try {
      await fs.unlink(filePath);
      return `File deleted: ${filePath}`;
    } catch (error: any) {
      return `Error deleting file: ${error.message}`;
    }
  }
};

export const searchFilesTool: Tool = {
  name: 'search_files',
  description: 'Search for files matching a pattern in a directory',
  parameters: [
    {
      name: 'directory',
      type: 'string',
      description: 'The directory to search in',
      required: true
    },
    {
      name: 'pattern',
      type: 'string',
      description: 'The pattern to match (supports * and ** wildcards)',
      required: true
    }
  ],
  async execute({ directory, pattern }) {
    try {
      const results: string[] = [];
      const regex = new RegExp(
        pattern
          .replace(/\./g, '\\.')
          .replace(/\*\*/g, '{{GLOBSTAR}}')
          .replace(/\*/g, '[^/]*')
          .replace(/\{\{GLOBSTAR\}\}/g, '.*')
      );

      async function walk(dir: string) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            await walk(fullPath);
          } else if (regex.test(fullPath)) {
            results.push(fullPath);
          }
        }
      }

      await walk(directory);
      return results.length > 0 ? results.join('\n') : 'No files found';
    } catch (error: any) {
      return `Error searching files: ${error.message}`;
    }
  }
};

export const fileTools = [
  readFileTool,
  writeFileTool,
  listFilesTool,
  deleteFileTool,
  searchFilesTool
];
