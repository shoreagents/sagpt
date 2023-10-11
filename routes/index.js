import { OpenAI } from 'langchain/llms/openai';
import { RetrievalQAChain } from 'langchain/chains';
import { HNSWLib } from 'langchain/vectorstores/hnswlib';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

import express from "express";
const router = express.Router()

dotenv.config();

const txtFilename = "gptdata";
const txtPath = `./${txtFilename}.txt`;
const VECTOR_STORE_PATH = `${txtFilename}.index`;

const sadata = fileName => {
  let data = fs.readFileSync(fileName);
  return data.toString()
}

router.post('/updatedata', async (req,res) =>{
  const dataUpdated = req.body.database;
  updateData();
  fs.writeFile(txtPath, dataUpdated, (err) => {
    if (err) throw err;
    console.log("Database Successfully Updated");
  })
  res.redirect('/');
})

router.get('/', async (req,res) =>{
  updateData();
  res.render('index', {data: sadata(txtPath), articleGenerated: ""});
})

router.post('/', async (req,res) =>{
  const userAction = req.body.userAction;

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

    if (tone != "Standard") {
      toneOutput = `You are in ${tone} personality, so you will answer with the given subtones of that personality.`;
    }
    if (author != "None") {
      authorOutput = `The author is ${author}.`;
    }
    if (target != "None") {
      targetOutput = `Your Target Market will be ${target}.`;
    }
    if (perspective != "None") {
      perspectiveOutput = `You are in perspective of ${perspective}.`;
    }
    if (customerObjective != "None") {
      customerObjectiveOutput = `The selected Customer Objective is ${customerObjective}.`;
    }

    if (tone === undefined, author === undefined, target === undefined, perspective === undefined, customerObjective === undefined) {
      var toneOutput = "";
      var authorOutput = "";
      var targetOutput = "";
      var perspectiveOutput = "";
      var customerObjectiveOutput = "";
    }

    const output = await runWithEmbeddings(question, perspectiveOutput, toneOutput, targetOutput, authorOutput,customerObjectiveOutput);
    res.send({output});
    
  } else if (userAction == "ArticleGenerator"){
    const title = req.body.articletitle;
    const heading = req.body.heading;
    const subheading = req.body.subheading;
    const tone = req.body.tone;
    const author = req.body.author;
    const target = req.body.target;
    const perspective = req.body.perspective;
    const customerObjective = req.body.customerObjective;
    var articlearray = {};
    articlearray.title = title;
    for (let i = 0; i < heading.length; i++) {
      var num = i+1;
      var obj = new Object();
      obj.title = heading[i];
      if (subheading) {
        for(var j=0;j<subheading.length;j++){
          var num2 = j+1;
          if (num == subheading[j].substring(0, 1)){
            for(var k=0;k<subheading.length;k++){
                obj["subheadings"+num2] = subheading[j];
            }
          }
        }
      }
      articlearray["heading"+num] = obj;
    }

    var toneOutput = "";
    var authorOutput = "";
    var targetOutput = "";
    var perspectiveOutput = "";
    var customerObjectiveOutput = "";

    if (tone != "Standard") {
      toneOutput = `You are in ${tone} personality, so you will answer with the given subtones of that personality.`;
    }
    if (author != "None") {
      authorOutput = `The author is ${author}.`;
    }
    if (target != "None") {
      targetOutput = `Your Target Market will be ${target}.`;
    }
    if (perspective != "None") {
      perspectiveOutput = `You are in perspective of ${perspective}.`;
    }
    if (customerObjective != "None") {
      customerObjectiveOutput = `The selected Customer Objective is ${customerObjective}.`;
    }

    if (tone === undefined, author === undefined, target === undefined, perspective === undefined, customerObjective === undefined) {
      var toneOutput = "";
      var authorOutput = "";
      var targetOutput = "";
      var perspectiveOutput = "";
      var customerObjectiveOutput = "";
    }
    const listquery = req.body.listquery;
    const articleTitle = articlearray.title;
    const articleKeyword = req.body.keyword;
    var output = `<h1>Title: ${articleTitle}</h1>`;

    var data = [];

    for (var i in articlearray) {
      if (i != "title") {
        data.push([i, articlearray[i]]);
      }
    }

    for (let i = 0; i < data.length; i++) {
      var articleHeading = data[i][1].title;
      var articleTopic = "Article Heading: "+articleHeading+"\n\nSubheadings:\n";
      var query = listquery[i];
      /* console.log(articleTopic); */
      for (var key in data[i][1]) {
        data[i][1]['title'] && delete data[i][1]['title'];
        if (data[i][1].hasOwnProperty(key)) {
          var valuetemp = data[i][1][key];
          let value = valuetemp.substring(1);
          articleTopic += "\n"+value;
        }
      }
      const createArticle = await articleGenerator(articleTopic, query, articleTitle, articleKeyword, perspectiveOutput, toneOutput, targetOutput, authorOutput,customerObjectiveOutput);
      output += `\n\n<h2>${articleHeading}</h2>\n${createArticle}`;
    }
    console.log(output);

    res.render('index', {data: sadata(txtPath), articleGenerated: output});
  }
})

export const updateData = async () => {
  const text = fs.readFileSync(txtPath, 'utf8');
  const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
  const docs = await textSplitter.createDocuments([text]);
  const vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings());
  await vectorStore.save(VECTOR_STORE_PATH);
};

export const runWithEmbeddings = async (question, perspectiveOutput, toneOutput, targetOutput, authorOutput,customerObjectiveOutput) => {
  
  const model = new OpenAI({temperature:0.7, modelName:"gpt-4"});

  let vectorStore;
  if (fs.existsSync(VECTOR_STORE_PATH)) {
    vectorStore = await HNSWLib.load(VECTOR_STORE_PATH, new OpenAIEmbeddings());
  } else {
    const text = fs.readFileSync(txtPath, 'utf8');
    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
    const docs = await textSplitter.createDocuments([text]);
    vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings());
    await vectorStore.save(VECTOR_STORE_PATH);
  }

  const userprompt = `You are a helpful assistant. ${perspectiveOutput} ${toneOutput} ${authorOutput} ${targetOutput} ${perspectiveOutput} ${customerObjectiveOutput}` + `Question: ${question}`

  const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

  const res = await chain.call({ query: userprompt });
  const output = res.text;
  console.log(userprompt);
  return output;
};

export const articleGenerator = async (question, query, title, keyword, perspectiveOutput, toneOutput, targetOutput, authorOutput,customerObjectiveOutput) => {
  
  const model = new OpenAI({temperature:0.7, modelName:"gpt-4"});

  let vectorStore;
  if (fs.existsSync(VECTOR_STORE_PATH)) {
    vectorStore = await HNSWLib.load(VECTOR_STORE_PATH, new OpenAIEmbeddings());
  } else {
    const text = fs.readFileSync(txtPath, 'utf8');
    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
    const docs = await textSplitter.createDocuments([text]);
    vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings());
    await vectorStore.save(VECTOR_STORE_PATH);
  }

  const userprompt = `You are a content writer and will draft HTML formatted articles where at the start of every paragraph you will add '<p>' and must end with '</p>', it will be the same with Subheadings but with '<h3>' and '</h3>', and your responsibility is to elaborate on the provided heading title. "PLEASE DO NOT CREATE AN ENTIRE ARTICLE." ${perspectiveOutput} ${toneOutput} ${authorOutput} ${targetOutput} ${perspectiveOutput} ${customerObjectiveOutput}` + ` Expand this outline using the article title "${title}", and the focus keyword "${keyword}". The article outline: ${question}.

  Instructions:
  ${query}
  Do not include the article heading but you can include subheadings.
  Make sure that the heading body is long and explained in detail.
  You can add h4 subheadings inside h3 if possible.
  Do not add the word 'Subheading:' in the subheading titles.
  Do not include 'In conclusion' unless the Heading title is Conclusion itself.
  Do not add the '${title}' itself.`

  console.log(userprompt);

  const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

  const res = await chain.call({ query: userprompt });
  const output = res.text;
  return output;
};

export default router;