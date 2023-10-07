### FIFA 23 Players Data

Collected from [sofifa.com](https://sofifa.com).
#### You can [view demo data](./output/player_data_test.csv) and [download full players data](./output/player_data_full.csv).
Keep in mind that the above full players data won't always be up-to-date.

If you would like to download the latest data, you can do so by cloning the repo and running the script locally. 
Be mindful that the task will take over 2 hours and its intentionally set be be slow to evade Cloudfare IP blocking on sofifa.com.

To run the project locally, follow the instructions below.
Node (version `18.12.1`) and npm (version `9.3.1`) were used during development.

```
git clone https://github.com/prashantghimire/sofifa-web-scraper
cd sofifa-web-scraper
npm install

# to download top 60 players (useful for testing setup)
npm run download-test

# to download all the 18k+ players (takes 2+ hours)
npm run download-full
```


#### Players Data

```
import pandas as pd
pd.read_csv('./player_data.csv', index_col=['profile_id'])
```

<img src="images/player_data.png"  alt="Basic"/>
