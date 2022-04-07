# [DFONLINE](https://github.com/GeorgeRNG/dfonline) BACKEND

This has the backend code used by DFOnline. It also contains code for a bot, however it doesn't get hosted properly.

## API Endpoints
Every endpoint must start with /api/, since the server only takes requests from there.

### /save/
The save endpoint takes either a post or a get.  

#### Post
The request body is simple text with the data to be saved.  
The response is a JSON object:
```ts
{
    "id": string // the saved id
}
```  
or it will be
```ts
{
    "error": "Invalid data" // the only possible error.
}
```  

#### Get
The get just has `/{id}` added onto the end, where the response is a JSON object:  
```ts
{
    "id": string, // the id which you inputted
    "message": 'Success.' | 'No data found.' // A message about the request.
    "data": string // The data that was saved.
}
```

### /db/
The db endpoint takes a get request.  
It will return the actiondump as found [on the server](https://dfonline.dev/public/db.json).  
The file is fetched and stored when the server starts, so it should be available immediately.  
This exists because of cors, and I don't want to build it into the webapp.