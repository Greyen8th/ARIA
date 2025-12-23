import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface VoiceMessage {
  text: string;
  emotion?: 'normal' | 'alert' | 'whisper';
}

export class VoiceEngine {
  private queue: VoiceMessage[] = [];
  private isSpeaking: boolean = false;
  private soundEnabled: boolean = true;

  constructor() {
    // Initial warmup or check?
  }

  async speak(text: string, emotion: 'normal' | 'alert' | 'whisper' = 'normal'): Promise<void> {
    // Clean text: remove code blocks, URLs, and special chars that sound bad
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/https?:\/\/[^\s]+/g, 'URL link.')
      .replace(/[*_#`]/g, '') // Remove markdown
      .trim();

    if (!cleanText) return;

    this.queue.push({ text: cleanText, emotion });
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isSpeaking || this.queue.length === 0) return;

    this.isSpeaking = true;
    const message = this.queue.shift();

    if (message) {
      try {
        await this.playEffect(message.emotion);
        await this.executeSpeak(message.text, message.emotion);
      } catch (error) {
        console.error('[VoiceEngine] Speech failed:', error);
      }
    }

    this.isSpeaking = false;
    // Process next if any
    if (this.queue.length > 0) {
      this.processQueue();
    }
  }

  private async playEffect(emotion: string = 'normal'): Promise<void> {
    if (!this.soundEnabled) return;
    
    // MacOS system sounds
    let sound = '/System/Library/Sounds/Glass.aiff';
    if (emotion === 'alert') sound = '/System/Library/Sounds/Ping.aiff';
    if (emotion === 'whisper') sound = '/System/Library/Sounds/Bottle.aiff';

    try {
        await execAsync(`afplay "${sound}"`);
    } catch {
        // Ignore if sound file missing or linux
    }
  }

  private async executeSpeak(text: string, emotion: string = 'normal'): Promise<void> {
    let flags = '';
    
    // Voice selection (Samantha is a good Siri voice, usually available)
    // Use 'say -v ?' to list. We'll stick to default or try a specific one if available.
    // flags += '-v Samantha '; 

    // Rate/Speed
    if (emotion === 'alert') flags += '-r 220 '; // Fast
    if (emotion === 'whisper') flags += '-r 140 '; // Slow
    if (emotion === 'normal') flags += '-r 180 '; // Snappy/Jarvis-like

    // Escape text for shell
    const safeText = text.replace(/"/g, '\\"');

    try {
        await execAsync(`say ${flags} "${safeText}"`);
    } catch (e) {
        console.error('[VoiceEngine] TTS System error:', e);
    }
  }
}
