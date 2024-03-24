### EA FC 24 Players Data
[![Node.js CI](https://github.com/prashantghimire/sofifa-web-scraper/actions/workflows/node.js.yml/badge.svg)](https://github.com/prashantghimire/sofifa-web-scraper/actions/workflows/node.js.yml)

Collected from [sofifa.com](https://sofifa.com).
#### You can [view demo data](./output/player-data-test.csv) and [download full players data](./output/player-data-full.csv).
Keep in mind that the above full players data won't always be up-to-date.

If you would like to download the latest data, you can do so by cloning the repo and running the script locally. 
Be mindful that the job will take about 2.5 hours. There is a 300ms delay on each request to avoid Cloudfare rate limitting on sofifa.com.

To run the project locally, follow the instructions below.
Node (version `18.12.1`) and npm (version `9.3.1`) were used during development.

```
git clone https://github.com/prashantghimire/sofifa-web-scraper
cd sofifa-web-scraper
npm install

# to download test players (useful for testing setup)
npm run test

# to download all the 18k+ players (takes ~2.5 hours)
npm run full
```


#### Players Data

```
import pandas as pd
pd.read_csv('./player-data-full.csv', index_col=['player_id'])
```

<img src="images/player_data.png"  alt="Basic"/>
