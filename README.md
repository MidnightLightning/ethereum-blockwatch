# Ethereum Block Alarm
The Ethereum blockchain adds blocks at a rate of about 10 seconds/block. Some contracts need things to happen at a certain block height, and this tool can help track when that should be happening.

This application is deployed on IPFS under the hash [`QmW3NFie6mFcuTmDxhxf5CF4GT7qk2D9kBsaexUhyRWzpz`](https://ipfs.io/ipfs/QmW3NFie6mFcuTmDxhxf5CF4GT7qk2D9kBsaexUhyRWzpz/index.html)

# Developing
Install the required Node modules by running

    npm install

inside the project directory. If developing in a Docker environment, where Node/NPM isn't installed locally, run:

    docker run -it --rm --name npm -v "$PWD":/usr/src/app -w /usr/src/app node npm install --no-bin-links

## Development web server

    npm install -g http-server
    http-server /src/web -p8080

Or, in a Docker environment:

    docker-compose build
    docker-compose up -d

That uses the `Dockerfile` and `docker-compose.yml` files to get a container running that uses `http-server` to host the files.

Either way, then visiting `http://localhost:8080` should show the site.

## Run Gulp tasks
In a Docker environment, the "web" container is configured with Gulp, so can be used to run tasks as well:

    docker-compose run -d web gulp watch
    docker-compose run --rm web gulp less
