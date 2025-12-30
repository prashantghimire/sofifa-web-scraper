"""
SoFIFA Team Ratings Scraper
Comprehensive scraper for extracting team overall ratings and statistics
"""
import argparse
import csv
import asyncio
from playwright.async_api import async_playwright
from team_scraper import TeamScraper


class SoFIFATeamScraper:
    def __init__(self, output_file="team_ratings.csv"):
        self.output_file = output_file
        self.teams = []
        self.csv_initialized = False

    async def scrape_teams(self, max_teams=None):
        """Scrape team ratings from SoFIFA"""
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
            await page.route("**/*", lambda route: route.abort() 
                if route.request.resource_type in ["image", "stylesheet", "font", "media"]
                else route.continue_())
            
            offset = 0
            teams_scraped = 0
            page_num = 1
            should_continue = True
            
            print("🔍 Starting team ratings scraper...")
            print("=" * 60)
            
            while should_continue:
                if max_teams and teams_scraped >= max_teams:
                    print(f"\n--  Reached maximum of {max_teams} teams --")
                    break
                
                url = f"https://sofifa.com/teams?col=oa&sort=desc&offset={offset}"
                
                retries = 0
                max_retries = 5
                success = False
                
                while retries < max_retries and not success:
                    try:
                        if retries > 0:
                            print(f"  Retry {retries}/{max_retries} after 10s pause...")
                            await asyncio.sleep(10)
                        
                        print(f"\n[Page {page_num}] Scraping: {url}")
                        
                        await page.goto(url, wait_until='domcontentloaded', timeout=30000)
                        await asyncio.sleep(2)
                        
                        # Check for Cloudflare challenge
                        page_content = await page.content()
                        if 'Checking your browser' in page_content or 'Just a moment' in page_content:
                            print(" !! Cloudflare challenge detected !!")
                            retries += 1
                            continue
                        
                        # Extract team data using modular scraper
                        team_data = await TeamScraper.scrape_team_data(page)
                        
                        if not team_data:
                            print("  ✗ No teams found on this page")
                            should_continue = False
                            break
                        
                        print(f"  ✓ Found {len(team_data)} teams on this page")
                        
                        # Add teams and save incrementally
                        for team in team_data:
                            self.teams.append(team)
                            teams_scraped += 1
                            
                            if teams_scraped % 10 == 0:
                                print(f"    Scraped {teams_scraped} teams...")
                            
                            # Save incrementally after each team
                            self.save_team_to_csv(team)
                            
                            if max_teams and teams_scraped >= max_teams:
                                break
                        
                        # Check if there's a next page
                        has_next = await TeamScraper.check_next_page(page)
                        
                        if not has_next:
                            print("\n-- No more pages available --")
                            should_continue = False
                            break
                        
                        success = True
                        offset += 60
                        page_num += 1
                        
                    except Exception as e:
                        print(f"  ✗ Error: {str(e)}")
                        retries += 1
                        if retries >= max_retries:
                            print(f"  ✗ Failed after {max_retries} retries")
                            break
            
            await browser.close()
            
            print("\n" + "=" * 60)
            print(f"Scraping complete! Total teams: {len(self.teams)}")
            print(f"Data saved to: {self.output_file}")
            self.print_summary()

    def save_team_to_csv(self, team):
        """Save a single team to CSV (incremental save)"""
        fieldnames = ['team_id', 'name', 'league', 'overall', 'attack', 'midfield', 'defence', 'transfer_budget', 'club_worth', 'num_players', 'starting_11_average']
        
        # Initialize CSV with headers on first write
        if not self.csv_initialized:
            with open(self.output_file, 'w', encoding='utf-8', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
            self.csv_initialized = True
        
        # Append team data
        with open(self.output_file, 'a', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writerow(team)

    def print_summary(self):
        """Print summary statistics"""
        if not self.teams:
            return
        
        print("\n" + "=" * 60)
        print("SUMMARY")
        print("=" * 60)
        
        # Overall rating distribution
        rating_dist = {}
        for team in self.teams:
            overall = team.get('overall', '0')
            rating_range = f"{(int(overall) // 5) * 5}-{(int(overall) // 5) * 5 + 4}"
            rating_dist[rating_range] = rating_dist.get(rating_range, 0) + 1
        
        print("\nOverall Rating Distribution:")
        for rating_range in sorted(rating_dist.keys(), reverse=True):
            print(f"  {rating_range}: {rating_dist[rating_range]} teams")
        
        # Top 10 teams by overall rating
        sorted_teams = sorted(self.teams, key=lambda x: int(x.get('overall', 0)), reverse=True)
        
        if len(sorted_teams) >= 10:
            print("\n" + "=" * 60)
            print("TOP 10 TEAMS BY OVERALL RATING")
            print("=" * 60)
            for i, team in enumerate(sorted_teams[:10]):
                att = team.get('attack', 'N/A')
                mid = team.get('midfield', 'N/A')
                deff = team.get('defence', 'N/A')
                league = team.get('league', 'N/A')
                print(f"{i+1:2d}. {team['name']:30s} | OVR: {team['overall']:2s} | ATT: {att:2s} | MID: {mid:2s} | DEF: {deff:2s} | {league}")

async def main():
    """Main function to run the team scraper"""
    parser = argparse.ArgumentParser(description='Scrape team overall ratings from SoFIFA')
    parser.add_argument('--max-teams', type=int, default=None,
                        help='Maximum number of teams to scrape (default: all teams)')
    parser.add_argument('--output-file', default='team_ratings.csv',
                        help='Output CSV file (default: team_ratings.csv)')
    
    args = parser.parse_args()
    
    scraper = SoFIFATeamScraper(output_file=args.output_file)
    await scraper.scrape_teams(max_teams=args.max_teams)


if __name__ == '__main__':
    asyncio.run(main())
