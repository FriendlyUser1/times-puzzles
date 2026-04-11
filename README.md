# times-puzzles

Scripts to scrape and print The Times daily puzzles.

## Overview

This repository contains two utilities:

- `app.js`: Scrapes The Times printable puzzles page, finds puzzle PDF links, downloads them, and tracks already-downloaded dates in `puzzleScraperDatabase.json`.
- `print_crosswords.sh`: Prints selected pages from a puzzle PDF based on the day of the week.

## Requirements

- Node.js (for `app.js`)
- npm
- `pdftk` (required by the print script)
- CUPS printing tools (`lp`, `lpstat`, `lpoptions`)

## Installation / Setup

1. Install Node.js dependencies:

   ```bash
   npm install
   ```

2. Install `pdftk` (example for Debian/Ubuntu):

   ```bash
   sudo apt-get update
   sudo apt-get install pdftk
   ```

3. Ensure you have a default printer configured in CUPS using `lpoptions`:

   ```bash
   lpoptions -d YOUR_PRINTER_NAME
   ```

   You can list available printers with:

   ```bash
   lpstat -p -d
   ```

4. Create your local environment file and set your puzzle directory path:

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` and set:

   ```dotenv
   PUZZLE_DIR=/your/path/to/puzzles
   ```

## Usage

### Download puzzle PDFs

Before running, make sure `PUZZLE_DIR` in `.env` points to your own puzzles folder.

Run:

```bash
node app.js
```

This downloads newly found puzzle PDFs into the folder configured by `PUZZLE_DIR` and records downloaded dates in `puzzleScraperDatabase.json`.

### Print puzzle pages

Before running, make sure `PUZZLE_DIR` in `.env` points to your own puzzles folder.

Run without arguments to print today's puzzle file (expected as `DDMMYY.pdf` in the folder configured by `PUZZLE_DIR`):

```bash
./print_crosswords.sh
```

If today's file is missing, the script will first run `node app.js` from this repository to fetch puzzles, then continue printing.

Run with a specific file path:

```bash
./print_crosswords.sh /path/to/your/file.pdf
```

The script prints a day-specific set of pages and sends the output to your default printer.
