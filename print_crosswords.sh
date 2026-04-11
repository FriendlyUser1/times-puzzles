#!/bin/bash

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

if [ -f "$SCRIPT_DIR/.env" ]; then
	set -a
	. "$SCRIPT_DIR/.env"
	set +a
fi

PUZZLE_DIR="${PUZZLE_DIR:-$HOME/Documents/puzzles}"

PRINTER=$(lpstat -d)

if [[ $PRINTER == "no"* ]]; then
	echo "No default printer found. Please set a default printer."
	exit 1
else
	PRINTER=$(echo "$PRINTER" | cut -d' ' -f4)
fi

# pick file from argument or today
if [ "$#" -eq 0 ]; then

	todaydate=$(date +%d%m%y)
	puzzle_file=$PUZZLE_DIR/$todaydate.pdf

	if [ ! -f "$puzzle_file" ]; then
		echo "Fetching today's puzzle..."
		node "$SCRIPT_DIR/app.js" 2>&1
	fi

else
	puzzle_file="$1"
fi

if [ ! -f "$puzzle_file" ]; then
	echo "Error: File '$puzzle_file' does not exist."
	exit 1
fi

# get day of week
filename=$(basename "$puzzle_file" ".pdf")

day_part=${filename:0:2}
month_part=${filename:2:2}
year_part=${filename:4:2}

day=$(date -d "$year_part$month_part$day_part" +%u)

if [ "$day" -eq 1 ]; then
	# Monday
	pages="2 3 4 5 7 9"
elif [ "$day" -eq 6 ]; then
	# Saturday
	pages="5 6 7 2 8 4"
elif [ "$day" -eq 7 ]; then
	# Sunday
	pages="1 3 2 4 5 7"
else
	# Tuesday-Friday
	pages="2 4 5 7"
fi

echo "Printing $puzzle_file to $PRINTER pages $pages"

# shellcheck disable=SC2086
# (we want to split the pages)
pdftk "$puzzle_file" cat $pages output - | lp -o sides=two-sided-long-edge
