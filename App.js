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
  const url = `https://www.homedepot.com/p/svcs/frontEndModel/${x.toString()}`;
  return axios
    .get(url)
    .then(res => {
      const { itemId, storeSkus, media } = res.data.primaryItemData;
      // media.mediaList.filter(e => e.mediaType == "IMAGE" && e.height === 300);
      return {
        msg: "OK",
        itemId,
        pricing: storeSkus
          .filter(e => e.storeId === "8119")
          .map(e => e.pricing)
          .pop(),
        // storeSkus,
        media: media.mediaList
          .filter(e => e.mediaType == "IMAGE" && e.height === "300")
          .pop()
      };
    })
    .catch(e => {
      return {
        msg: "ERR",
        errInfo: e.message,
        url,
        itemid: x
      };
    });
};

app.get("/getData/:itemid", (req, res) => {
  // Using the then and catch:
  // a list of promises are wrapped in Promise.all, this again returns a promise, so we then() and send the res
  // We also then inside map because axios is async
  const { itemid } = req.params;
  const { n } = req.query;
  const x1 = [];

  if (n) {
    log(n);
    const _ = parseInt(itemid);
    for (var i = 0; i < n; i++) {
      // log(i);
      x1.push(_ + i);
    }
  } else {
    x1.push(parseInt(itemid));
  }

  Promise.all(
    x1.map(e =>
      getFrom(e)
        .then(r => r)
        .catch(e => e)
    )
  )
    .then(e => res.send(e))
    .catch(e => res.send(e));
});

app.get("/asyncawait/:itemid", async (req, res) => {
  //  Using async and await:
  //  getFrom is a regular function, map does things syncly, but axios fetches things asyncly,
  //  so we async and await the function in map so we can get the async return data and pretened it is sync
  //  what you get is a list of promises, which needs to be resolved to get the actual data; we do this using Promise.all
  //   in doing this, we async the function in get route. note async before (req,res)
  const { itemid } = req.params;
  const x1 = [parseInt(itemid)];
  // x1.unshift(...x1);
  // x1.unshift(...x1);
  // x1.unshift(...x1);
  // x1.unshift(...x1);
  // x1.unshift(...x1);
  const ret = x1.map(async e => await getFrom(e));
  const out = await Promise.all(ret);
  res.send({ data: out });
});

app.listen(port, () => log(`App started on port ${port}`));
