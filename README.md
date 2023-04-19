### FIFA 23 Players Data

Collected from [sofifa.com](https://sofifa.com) as of April 07, 2023.
#### Check out the [demo data here](./output/player_data_test.csv).

Complete latest players data can be obtained by running the project locally. The full data is not guaranteed to be the latest since completing scraping takes about 2 hours. Due to Cloudflare restrictions, scraping is set to be slow on purpose.

To do so, follow the instructions below:

Node (version `18.12.1`) and npm (version `9.3.1`) were used during development.

```
git clone https://github.com/prashantghimire/sofifa-web-scraper
cd sofifa-web-scraper
npm i

# to download top 60 players(useful for testing setup).
npm run download-test

# to download all the 18k+ players (takes 2+ hours)
npm run download-full
```

The output data are in the [output](./output) directory.

#### Players Data

```
import pandas as pd
pd.read_csv('./player_data.csv', index_col=['profile_id'])
```

<img src="images/player_data.png" width="400px" alt="Basic"/>
