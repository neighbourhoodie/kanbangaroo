# Kanbangaroo
## A real-time multi-user kanban board demo

## Prerequisites

```bash
npm i
```

You need a CouchDB running on your system. To install CouchDB on MacOS, grab an installer from [the official CouchDB page](https://couchdb.apache.org/#download), run it, and then start CouchDB.

There are also separate installation instructions for [Linux](http://docs.couchdb.org/en/stable/install/unix.html) and [Windows](http://docs.couchdb.org/en/stable/install/windows.html).

⚠️ Note that your local CouchDB must have CORS enabled. To do this:
1.  [open the database admin dashboard config page in your browser](http://127.0.0.1:5984/_utils/#_config), click on `CORS` in the submenu, and then on the `Enable CORS` button. 
2.  Add an origin domain that points to this Vite app, eg. `http://localhost:5173`

The code will expect a CouchDB database called `kanbangaroo`. After starting CouchDB, there’ll be a little couch icon in your menu bar, in it you’ll find `Open admin console`. Click that to open the database admin dashboard in your browser. Click `Create Database`, select `Non-partitioned`, and give it the name `kanbangaroo`. Alternatively, [open the CouchDB admin dashboard via this link](http://127.0.0.1:5984/_utils/#/_all_dbs) and then add the database.

Once you’ve created that database, put these three docs in there:

```json
{
  "_id": "column-01",
  "type": "column",
  "label": "Backlog",
  "position": 0
}

{
  "_id": "column-02",
  "type": "column",
  "label": "Todo",
  "position": 1
}

{
  "_id": "column-03",
  "type": "column",
  "label": "Done",
  "position": 2
}
```

The CouchDB access is set up in `/src/lib/Board.svelte`, and currently assumes you’ll be authenticating with the CouchDB. You can either set up your CouchDB admin user to match the credentials in the file (`admin:admin`), or add a user that can access the `kanbangaroo` database and add their credentials to `/src/lib/Board.svelte`. If this is your first time trying out CouchDB, the former approach is completely fine for testing in a local dev DB.

```bash
npm run dev
```

**Note:** we’re using the browser-native `crypto.randomUUID()` method to generate `_id`s for new documents. This API is only available in secure contexts (https) or on localhost, if you access it in a different manner, you won’t be able to create new cards. This will happen if you expose the dev instance to the local network via Vite’s `--host` argument, for example. If you want to avoid this, use something like [the uuid package](https://www.npmjs.com/package/uuid).

## Using PouchDB with Vite

To make PouchDB work in Vite, we’ve already made these additions:

```bash
npm i events
```

```js
// vite.config.ts
export default defineConfig({
  plugins: [svelte()],
  define: { global: "window" } // required for PouchDB
})
```

## Accompanying Blog posts

This repo accompanies a series of blog posts, and the state you’re looking at, tag `step-4`, belongs to the fourth one, [Resource Locking with CouchDB and Svelte](https://neighbourhood.ie/blog/2025/01/15/resource-locking-with-couchdb-and-svelte).

If you want to follow through the steps, each one is a tag you can check out. Step 1 is `git checkout step-1`, and the other steps just increment the number.
