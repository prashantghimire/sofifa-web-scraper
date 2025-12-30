"""
Modular SoFIFA Team Scraper
Extracts team ratings data from sofifa.com
"""
import re
from playwright.async_api import Page


class TeamScraper:
    """Handles extraction of team data from team listing pages"""
    
    @staticmethod
    def extract_team_id(url: str) -> str:
        """Extract team ID from URL"""
        match = re.search(r'/team/(\d+)/', url)
        return match.group(1) if match else ''
    
    @staticmethod
    async def scrape_team_data(page: Page) -> list:
        """
        Scrape all team data from a team listing page
        Returns a list of dictionaries with team attributes
        """
        teams = await page.evaluate("""
            () => {
                const teams = [];
                const rows = document.querySelectorAll('table tbody tr');
                
                rows.forEach(row => {
                    const team = {};
                    
                    // Team name and ID
                    const teamLink = row.querySelector('td.s20 a');
                    if (teamLink) {
                        team.name = teamLink.textContent.trim();
                        const href = teamLink.getAttribute('href');
                        const idMatch = href ? href.match(/\\/team\\/(\\d+)/) : null;
                        team.team_id = idMatch ? idMatch[1] : '';
                    }
                    
                    // League
                    const leagueLink = row.querySelector('td.s20 a.sub');
                    if (leagueLink) {
                        team.league = leagueLink.textContent.trim();
                    }
                    
                    // Overall rating (OVR)
                    const ovrCell = row.querySelector('td[data-col="oa"] em');
                    if (ovrCell) {
                        team.overall = ovrCell.textContent.trim();
                    }
                    
                    // Attack rating (ATT)
                    const attCell = row.querySelector('td[data-col="at"] em');
                    if (attCell) {
                        team.attack = attCell.textContent.trim();
                    }
                    
                    // Midfield rating (MID)
                    const midCell = row.querySelector('td[data-col="md"] em');
                    if (midCell) {
                        team.midfield = midCell.textContent.trim();
                    }
                    
                    // Defence rating (DEF)
                    const defCell = row.querySelector('td[data-col="df"] em');
                    if (defCell) {
                        team.defence = defCell.textContent.trim();
                    }
                    
                    // Transfer Budget
                    const transferCell = row.querySelector('td[data-col="tb"]');
                    if (transferCell) {
                        team.transfer_budget = transferCell.textContent.trim();
                    }
                    
                    // Club Worth 
                    const clubWorthCell = row.querySelector('td[data-col="cw"]');
                    if (clubWorthCell) {
                        team.club_worth = clubWorthCell.textContent.trim();
                    }
                    
                    // Number of Players
                    const playersCell = row.querySelector('td[data-col="ps"] em');
                    if (playersCell) {
                        team.num_players = playersCell.textContent.trim();
                    }
                    
                    // Starting 11 Average
                    const startingAveCell = row.querySelector('td[data-col="sa"] em');
                    if (startingAveCell) {
                        team.starting_11_average = startingAveCell.textContent.trim();
                    }
                    
                    if (team.name && team.overall) {
                        teams.push(team);
                    }
                });
                
                return teams;
            }
        """)
        
        return teams
    
    @staticmethod
    async def check_next_page(page: Page) -> bool:
        """
        Check if there's a next page available
        Returns True if next page exists, False otherwise
        """
        has_next = await page.evaluate("""
                        () => {
                            const buttons = document.querySelectorAll('.pagination a.button');
                            const nextButton = Array.from(buttons).find(btn => btn.textContent.includes('Next'));
                            return nextButton !== undefined;
                        }
                    """)
        
        return has_next
