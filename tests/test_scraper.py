"""
Test script for SoFIFA Player Scraper
Tests scraping of a single player (Lionel Messi)
"""
import asyncio
import json
import sys
from pathlib import Path

# Add src directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from playwright.async_api import async_playwright
from player_scraper import PlayerScraper


async def test_single_player():
    """Test scraping a single player page"""
    test_url = "https://sofifa.com/player/158023/lionel-messi/260005/"
    
    print("="*60)
    print("Testing SoFIFA Player Scraper")
    print("="*60)
    print(f"\nTest URL: {test_url}")
    print("\nStarting browser...")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--disable-dev-shm-usage',
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        )
        
        context = await browser.new_context(
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport={'width': 1920, 'height': 1080},
            locale='en-US',
            timezone_id='America/New_York',
            extra_http_headers={
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none'
            }
        )
        
        page = await context.new_page()
        
        # Block images, stylesheets, fonts to optimize loading
        await page.route("**/*", lambda route: route.abort() if route.request.resource_type in ["image", "stylesheet", "font", "media"] else route.continue_())
        
        print("Navigating to player page...")
        await page.goto(test_url, wait_until="domcontentloaded", timeout=15000)
        await page.wait_for_timeout(2000)
        
        # Check for Cloudflare challenge
        page_content = await page.content()
        if 'Checking your browser' in page_content or 'Just a moment' in page_content:
            print("⚠ Cloudflare challenge detected - test may fail")
        
        print("Extracting player data...")
        player_data = await PlayerScraper.scrape_player_data(page, test_url)
        
        await browser.close()
        
        # Print results
        print("\n" + "="*60)
        print("EXTRACTION RESULTS")
        print("="*60)
        
        # Define expected fields in order
        expected_fields = [
            "player_id", "version", "name", "full_name", "description", "image",
            "height_cm", "weight_kg", "dob", "positions", "overall_rating", "potential",
            "value", "wage", "preferred_foot", "weak_foot", "skill_moves",
            "international_reputation", "body_type", "real_face",
            "release_clause", "specialities", "club_id", "club_name", "club_league_id",
            "club_league_name", "club_logo", "club_rating", "club_position",
            "club_kit_number", "club_joined", "club_contract_valid_until",
            "country_id", "country_name", "country_league_id", "country_league_name",
            "country_flag", "country_rating", "country_position", "country_kit_number",
            "attacking_crossing", "attacking_finishing", "attacking_heading_accuracy", 
            "attacking_short_passing", "attacking_volleys",
            "skill_dribbling", "skill_curve", "skill_fk_accuracy", "skill_long_passing", 
            "skill_ball_control",
            "movement_acceleration", "movement_sprint_speed", "movement_agility", 
            "movement_reactions", "movement_balance",
            "power_shot_power", "power_jumping", "power_stamina", "power_strength", 
            "power_long_shots",
            "mentality_aggression", "mentality_interceptions", "mentality_att_positioning", 
            "mentality_vision", "mentality_penalties", "mentality_composure",
            "defending_defensive_awareness", "defending_standing_tackle", "defending_sliding_tackle",
            "goalkeeping_gk_diving", "goalkeeping_gk_handling", "goalkeeping_gk_kicking", 
            "goalkeeping_gk_positioning", "goalkeeping_gk_reflexes",
            "play_styles"
        ]
        
        print(f"\nTotal fields extracted: {len(player_data)}")
        print(f"Expected fields: {len(expected_fields)}")
        
        # Check which fields are present/missing
        present_fields = []
        missing_fields = []
        
        for field in expected_fields:
            if field in player_data and player_data[field]:
                present_fields.append(field)
            else:
                missing_fields.append(field)
        
        print(f"\n✓ Present: {len(present_fields)}/{len(expected_fields)}")
        print(f"✗ Missing: {len(missing_fields)}/{len(expected_fields)}")
        
        if missing_fields:
            print(f"\nMissing fields: {', '.join(missing_fields)}")
        
        # Print sample data
        print("\n" + "="*60)
        print("SAMPLE DATA")
        print("="*60)
        
        sample_fields = [
            "player_id", "name", "full_name", "overall_rating", "potential",
            "positions", "club_name", "country_name", "attacking_crossing", "attacking_finishing",
            "skill_dribbling", "mentality_att_positioning", "play_styles"
        ]
        
        for field in sample_fields:
            value = player_data.get(field, 'N/A')
            # Truncate long values
            if isinstance(value, str) and len(value) > 80:
                value = value[:77] + "..."
            print(f"{field:25s}: {value}")
        
        # Save full data to JSON for inspection
        with open('test_output.json', 'w', encoding='utf-8') as f:
            json.dump(player_data, f, indent=2, ensure_ascii=False)
        
        print(f"\n✓ Full data saved to: test_output.json")
        
        # Print all extracted fields
        print("\n" + "="*60)
        print("ALL EXTRACTED FIELDS")
        print("="*60)
        for key in sorted(player_data.keys()):
            value = player_data[key]
            if isinstance(value, str) and len(value) > 60:
                value = value[:57] + "..."
            print(f"  {key:30s}: {value}")
        
        return player_data


if __name__ == "__main__":
    asyncio.run(test_single_player())
