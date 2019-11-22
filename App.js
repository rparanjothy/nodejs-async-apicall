const express = require("express");
const axios = require("axios");
const log = console.log;

const app = express();
const port = process.env.port || 3333;

app.get("/hello/:name?/:age?", (req, res) => {
  o = {};
  res.cookie("msg", "welcome");
  res.send({ params: req.params, hdr: req.headers, hn: req.hostname });
});

const getFrom = x => {
  url = `https://www.homedepot.com/p/svcs/frontEndModel/${x}`;
  return axios
    .get(url)
    .then(res => res.data)
    .catch(e => log(e));
};

app.get("/getData/:itemid", (req, res) => {
  //   Using the then and catch
  // a list of promises are wrapped in Promise.all, this again returns a promise, so we then() and send the res
  // We also then inside map because axios is async
  Promise.all([itemid, itemid].map(e => getFrom(e).then(r => r)))
    .then(e => res.send(e))
    .catch(e => res.send(e));
});

app.get("/asyncawait/:itemid", async (req, res) => {
  const { itemid } = req.params;
  //  Using async and await:
  //  getFrom is a regular function, map does things syncly, but axios fetches things asyncly,
  //  so we async and await the function in map so we can get the async return data and pretened it is sync
  //  what you get is a list of promises, which needs to be resolved to get the actual data; we do this using Promise.all
  //   in doing this, we async the function in get route. note async before (req,res)
  const ret = [itemid, itemid].map(async e => await getFrom(e));
  const out = await Promise.all(ret);
  res.send({ msg: out });
});

app.listen(port, () => log(`App started on port ${port}`));