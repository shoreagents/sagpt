import { OpenAI } from 'langchain/llms/openai';
import OpenAIChat from "openai";
import { Pinecone } from '@pinecone-database/pinecone';
import { marked } from 'marked';
import { loadQAStuffChain } from 'langchain/chains';
import { Document } from "langchain/document";
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import * as dotenv from 'dotenv';
import express, { query } from "express";
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import { Parser } from 'json2csv';
import Replicate from "replicate";

const router = express.Router()

import MethodOverrideOptions from 'method-override';
router.use(MethodOverrideOptions('_method'))

router.use(cookieParser());

dotenv.config();

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

var users = [];

function authenticateToken(req, res, next) {
  try {
    const usernameValue = req.body.username;
    var loggeduser = users.find(({ username }) => username === usernameValue);
    const jwtToken = loggeduser.tokenJWT;
    if (jwtToken === undefined) res.redirect('/');
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) return res.sendStatus(401)
    jwt.verify(token, jwtToken, (err, user) => {
      if (err) console.log(err);
      if (err) return res.sendStatus(403)
      req.user = user;
      next();
    })
  } catch (error) {
    console.log(error);
    res.redirect('/')
  }
}

function checkNotAuthenticated(req, res, next) {
  try {
    var loggeduser = users.find(({ username }) => username === req.cookies["username"]);
    const identifier = loggeduser.username;
    const password = loggeduser.password;
    const API_URL = "https://sagpt-data.onrender.com/api/auth/local";
    const requestOptions = {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "identifier": identifier,
        "password": password
      })
    }
    fetch(API_URL, requestOptions).then(res => res.json()).then(data => {
      if (data.error) {
        next();
      } else {
        res.redirect('/')
      }
    })
  } catch (error) {
    next();
  }
}

async function getData(name, userName) {
  var loggeduser = users.find(({ username }) => username === userName);
  const response = await fetch(`https://sagpt-data.onrender.com/api/${name}`, {
    method: "GET",
    headers: {
      'Authorization': `Bearer ${loggeduser.tokenJWT}`
    }
  }).catch((error) => {
    console.log(error);
  });
  const data = await response.json();
  var output;
  if (name == "users") {
    output = data;
  } else {
    output = data.data;
  }
  return output;
}

function logAction(userName, logaction) {
  var loggeduser = users.find(({ username }) => username === userName);
  fetch(`https://sagpt-data.onrender.com/api/logs`, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
      'Authorization': `Bearer ${loggeduser.tokenJWT}`
    },
    body: JSON.stringify({
      data: {
        logname: logaction,
        authorname: loggeduser.username
      }
    })
  }).then(res => res.json()).then(async (data) => {
    if (data.error) {
      console.log(data.error.message);
      const perspectives = await getData("perspectives", loggeduser.username);
      const tones = await getData("tones", loggeduser.username);
      const customerObjectives = await getData("customer-objectives", loggeduser.username);
      const targetMarkets = await getData("target-markets", loggeduser.username);
      const authors = await getData("users", loggeduser.username);
      res.render('index', { authors: authors, targetMarkets: targetMarkets, customerObjectives: customerObjectives, tones: tones, perspectives: perspectives, role: loggeduser.role, firstname: loggeduser.firstname, lastname: loggeduser.lastname, username: loggeduser.username, email: loggeduser.email, bio: loggeduser.bio, notice: "error", noticemsg: data.error.message });
    }
  }).catch((error) => {
    console.log(error)
    res.redirect('/login');
  })
}

function checkAuthenticated(req, res, next) {
  try {
    var loggeduser = users.find(({ username }) => username === req.cookies["username"]);
    if (req.cookies["tokenJWT"] == loggeduser.tokenJWT) {
      const identifier = loggeduser.username;
      const password = loggeduser.password;
      const API_URL = "https://sagpt-data.onrender.com/api/auth/local";
      const requestOptions = {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "identifier": identifier,
          "password": password
        })
      }
      fetch(API_URL, requestOptions).then(res => res.json()).then(data => {
        if (data.error) {
          console.log(data.error.message);
          res.render('login', { notice: "none", noticemsg: "none", errormsg: data.error.message });
        } else {
          const user = data.user;
          const accessToken = jwt.sign(user, data.jwt);
          loggeduser.tokenJWT = data.jwt;
          res.cookie('tokenJWT', data.jwt, { maxAge: 900000, httpOnly: true });
          res.cookie('username', data.user.username, { maxAge: 900000, httpOnly: true });
          var fullUrl = req.protocol + '://' + req.get('host') + "/";
          fetch(`${fullUrl}users`, {
            method: "POST",
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'accept': 'application/json',
            },
            body: JSON.stringify({
              "username": user.username
            })
          }).then(res => res.json()).then(data => {
            if (data.error) {
              console.log(data.error.message);
              res.render('login', { notice: "none", noticemsg: "none", errormsg: data.error.message });
            } else {
              req.user = data;
              next();
            }
          }).catch((error) => {
            console.log(error);
            res.redirect('/login');
          })
        }
      })
    } else {
      console.log("Login Validation Error");
      res.clearCookie('username');
      res.clearCookie('tokenJWT');
      res.redirect('/login');
    }
  } catch (error) {
    res.clearCookie('username');
    res.clearCookie('tokenJWT');
    res.redirect('/login');
  }
}

router.get('/login', checkNotAuthenticated, async (req, res) => {
  res.render('login', { notice: "none", noticemsg: "none", errormsg: "none" });
})

router.get('/', checkAuthenticated, async (req, res) => {
  var loggeduser = users.find(({ username }) => username === req.cookies["username"]);
  const perspectives = await getData("perspectives", loggeduser.username);
  const tones = await getData("tones", loggeduser.username);
  const customerObjectives = await getData("customer-objectives", loggeduser.username);
  const targetMarkets = await getData("target-markets", loggeduser.username);
  const authors = await getData("users", loggeduser.username);
  res.render('index', { authors: authors, targetMarkets: targetMarkets, customerObjectives: customerObjectives, tones: tones, perspectives: perspectives, role: loggeduser.role, firstname: req.user.firstname, lastname: req.user.lastname, username: req.user.username, email: req.user.email, bio: req.user.bio, notice: "none", noticemsg: "none" });
})

router.get('*', function (req, res) {
  res.status(404).render('404');
});

router.delete('/logout', (req, res) => {
  const userName = req.body.username;
  console.log("Logging out " + userName);
  console.log(userName + " logging out");
  logAction(userName, "User has logged out.");
  res.clearCookie('username');
  res.clearCookie('tokenJWT');
  users = users.filter(function (obj) {
    return obj.username !== userName;
  });
  res.redirect('/');
})

router.post('/users', authenticateToken, async (req, res) => {
  const output = req.user;
  return res.json(output);
})

router.post('/fine-tuned', async (req, res) => {
  const question = req.body.question;
  const openai = new OpenAIChat({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const response = await openai.completions.create({
    model: "ft:davinci-002:shoreagents:shoreagents:93ua3KOy",
    prompt: question + "\\n\\n",
    temperature: 0.7,
    max_tokens: 100,
    frequency_penalty: 0,
    presence_penalty: 0,
    stop: ["###"]
  });
  res.send(response);
})

router.post('/instagram-image', async (req, res) => {
  const prompt = req.body.prompt;
  var output;

  console.log(`GENERATE IMAGE FOR INSTAGRAM STARTED`);

  try {

      console.log(`Generating image using the generated prompt "${prompt}"`)

      const imageOutput = await replicate.run(
        `konieshadow/fooocus-api-realistic:${process.env.FOOOCUS_API}`,
        {
          input: {
            prompt: prompt,
            cn_type1: "ImagePrompt",
            cn_type2: "ImagePrompt",
            cn_type3: "ImagePrompt",
            cn_type4: "ImagePrompt",
            sharpness: 2,
            image_seed: 1062324901251685922,
            uov_method: "Disabled",
            image_number: 1,
            guidance_scale: 4,
            refiner_switch: 0.5,
            negative_prompt: "unrealistic, saturated, high contrast, big nose, painting, drawing, sketch, cartoon, anime, manga, render, CG, 3d, watermark, signature, label",
            style_selections: "Fooocus V2,Fooocus Photograph,Fooocus Negative, Fooocus Enhance, Fooocus Sharp",
            uov_upscale_value: 0,
            outpaint_selections: "",
            outpaint_distance_top: 0,
            performance_selection: "Quality",
            outpaint_distance_left: 0,
            aspect_ratios_selection: "1344*768",
            outpaint_distance_right: 0,
            outpaint_distance_bottom: 0,
            inpaint_additional_prompt: ""
          }
        }
      );

      output = imageOutput[0];
      console.log("Image Successfully Generated");
      console.log("IMAGE OUTPUT LINK: " + output);

  } catch (error) {
    console.log("An error has occured while generating the image.");
    console.log("ERROR MESSAGE: " + error);
    output = "An error has occured while generating the image.";
  }


  res.send({ output });
});

// router.post('/instagram-image', async (req, res) => {
//   const metaDescription = req.body.metaDescription;
//   var output;

//   console.log(`GENERATE IMAGE FOR INSTAGRAM STARTED`);

//   try {
//     const imagePrompt = `Using this content (${metaDescription}), you will create a good prompt for an image to be generated. Do not add any comments or any other unnecessary content. Use an Attractive Filipino female or male as the subject in and instagrammable style. Either in the BPO work place. Make sure to not include the Title itself (${metaDescription}), and remove any quotations ("").`;

//     const pinecone = new Pinecone({
//       apiKey: process.env.PINECONE_API_KEY,
//       environment: process.env.PINECONE_ENVIRONMENT
//     });
//     const index = pinecone.index('sagpt');
//     const queryEmbedding = await new OpenAIEmbeddings().embedQuery(imagePrompt);
//     const queryResponse = await index.query({
//       topK: 5,
//       vector: queryEmbedding,
//       includeMetadata: true,
//       includeValues: true
//     });

//     if (queryResponse.matches.length) {
//       const llm = new OpenAI({ temperature: 0.7, modelName: "gpt-4-1106-preview" });
//       const chain = loadQAStuffChain(llm);

//       const concatenatedPageContent = queryResponse.matches
//         .map((match) => match.metadata.text)
//         .join("\n\n");

//       console.log(`Generating prompt using the meta description "${metaDescription}"`)

//       const finalPrompt = await chain.call({
//         input_documents: [new Document({ pageContent: concatenatedPageContent })],
//         question: imagePrompt
//       });

//       console.log(`Generating image using the generated prompt "${finalPrompt.text}"`)

//       await fetch('https://2434-122-55-242-30.ngrok-free.app/v2/generation/image-prompt', {
//         method: "POST",
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           prompt: finalPrompt.text,
//           negative_prompt: "unrealistic, saturated, high contrast, big nose, painting, drawing, sketch, cartoon, anime, manga, render, CG, 3d, watermark, signature, label",
//           style_selections: [
//             "Fooocus V2",
//             "Fooocus Enhance",
//             "Fooocus Sharp"
//           ],
//           performance_selection: "Speed",
//           aspect_ratios_selection: "1344*768",
//           image_number: 1,
//           image_seed: 1062324901251685922,
//           sharpness: 2,
//           guidance_scale: 4,
//           base_model_name: "juggernautXL_version6Rundiffusion.safetensors",
//           refiner_model_name: "None",
//           refiner_switch: 0.5,
//           loras: [
//             {
//               "model_name": "sd_xl_offset_example-lora_1.0.safetensors",
//               "weight": 0.1
//             }
//           ],
//           advanced_params: {
//             adaptive_cfg: 7,
//             adm_scaler_end: 0.3,
//             adm_scaler_negative: 0.8,
//             adm_scaler_positive: 1.5,
//             canny_high_threshold: 128,
//             canny_low_threshold: 64,
//             controlnet_softness: 0.25,
//             debugging_cn_preprocessor: false,
//             debugging_inpaint_preprocessor: false,
//             disable_preview: false,
//             freeu_b1: 1.01,
//             freeu_b2: 1.02,
//             freeu_enabled: false,
//             freeu_s1: 0.99,
//             freeu_s2: 0.95,
//             inpaint_disable_initial_latent: false,
//             inpaint_engine: "v1",
//             inpaint_erode_or_dilate: 0,
//             inpaint_respective_field: 1,
//             inpaint_strength: 1,
//             invert_mask_checkbox: false,
//             mixing_image_prompt_and_inpaint: false,
//             mixing_image_prompt_and_vary_upscale: false,
//             overwrite_height: -1,
//             overwrite_step: -1,
//             overwrite_switch: -1,
//             overwrite_upscale_strength: -1,
//             overwrite_vary_strength: -1,
//             overwrite_width: -1,
//             refiner_swap_method: "joint",
//             sampler_name: "dpmpp_2m_sde_gpu",
//             scheduler_name: "karras",
//             skipping_cn_preprocessor: false
//           },
//           require_base64: false,
//           async_process: false,
//           webhook_url: "",
//           input_image: null,
//           input_mask: "",
//           inpaint_additional_prompt: "",
//           outpaint_selections: [],
//           outpaint_distance_left: -1,
//           outpaint_distance_right: -1,
//           outpaint_distance_top: -1,
//           outpaint_distance_bottom: -1,
//           image_prompts: [
//             {
//               "cn_img": "string",
//               "cn_stop": 0,
//               "cn_weight": 0,
//               "cn_type": "ImagePrompt"
//             },
//             {
//               cn_img: "string",
//               cn_stop: 0,
//               cn_weight: 0,
//               cn_type: "ImagePrompt"
//             }
//           ]
//         })
//       }).then(res => res.json()).then(async (data) => {
//         if (data.error) {
//           console.log(data.error.message);
//           output = "An error has occured while generating the image.";
//         } else {
//           output = data[0];
//           console.log("Image Successfully Generated");
//           console.log(data);
//         }
//       }).catch((error) => {
//         console.log("Catches Error:")
//         console.log(error);
//         output = "An error has occured while generating the image.";
//       })

//     }
//   } catch (error) {
//     console.log("An error has occured while generating the image.");
//     console.log("ERROR MESSAGE:");
//     console.log(error);
//     output = "An error has occured while generating the image.";
//   }

//   res.send({ output });
// });

router.post('/', async (req, res) => {
  const userAction = req.body.userAction;
  const userName = req.body.userName;
  if (userAction == "ChatAI") {
    const question = req.body.userinput;
    const tone = req.body.tone;
    const author = req.body.author;
    const target = req.body.target;
    const perspective = req.body.perspective;
    const customerObjective = req.body.customerObjective;

    var toneOutput = "";
    var authorOutput = "";
    var targetOutput = "";
    var perspectiveOutput = "";
    var customerObjectiveOutput = "";

    if (tone == "Select Tone/Personality") {
      var toneOutput = "";
    } else if (tone != "None") {
      toneOutput = `You are in ${tone} personality, so you will answer with the given subtones of that personality.`;
    }
    if (author == "Select Author") {
      var authorOutput = "";
    } else if (author != "None") {
      authorOutput = `The author is ${author}.`;
    }
    if (target == "Select Target Market") {
      var targetOutput = "";
    } else if (target != "None") {
      targetOutput = `Your Target Market/s will be ${target}.`;
    }
    if (perspective == "Select Perspective") {
      var perspectiveOutput = "";
    } else if (perspective != "None") {
      perspectiveOutput = `You will write in ${perspective} writing perspective.`;
    }
    if (customerObjective == "Select Customer Objective") {
      var customerObjectiveOutput = "";
    } else if (customerObjective != "None") {
      customerObjectiveOutput = `The selected Customer Objective is ${customerObjective}.`;
    }

    let output;
    try {
      var temp = await runWithEmbeddings(question, perspectiveOutput, toneOutput, targetOutput, authorOutput, customerObjectiveOutput);
      output = marked.parse(temp);
      logAction(userName, "User used AI Assistant.");
    } catch (error) {
      logAction(userName, "User attempted to use AI Assistant but failed.");
      output = "There is an error on our server. Sorry for inconvenience. Please try again later."
      console.log(error);
      console.log(output);
    }

    res.send({ output });

  } else if (userAction == "ArticleGenerator") {
    const title = req.body.articletitle;
    const heading = req.body.heading;
    const subheading = req.body.subheading;
    const tone = req.body.tone;
    const author = req.body.author;
    const target = req.body.target;
    const perspective = req.body.perspective;
    const customerObjective = req.body.customerObjective;
    const userName = req.body.userName;
    const site = req.body.site;
    var articlearray = {};
    articlearray.title = title;
    for (let i = 0; i < heading.length; i++) {
      var num = i + 1;
      var obj = new Object();
      obj.title = heading[i];
      if (subheading) {
        for (var j = 0; j < subheading.length; j++) {
          var num2 = j + 1;
          if (num == subheading[j].substring(0, 1)) {
            for (var k = 0; k < subheading.length; k++) {
              obj["subheadings" + num2] = subheading[j];
            }
          }
        }
      }
      articlearray["heading" + num] = obj;
    }

    var toneOutput = "";
    var authorOutput = "";
    var targetOutput = "";
    var perspectiveOutput = "";
    var customerObjectiveOutput = "";

    if (tone == "Select Tone/Personality") {
      var toneOutput = "";
    } else if (tone != "None") {
      toneOutput = `You are in ${tone} personality, so you will answer with the given subtones of that personality.`;
    }
    if (author == "Select Author") {
      var authorOutput = "";
    } else if (author != "None") {
      authorOutput = `The author is ${author}.`;
    }
    if (target == "Select Target Market") {
      var targetOutput = "";
    } else if (target != "None") {
      targetOutput = `Your Target Market/s will be ${target}.`;
    }
    if (perspective == "Select Perspective") {
      var perspectiveOutput = "";
    } else if (perspective != "None") {
      perspectiveOutput = `You will write in ${perspective} writing perspective.`;
    }
    if (customerObjective == "Select Customer Objective") {
      var customerObjectiveOutput = "";
    } else if (customerObjective != "None") {
      customerObjectiveOutput = `The selected Customer Objective is ${customerObjective}.`;
    }

    var output;
    const listquery = req.body.listquery;
    const articleTitle = articlearray.title;
    const articleKeyword = req.body.keyword;
    const generalQuery = req.body.generalQuery;
    var contentBody = `<h1>${articleTitle}</h1>`;

    var data = [];

    for (var i in articlearray) {
      if (i != "title") {
        data.push([i, articlearray[i]]);
      }
    }

    try {
      for (let i = 0; i < data.length; i++) {
        var articleHeading = data[i][1].title;
        var articleTopic = "Article Heading: " + articleHeading + "\n\nSubheadings:\n";
        var query = listquery[i];
        for (var key in data[i][1]) {
          data[i][1]['title'] && delete data[i][1]['title'];
          if (data[i][1].hasOwnProperty(key)) {
            var valuetemp = data[i][1][key];
            let value = valuetemp.substring(1);
            articleTopic += "\n" + value;
          }
        }
        const createArticle = await articleGenerator(generalQuery, articleTopic, query, articleTitle, articleKeyword, perspectiveOutput, toneOutput, targetOutput, authorOutput, customerObjectiveOutput, site);
        contentBody += `\n\n<h2>${articleHeading}</h2>\n${createArticle}`;
      }
      temp = contentBody.replace(/```html/g, '');
      const content = temp.replace(/```/g, '');
      const seoTitle = await seoTitleGenerator(articleKeyword);
      const metaDescription = await metaDescriptionGenerator(articleKeyword, content);
      const slug = articleKeyword.replace(/\s+/g, '-').toLowerCase();
      output = {
        content,
        seoTitle,
        metaDescription,
        slug
      }
      console.log(output);
      var wordCount = output.content.match(/(\w+)/g).length;
      console.log(wordCount);
      logAction(userName, "User successfully generated an article using Manual Article Generator.");
      res.send({ output });
    } catch (error) {
      logAction(userName, "User attempted to generate an article using Manual Article Generator but failed.");
      output = "There is an error on our server. Sorry for inconvenience. Please try again later.";
      console.log(output + " | " + error);
      res.send({ output });
    }
  } else if (userAction == "QueryArticleGenerator") {
    const keyword = req.body.keyword;
    const articleOverview = req.body.articleOverview;
    const tone = req.body.tone;
    const author = req.body.author;
    const target = req.body.target;
    const perspective = req.body.perspective;
    const customerObjective = req.body.customerObjective;
    const userName = req.body.userName;
    const site = req.body.site;
    console.log('---------------------------------------------------------------');
    console.log("This article is for " + site);

    var toneOutput = "";
    var authorOutput = "";
    var targetOutput = "";
    var perspectiveOutput = "";
    var customerObjectiveOutput = "";

    if (tone == "Select Tone/Personality") {
      var toneOutput = "";
    } else if (tone != "None") {
      toneOutput = `You are in ${tone} personality, so you will answer with the given subtones of that personality.`;
    }
    if (author == "Select Author") {
      var authorOutput = "";
    } else if (author != "None") {
      authorOutput = `The author is ${author}.`;
    }
    if (target == "Select Target Market") {
      var targetOutput = "";
    } else if (target != "None") {
      targetOutput = `Your Target Market/s will be ${target}.`;
    }
    if (perspective == "Select Perspective") {
      var perspectiveOutput = "";
    } else if (perspective != "None") {
      perspectiveOutput = `You will write in ${perspective} writing perspective.`;
    }
    if (customerObjective == "Select Customer Objective") {
      var customerObjectiveOutput = "";
    } else if (customerObjective != "None") {
      customerObjectiveOutput = `The selected Customer Objective is ${customerObjective}.`;
    }

    try {
      var title;
      var output;
      var temp;
      const createTitle = await titleGenerator(keyword, perspectiveOutput, toneOutput, targetOutput, customerObjectiveOutput);
      var titleTemp = createTitle.replace(/['"]+/g, '')
      title = titleTemp;
      console.log("Article Title: " + title);
      var createArticle;
      var wordCount;
      var num = wordCount - 500;
      console.log(wordCount);

      for (let i = 0; i < 20; i++) {
        if (createArticle == null) {
          wordCount = 0;
        } else {
          wordCount = createArticle.match(/(\w+)/g).length;
        }
        var num = wordCount - 500;
        console.log(wordCount);
        if (num < 1500) {
          if (typeof createArticle === 'undefined') {
            createArticle = "\n";
          }
          createArticle += "\n\n" + await addHeadingContent(wordCount, createArticle, articleOverview, title, keyword, perspectiveOutput, toneOutput, targetOutput, authorOutput, customerObjectiveOutput, site);
        } else {
          createArticle += "\n\n" + await generateConclusion(createArticle, articleOverview, title, keyword, perspectiveOutput, toneOutput, targetOutput, authorOutput, customerObjectiveOutput, site);
          break;
        }
      }

      const tempcontent = "<h1>" + title + "</h1>" + "\n" + createArticle;
      temp = tempcontent.replace(/```html/g, '');
      const content = temp.replace(/```/g, '');
      const seoTitle = await seoTitleGenerator(keyword);
      const metaDescription = await metaDescriptionGenerator(keyword, content);
      const slug = keyword.replace(/\s+/g, '-').toLowerCase();

      // var createArticle = await bulkArticleGenerator(generalQuery, articleTitle, articleKeyword, perspectiveOutput, toneOutput, targetOutput, authorOutput,customerObjectiveOutput);
      console.log("/////////////////////////////////////////////////////////////////////////////////");
      console.log("//////////////////////////////////// OUTPUT /////////////////////////////////////");
      console.log("/////////////////////////////////////////////////////////////////////////////////");


      output = {
        content,
        seoTitle,
        metaDescription,
        slug
      }

      console.log(output);
      // var wordCount = output.match(/(\w+)/g).length;
      // console.log(wordCount);
      logAction(userName, "User successfully generated an article using Instructive Article Generator.");
      res.send({ output });
    } catch (error) {
      logAction(userName, "User attempted to generate an article using Instructive Article Generator but failed.");
      output = "There is an error on our server. Sorry for inconvenience. Please try again later.";
      console.log(bulkdata + " | " + error);
      res.send({ output });
    }
  } else if (userAction == "IntegromatArticleGenerator") {
    const keyword = req.body.keyword;
    const articleOverview = req.body.articleOverview;
    const tone = req.body.tone;
    const author = req.body.author;
    const target = req.body.target;
    const perspective = req.body.perspective;
    const customerObjective = req.body.customerObjective;
    const site = "Company Site"

    var toneOutput = "";
    var authorOutput = "";
    var targetOutput = "";
    var perspectiveOutput = "";
    var customerObjectiveOutput = "";

    if (tone == "Select Tone/Personality") {
      var toneOutput = "";
    } else if (tone != "None") {
      toneOutput = `You are in ${tone} personality, so you will answer with the given subtones of that personality.`;
    }
    if (author == "Select Author") {
      var authorOutput = "";
    } else if (author != "None") {
      authorOutput = `The author is ${author}.`;
    }
    if (target == "Select Target Market") {
      var targetOutput = "";
    } else if (target != "None") {
      targetOutput = `Your Target Market/s will be ${target}.`;
    }
    if (perspective == "Select Perspective") {
      var perspectiveOutput = "";
    } else if (perspective != "None") {
      perspectiveOutput = `You will write in ${perspective} writing perspective.`;
    }
    if (customerObjective == "Select Customer Objective") {
      var customerObjectiveOutput = "";
    } else if (customerObjective != "None") {
      customerObjectiveOutput = `The selected Customer Objective is ${customerObjective}.`;
    }

    try {
      var title;
      var output;
      var temp;
      const createTitle = await titleGenerator(keyword, perspectiveOutput, toneOutput, targetOutput, customerObjectiveOutput);
      var titleTemp = createTitle.replace(/['"]+/g, '')
      title = titleTemp;
      console.log("Article Title: " + title);
      var createArticle;
      var wordCount;
      var num = wordCount - 500;
      console.log(wordCount);
      var headings = [];
      var imageLinks = [];

      console.log('---------------------------------------------------------------');
      console.log("This article is for " + site);

      for (let i = 0; i < 20; i++) {
        if (createArticle == null) {
          wordCount = 0;
        } else {
          wordCount = createArticle.match(/(\w+)/g).length;
        }
        var num = wordCount - 500;
        console.log(wordCount);
        if (num < 1000) {
          if (typeof createArticle === 'undefined') {
            createArticle = "\n";
          }
          createArticle += "\n\n" + await addHeadingContent(wordCount, createArticle, articleOverview, title, keyword, perspectiveOutput, toneOutput, targetOutput, authorOutput, customerObjectiveOutput, site);
          const articleHeading = await getArticleHeading(headings, createArticle);
          headings.push(articleHeading);
          console.log(headings);
          const imageLink = await generateHeadingImage(headings, i);
          console.log(imageLink);
          imageLinks.push(imageLink);
        } else {
          createArticle += "\n\n" + await generateConclusion(createArticle, articleOverview, title, keyword, perspectiveOutput, toneOutput, targetOutput, authorOutput, customerObjectiveOutput);
          const articleHeading = await getArticleHeading(headings, createArticle);
          headings.push(articleHeading);
          console.log(headings);
          const imageLink = await generateHeadingImage(headings, i);
          console.log(imageLink);
          imageLinks.push(imageLink);
          break;
        }
      }

      const tempcontent = createArticle;
      temp = tempcontent.replace(/```html/g, '');
      const content = temp.replace(/```/g, '');
      const seoTitle = await seoTitleGenerator(keyword);
      const metaDescription = await metaDescriptionGenerator(keyword, content);
      const slug = keyword.replace(/\s+/g, '-').toLowerCase();
      const articleTitle = title;
      console.log("/////////////////////////////////////////////////////////////////////////////////");
      console.log("//////////////////////////////////// OUTPUT /////////////////////////////////////");
      console.log("/////////////////////////////////////////////////////////////////////////////////");

      const articleImages = imageLinks.reduce((acc, cur) => ({ ...acc, [cur.imageKey]: cur.imageLink }), {})

      output = {
        content,
        seoTitle,
        articleTitle,
        metaDescription,
        articleImages,
        slug
      }

      console.log(output);
      // var wordCount = output.match(/(\w+)/g).length;
      // console.log(wordCount);
      res.send({ output });
    } catch (error) {
      output = "There is an error on our server. Sorry for inconvenience. Please try again later.";
      console.log(bulkdata + " | " + error);
      res.send({ output });
    }
  } else if (userAction == "IntegromatCareersArticleGenerator") {
    const keyword = req.body.keyword;
    const articleOverview = req.body.articleOverview;
    const tone = req.body.tone;
    const author = req.body.author;
    const target = req.body.target;
    const perspective = req.body.perspective;
    const customerObjective = req.body.customerObjective;
    const site = "Careers Site";

    var toneOutput = "";
    var authorOutput = "";
    var targetOutput = "";
    var perspectiveOutput = "";
    var customerObjectiveOutput = "";

    if (tone == "Select Tone/Personality") {
      var toneOutput = "";
    } else if (tone != "None") {
      toneOutput = `You are in ${tone} personality, so you will answer with the given subtones of that personality.`;
    }
    if (author == "Select Author") {
      var authorOutput = "";
    } else if (author != "None") {
      authorOutput = `The author is ${author}.`;
    }
    if (target == "Select Target Market") {
      var targetOutput = "";
    } else if (target != "None") {
      targetOutput = `Your Target Market/s will be ${target}.`;
    }
    if (perspective == "Select Perspective") {
      var perspectiveOutput = "";
    } else if (perspective != "None") {
      perspectiveOutput = `You will write in ${perspective} writing perspective.`;
    }
    if (customerObjective == "Select Customer Objective") {
      var customerObjectiveOutput = "";
    } else if (customerObjective != "None") {
      customerObjectiveOutput = `The selected Customer Objective is ${customerObjective}.`;
    }

    try {
      var title;
      var output;
      var temp;
      const createTitle = await titleGenerator(keyword, perspectiveOutput, toneOutput, targetOutput, customerObjectiveOutput);
      var titleTemp = createTitle.replace(/['"]+/g, '')
      title = titleTemp;
      console.log("Article Title: " + title);
      var createArticle;
      var wordCount;
      var num = wordCount - 500;
      console.log(wordCount);
      var headings = [];
      // var imageLinks = [];
      console.log('---------------------------------------------------------------');
      console.log("This article is for " + site);
      for (let i = 0; i < 20; i++) {
        if (createArticle == null) {
          wordCount = 0;
        } else {
          wordCount = createArticle.match(/(\w+)/g).length;
        }
        var num = wordCount - 500;
        console.log(wordCount);
        if (num < 1000) {
          if (typeof createArticle === 'undefined') {
            createArticle = "\n";
          }
          createArticle += "\n\n" + await addHeadingContent(wordCount, createArticle, articleOverview, title, keyword, perspectiveOutput, toneOutput, targetOutput, authorOutput, customerObjectiveOutput, site);
          const articleHeading = await getArticleHeading(headings, createArticle);
          headings.push(articleHeading);
          console.log(headings);
          // const imageLink = await generateHeadingImage(headings, i);
          // console.log(imageLink);
          // imageLinks.push(imageLink);
        } else {
          createArticle += "\n\n" + await generateConclusion(createArticle, articleOverview, title, keyword, perspectiveOutput, toneOutput, targetOutput, authorOutput, customerObjectiveOutput);
          const articleHeading = await getArticleHeading(headings, createArticle);
          headings.push(articleHeading);
          console.log(headings);
          // const imageLink = await generateHeadingImage(headings, i);
          // console.log(imageLink);
          // imageLinks.push(imageLink);
          break;
        }
      }

      const tempcontent = createArticle;
      temp = tempcontent.replace(/```html/g, '');
      const content = temp.replace(/```/g, '');
      const seoTitle = await seoTitleGenerator(keyword);
      const metaDescription = await metaDescriptionGenerator(keyword, content);
      const slug = keyword.replace(/\s+/g, '-').toLowerCase();
      const articleTitle = title;
      console.log("/////////////////////////////////////////////////////////////////////////////////");
      console.log("//////////////////////////////////// OUTPUT /////////////////////////////////////");
      console.log("/////////////////////////////////////////////////////////////////////////////////");

      // const articleImages = imageLinks.reduce((acc, cur) => ({ ...acc, [cur.imageKey]: cur.imageLink }), {})

      output = {
        content,
        seoTitle,
        articleTitle,
        metaDescription,
        // articleImages,
        slug
      }

      console.log(output);
      // var wordCount = output.match(/(\w+)/g).length;
      // console.log(wordCount);
      res.send({ output });
    } catch (error) {
      output = "There is an error on our server. Sorry for inconvenience. Please try again later.";
      console.log(bulkdata + " | " + error);
      res.send({ output });
    }
  } else if (userAction == "BulkArticleGenerator") {
    const focuskeyword1 = req.body.focuskeyword1;
    const focuskeyword2 = req.body.focuskeyword2;
    const focuskeyword3 = req.body.focuskeyword3;
    const focuskeyword4 = req.body.focuskeyword4;
    const focuskeyword5 = req.body.focuskeyword5;
    const focuskeyword6 = req.body.focuskeyword6;
    const focuskeyword7 = req.body.focuskeyword7;
    const focuskeyword8 = req.body.focuskeyword8;
    const focuskeyword9 = req.body.focuskeyword9;
    const focuskeyword10 = req.body.focuskeyword10;
    const tone = req.body.tone;
    const author = req.body.author;
    const target = req.body.target;
    const perspective = req.body.perspective;
    const customerObjective = req.body.customerObjective;
    const generalQuery = req.body.generalQuery;

    // console.log(focuskeyword1,focuskeyword2,focuskeyword3, focuskeyword4,focuskeyword5,focuskeyword6,focuskeyword7,focuskeyword8,focuskeyword9,focuskeyword10);
    // console.log(tone,author,target,perspective,customerObjective);

    var keyword = [];
    var title = [];
    keyword.push(focuskeyword1);
    keyword.push(focuskeyword2);
    keyword.push(focuskeyword3);
    keyword.push(focuskeyword4);
    keyword.push(focuskeyword5);
    keyword.push(focuskeyword6);
    keyword.push(focuskeyword7);
    keyword.push(focuskeyword8);
    keyword.push(focuskeyword9);
    keyword.push(focuskeyword10);

    var toneOutput = "";
    var authorOutput = "";
    var targetOutput = "";
    var perspectiveOutput = "";
    var customerObjectiveOutput = "";

    if (tone == "Select Tone/Personality") {
      var toneOutput = "";
    } else if (tone != "None") {
      toneOutput = `You are in ${tone} personality, so you will answer with the given subtones of that personality.`;
    }
    if (author == "Select Author") {
      var authorOutput = "";
    } else if (author != "None") {
      authorOutput = `The author is ${author}.`;
    }
    if (target == "Select Target Market") {
      var targetOutput = "";
    } else if (target != "None") {
      targetOutput = `Your Target Market/s will be ${target}.`;
    }
    if (perspective == "Select Perspective") {
      var perspectiveOutput = "";
    } else if (perspective != "None") {
      perspectiveOutput = `You will write in ${perspective} writing perspective.`;
    }
    if (customerObjective == "Select Customer Objective") {
      var customerObjectiveOutput = "";
    } else if (customerObjective != "None") {
      customerObjectiveOutput = `The selected Customer Objective is ${customerObjective}.`;
    }

    var bulkdata = [];

    try {
      //keyword.length
      for (let i = 0; i < 1; i++) {
        var focuskeyword = keyword[i]
        const createTitle = await titleGenerator(focuskeyword, perspectiveOutput, toneOutput, targetOutput, customerObjectiveOutput);
        var titleTemp = createTitle.replace(/['"]+/g, '')
        title.push(titleTemp);
      }
      //title.length
      var heading = [];
      for (let i = 0; i < 1; i++) {
        var articleKeyword = keyword[i];
        var articleTitle = title[i];
        var createArticle;
        var wordCount;
        for (let j = 0; j < 20; j++) {
          if (createArticle == null) {
            wordCount = 0;
          } else {
            wordCount = createArticle.match(/(\w+)/g).length;
          }
          var num = wordCount - 500;
          console.log(wordCount);
          if (num < 1500) {
            createArticle += "\n\n" + await addHeadingContent(generalQuery, articleTitle, articleKeyword, perspectiveOutput, toneOutput, targetOutput, authorOutput, customerObjectiveOutput);
          } else {
            createArticle += "\n\n" + await generateConclusion(generalQuery, articleTitle, articleKeyword, perspectiveOutput, toneOutput, targetOutput, authorOutput, customerObjectiveOutput);
            break;
          }
        }
        // var createArticle = await bulkArticleGenerator(generalQuery, articleTitle, articleKeyword, perspectiveOutput, toneOutput, targetOutput, authorOutput,customerObjectiveOutput);
        bulkdata.push([i, title[i], createArticle]);
      }
      console.log(bulkdata);
      // var wordCount = output.match(/(\w+)/g).length;
      // console.log(wordCount);
      res.send({ bulkdata });
    } catch (error) {
      output = "There is an error on our server. Sorry for inconvenience. Please try again later.";
      console.log(bulkdata + " | " + error);
      res.send({ bulkdata });
    }

  } else if (userAction == "GenerateKeywords") {
    var keywords = [];
    try {
      for (let i = 0; i < 10; i++) {
        var stringKeywords = keywords.toString();
        var generatedKeyword = await generateKeywords(stringKeywords);
        console.log(generatedKeyword);
        keywords.push(generatedKeyword);
      }
      console.log(keywords);
      res.send({ keywords });
    } catch (error) {
      keywords = "There is an error on our server. Sorry for inconvenience. Please try again later.";
      console.log(error);
      res.send({ keywords });
    }

  } else if (userAction == "LoginGPT") {
    const identifier = req.body.identifier;
    const password = req.body.password;
    var accessToken;
    try {
      const API_URL = "https://sagpt-data.onrender.com/api/auth/local";
      const requestOptions = {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "identifier": identifier,
          "password": password
        })
      }
      await fetch(API_URL, requestOptions).then(res => res.json()).then(data => {
        if (data.error) {
          console.log(data.error.message);
          res.render('login', { notice: "none", noticemsg: "none", errormsg: data.error.message });
        } else {
          var user = data.user;
          user.password = password;
          user.tokenJWT = data.jwt;
          accessToken = jwt.sign(user, data.jwt)
          fetch("https://sagpt-data.onrender.com/api/users/me?populate=role", {
            method: "GET",
            headers: {
              'Authorization': `Bearer ${data.jwt}`
            }
          }).then(res => res.json()).then(data => {
            if (data.error) {
              console.log(data.error.message);
            } else {
              const role = data.role.name;
              user.role = role;
              if (users.some(e => e.username === identifier)) {
                const index = users.findIndex(obj => { return obj.username === identifier });
                users[index].tokenJWT = user.tokenJWT;
                console.log(identifier + " re-logging in due to expired cookie");
              }
              else {
                users.push(user);
              }
              res.cookie('tokenJWT', user.tokenJWT, { maxAge: 900000, httpOnly: true });
              res.cookie('username', data.username, { maxAge: 900000, httpOnly: true });
              var fullUrl = req.protocol + '://' + req.get('host') + "/";
              fetch(`${fullUrl}users`, {
                method: "POST",
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                  'accept': 'application/json',
                },
                body: JSON.stringify({
                  "username": data.username
                })
              }).then(res => res.json()).then(async (data) => {
                if (data.error) {
                  console.log(data.error.message);
                  res.render('login', { notice: "none", noticemsg: "none", errormsg: data.error.message });
                } else {
                  console.log(data.username + " logged in");
                  logAction(data.username, "User has logged in.");
                  const perspectives = await getData("perspectives", data.username);
                  const tones = await getData("tones", data.username);
                  const customerObjectives = await getData("customer-objectives", data.username);
                  const targetMarkets = await getData("target-markets", data.username);
                  const authors = await getData("users", data.username);
                  res.render('index', { authors: authors, targetMarkets: targetMarkets, customerObjectives: customerObjectives, tones: tones, perspectives: perspectives, role: role, firstname: data.firstname, lastname: data.lastname, username: data.username, email: data.email, bio: data.bio, notice: "none", noticemsg: "none" });
                }
              }).catch((error) => {
                console.log("Catches Error:" + error);
                res.render('login', { notice: "error", noticemsg: "Oops! An error has occured, please try to refresh the page and try again.", errormsg: "none" });
              })
            }
          })
        }
      }).catch((error) => {
        console.log(error);
      })
    } catch (error) {
      console.log(error);
    }
  } else if (userAction == "ChangePassword") {
    try {
      var loggeduser = users.find(({ username }) => username === req.cookies["username"]);
      const identifier = loggeduser.username;
      const password = loggeduser.password;
      const currentPassword = req.body.password;
      const newPassword = req.body.newpassword;
      const confirmPassword = req.body.confirmpassword;
      const API_URL = "https://sagpt-data.onrender.com/api/auth/local";
      const requestOptions = {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "identifier": identifier,
          "password": password
        })
      }
      fetch(API_URL, requestOptions).then(res => res.json()).then(data => {
        if (data.error) {
          console.log(data.error.message);
          res.render('login', { notice: "none", noticemsg: "none", errormsg: data.error.message });
        } else {
          const user = data.user;
          loggeduser.tokenJWT = data.jwt;
          res.cookie('tokenJWT', data.jwt, { maxAge: 900000, httpOnly: true });
          res.cookie('username', data.user.username, { maxAge: 900000, httpOnly: true });
          fetch("https://sagpt-data.onrender.com/api/auth/change-password", {
            method: "POST",
            headers: {
              'Content-Type': 'application/json',
              'accept': 'application/json',
              'Authorization': `Bearer ${data.jwt}`
            },
            body: JSON.stringify({
              currentPassword: currentPassword,
              password: newPassword,
              passwordConfirmation: confirmPassword
            })
          }).then(res => res.json()).then(async (data) => {
            if (data.error) {
              console.log(data.error.message);
              const perspectives = await getData("perspectives", loggeduser.username);
              const tones = await getData("tones", loggeduser.username);
              const customerObjectives = await getData("customer-objectives", loggeduser.username);
              const targetMarkets = await getData("target-markets", loggeduser.username);
              const authors = await getData("users", loggeduser.username);
              res.render('index', { authors: authors, targetMarkets: targetMarkets, customerObjectives: customerObjectives, tones: tones, perspectives: perspectives, role: loggeduser.role, firstname: user.firstname, lastname: user.lastname, username: user.username, email: user.email, bio: user.bio, notice: "error", noticemsg: data.error.message });
            } else {
              console.log("Password successfully changed.");
              logAction(loggeduser.username, "User has changed their password.");
              users = users.filter(function (obj) {
                return obj.username !== loggeduser.username;
              });
              res.render('login', { notice: "success", noticemsg: "Password successfully changed. Please login again", errormsg: "none" });
            }
          })
        }
      })
    } catch (error) {
      console.log(error);
      res.redirect('/')
    }
  } else if (userAction == "UpdateProfile") {
    try {
      var loggeduser = users.find(({ username }) => username === req.cookies["username"]);
      const identifier = loggeduser.username;
      const password = loggeduser.password;
      const firstname = req.body.firstname;
      const lastname = req.body.lastname;
      const bio = req.body.bio;
      const API_URL = "https://sagpt-data.onrender.com/api/auth/local";
      const requestOptions = {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "identifier": identifier,
          "password": password
        })
      }
      fetch(API_URL, requestOptions).then(res => res.json()).then(data => {
        if (data.error) {
          console.log(data.error.message);
          res.render('login', { notice: "none", noticemsg: "none", errormsg: data.error.message });
        } else {
          const user = data.user;
          loggeduser.tokenJWT = data.jwt;
          res.cookie('tokenJWT', data.jwt, { maxAge: 900000, httpOnly: true });
          res.cookie('username', data.user.username, { maxAge: 900000, httpOnly: true });
          fetch(`https://sagpt-data.onrender.com/api/users/${user.id}`, {
            method: "PUT",
            headers: {
              'Content-Type': 'application/json',
              'accept': 'application/json',
              'Authorization': `Bearer ${data.jwt}`
            },
            body: JSON.stringify({
              firstname: firstname,
              lastname: lastname,
              bio: bio
            })
          }).then(res => res.json()).then(async (data) => {
            if (data.error) {
              console.log(data.error.message);
              const perspectives = await getData("perspectives", loggeduser.username);
              const tones = await getData("tones", loggeduser.username);
              const customerObjectives = await getData("customer-objectives", loggeduser.username);
              const targetMarkets = await getData("target-markets", loggeduser.username);
              const authors = await getData("users", loggeduser.username);
              res.render('index', { authors: authors, targetMarkets: targetMarkets, customerObjectives: customerObjectives, tones: tones, perspectives: perspectives, role: loggeduser.role, firstname: user.firstname, lastname: user.lastname, username: user.username, email: user.email, bio: user.bio, notice: "error", noticemsg: data.error.message });
            } else {
              console.log("User Profile successfully updated.");
              logAction(loggeduser.username, "User has updated their profile.");
              res.redirect('/');
            }
          })
        }
      })
    } catch (error) {
      console.log(error);
      res.redirect('/')
    }
  } else if (userAction == "DownloadLogs") {
    try {
      var loggeduser = users.find(({ username }) => username === req.cookies["username"]);
      const identifier = loggeduser.username;
      const password = req.body.password;
      const API_URL = "https://sagpt-data.onrender.com/api/auth/local";
      const requestOptions = {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "identifier": identifier,
          "password": password
        })
      }
      fetch(API_URL, requestOptions).then(res => res.json()).then(async (data) => {
        var loggeduser = users.find(({ username }) => username === req.cookies["username"]);
        if (data.error) {
          console.log(data.error.message);
          const perspectives = await getData("perspectives", loggeduser.username);
          const tones = await getData("tones", loggeduser.username);
          const customerObjectives = await getData("customer-objectives", loggeduser.username);
          const targetMarkets = await getData("target-markets", loggeduser.username);
          const authors = await getData("users", loggeduser.username);
          res.render('index', { authors: authors, targetMarkets: targetMarkets, customerObjectives: customerObjectives, tones: tones, perspectives: perspectives, role: loggeduser.role, firstname: loggeduser.firstname, lastname: loggeduser.lastname, username: loggeduser.username, email: loggeduser.email, bio: loggeduser.bio, notice: "error", noticemsg: data.error.message });
        } else {
          const user = data.user;
          loggeduser.tokenJWT = data.jwt;
          fetch(`https://sagpt-data.onrender.com/api/logs`, {
            method: "GET",
            headers: {
              'Authorization': `Bearer ${loggeduser.tokenJWT}`
            }
          }).then(res => res.json()).then(async (response) => {
            if (response.error) {
              console.log(response.error.message);
              const perspectives = await getData("perspectives", loggeduser.username);
              const tones = await getData("tones", loggeduser.username);
              const customerObjectives = await getData("customer-objectives", loggeduser.username);
              const targetMarkets = await getData("target-markets", loggeduser.username);
              const authors = await getData("users", loggeduser.username);
              res.render('index', { authors: authors, targetMarkets: targetMarkets, customerObjectives: customerObjectives, tones: tones, perspectives: perspectives, role: loggeduser.role, firstname: user.firstname, lastname: user.lastname, username: user.username, email: user.email, bio: user.bio, notice: "error", noticemsg: data.error.message });
            } else {
              const parser = new Parser();
              const data = response.data;
              var newdata = []
              for (let i = 0; i < data.length; i++) {
                var obj = new Object();
                obj.id = data[i].id;
                obj.logname = data[i].attributes.logname;
                obj.authorname = data[i].attributes.authorname;
                obj.createdAt = data[i].attributes.createdAt;
                obj.updatedAt = data[i].attributes.updatedAt;
                obj.publishedAt = data[i].attributes.publishedAt;
                newdata.push(obj);
              }
              const csv = parser.parse(newdata);
              console.log("Data successfully exported");
              logAction(user.username, "User exported the logs data.");
              fs.writeFileSync('SAGPT-Logs.csv', csv);
              res.download('./SAGPT-Logs.csv');
            }
          }).then(function () {
            setTimeout(function () { fs.unlinkSync('./SAGPT-Logs.csv'); }, 1000);
          }).catch((error) => {
            console.log(error);
            res.redirect('/');
          })
        }
      })
    } catch (error) {
      console.log(error);
      res.redirect('/');
    }
  }
})

export const getArticleHeading = async (headings, article) => {
  console.log("Getting article headings");
  var prompt;
  var output;
  if (headings === undefined || headings.length == 0) {
    prompt = `Your task is only to get the H2 Heading Title in this given article ${article}. Get the title only, do not add any comments, and it should not be a sentence or the whole heading content.`;
  } else {
    prompt = `Your task is only to get one of the H2 Heading Title in this given article ${article}. Get the title only, do not add any comments, and it should not be a sentence or the whole heading content. Make sure it is not one of these (${headings})`;
  }

  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT
  });
  const index = pinecone.index('sagpt');
  const queryEmbedding = await new OpenAIEmbeddings().embedQuery(prompt);
  const queryResponse = await index.query({
    topK: 5,
    vector: queryEmbedding,
    includeMetadata: true,
    includeValues: true
  });

  if (queryResponse.matches.length) {
    const llm = new OpenAI({ temperature: 0.7, modelName: "gpt-4-1106-preview" });
    const chain = loadQAStuffChain(llm);

    const concatenatedPageContent = queryResponse.matches
      .map((match) => match.metadata.text)
      .join("\n\n");


    const result = await chain.call({
      input_documents: [new Document({ pageContent: concatenatedPageContent })],
      question: prompt
    });

    output = result.text;
  }
  console.log(`Get Article Headings Success`)

  return output;
};

export const generateHeadingImage = async (headings, loopNum) => {
  const headingTitle = headings[loopNum];
  const num = loopNum + 1;
  var output;
  console.log('Getting heading #"' + num + '" prompt for image generation');

  const imagePrompt = `Using this Heading Title (${headingTitle}), you will create a good prompt for an image to be generated. Do not add any comments or any other unnecessary content. If there is a person involved, make it a Filipino and a Real Estate Virtual Assistant. Make sure to not include the Title itself (${headingTitle}), and remove any quotations ("").`;

  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT
  });
  const index = pinecone.index('sagpt');
  const queryEmbedding = await new OpenAIEmbeddings().embedQuery(imagePrompt);
  const queryResponse = await index.query({
    topK: 5,
    vector: queryEmbedding,
    includeMetadata: true,
    includeValues: true
  });

  if (queryResponse.matches.length) {
    const llm = new OpenAI({ temperature: 0.7, modelName: "gpt-4-1106-preview" });
    const chain = loadQAStuffChain(llm);

    const concatenatedPageContent = queryResponse.matches
      .map((match) => match.metadata.text)
      .join("\n\n");

    const finalPrompt = await chain.call({
      input_documents: [new Document({ pageContent: concatenatedPageContent })],
      question: imagePrompt
    });

    console.log("Image Prompt #" + num + ": " + finalPrompt.text);

    console.log("Generating image...")

    const imageOutput = await replicate.run(
      `konieshadow/fooocus-api-realistic:${process.env.FOOOCUS_API}`,
      {
        input: {
          prompt: finalPrompt.text,
          cn_type1: "ImagePrompt",
          cn_type2: "ImagePrompt",
          cn_type3: "ImagePrompt",
          cn_type4: "ImagePrompt",
          sharpness: 2,
          image_seed: -1,
          uov_method: "Disabled",
          image_number: 1,
          guidance_scale: 3,
          refiner_switch: 0.5,
          negative_prompt: "unrealistic, saturated, high contrast, big nose, painting, drawing, sketch, cartoon, anime, manga, render, CG, 3d, watermark, signature, label",
          style_selections: "Fooocus V2,Fooocus Photograph,Fooocus Negative",
          uov_upscale_value: 0,
          outpaint_selections: "",
          outpaint_distance_top: 0,
          performance_selection: "Speed",
          outpaint_distance_left: 0,
          aspect_ratios_selection: "1344*768",
          outpaint_distance_right: 0,
          outpaint_distance_bottom: 0,
          inpaint_additional_prompt: ""
        }
      }
    );

    const imageKey = "image" + num;

    output = {
      imageKey: imageKey,
      imageLink: imageOutput[0]
    }

  }

  return output
};

export const runWithEmbeddings = async (question, perspectiveOutput, toneOutput, targetOutput, authorOutput, customerObjectiveOutput) => {

  var output;
  const userprompt = `You are a helpful assistant, but do not say that you are a helpful assistant. ${perspectiveOutput} ${toneOutput} ${authorOutput} ${targetOutput} ${customerObjectiveOutput} Question: ${question}`;

  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT
  });
  const index = pinecone.index('sagpt');
  const queryEmbedding = await new OpenAIEmbeddings().embedQuery(question);
  const queryResponse = await index.query({
    topK: 5,
    vector: queryEmbedding,
    includeMetadata: true,
    includeValues: true
  });

  // console.log("Pinecone Query Response:", queryResponse);

  if (queryResponse.matches.length) {
    const llm = new OpenAI({ temperature: 0.7, modelName: "gpt-4-1106-preview" });
    const chain = loadQAStuffChain(llm);

    const concatenatedPageContent = queryResponse.matches
      .map((match) => match.metadata.text)
      .join("\n\n");

    // console.log("Concatenated Page Content:", concatenatedPageContent);
    console.log('---------------------------------------------------------------');

    try {
      const result = await chain.call({
        input_documents: [new Document({ pageContent: concatenatedPageContent })],
        question: userprompt
      });

      output = result.text;
      console.log("User Prompt:", userprompt);
      console.log("Chain Result:", result.text);
    } catch (error) {
      console.error("Error in processing chain:", error);
      output = "An error occurred while processing your request.";
    }
  } else {
    console.log("Since there are no matches, GPT-3 will not be queried.");
    output = "I'm sorry, there are no matches that are related to the question in our data.";
  }

  return output;
};

export const articleGenerator = async (generalQuery, question, query, title, keyword, perspectiveOutput, toneOutput, targetOutput, authorOutput, customerObjectiveOutput, site) => {

  var siteText;
  if (site == "Company Site") {
    siteText = "This article is for the ShoreAgents Company Website";
  } else if (site == "Careers Site") {
    siteText = "This article is for the ShoreAgents Careers Website";
  }

  var output;
  const userprompt = `You are a content writer and will draft HTML formatted articles where at the start of every paragraph you will add '<p>' and must end with '</p>', it will be the same with Subheadings but with '<h3>' and '</h3>', and your responsibility is to elaborate on the provided heading title. "PLEASE DO NOT CREATE AN ENTIRE ARTICLE." ${perspectiveOutput} ${toneOutput} ${authorOutput} ${targetOutput} ${customerObjectiveOutput}` + ` Expand this outline using the article title "${title}", and the focus keyword "${keyword}". The article outline: ${question}.

  Instructions:
  ${query}
  ${generalQuery}
  ${siteText}
  Do not include the article heading but you can include subheadings.
  Make sure that the heading body is long and explained in detail.
  You can add h4 subheadings inside h3 if possible.
  You can also add <ul> <li> tags.
  Do not add the word 'Subheading:' in the subheading titles.
  Strictly, you will not give any comments on the generated content, it must be content article body only.
  Do not include 'In conclusion' unless the Heading title is Conclusion itself.
  Do not add the '${title}' itself.`

  console.log(userprompt);

  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT
  });
  const index = pinecone.index('sagpt');
  const queryEmbedding = await new OpenAIEmbeddings().embedQuery(question);
  const queryResponse = await index.query({
    topK: 5,
    vector: queryEmbedding,
    includeMetadata: true,
    includeValues: true
  });

  // const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

  // const res = await chain.call({ query: userprompt });
  // const output = res.text;
  // return output;

  if (queryResponse.matches.length) {
    const llm = new OpenAI({ temperature: 0.7, modelName: "gpt-4-1106-preview" });
    const chain = loadQAStuffChain(llm);

    const concatenatedPageContent = queryResponse.matches
      .map((match) => match.metadata.text)
      .join("\n\n");

    // console.log("Concatenated Page Content:", concatenatedPageContent);
    console.log('---------------------------------------------------------------');

    try {
      const result = await chain.call({
        input_documents: [new Document({ pageContent: concatenatedPageContent })],
        question: userprompt
      });

      output = result.text;
      console.log("User Prompt:", userprompt);
      // console.log("Chain Result:", result.text);
    } catch (error) {
      console.error("Error in processing chain:", error);
      output = "An error occurred while processing your request.";
    }
  } else {
    console.log("I'm sorry, there are no matches that are related to the question in our data.");
    output = "I'm sorry, there are no matches that are related to the question in our data.";
  }

  return output;
};

export const seoTitleGenerator = async (focuskeyword) => {

  var output;
  const userprompt = `Create a good seo title using the keyword '${focuskeyword}'. Make sure to make it SEO optimized and has a maximum of 60 characters only. Make sure to keep it a seo title only, and do not include any introductions or short descriptions. Also make sure to remove the quotation.`

  console.log('---------------------------------------------------------------');
  console.log("Generating SEO Title.");

  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT
  });
  const index = pinecone.index('sagpt');
  const queryEmbedding = await new OpenAIEmbeddings().embedQuery(userprompt);
  const queryResponse = await index.query({
    topK: 5,
    vector: queryEmbedding,
    includeMetadata: true,
    includeValues: true
  });

  // console.log("Pinecone Query Response:", queryResponse);

  if (queryResponse.matches.length) {
    const llm = new OpenAI({ temperature: 0.7, modelName: "gpt-4-1106-preview" });
    const chain = loadQAStuffChain(llm);

    const concatenatedPageContent = queryResponse.matches
      .map((match) => match.metadata.text)
      .join("\n\n");

    // console.log("Concatenated Page Content:", concatenatedPageContent);
    console.log('---------------------------------------------------------------');

    try {
      const result = await chain.call({
        input_documents: [new Document({ pageContent: concatenatedPageContent })],
        question: userprompt
      });

      output = result.text;
      console.log("User Prompt:", userprompt);
      console.log("Chain Result:", result.text);
    } catch (error) {
      console.error("Error in processing chain:", error);
      output = "An error occurred while processing your request.";
    }
  } else {
    console.log("I'm sorry, there are no matches that are related to the question in our data.");
    output = "I'm sorry, there are no matches that are related to the question in our data.";
  }
  return output;
};

export const metaDescriptionGenerator = async (focuskeyword, articleContent) => {

  var output;
  const userprompt = `Create a good meta description using the keyword '${focuskeyword}' for this article '${articleContent}'. Make sure to make it SEO optimized and has a maximum of 160 characters only. Make sure to keep it a meta description only, and do not include any introductions or short descriptions.  Also make sure to remove the quotation.`

  console.log('---------------------------------------------------------------');
  console.log("Generating Meta Description.");

  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT
  });
  const index = pinecone.index('sagpt');
  const queryEmbedding = await new OpenAIEmbeddings().embedQuery(userprompt);
  const queryResponse = await index.query({
    topK: 5,
    vector: queryEmbedding,
    includeMetadata: true,
    includeValues: true
  });

  // console.log("Pinecone Query Response:", queryResponse);

  if (queryResponse.matches.length) {
    const llm = new OpenAI({ temperature: 0.7, modelName: "gpt-4-1106-preview" });
    const chain = loadQAStuffChain(llm);

    const concatenatedPageContent = queryResponse.matches
      .map((match) => match.metadata.text)
      .join("\n\n");

    // console.log("Concatenated Page Content:", concatenatedPageContent);
    console.log('---------------------------------------------------------------');

    try {
      const result = await chain.call({
        input_documents: [new Document({ pageContent: concatenatedPageContent })],
        question: userprompt
      });

      output = result.text;
      console.log("Chain Result:", result.text);
    } catch (error) {
      console.error("Error in processing chain:", error);
      output = "An error occurred while processing your request.";
    }
  } else {
    console.log("I'm sorry, there are no matches that are related to the question in our data.");
    output = "I'm sorry, there are no matches that are related to the question in our data.";
  }
  return output;
};

export const titleGenerator = async (focuskeyword, perspectiveOutput, toneOutput, targetOutput, customerObjectiveOutput) => {

  var output;
  const userprompt = `Create a good article title using the keyword '${focuskeyword}'. Make sure to make it SEO optimized. ${perspectiveOutput} ${toneOutput} ${targetOutput} ${customerObjectiveOutput} Make sure to keep it a title only, and do not include any introductions or short descriptions. Avoid using the terms "Maximize, Streamline, Leverage, Transform, Discover, Boosting, Optimizing, Emerging."`

  console.log(userprompt);

  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT
  });
  const index = pinecone.index('sagpt');
  const queryEmbedding = await new OpenAIEmbeddings().embedQuery(userprompt);
  const queryResponse = await index.query({
    topK: 5,
    vector: queryEmbedding,
    includeMetadata: true,
    includeValues: true
  });

  // console.log("Pinecone Query Response:", queryResponse);

  if (queryResponse.matches.length) {
    const llm = new OpenAI({ temperature: 0.7, modelName: "gpt-4-1106-preview" });
    const chain = loadQAStuffChain(llm);

    const concatenatedPageContent = queryResponse.matches
      .map((match) => match.metadata.text)
      .join("\n\n");

    // console.log("Concatenated Page Content:", concatenatedPageContent);
    console.log('---------------------------------------------------------------');

    try {
      const result = await chain.call({
        input_documents: [new Document({ pageContent: concatenatedPageContent })],
        question: userprompt
      });

      output = result.text;
      console.log("User Prompt:", userprompt);
    } catch (error) {
      console.error("Error in processing chain:", error);
      output = "An error occurred while processing your request.";
    }
  } else {
    console.log("I'm sorry, there are no matches that are related to the question in our data.");
    output = "I'm sorry, there are no matches that are related to the question in our data.";
  }

  // const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

  // const res = await chain.call({ query: userprompt });
  // const output = res.text;
  return output;
};

// export const bulkArticleGenerator = async (generalQuery, title, keyword, perspectiveOutput, toneOutput, targetOutput, authorOutput, customerObjectiveOutput) => {

//   const model = new OpenAI({temperature:0.7, modelName:"gpt-4-1106-preview"});

//   let vectorStore;
//   if (fs.existsSync(VECTOR_STORE_PATH)) {
//     vectorStore = await HNSWLib.load(VECTOR_STORE_PATH, new OpenAIEmbeddings());
//   } else {
//     const text = fs.readFileSync(txtPath, 'utf8');
//     const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
//     const docs = await textSplitter.createDocuments([text]);
//     vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings());
//     await vectorStore.save(VECTOR_STORE_PATH);
//   }

//   const userprompt = `You are a content writer and will draft HTML formatted articles where at the start of every paragraph you will just add '<p>' and must end with '</p>', it will be the same with Headings using '<h2>' and '</h2>', as well as Subheadings but with '<h3>' and '</h3>'. Your responsibility is to generate a good article that is SEO optimized, using the article title "${title}", and the focus keyword "${keyword}". ${perspectiveOutput} ${toneOutput} ${authorOutput} ${targetOutput} ${customerObjectiveOutput}

//   Instructions:
//   ${generalQuery}
//   You can be creative such as adding <ul> <li> and <h4> subheadings.
//   Do not add the word 'Subheading:' in the subheading titles.
//   Strictly, you will not give any comments on the generated content, it must be content article body only.
//   Do not add the '${title}' itself.`

//   console.log(userprompt);

//   const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

//   const res = await chain.call({ query: userprompt });
//   const output = res.text;
//   console.log(output);
//   return output;
// };

// export const generateKeywords = async (keywords) => {
//   const model = new OpenAI({temperature:0.7, modelName:"gpt-4-1106-preview"});
//   let vectorStore;
//   if (fs.existsSync(VECTOR_STORE_PATH)) {
//     vectorStore = await HNSWLib.load(VECTOR_STORE_PATH, new OpenAIEmbeddings());
//   } else {
//     const text = fs.readFileSync(txtPath, 'utf8');
//     const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
//     const docs = await textSplitter.createDocuments([text]);
//     vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings());
//     await vectorStore.save(VECTOR_STORE_PATH);
//   }

//   var currentKeywords;
//   if (keywords) {
//     currentKeywords = `Also, it is important to make it different from these given keywords ${keywords}`;
//   } else { 
//     currentKeywords = " ";
//   }

//   const userprompt = `Create good and top ranking focus keyword for an article. Make sure to create a keyword only and you should not include any comments or short descriptions. It should be a keyword, not a slug and remove the quotations. It should also relate into real estate. ${currentKeywords}`;

//   console.log(userprompt);

//   const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

//   const res = await chain.call({ query: userprompt });
//   const output = res.text;
//   // console.log(output);
//   return output;
// };

export const addHeadingContent = async (wordCount, articleContent, generalQuery, title, keyword, perspectiveOutput, toneOutput, targetOutput, authorOutput, customerObjectiveOutput, site) => {

  var siteText;
  if (site == "Company Site") {
    siteText = "This article is for the ShoreAgents Company Website";
  } else if (site == "Careers Site") {
    siteText = "This article is for the ShoreAgents Careers Website";
  }

  var output;
  var userprompt;
  if (wordCount == 0) {
    userprompt = `You are a content writer and will draft HTML formatted article heading where at the start of every paragraph you will just add '<p>' and must end with '</p>', it will be the same with Headings using '<h2>' and '</h2>', as well as Subheadings but with '<h3>' and '</h3>'. This is focused solely on generating an Introduction for the article "${title}". Your responsibility is to generate an article H2 Heading ONLY and it's content body. Make sure it's readability is good and is SEO optimized, using the article title "${title}", and the focus keyword "${keyword}". ${perspectiveOutput} ${toneOutput} ${authorOutput} ${targetOutput} ${customerObjectiveOutput}
  
    Instructions:
      ${generalQuery}
      ${siteText}
      You can be creative such as adding <ul> <li> and <h4> subheadings inside H2 headings.
      Make sure to add the generated H2 Heading.
      Do not add the word 'Subheading:' in the subheading titles.
      Strictly, do not add any H2 or H3 Conclusions.
      Strictly, do not add any conclusion "In conclusion..." content anywhere.
      Strictly, you will not give any comments on the generated content, it must be content article body only.
      DO NOT add any comments or tags at the start ('''html) and end (''') of the output.
      Do not add the '${title}' itself.`;
  } else {
    userprompt = `You are a content writer and will draft HTML formatted article heading where at the start of every paragraph you will just add '<p>' and must end with '</p>', it will be the same with Headings using '<h2>' and '</h2>', as well as Subheadings but with '<h3>' and '</h3>'. Your responsibility is to generate an article H2 Heading ONLY and it's content body, do not include the previous headings. Make sure it's readability is good and is SEO optimized, using the article title "${title}", and the focus keyword "${keyword}". ${perspectiveOutput} ${toneOutput} ${targetOutput} ${customerObjectiveOutput}

    You will continue this article and make it as a reference only and do not add this in the new generated content '${articleContent}'. 

    Article Overview:
    ${generalQuery}
  
    Instructions:
      ${siteText}
      Please ensure that the provided sentences to generate unique content that differs from what has already been given. Avoid repeating sentences, especially with the first sentence.
      Avoid using the Article Title to be added in the content.
      You can be creative such as adding <ul> <li> and <h4> subheadings inside H2 headings.
      Make sure to add the generated H2 Heading.
      Do not add the word 'Subheading:' in the subheading titles.
      Strictly, do not add any H2 or H3 Conclusions.
      Strictly, do not add any conclusion "In conclusion..." content anywhere.
      Strictly, you will not give any comments on the generated content, it must be content article body only.
      DO NOT add any comments or tags at the start ('''html) and end (''') of the output.
      Do not add the '${title}' itself.
      Make sure not to repeat previous H2 heading contents, it should be different and not related to each other.
      You will only add new H2 heading contents, and DO NOT REPEAT PREVIOUS ARTICLE HEADINGS AND ITS CONTENTS.
      `;
  }
  console.log('---------------------------------------------------------------');
  console.log("Generating Header Contents.");

  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT
  });
  const index = pinecone.index('sagpt');
  const queryEmbedding = await new OpenAIEmbeddings().embedQuery(userprompt);
  const queryResponse = await index.query({
    topK: 5,
    vector: queryEmbedding,
    includeMetadata: true,
    includeValues: true
  });

  // console.log("Pinecone Query Response:", queryResponse);

  if (queryResponse.matches.length) {
    const llm = new OpenAI({ temperature: 0.7, modelName: "gpt-4-1106-preview" });
    const chain = loadQAStuffChain(llm);

    const concatenatedPageContent = queryResponse.matches
      .map((match) => match.metadata.text)
      .join("\n\n");

    // console.log("Concatenated Page Content:", concatenatedPageContent);
    console.log('---------------------------------------------------------------');

    try {
      const result = await chain.call({
        input_documents: [new Document({ pageContent: concatenatedPageContent })],
        question: userprompt
      });

      // const temp = result.text;
      // output = addInternalLinks(temp);
      output = result.text;
      console.log("Chain Result:", output);
    } catch (error) {
      console.error("Error in processing chain:", error);
      output = "An error occurred while processing your request.";
    }
  } else {
    console.log("Since there are no matches, GPT-3 will not be queried.");
    output = "I'm sorry, there are no matches that are related to the question in our data.";
  }

  console.log('---------------------------------------------------------------');

  return output
};

export const generateConclusion = async (articleContent, generalQuery, title, keyword, perspectiveOutput, toneOutput, targetOutput, authorOutput, customerObjectiveOutput) => {

  var output;
  const userprompt = `You are a content writer and will draft HTML formatted article heading where at the start of every paragraph you will just add '<p>' and must end with '</p>', it will be the same with Headings using '<h2>' and '</h2>', as well as Subheadings but with '<h3>' and '</h3>'. Your responsibility is to generate a H2 Conclusion Heading. This is focused solely on generating a Conclusion for the article "${title}". Make sure it's readability is good and is SEO optimized, using the article title "${title}", and the focus keyword "${keyword}". ${perspectiveOutput} ${toneOutput} ${authorOutput} ${targetOutput} ${customerObjectiveOutput}
  
  Instructions:
  ${generalQuery}
  Make sure to add the H2 Conclusion Heading.
  This is a Conclusion Heading and content body only.
  Strictly, you will not give any comments on the generated content, it must be content article body only.
  Do not add the '${title}' itself.
  Add something that would relate it to ShoreAgents.
  You will finish this article with a conclusion'${articleContent}'`;

  console.log('---------------------------------------------------------------');
  console.log("Generating Conclusion.");

  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT
  });
  const index = pinecone.index('sagpt');
  const queryEmbedding = await new OpenAIEmbeddings().embedQuery(userprompt);
  const queryResponse = await index.query({
    topK: 5,
    vector: queryEmbedding,
    includeMetadata: true,
    includeValues: true
  });

  // console.log("Pinecone Query Response:", queryResponse);

  if (queryResponse.matches.length) {
    const llm = new OpenAI({ temperature: 0.7, modelName: "gpt-4-1106-preview" });
    const chain = loadQAStuffChain(llm);

    const concatenatedPageContent = queryResponse.matches
      .map((match) => match.metadata.text)
      .join("\n\n");

    // console.log("Concatenated Page Content:", concatenatedPageContent);
    console.log('---------------------------------------------------------------');

    try {
      const result = await chain.call({
        input_documents: [new Document({ pageContent: concatenatedPageContent })],
        question: userprompt
      });

      // const temp = result.text;
      // output = addInternalLinks(temp);
      output = result.text;

      console.log("Chain Result:", output);
    } catch (error) {
      console.error("Error in processing chain:", error);
      output = "An error occurred while processing your request.";
    }
  } else {
    console.log("I'm sorry, there are no matches that are related to the question in our data.");
    output = "I'm sorry, there are no matches that are related to the question in our data.";
  }

  console.log('---------------------------------------------------------------');

  return output;
};

export const addInternalLinks = async (articleContent) => {

  var output;
  const userprompt = `You are a content writer and will draft HTML formatted article heading where at the start of every paragraph you will just add '<p>' and must end with '</p>', it will be the same with Headings using '<h2>' and '</h2>', as well as Subheadings but with '<h3>' and '</h3>'. Your responsibility is to add an <a> internal links in this article heading that may relate to sectors / services, main pages, roles, directory and blog links provided "${articleContent}"
  
  Make sure to provide the 'href' with the links provided in Sectors / Services, Main Pages, Directory, Roles, and Blog Links that are related to that <a> link.
  
  Do not add additional contents or any comments from you. Just rewrite everything with <a> links added.

  Stricly, SO NOT ADD LINKS OR CREATE LINKS THAT IS NOT FOUND ON THE DATA. ONLY use the links that you can only be found in SECTORS / SERVICES, MAIN PAGES, ROLES, DIRECTORY and BLOG links.

  Do not add the links that is already given, there must only one with the same internal link.
  
  Don't include homepage (https://www.shoreagents.com/) as internal link.`;

  console.log(userprompt);

  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT
  });
  const index = pinecone.index('sagpt');
  const queryEmbedding = await new OpenAIEmbeddings().embedQuery(userprompt);
  const queryResponse = await index.query({
    topK: 5,
    vector: queryEmbedding,
    includeMetadata: true,
    includeValues: true
  });

  // console.log("Pinecone Query Response:", queryResponse);

  if (queryResponse.matches.length) {
    const llm = new OpenAI({ temperature: 0.7, modelName: "gpt-4-1106-preview" });
    const chain = loadQAStuffChain(llm);

    const concatenatedPageContent = queryResponse.matches
      .map((match) => match.metadata.text)
      .join("\n\n");

    // console.log("Concatenated Page Content:", concatenatedPageContent);
    console.log('---------------------------------------------------------------');

    try {
      const result = await chain.call({
        input_documents: [new Document({ pageContent: concatenatedPageContent })],
        question: userprompt
      });

      output = result.text;
      console.log("User Prompt:", userprompt);
      console.log("Chain Result:", result.text);
    } catch (error) {
      console.error("Error in processing chain:", error);
      output = "An error occurred while processing your request.";
    }
  } else {
    console.log("I'm sorry, there are no matches that are related to the question in our data.");
    output = "I'm sorry, there are no matches that are related to the question in our data.";
  }
  console.log("/////////////////////////////////////////////////////////////////////////////////");
  console.log(output);
  console.log("/////////////////////////////////////////////////////////////////////////////////");
  return output;
};

export default router;