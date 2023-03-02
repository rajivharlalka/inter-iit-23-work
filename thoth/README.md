# Thoth

Why this name: The Egyptian God of Messeges. The server acts as a messenger between different optimzation algorithms to fetch details between them.

## Installing / Getting started

A quick introduction of the minimal setup you need to get the development environment setup

## Requirements

-   Node >= 16

```shell
yarn
yarn dev
```

Docker can also be used to start the server.

```shell
# To start the Server
docker compose up --build -d
# To stop the server
docker compose down --remove-orphans
```

## API reference

Postman documentation: [here](https://documenter.getpostman.com/view/19757323/2s8ZDR96HX)

`baseurl`: http://127.0.0.1:3000/v1

`Production Url`: https://thoth.grow-simplee.tech

-   [Login endpoints](#login)
-   [Rider endpoints](#rider)
-   [Package endpoints](#package)
-   [Bin endpoints](#bin)
-   [Route endpoints](#route)
-   [Status endpoints](#status)
-   [Utility endpoints](#utility)
-   [Service endpoints](#service)

### Login

-   #### Admin Login

Endpoint for admin login

```shell
POST /auth/admin
```

<details>
<summary>Request Body</summary>
<pre>
{
    "email":"yo@admin.com",
    "password":"Admin098"
}
</pre>
</details>

<details>
<summary>Response</summary>
<pre>
{
    "message": "Logged in"
}
</pre>
</details>

-   #### Rider Login

Endpoint for rider login

```shell
POST /auth/rider
```

<details>
<summary>Request Body</summary>
<pre>
{
    "email":"Clair11@gmail.com",
    "password":"Rider098"
}
</pre>
</details>

<details>
<summary>Response</summary>
<pre>
{
    "message": "Login Success",
    "rider": {
        "_id": "63d1295758fa89399775d87d",
        "name": "Merle Rogahn",
        "phone": "+919279512912",
        "email": "Clair11@gmail.com",
        "createdAt": "2023-01-25T13:06:31.418Z",
        "updatedAt": "2023-01-25T13:06:31.418Z",
        "__v": 0
    }
}
</pre>
</details>

### Rider

-   #### Get All Riders

Endpoint for getting list of all riders

```shell
GET /rider/all
```

<details>
<summary>Response</summary>
<pre>
{
    "message": "Riders",
    "riders": [
        {
            "_id": "63d1295758fa89399775d87d",
            "name": "Merle Rogahn",
            "phone": "+919279512912",
            "email": "Clair11@gmail.com",
            "createdAt": "2023-01-25T13:06:31.418Z",
            "updatedAt": "2023-01-25T13:06:31.418Z",
            "__v": 0,
            "assigned": true
        }
    ]
}
</pre>
</details>

-   #### Add Rider

Endpoint for adding a new rider to the database

```shell
POST /rider/add
```

<details>
<summary>Request Body</summary>
<pre>
{
    "name": "Merle Rogahn",
    "phone": "+919279512912",
    "email": "Clair11@gmail.com"
}
</pre>
</details>

<details>
<summary>Response</summary>
<pre>
{
    "message": "Rider Added",
    "rider": {
        "name": "test",
        "phone": "+918987966604",
        "email": "test@gmail.com",
        "_id": "63cac2aa1e2adff1a3b062c6",
        "createdAt": "2023-01-20T16:34:50.865Z",
        "updatedAt": "2023-01-20T16:34:50.865Z",
        "__v": 0
    }
}
</pre>
</details>

-   #### Get Rider Location

Endpoint for getting rider's last known location (locations are being stored in redis geohashes)  
Returns all rider locations if no `rider_id` is found in query

```shell
GET /rider/location?rider_id=63c717fee9c8bd67b877e46f
```

<details>
<summary>Response</summary>
<pre>
{
    "message": "Rider location",
    "rider": {
        "coordinates": {
            "latitude": 12907009,
            "longitude": 77585678
        },
        "id": "63c717fee9c8bd67b877e46f"
    }
}
</pre>
</details>

```shell
GET /rider/location
```

<details>
<summary>Response</summary>
<pre>
{
    "message": "Rider location",
    "rider": [
        {
            "coordinates": {
                "latitude": 12971598.333333332,
                "longitude": 77594561.66666666
            },
            "id": "63c717fee9c8bd67b877e46f"
        },
        {
            "coordinates": {
                "latitude": 12953950,
                "longitude": 77641089
            },
            "id": "63c717fee9c8bd67b877e473"
        }
    ]
}
</pre>
</details>

-   #### Set Rider Location

Endpoint for setting rider's location (pass scaled coordinates)

```shell
POST /rider/location
```

<details>
<summary>Request Body</summary>
<pre>
{
    "rider_id": "63c717fee9c8bd67b877e46f",
    "value" : {
        "coordinates": {
            "latitude": 12907009,
            "longitude": 77585678
        }
    }
}
</pre>
</details>

<details>
<summary>Response</summary>
<pre>
{
    "message": "Rider location set",
    "value": {
        "coordinates": {
            "latitude": 12907009,
            "longitude": 77585678
        }
    }
}
</pre>
</details>

### Package

-   #### Get Package Details

Endpoint for getting package details from `package_id`

```shell
GET /package/details?package_id=63d1285d70bb48a2ca4ec16b
```

<details>
<summary>Response</summary>
<pre>
{
    "message": "Package Details",
    "pkg": {
        "deliver_to": {
            "name": "Ms. Dixie Veum",
            "phone_number": "+919405505694"
        },
        "coordinates": {
            "latitude": 12974678,
            "longitude": 77604902,
            "address": "22, Amoeba Complex, Church Street, Bangalore"
        },
        "dimensions": {
            "length": 19,
            "breadth": 21,
            "height": 10,
            "weight": 25
        },
        "_id": "63d1285d70bb48a2ca4ec16b",
        "image_url": "https://via.placeholder.com/150",
        "sku_id": "SKU_82",
        "awb_id": "76084mibiqf",
        "delivered_time": "2023-01-25T13:02:21.658Z",
        "type": "DELIVERY",
        "latest_status": "IN_WAREHOUSE",
        "createdAt": "2023-01-25T13:02:21.676Z",
        "updatedAt": "2023-01-27T09:03:41.148Z",
        "__v": 0
    },
    "status": [
        {
            "status": "IN_WAREHOUSE",
            "createdAt": "2023-01-25T13:02:21.815Z"
        }
    ]
}
</pre>
</details>

-   #### Get Package List

Endpoint for getting package list from a given `sku_id` or `awb_id`  
Returns list of all packages if nothing is passed in query

```shell
GET /package/list?sku_id=SKU_1
GET /package/list?awb_id=DEF
GET /package/list
```

<details>
<summary>Response</summary>
<pre>
{
    "message": "Package List",
    "package": [
        {
            "deliver_to": {
                "name": "Ms. Dixie Veum",
                "phone_number": "+919405505694"
            },
            "coordinates": {
                "latitude": 12974678,
                "longitude": 77604902,
                "address": "22, Amoeba Complex, Church Street, Bangalore"
            },
            "dimensions": {
                "length": 19,
                "breadth": 21,
                "height": 10,
                "weight": 25
            },
            "_id": "63d1285d70bb48a2ca4ec16b",
            "image_url": "https://via.placeholder.com/150",
            "sku_id": "SKU_82",
            "awb_id": "76084mibiqf",
            "delivered_time": "2023-01-25T13:02:21.658Z",
            "type": "PICKUP",
            "latest_status": "FAKE_ATTEMPT",
            "createdAt": "2023-01-25T13:02:21.676Z",
            "updatedAt": "2023-01-27T09:03:41.148Z",
            "__v": 0
        }
    ]
}
</pre>
</details>

-   #### Add Delivery Package

Endpoint for adding a delivery package

```shell
POST /package/delivery
```

<details>
<summary>Request Body</summary>
<pre>
{
    "awb_id": "DEF",
    "sku_id": "SKU_1",
    "deliver_to": {
        "name": "PQR",
        "phone_number": "9876543210"
    },
    "address": "1260, SY 35/4, SJR Tower's, 7th Phase, 24th Main, Puttanhalli, JP Nagar, Bangalore",
    "dimensions": {
        "length": 4,
        "breadth": 4,
        "height": 4,
        "weight": 3
    },
    "type":"DELIVERY"
}
</pre>
</details>

<details>
<summary>Response</summary>
<pre>
{
    "message": "Delivery Package Added",
    "deliveryPackage": {
        "item_id": "63c3b65362013a31d4b2a576",
        "deliver_to": {
            "name": "PQR",
            "phone_number": "9876543210"
        },
        "status": "IN_WAREHOUSE",
        "coordinates": {
            "latitude": 12907009,
            "longitude": 77585678,
            "address": "1260, SY 35/4, SJR Tower's, 7th Phase, 24th Main, Puttanhalli, JP Nagar, Bangalore"
        },
        "type": "DELIVERY",
        "_id": "63c3b9f65c1a9b6fc6e475f3",
        "createdAt": "2023-01-15T08:31:50.044Z",
        "updatedAt": "2023-01-15T08:31:50.044Z",
        "__v": 0
    }
}
</pre>
</details>

-   #### Upload image

Endpoint for uploading package image and updating `image_url` in a package

### Bin

-   #### Get Bin Details

Endpoint for getting bin details from `rider_id` (if rider is assigned)

```shell
GET /bin/details?rider_id=63c717fee9c8bd67b877e46f
```

<details>
<summary>Response</summary>
<pre>
{
    "message": "Bin details",
    "bin": {
        "dimensions": {
            "length": 80,
            "breadth": 80,
            "height": 80,
            "weight": 3
        },
        "_id": "63d1440641bda10b2fb2a280",
        "packages": [
            {
                "package_id": "63d1285d70bb48a2ca4ec16b",
                "length": 19,
                "breadth": 21,
                "height": 10,
                "x": 0,
                "y": 0,
                "z": 0,
                "weight": 25,
                "_id": "63d1440641bda10b2fb2a281"
            },
            {
                "package_id": "63d1285f70bb48a2ca4ec16f",
                "length": 25,
                "breadth": 5,
                "height": 10,
                "x": 0,
                "y": 0,
                "z": 10,
                "weight": 15,
                "_id": "63d1440641bda10b2fb2a282"
            },
            {
                "package_id": "63d1286170bb48a2ca4ec173",
                "length": 21,
                "breadth": 26,
                "height": 10,
                "x": 0,
                "y": 0,
                "z": 20,
                "weight": 10,
                "_id": "63d1440641bda10b2fb2a283"
            },
            {
                "package_id": "63d1286370bb48a2ca4ec177",
                "length": 34,
                "breadth": 8,
                "height": 10,
                "x": 0,
                "y": 0,
                "z": 30,
                "weight": 1,
                "_id": "63d1440641bda10b2fb2a284"
            },
            {
                "package_id": "63d1286470bb48a2ca4ec17b",
                "length": 24,
                "breadth": 19,
                "height": 10,
                "x": 0,
                "y": 0,
                "z": 40,
                "weight": 17,
                "_id": "63d1440641bda10b2fb2a285"
            }
        ],
        "createdAt": "2023-01-25T15:00:22.105Z",
        "updatedAt": "2023-01-25T15:00:22.105Z",
        "__v": 0
    }
}
</pre>
</details>

### Route

-   #### Get Route Details

Endpoint for getting route details from `route_id`  
Returns route information with all the packages grouped by coordinates

```shell
GET /route/details?route_id=63c6b3dae80dbf8d9bfcbdac
```

<details>
<summary>Response</summary>
<pre>
{
    "message": "Route Details",
    "rider": {
        "_id": "63c717fee9c8bd67b877e46f",
        "name": "Emmett Gleason PhD",
        "phone": "+919255410947",
        "email": "Rodolfo_Keebler@yahoo.com",
        "createdAt": "2023-01-17T21:49:50.327Z",
        "updatedAt": "2023-01-17T21:49:50.327Z",
        "__v": 0
    },
    "route": [
        {
            "packages": [
                {
                    "deliver_to": {
                        "name": "Kathleen Thompson",
                        "phone_number": "53198547414"
                    },
                    "coordinates": {
                        "latitude": 12953949.8,
                        "longitude": 77641089,
                        "address": "181, 3rd Floor, Amar Jyothi Layout, Inner Ring Road, Domlur, Bangalore"
                    },
                    "dimensions": {
                        "length": 15.987374662787465,
                        "breadth": 17.14948421803188,
                        "height": 13.252371533755147,
                        "weight": 15.584148421808738
                    },
                    "_id": "63c717e7a71d72cff9eede15",
                    "image_url": "https://public-images-inter-iit.s3.ap-south-1.amazonaws.com/clock.jpeg",
                    "sku_id": "SKU_110",
                    "type": "DELIVERY",
                    "latest_status": "OUT_FOR_DELIVERY",
                    "createdAt": "2023-01-17T21:49:27.880Z",
                    "updatedAt": "2023-01-24T19:45:34.076Z",
                    "__v": 0
                }
            ],
            "coordinates": {
                "latitude": 12953949.8,
                "longitude": 77641089,
                "address": "181, 3rd Floor, Amar Jyothi Layout, Inner Ring Road, Domlur, Bangalore"
            }
        },
        {
            "packages": [
                {
                    "deliver_to": {
                        "name": "Anita Valdez",
                        "phone_number": "47015403024"
                    },
                    "coordinates": {
                        "latitude": 12937155.799999999,
                        "longitude": 77702337.4,
                        "address": "Panathur Main Road, Kadubeesanahalli, Marathahalli, Bangalore"
                    },
                    "dimensions": {
                        "length": 7.911365680114599,
                        "breadth": 24.44056408440035,
                        "height": 11.64451061529388,
                        "weight": 13.65208901333415
                    },
                    "_id": "63c717e7a71d72cff9eede17",
                    "image_url": "https://public-images-inter-iit.s3.ap-south-1.amazonaws.com/clock.jpeg",
                    "sku_id": "SKU_112",
                    "type": "DELIVERY",
                    "latest_status": "OUT_FOR_DELIVERY",
                    "createdAt": "2023-01-17T21:49:27.908Z",
                    "updatedAt": "2023-01-24T19:45:36.282Z",
                    "__v": 0
                }
            ],
            "coordinates": {
                "latitude": 12937155.799999999,
                "longitude": 77702337.4,
                "address": "Panathur Main Road, Kadubeesanahalli, Marathahalli, Bangalore"
            }
        }
    ],
    "warehouse": {
        "latitude": 12907009,
        "longitude": 77585678
    },
    "number_points": 2,
    "number_packages": 2
}
</pre>
</details>

-   #### Get Route List

Endpoint for getting route details without packages from `route_id` or `rider_id`  
Returns all routes **without** packages if nothing is passed in query

```shell
GET /route/list
GET /route/list?rider_id=63c717fee9c8bd67b877e46f
GET /route/list?route_id=63c6b3dae80dbf8d9bfcbdac
```

<details>
<summary>Response</summary>
<pre>
{
    "message": "Route list",
    "routes": [
        {
            "_id": "63c7180a6c7d9976115ba964",
            "createdAt": "2023-01-17T21:50:02.731Z",
            "updatedAt": "2023-01-17T21:50:02.731Z",
            "__v": 0,
            "bin_id": "63cb9692131c69c10ec491c2",
            "rider": {
                "_id": "63c717fee9c8bd67b877e46f",
                "name": "Emmett Gleason PhD",
                "phone": "+919255410947",
                "email": "Rodolfo_Keebler@yahoo.com",
                "createdAt": "2023-01-17T21:49:50.327Z",
                "updatedAt": "2023-01-17T21:49:50.327Z",
                "__v": 0
            },
            "number_points": 2,
            "number_packages": 2
        }
    ]
}
</pre>
</details>

-   #### Assign Rider to Route

Endpoint for updating rider associated with a particular route

```shell
PATCH /route/update_rider
```

<details>
<summary>Request Body</summary>
<pre>
{
    "route_id": "63c7180a6c7d9976115ba963",
    "rider_id": "63c717fee9c8bd67b877e46f"
}
</pre>
</details>

<details>
<summary>Response</summary>
<pre>
{
    "message": "Rider updated"
}
</pre>
</details>

### Status

-   #### Update Status

Endpoint for updating status associated with a particular package  
Status can take the following values: `IN_WAREHOUSE`, `IN_SCAN`, `TAMPER_CHECK`,`BIN_PACKING`, `ROUTE_ASSIGNMENT`, `DRIVER_ASSIGNMENT`, `OUT_FOR_DELIVERY`,`DELIVERED`, `PICKED`, `FAKE_ATTEMPT`,

### Fake Attempt Check

When a status of "DELIVERED or PICKED" is given, a check for fake attempt is done where the riders location and package's delivery position is used to calculate the distance, and if that is greater than 200m , then it is said to be a fake delivery attempt. For this, rider's location (which gets cached regularly from mobile's gps in redis) is fetched and haversine distance between package and riders coordinates is calculated. This distance being more than 200m means FAKE ATTEMPT

```shell
POST /status/update
```

<details>
<summary>Request Body</summary>
<pre>
{
    "status": "TAMPER_CHECK",
    "package_id": "63cac603a73ed4acc4d10362",
    "rider_id": "63c717fee9c8bd67b877e473"
}
</pre>
</details>

<details>
<summary>Response</summary>
<pre>
{
    "message": "Status Updated",
    "statusItem": {
        "status": "TAMPER_CHECK",
        "package_id": "63d506cbbff1f2fd6fe080f3",
        "_id": "63d7c999f560322dda51a594",
        "createdAt": "2023-01-30T13:43:53.783Z",
        "updatedAt": "2023-01-30T13:43:53.783Z",
        "__v": 0
    }
}
</pre>
</details>

### Utility

-   #### Get Error

Endpoint for getting error values associated with the packages with given `sku_id`

```shell
GET /util/error?sku_id=SKU_1
```

<details>
<summary>Response</summary>
<pre>
{
    "message": "Calculated Error",
    "error": {
        "length": {
            "avg": 19.740287596703435,
            "error": 33.73739688360961
        },
        "breadth": {
            "avg": 18.648893715154795,
            "error": 46.220518762136955
        },
        "height": {
            "avg": 10.834805951676751,
            "error": 35.30807662319844
        },
        "weight": {
            "avg": 13.38884462883113,
            "error": 33.89725997887264
        },
        "volume": {
            "avg": 4009.2117780446165,
            "error": 69.0239534261037
        }
    }
}
</pre>
</details>

-   #### Upload CSV Package List

Endpoint for populating the database using csv file containing package list.

```shell
POST /util/csv/package
```

### Service

-   #### Start Optimizer

Endpoint for starting the optimizer service. it sends a request to the rabbitmq channel which iniitiates a grpc call to the server asyncronously.

```shell
GET /service/start
```

-   #### Start Dynamic Pickup

Endpoint for adding a pickup package and starting the dynamic pickup service

```shell
POST /service/dynamic
```

<details>
<summary>Request Body</summary>
<pre>
{
    "awb_id": "DEF",
    "sku_id": "SKU_1",
    "pickup_from": {
        "name": "PQR",
        "phone_number": "9876543210"
    },
    "address": "1260, SY 35/4, SJR Tower's, 7th Phase, 24th Main, Puttanhalli, JP Nagar, Bangalore",
    "type":"PICKUP"
}
</pre>
</details>

<!--
To generate the .pb.go file for go using protoc from the root Directory:

```shell
protoc --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    proto/*.proto
```

## Running server

```
go get .
cd server
go run ./server.go
```

### Running Client

```
From root directory of project
go run .
```

## Current Structs of proto file:

#### 3D Bin Packing

```go
struct Box{
	length  float
	breadth float
	height  float
	id      int32
    weight  float
}

struct Position{
	x float
	y float
	z float
}

struct BinPackingRequest{
    Bin     Box
    Items   Box[]
}

struct BinPackingResponse{
    Items       Box[]
    Positions   Position[]
}
```

#### Route Planner

````go

struct Package{
    length	float
    breadth float
    height	float
    lat		float
    long	flaot
    id		int32
    wieght	float
}

struct Vehicle{
    weight		float
    volume		float
    vehicle_id	int32
}
struct CVRPRequest {
    vechicle_count	int32
    package_count	int32
    package         Package[]
    vehicle         Vehicle[]
}

struct Path{
    vehicle_id  int32
    box         int32[]
}

struct CVRPResponse{
    vehicle_count   int32
    paths           Path[]
}
``` -->

<!-- - awb_id - unique product  , sku_id - item
- length weight height breadth - errorenous

- pickup package: skuid ,
``` -->
