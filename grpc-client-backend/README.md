# GRPC Handler

Set of scripts that are either processes or run periodically to perform certain set of tasks such as making grpc calls, updating threat metric, making simulations.

The entire codebase uses the same databases which the main backend repository uses. The scripts are written in Nodejs, main database used is MongoDB and Redis is utilised as a cache database.

## Installation

Main System Requirements

```
Node >= 16.0.0
Docker >=20.10
docker-compose >=1.29
```

-   To Install all project dependencies

```bash
  yarn
```

-   To run any script

```bash
node <name_of_script>
```

Since the main script is the `recieve.js` which handles the grpc calls, it is containerized using docker and deployed using docker-compose.

-   To build the docker container

```bash
docker build . -t grpc-server:latest
```

-   To deploy the container

```bash
docker compose up --build -d
```

## Usage/Examples

List of Scripts and their usecase:

-   `recieve.js` - The main script that handles the grpc calls
-   `updateThreat.js` - Background process that updates threat of each package.
-   `simulate_paths.js` - Simulate path of each Rider
