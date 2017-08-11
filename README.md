# Node Based web project
While making small modules in Node is easy, and adheres to the Unix-y philosophy of "do one thing and do it well," it can lead to some [unfortunate situations](http://www.theregister.co.uk/2016/03/23/npm_left_pad_chaos/) if those modules get too small.

So this is my source repo for getting a simple NodeJS web application running, with my favorite side-tools configured.

To clone this archive as a starting point, use `git archive master | tar -x -C /somewhere/else` to clone it without any of the existing Git history ([ref](http://stackoverflow.com/a/163769/144756)).

## Included packages
- [Gulp](https://www.npmjs.com/package/mocha): For build tasks
- ESLint: For keeping JavaScript clean
- LESS: For complex CSS manipulation
- [Mocha](https://www.npmjs.com/package/mocha): For unit-testing

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
