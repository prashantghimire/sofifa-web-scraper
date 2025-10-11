### Notice 📣 : Works with EA FC 25 🚀! This library has been migrated from Puppeteer (JavaScript) to Playwright (Python). This change has proven to be more effective against Cloudflare bot protections implemented by SoFIFA.
*Puppeteer code is kept in the `legacy` branch.*
# SoFIFA Player Scraper

A comprehensive Playwright-based web scraper that extracts player URLs and detailed statistics from [sofifa.com](https://sofifa.com/) and saves them to CSV files.

<img src="cover.png" alt="Cover Image">

## Quickstart

- **Install dependencies**
  ```bash
  pip3 install -r requirements.txt
  playwright install chromium
  ```
- **Validate the scraper**
  ```bash
  python3 tests/test_scraper.py
  ```
- **Collect player URLs**
  ```bash
  python3 src/scrape_player_urls.py
  ```
- **Scrape player stats (with optional CLI arguments)**
  ```bash
  python3 src/sofifa_scraper.py --max-players 100 \
      --player-urls-file player_urls.csv \
      --output-file player_stats.csv
  ```
  Omit an argument to use its default value (e.g., remove `--max-players` to scrape all players).

## Project Structure

```
sofifa-web-scraper/
├── src/                          # Source code
│   ├── scrape_player_urls.py    # URL collector
│   ├── player_scraper.py        # Modular scraper class
│   └── sofifa_scraper.py        # Main stats scraper
├── tests/                        # Test files
│   └── test_scraper.py          # Single player test
├── player_urls.csv               # Input: Player URLs
├── player_stats.csv              # Output: Player stats
└── README.md                     # This file
```

## Architecture

The scraper uses a modular design:
```
src/player_scraper.py (PlayerScraper class)
    ↓
src/sofifa_scraper.py (SoFIFAScraper class)
    ↓
player_stats.csv (output)
```

## Features

### Comprehensive Data Extraction (70+ fields)

- **Basic Info:** player_id, version, name, full_name, description, image, height_cm, weight_kg, dob, positions
- **Ratings & Value:** overall_rating, potential, value, wage
- **Profile Attributes:** preferred_foot, weak_foot, skill_moves, international_reputation, body_type, real_face, release_clause, specialities
- **Club Information:** club_id, club_name, club_league_id, club_league_name, club_logo, club_rating, club_position, club_kit_number, club_joined, club_contract_valid_until
- **National Team:** country_id, country_name, country_league_id, country_league_name, country_flag, country_rating, country_position, country_kit_number
- **Attacking Stats:** crossing, finishing, heading_accuracy, short_passing, volleys
- **Skill Stats:** dribbling, curve, fk_accuracy, long_passing, ball_control
- **Movement Stats:** acceleration, sprint_speed, agility, reactions, balance
- **Power Stats:** shot_power, jumping, stamina, strength, long_shots
- **Mentality Stats:** aggression, interceptions, positioning, vision, penalties, composure
- **Defending Stats:** defensive_awareness, standing_tackle, sliding_tackle
- **Goalkeeping Stats:** gk_diving, gk_handling, gk_kicking, gk_positioning, gk_reflexes
- **Special:** play_styles (comma-separated list), url

### Performance Optimizations

- **Headless mode** - Runs without opening browser window
- **Resource blocking** - Blocks images, CSS, fonts, and media for faster loading
- **Cloudflare bypass** - Automatic retry with 10s backoff on bot challenges (5 retries)
- **Async implementation** - Better performance with async/await
- **Incremental saves** - Progress saved after each player is scraped

### Output Format

All CSV headers use **lowercase_snake_case** format with no spaces for consistency.

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

## Installation

1. **Install Python dependencies:**
   ```bash
   pip3 install -r requirements.txt
   ```

2. **Install Playwright browsers:**
   ```bash
   playwright install chromium
   ```

## Usage

### Quick Start - Test First

Test the scraper on a single player (Lionel Messi) to verify everything works:

```bash
python3 tests/test_scraper.py
```

**Expected output:**
- ✓ Extraction summary in console
- ✓ `test_output.json` file with all 70+ fields
- ✓ Field presence/absence report

### Step 1: Scrape Player URLs

First, run the URL scraper to get all player URLs:

```bash
python3 src/scrape_player_urls.py
```

This script will:
1. Navigate to `https://sofifa.com/players?col=oa&sort=desc`
2. Extract all player URLs from the current page
3. Click through pagination (offset increments of 60)
4. Continue until no "Next" button exists
5. Save all URLs to `player_urls.csv` after each page
6. Automatically retry on Cloudflare challenges (up to 5 times with 10s backoff)

**Output:** `player_urls.csv` with all player profile URLs

### Step 2: Scrape Player Stats

After you have `player_urls.csv`, run the stats scraper:

```bash
python3 src/sofifa_scraper.py [--max-players N] [--player-urls-file PATH] [--output-file PATH]
```

This script will:
1. Load player URLs from `player_urls.csv`
2. Visit each player page and extract detailed stats (runs in headless mode)
3. Save progress incrementally after each player to `player_stats.csv`
4. Automatically retry on Cloudflare challenges (up to 5 times with 10s backoff)
5. Display a summary with extracted data

**Notes:**
- Omit CLI arguments to use default values (`player_urls.csv`, `player_stats.csv`, and scraping all players).
- Use `--max-players` to limit runs for testing (for example, `--max-players 50`).
- Provide alternate input/output paths with `--player-urls-file` and `--output-file`.

## Output Format

### player_stats.csv

Comprehensive CSV with 70+ columns in **lowercase_snake_case** format:

```csv
player_id,version,name,full_name,description,image,height_cm,weight_kg,dob,positions,overall_rating,potential,value,wage,preferred_foot,weak_foot,skill_moves,international_reputation,body_type,real_face,release_clause,specialities,club_id,club_name,club_league_id,club_league_name,club_logo,club_rating,club_position,club_kit_number,club_joined,club_contract_valid_until,country_id,country_name,country_league_id,country_league_name,country_flag,country_rating,country_position,country_kit_number,attacking_crossing,attacking_finishing,attacking_heading_accuracy,attacking_short_passing,attacking_volleys,skill_dribbling,skill_curve,skill_fk_accuracy,skill_long_passing,skill_ball_control,movement_acceleration,movement_sprint_speed,movement_agility,movement_reactions,movement_balance,power_shot_power,power_jumping,power_stamina,power_strength,power_long_shots,mentality_aggression,mentality_interceptions,mentality_att_positioning,mentality_vision,mentality_penalties,mentality_composure,defending_defensive_awareness,defending_standing_tackle,defending_sliding_tackle,goalkeeping_gk_diving,goalkeeping_gk_handling,goalkeeping_gk_kicking,goalkeeping_gk_positioning,goalkeeping_gk_reflexes,play_styles,url
158023,FC 26,L. Messi,Lionel Andrés Messi Cuccitini,...
```

**Key Features:**
- All headers in **lowercase_snake_case** (no spaces)
- 70+ comprehensive fields per player
- Incremental saves (progress preserved after each player)

## Customization

You can modify the scraper by editing `src/sofifa_scraper.py`:

- **Limit players:** Set `max_players = 10` to scrape specific amount instead of all
- **Change input file:** Pass different filename to `SoFIFAScraper(player_urls_file="custom.csv")`
- **Change output filename:** Modify the filename in the scraper initialization
- **Adjust retry settings:** Modify `max_retries` and sleep duration in the scraping loop
- **Modify extracted fields:** Edit the `PlayerScraper` class in `src/player_scraper.py`

## Notes

- The scraper runs in **headless mode** (no visible browser window)
- **Resource blocking** is enabled to skip loading images, CSS, fonts, and media for faster performance
- **Cloudflare detection:** Automatically retries up to 5 times with 10-second pauses if bot challenge is detected
- **Incremental saves:** Progress is saved after each player, so you can resume if interrupted
- The scraper respects the website's structure as of the implementation date
- Website structure changes may require updates to the selectors in `player_scraper.py`
- Be respectful of the website's terms of service and rate limits

## Troubleshooting

**Browser not found:**
```bash
playwright install chromium
```

**Cloudflare challenges:**
- The scraper automatically retries up to 5 times with 10s backoff
- If challenges persist, the website may have stricter bot detection
- Consider adding longer delays between requests

**Timeout errors:**
- Check your internet connection
- The website might be slow or down
- Increase timeout values in the script

**No stats extracted:**
- Run `python3 tests/test_scraper.py` first to verify extraction works
- Check `test_output.json` for raw extracted data
- The website structure may have changed
- Check if player URLs in CSV are valid and accessible
- Verify the selectors in `src/player_scraper.py`

**Missing fields in output:**
- Some players may not have all fields (e.g., no club)
- This is expected and handled gracefully
- Run `python3 tests/test_scraper.py` to see which fields are typically missing

## Verification Checklist

Before running full scrape:

- [ ] Run `python3 tests/test_scraper.py` successfully
- [ ] Check `test_output.json` has expected data
- [ ] Verify CSV headers match your schema
- [ ] Test with `max_players=5` first in `src/sofifa_scraper.py`
- [ ] Then run full scrape

## License

MIT License - Feel free to use and modify as needed.
