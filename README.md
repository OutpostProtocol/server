# Outpost Server

The outpost server is used to store data from Arweave from querying from our frontend. In order to provide a comparable user experience to web2 platforms, we also process transactions optimistically. That is, we assume they'll go through and upload them to the server. When the transaction is confirmed, we'll updated it in our backend.

## Prerequisites
- A postgres database you can connect to
- An api key for [infura](https://infura.io/)
- An [Arweave Wallet](https://www.arweave.org/wallet) 

## Setup
Create a `.env.development` file in the root of the repo and a add the following
```
DATABASE_URL=url_to_your_postgres_db
INFURA_ID=id_from_infura
INFURA_SECRET=secret_from_infura
HASH_SECRET=random_string_thats_used_with_verifying_auth_tokens
SECRET_PASSWORD=random_string_for_encrypting_your_wallet
OUTPOST_AR_ADDRESS=your_wallet_address
WALLET_PATH=local_path_to_your_wallet
```

HASH_SECRET and SECRET_PASSWORD can be any random strings. SECRET_PASSWORD is used for encrypting your arweave keyfile. HASH_SECRET is used to create an hmac of a users auth token. This should be simplified to just creating a regular hash of the auth token without HASH_SECRET, but you'll need it for now.

### Install Dependencies
```bash
yarn install
```

### Encrypt your wallet
We have to commit and push our wallet to heroku for production. To make sure we don't accidentally commit our wallet to github, we are encrypting it.

```bash
NODE_ENV=development node encryptWallet.js
```

This creates a `wallet.sec` file in the root of your repository which is your wallet encrypted with SECRET_PASSWORD as the key.

### (Optional) Add Publications to DB
If you need to run our UI, you may need to add publications to the database. To do so, add your publication's information to scripts/publication.ts. The images can just be empty strings for testing.

`NODE_ENV=development yarn addCommunities:dev`

## Start the Server
```bash
yarn start
```

## The Repo
- ./src/schema.js
  - The schema exposed by graphql
- ./src/store
  - The models for the database and logic we reuse for querying and updating the database.
- ./src/runner
  - The runner script continuously queries Arweave for updates. When new blocks are added to the chain, we'll find all transactions related to our app and process them.
- ./src/dataSources
  - The dataSources apollo uses for queries and mutations.

### Quickstart
  - Make sure you have [**Docker**](https://www.docker.com/products/docker-desktop) installed.
  - Next, save some [**Ethereum Wallet**] JSON as `./wallet.json`.
  - Make a copy of `.env.example` and rename it to `.env`.
    - _Save this in the project directory!_
  - Once that's done, grab an [**Infura**](https://infura.io) API `publicKey` and `secretKey`, and paste this content in the project's `.env` file.
  - Okay, that's the config done! Next, open a new terminal and execute `docker-compose -f quickstart.yml up` to launch the test [**Postgres**](https://www.postgresql.org/) database we'll use to store Outpost content.
    - Note: To stop the docker instance, run `docker ps -l` to find the ID of the Docker container, then call `docker container kill <container-id>`. You can also remove the instance and it's data altogether by running `docker container rm <container-id>`.
    - If you'd like, you can add some example communities by running `yarn addCommunities:dev`.
    - You can also add some example posts by calling `yarn addPublications:dev`. :)
  - Finally, to launch the API, run `yarn start` in the project directory. The Outpost API should then become available on [http://localhost:4000](http://localhost:4000).

