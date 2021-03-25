// linkedom/jsdom
import puppeteer from "puppeteer";
import fs from "fs-extra";
import fg from "fast-glob";
import { minify as minHTML } from "html-minifier";

// import { Oath, Adios } from "/dist/adios.js"

const globalData = () => {
  const asIcon = (val) =>
    `https://cdn.jsdelivr.net/npm/heroicons@0.4.2/outline/${val}.svg`;
  const output = {};
  const ui = {
    icon: {
      bolt: asIcon("lightning-bolt"),
      dots: asIcon("dots-horizontal"),
      search: asIcon("search"),
      menu: asIcon("menu"),
      x: asIcon("x"),
      bell: asIcon("bell"),
      ticket: asIcon("ticket"),
      location: asIcon("location-marker"),
      icon: asIcon("icon"),
      mail: asIcon("mail"),
      phone: asIcon("phone"),
      plus: asIcon("plus"),
      chat: asIcon("chat-alt"),
      home: asIcon("home"),
      fire: asIcon("fire"),
      "user-group": asIcon("user-group"),
      "trending-up": asIcon("trending-up"),
    },
    myGroups: [
      { name: "Movies", href: "/g/Movies" },
      { name: "Food", href: "/g/Food" },
      { name: "Sports", href: "/g/Sports" },
      { name: "Animals", href: "/g/Animals" },
      { name: "Science", href: "/g/Science" },
      { name: "Dinosaurs", href: "/g/Dinosaurs" },
      { name: "Talents", href: "/g/Talents" },
      { name: "Gaming", href: "/g/Gaming" },
    ],
  };
  ui.nav = {
    home: { name: "Home", href: "/", icon: ui.icon["home"] },
    popular: { name: "Popular", href: "/popular", icon: ui.icon["fire"] },
    groups: {
      name: "Groups",
      href: "/groups",
      icon: ui.icon["user-group"],
    },
    trending: {
      name: "Trending",
      href: "/trending",
      icon: ui.icon["trending-up"],
    },
  };

  output.ui = ui;
  output.follow = [
    {
      image:
        "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&amp;ixid=eyJhcHBfaWQiOjEyMDd9&amp;auto=format&amp;fit=facearea&amp;facepad=2&amp;w=256&amp;h=256&amp;q=80",
      name: "Tyler Durden",
      email: "tyler@fight.club",
    },
    {
      image:
        "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&amp;ixid=eyJhcHBfaWQiOjEyMDd9&amp;auto=format&amp;fit=facearea&amp;facepad=2&amp;w=256&amp;h=256&amp;q=80",
      name: "Tyler Durden",
      email: "tyler@fight.club",
    },
    {
      image:
        "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&amp;ixid=eyJhcHBfaWQiOjEyMDd9&amp;auto=format&amp;fit=facearea&amp;facepad=2&amp;w=256&amp;h=256&amp;q=80",
      name: "Tyler Durden",
      email: "tyler@fight.club",
    },
  ];

  output.trending = [
    {
      image:
        "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&amp;ixid=eyJhcHBfaWQiOjEyMDd9&amp;auto=format&amp;fit=facearea&amp;facepad=2&amp;w=256&amp;h=256&amp;q=80",
      name: "Betty Rag",
      email: "betty@fight.club",
    },
    {
      image:
        "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&amp;ixid=eyJhcHBfaWQiOjEyMDd9&amp;auto=format&amp;fit=facearea&amp;facepad=2&amp;w=256&amp;h=256&amp;q=80",
      name: "Betty Rag",
      email: "betty@fight.club",
    },
    {
      image:
        "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&amp;ixid=eyJhcHBfaWQiOjEyMDd9&amp;auto=format&amp;fit=facearea&amp;facepad=2&amp;w=256&amp;h=256&amp;q=80",
      name: "Betty Rag",
      email: "betty@fight.club",
    },
  ];

  return output;
};

const options = {
  log: true,
  headless: true,
  root: "examples/",
  server: "http://127.0.0.1:5000/examples/base/",
  // fn: scripter,
  base: "base/",
  dist: "dist/",
  data: { at: "data", is: globalData() },
  minify: {
    minifyCSS: true,
    minfyJS: true,
    removeComments: true,
    collapseWhitespace: true,
    removeOptionalTags: true,
    removeRedundantAttributes: true,
  },
};

const hydrate = async ({ log, dist, base, root, minify, server, fn, data, headless }) => {
  //   init promises
  let browser = await puppeteer.launch({ dumpio: log, headless });
  let page = await browser.newPage();

  const paths = await fg("**/*.html", { cwd: root + base });

  const files = [];
  const runtime = async (page, paths) => {
    const path = paths.pop();

    // wait for page to load
    await page.goto(server + path, { waitUntil: "domcontentloaded" });
    // check if data needs to be inserted
    const dataClosure = (data) => {
      Object.assign(document.defaultView[data.at].is, data.is);
      return document.defaultView[data.at].be();
    };
    data && console.log(await page.evaluate(dataClosure, data));

    // check if fn needs to be run
    fn && console.log(await page.evaluate(fn));

    // wait for sg to load
    await page.waitForSelector('[data-each="sg.ok.events"]~li');

    // wait two frames for dom to fully shake out
    const twoTicks = async () =>
      await new Promise((ok) =>
        requestAnimationFrame(() => requestAnimationFrame(ok))
      );
    await page.evaluate(twoTicks);

    const content = await page.content();
    const mini = minify ? minHTML(content, minify) : content;
    files.push(fs.outputFile(root + dist + path, mini));
    // if there are more paths, scrape them
    return paths.length ? await runtime(page, paths) : 0;
  };

  await runtime(page, paths);
  await Promise.all(files);
  await browser.close();
  console.log("Done");
  return 0;
};

try {
  hydrate(options);
} catch (e) {
  console.log(e);
}
