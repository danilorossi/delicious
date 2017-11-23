## What is this?

This is the project built while following the [Learn Node](https://learnnode.com/) course from Wes Bos (still Work In Progress).

## Main features

This paragraph will be update with a detailed list of features.

The main ones are:

* Authentication (User register, lost password flow with email, user data management)
* Geolocation (Store gelocation with google)
* Persistence (MongoDB)

## Tech stack

This paragraph will be update with a detailed tech stack.

Main technologies are:

* NodeJS with Express, PUB (ex Jade) as the templating engine
* MongoDB for the persistence layer

## Sample Data

To load sample data, run the following command in your terminal:

```bash
npm run sample 
```

If you have previously loaded in this data, you can wipe your database 100% clean with:

```bash
npm run blowitallaway
```

That will populate 16 stores with 3 authors and 41 reviews. The logins for the authors are as follows:

|Name|Email (login)|Password|
|---|---|---|
|Wes Bos|wes@example.com|wes|
|Debbie Downer|debbie@example.com|debbie|
|Beau|beau@example.com|beau|


