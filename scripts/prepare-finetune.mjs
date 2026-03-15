import fs from 'fs';
import path from 'path';

function usage() {
  console.log('Usage: node scripts/prepare-finetune.mjs [input.jsonl] [output.jsonl]');
}

const args = process.argv.slice(2);
const input = args[0] || path.resolve(process.cwd(), 'scripts', 'chat_logs.jsonl');
const output = args[1] || path.resolve(process.cwd(), 'scripts', 'chat_finetune.jsonl');

if (!fs.existsSync(input)) {
  console.error('Input file not found:', input);
  usage();
  process.exit(1);
}

const lines = fs.readFileSync(input, 'utf8').split(/\r?\n/).filter(Boolean);
const outFd = fs.openSync(output, 'w');
let written = 0;

for (const line of lines) {
  try {
    const obj = JSON.parse(line);
    const user = (obj.userMessage || '').trim();
    const bot = (obj.botReply || '').trim();
    const cat = obj.matchedCategory || 'unknown';

    if (!user || !bot) continue;

    // Format for OpenAI fine-tuning: {"prompt": "...", "completion": " ..."}
    // We include a short context tag to help the model.
    const prompt = `User: ${user}\nCategory: ${cat}\nAssistant:`;
    // Ensure completion starts with a space and ends with newline (OpenAI style)
    const completion = ` ${bot}\n`;

    const outRecord = { prompt, completion };
    fs.writeSync(outFd, JSON.stringify(outRecord) + '\n');
    written += 1;
  } catch (err) {
    // skip malformed lines
    continue;
  }
}

fs.closeSync(outFd);
console.log(`Wrote ${written} examples to ${output}`);
