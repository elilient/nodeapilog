# nodeapilog

To install the necessary dependencies:

### `npm install`

This project uses .env file to store SLACK_URL which is the slack webhook url.

In the project directory, you can run:

### `nodemon start`

It will run the app in http://localhost:3000

## Endpoints
POST `http://localhost:3000/callback`.
Sends data to mongodb and shows the payload in slack api.
#### Example payload:

` {   "title":"Title125",
    "message": {
        "id": "HktzGX8vH",
        "title": "EMÜ Majandustudengid II",  
        "description": "EMÜ Majandustudengid mäng",  
        "token": "oex-yswu-drs",  
        "ended": true
    }
} `

GET `http://localhost:3000/callback/`
Returns all entries from mongodb

### Pagination and filtering
GET `http://localhost:3000/callback/logs?page=1&limit=5&title=title66&created_at=2020-09-03`
Returns entries which match these filters
Viable query params are: page, limit, title, created_at

