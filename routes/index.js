import { OpenAI } from 'langchain/llms/openai';
import { ChatOpenAI } from "langchain/chat_models/openai";
import { RetrievalQAChain, ConversationalRetrievalQAChain } from 'langchain/chains';
import { HNSWLib } from 'langchain/vectorstores/hnswlib';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { BufferMemory } from "langchain/memory";
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
  res.render('index', {data: sadata(txtPath)});
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

    if (tone == "Select Tone/Personality"){
      var toneOutput = "";
    } else if (tone != "None") {
      toneOutput = `You are in ${tone} personality, so you will answer with the given subtones of that personality.`;
    } 
    if (author == "Select Author"){
      var authorOutput = "";
    } else if (author != "None") {
      authorOutput = `The author is ${author}.`;
    } 
    if (target ==  "Select Target Market"){
      var targetOutput = "";
    } else if (target != "None") {
      targetOutput = `Your Target Market/s will be ${target}.`;
    }
    if (perspective == "Select Perspective"){
      var perspectiveOutput = "";
    } else if (perspective != "None") {
      perspectiveOutput = `You will write in ${perspective} writing perspective.`;
    }
    if (customerObjective == "Select Customer Objective"){
      var customerObjectiveOutput = "";
    } else if (customerObjective != "None") {
      customerObjectiveOutput = `The selected Customer Objective is ${customerObjective}.`;
    }

    let output;
    try {
      output = await runWithEmbeddings(question, perspectiveOutput, toneOutput, targetOutput, authorOutput,customerObjectiveOutput);
    } catch (error) {
      output = "There is an error on our server. Sorry for inconvenience. Please try again later."
      console.log(error);
      console.log(output);
    }
    
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

    if (tone == "Select Tone/Personality"){
      var toneOutput = "";
    } else if (tone != "None") {
      toneOutput = `You are in ${tone} personality, so you will answer with the given subtones of that personality.`;
    } 
    if (author == "Select Author"){
      var authorOutput = "";
    } else if (author != "None") {
      authorOutput = `The author is ${author}.`;
    } 
    if (target ==  "Select Target Market"){
      var targetOutput = "";
    } else if (target != "None") {
      targetOutput = `Your Target Market/s will be ${target}.`;
    }
    if (perspective == "Select Perspective"){
      var perspectiveOutput = "";
    } else if (perspective != "None") {
      perspectiveOutput = `You will write in ${perspective} writing perspective.`;
    }
    if (customerObjective == "Select Customer Objective"){
      var customerObjectiveOutput = "";
    } else if (customerObjective != "None") {
      customerObjectiveOutput = `The selected Customer Objective is ${customerObjective}.`;
    }

    const listquery = req.body.listquery;
    const articleTitle = articlearray.title;
    const articleKeyword = req.body.keyword;
    const generalQuery = req.body.generalQuery;
    var output = `<h1>${articleTitle}</h1>`;

    var data = [];

    for (var i in articlearray) {
      if (i != "title") {
        data.push([i, articlearray[i]]);
      }
    }

    try {
      for (let i = 0; i < data.length; i++) {
        var articleHeading = data[i][1].title;
        var articleTopic = "Article Heading: "+articleHeading+"\n\nSubheadings:\n";
        var query = listquery[i];
        for (var key in data[i][1]) {
          data[i][1]['title'] && delete data[i][1]['title'];
          if (data[i][1].hasOwnProperty(key)) {
            var valuetemp = data[i][1][key];
            let value = valuetemp.substring(1);
            articleTopic += "\n"+value;
          }
        }
        const createArticle = await articleGenerator(generalQuery, articleTopic, query, articleTitle, articleKeyword, perspectiveOutput, toneOutput, targetOutput, authorOutput,customerObjectiveOutput);
        output += `\n\n<h2>${articleHeading}</h2>\n${createArticle}`;
      }
      console.log(output);
      var wordCount = output.match(/(\w+)/g).length;
      console.log(wordCount);
      res.send({output});
    } catch (error) {
      output = "There is an error on our server. Sorry for inconvenience. Please try again later.";
      console.log(output+" | "+error);
      res.send({output});
    }
  } else if (userAction == "BulkArticleGenerator"){
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

    if (tone == "Select Tone/Personality"){
      var toneOutput = "";
    } else if (tone != "None") {
      toneOutput = `You are in ${tone} personality, so you will answer with the given subtones of that personality.`;
    } 
    if (author == "Select Author"){
      var authorOutput = "";
    } else if (author != "None") {
      authorOutput = `The author is ${author}.`;
    } 
    if (target ==  "Select Target Market"){
      var targetOutput = "";
    } else if (target != "None") {
      targetOutput = `Your Target Market/s will be ${target}.`;
    }
    if (perspective == "Select Perspective"){
      var perspectiveOutput = "";
    } else if (perspective != "None") {
      perspectiveOutput = `You will write in ${perspective} writing perspective.`;
    }
    if (customerObjective == "Select Customer Objective"){
      var customerObjectiveOutput = "";
    } else if (customerObjective != "None") {
      customerObjectiveOutput = `The selected Customer Objective is ${customerObjective}.`;
    }

    var bulkdata = [];

    try {
      //keyword.length
      for (let i = 0; i < keyword.length; i++) {
        var focuskeyword = keyword[i]
        const createTitle = await titleGenerator(focuskeyword, perspectiveOutput, toneOutput, targetOutput, customerObjectiveOutput);
        var titleTemp = createTitle.replace(/['"]+/g, '')
        title.push(titleTemp);
      }
      //title.length
      for (let i = 0; i < title.length; i++) {
        var articleKeyword = keyword[i];
        var articleTitle = title[i];
        var createArticle = await bulkArticleGenerator(generalQuery, articleTitle, articleKeyword, perspectiveOutput, toneOutput, targetOutput, authorOutput,customerObjectiveOutput);
        bulkdata.push([i, title[i], createArticle]);
      }
      console.log(bulkdata);
      // var wordCount = output.match(/(\w+)/g).length;
      // console.log(wordCount);
      res.send({bulkdata});
    } catch (error) {
      output = "There is an error on our server. Sorry for inconvenience. Please try again later.";
      console.log(bulkdata+" | "+error);
      res.send({bulkdata});
    }

  } else if (userAction == "GenerateKeywords"){
    var keywords = [];
    try {
      for (let i = 0; i < 10; i++) {
        var stringKeywords = keywords.toString();
        var generatedKeyword = await generateKeywords(stringKeywords);
        console.log(generatedKeyword);
        keywords.push(generatedKeyword);
      }
      console.log(keywords);
      res.send({keywords});
    } catch (error) {
      keywords = "There is an error on our server. Sorry for inconvenience. Please try again later.";
      console.log(error);
      res.send({keywords});
    }
    
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
  
  const model = new ChatOpenAI({temperature:0.7, modelName:"gpt-4"});

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

  const userprompt = `You are a helpful assistant. ${perspectiveOutput} ${toneOutput} ${authorOutput} ${targetOutput} ${customerObjectiveOutput}` + `Question: ${question}`

  const fasterModel = new ChatOpenAI({
    temperature:0.7,
    modelName: "gpt-4",
  });

  // const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());
  const chain = ConversationalRetrievalQAChain.fromLLM(
    model,
    vectorStore.asRetriever(),
    {
      returnSourceDocuments: true,
      memory: new BufferMemory({
        memoryKey: "chat_history",
        inputKey: "question",
        outputKey: "text",
        returnMessages: true,
      }),
      questionGeneratorChainOptions: {
        llm: fasterModel,
      },
    }
  );

  const res = await chain.call({ question: userprompt });

  const output = res.text;
  console.log(userprompt);
  return output;
};

export const articleGenerator = async (generalQuery, question, query, title, keyword, perspectiveOutput, toneOutput, targetOutput, authorOutput,customerObjectiveOutput) => {
  
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

  const userprompt = `You are a content writer and will draft HTML formatted articles where at the start of every paragraph you will add '<p>' and must end with '</p>', it will be the same with Subheadings but with '<h3>' and '</h3>', and your responsibility is to elaborate on the provided heading title. "PLEASE DO NOT CREATE AN ENTIRE ARTICLE." ${perspectiveOutput} ${toneOutput} ${authorOutput} ${targetOutput} ${customerObjectiveOutput}` + ` Expand this outline using the article title "${title}", and the focus keyword "${keyword}". The article outline: ${question}.

  Instructions:
  ${query}
  ${generalQuery}
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

export const titleGenerator = async (focuskeyword, perspectiveOutput, toneOutput, targetOutput, customerObjectiveOutput) => {
  const model = new OpenAI({temperature:0.7, modelName:"gpt-4-1106-preview"});
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

  const userprompt = `Create a good article title using the keyword '${focuskeyword}'. Make sure to make it SEO optimized. ${perspectiveOutput} ${toneOutput} ${targetOutput} ${customerObjectiveOutput} Make sure to keep it a title only, and do not include any introductions or short descriptions.`

  console.log(userprompt);

  const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

  const res = await chain.call({ query: userprompt });
  const output = res.text;
  return output;
};

export const bulkArticleGenerator = async (generalQuery, title, keyword, perspectiveOutput, toneOutput, targetOutput, authorOutput, customerObjectiveOutput) => {
  
  const model = new OpenAI({temperature:0.7, modelName:"gpt-4-1106-preview"});

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

  const userprompt = `You are a content writer and will draft HTML formatted articles where at the start of every paragraph you will just add '<p>' and must end with '</p>', it will be the same with Headings using '<h2>' and '</h2>', as well as Subheadings but with '<h3>' and '</h3>'. Your responsibility is to generate a good article that is SEO optimized, using the article title "${title}", and the focus keyword "${keyword}". ${perspectiveOutput} ${toneOutput} ${authorOutput} ${targetOutput} ${customerObjectiveOutput}

  Instructions:
  ${generalQuery}
  You can be creative such as adding <ul> <li> and <h4> subheadings.
  Do not add the word 'Subheading:' in the subheading titles.
  Strictly, you will not give any comments on the generated content, it must be content article body only.
  Do not add the '${title}' itself.`

  console.log(userprompt);

  const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

  const res = await chain.call({ query: userprompt });
  const output = res.text;
  console.log(output);
  return output;
};

export const generateKeywords = async (keywords) => {
  
  const model = new OpenAI({temperature:0.7, modelName:"gpt-4-1106-preview"});

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

  var currentKeywords;
  if (keywords) {
    currentKeywords = `Also, it is important to make it different from these given keywords ${keywords}`;
  } else { 
    currentKeywords = " ";
  }

  const userprompt = `Create good and top ranking focus keyword for an article. Make sure to create a keyword only and you should not include any comments or short descriptions. It should be a keyword, not a slug and remove the quotations. It should also relate into real estate ${currentKeywords}`;

  console.log(userprompt);

  const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

  const res = await chain.call({ query: userprompt });
  const output = res.text;
  // console.log(output);
  return output;
};

export default router;