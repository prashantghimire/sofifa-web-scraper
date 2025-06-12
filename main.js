const fs = require('fs');
const { createObjectCsvWriter } = require('csv-writer');
const puppeteer = require('puppeteer');
const { getPlayerData } = require('./scraper/player-data-scraper');
const { getPlayerUrls } = require('./scraper/player-url-scraper');
const { delay } = require('./utils');

const main = async (arg) => {
  const browser = await puppeteer.launch();
  try {
    const mode = arg || 'test';
    console.log(`[INFO] Running in ${mode} mode`);

    const urlFilePath = `./output/player-urls-${mode}.json`;
    const dataFilePath = `./output/player-data-${mode}.csv`;

    if (mode === 'download-urls') {
      const urls = await getPlayerUrls(browser);
      fs.writeFileSync(
        './output/player-urls-full.json',
        JSON.stringify(urls, null, 2)
      );
      fs.writeFileSync(
        './output/player-urls-test.json',
        JSON.stringify(urls.slice(0, 60), null, 2)
      );
      return;
    }

    const csvWriter = createObjectCsvWriter({
      path: dataFilePath,
      header: [
        { id: 'id', title: 'ID' },
        { id: 'long_name', title: 'Name' },
        { id: 'player_positions', title: 'Position' },
        { id: 'overall', title: 'Overall' },
        { id: 'potential', title: 'Potential' },
        { id: 'value_eur', title: 'Value(EUR)' },
        { id: 'wage_eur', title: 'Wage(EUR)' },
        { id: 'age', title: 'Age' },
        { id: 'height_cm', title: 'Height(cm)' },
        { id: 'weight_kg', title: 'Weight(kg)' },
        { id: 'club_name', title: 'Club' },
        { id: 'nationality_name', title: 'Nationality' },
      ],
    });

    let urls = JSON.parse(fs.readFileSync(urlFilePath, 'utf-8'));

    // --- MODIFICATION START ---
    // If we are in 'full' mode, we will only process the first 500 URLs.
    if (mode === 'full') {
      urls = urls.slice(0, 500);
      console.log(
        `[INFO] MODIFIED: Starting scrape for the first ${urls.length} players.`
      );
    }
    // --- MODIFICATION END ---

    for (const url of urls) {
      const playerData = await getPlayerData(browser, url);
      if (playerData) {
        csvWriter.writeRecords([playerData]);
        console.log(`[OK] ${playerData.long_name}`);
      }
      await delay(300);
    }
  } catch (err) {
    console.log(err);
  } finally {
    await browser.close();
  }
};

main(process.argv[2]);
