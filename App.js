const express = require("express");
const axios = require("axios");
const log = console.log;
const fs = require("fs");
const app = express();
const port = process.env.port || 3333;
var xml2js = require("xml2js");

app.get("/hello/:name?/:age?", (req, res) => {
  o = {};
  res.cookie("msg", "welcome");
  res.send({ params: req.params, hdr: req.headers, hn: req.hostname });
});

const getFrom = (x) => {
  const url = `https://www.homedepot.com/p/svcs/frontEndModel/${x.toString()}`;
  return axios
    .get(url)
    .then((res) => {
      const { itemId, storeSkus, media } = res.data.primaryItemData;
      // media.mediaList.filter(e => e.mediaType == "IMAGE" && e.height === 300);
      return {
        msg: "OK",
        itemId,
        pricing: storeSkus
          .filter((e) => e.storeId === "8119")
          .map((e) => e.pricing)
          .pop(),
        // storeSkus,
        media: media.mediaList
          .filter((e) => e.mediaType == "IMAGE" && e.height === "300")
          .pop(),
      };
    })
    .catch((e) => {
      return {
        msg: "ERR",
        errInfo: e.message,
        url,
        itemid: x,
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
    x1.map((e) =>
      getFrom(e)
        .then((r) => r)
        .catch((e) => e)
    )
  )
    .then((e) => res.send(e))
    .catch((e) => res.send(e));
});

app.get("/test", (req, res) => {
  const id = 1;
  const sitemap_pip = "https://www.homedepot.com/sitemap/d/pip_sitemap.xml";
  axios
    .get(sitemap_pip)
    .then((d) => d.data)
    .then((t) =>
      xml2js
        .parseStringPromise(t)
        .then((x) => x.sitemapindex.sitemap)
        .then((sitemaps) => sitemaps.map((x) => x.loc[0]))
        .then((detailId) => detailId)
        .catch(console.err)
    )
    .then((x) => x.map((e) => e.split("/").slice(-1)[0].split(".")[0]))
    .then((listDetails) =>
      listDetails.slice(100, 105).map((id, idx) => {
        setTimeout(() => {
          console.log(
            `starting... ${id} after ${
              idx * 500
            } - ${new Date().getMinutes()}:${new Date().getSeconds()}`
          );
          axios
            .get(`https://www.homedepot.com/sitemap/d/pip/${id}.xml`)
            .then((d) => d.data)
            .then((t) =>
              xml2js
                .parseStringPromise(t)
                .then((x) => x.urlset.url)
                .then((urlset) =>
                  urlset
                    // .slice(0, 4)
                    .map((x) => x.loc)
                    .map((x) => x[0])
                    .map((url) => url.split("/").slice(-2).join(","))
                )
                .then((csv) => csv.join("\n"))
                .then((csvdata) =>
                  fs.writeFile(`./data/thd-${id}.csv`, csvdata, (e) => {
                    // fs error
                    e
                      ? console.log(`${id} - error! - ${e.toString()}`)
                      : console.log(`${id} - done!`);
                  })
                )
                // xmljs error
                .catch(console.err)
            )
            // axios omsid error
            .catch(console.err);
        }, idx * 500);
      })
    )
    // axios error
    .catch(console.err);

  res.send({ msg: "crawler started.." });
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
  const ret = x1.map(async (e) => await getFrom(e));
  const out = await Promise.all(ret);
  res.send({ data: out });
});

app.listen(port, () => log(`App started on port ${port}`));
