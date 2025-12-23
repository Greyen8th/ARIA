# ARIA NEURAL CORE (Qwen 2.5)

To run Aria locally, you need to download the brain model manually, as it is too large for GitHub (approx. 2GB).

## Required Model
**Model:** Qwen2.5-3B-Instruct-GGUF (Quantized Q4_K_M or Q5_K_M)
**Filename:** `brain.gguf`

## Download Instructions

1.  **Download from HuggingFace:**
    *   Recommended: [Qwen/Qwen2.5-3B-Instruct-GGUF](https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/tree/main)
    *   Look for file: `qwen2.5-3b-instruct-q4_k_m.gguf` (or similar)
2.  **Rename the file:**
    *   Rename the downloaded file to `brain.gguf`
3.  **Place the file:**
    *   Move `brain.gguf` into this directory: `aria-agent/resources/models/`

## Verification
The file structure should look like this:
```
aria-agent/
├── resources/
│   ├── models/
│   │   ├── README.md (this file)
│   │   └── brain.gguf  <-- YOUR MODEL HERE
```

Once placed, run `npm run dev` and Aria will automatically load the cortex.
