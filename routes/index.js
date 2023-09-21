import { OpenAI } from 'langchain/llms/openai';
import { RetrievalQAChain, loadQAStuffChain } from 'langchain/chains';
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
  res.render('index', {data: sadata(txtPath)});
})

router.post('/', async (req,res) =>{
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

  if (tone != "Select Tone/Personality" || tone != "Standard") {
    toneOutput = `You are in ${tone} personality, so you will answer with the given subtones of that personality.`;
  }
  if (author != "Select Author" || author != "None") {
    authorOutput = `The author is ${author}.`;
  }
  if (target != "Select Target Market" || target != "None") {
    targetOutput = `Your Target Market will be ${target}.`;
  }
  if (perspective != "Select Perspective" || perspective != "None") {
    perspectiveOutput = `You are in perspective of ${perspective}.`;
  }
  if (customerObjective != "Select Customer Objective" || customerObjective != "None") {
    customerObjectiveOutput = `The selected Customer Objective is ${author}.`;
  }
  const output = await runWithEmbeddings(question, perspectiveOutput, toneOutput, targetOutput, authorOutput,customerObjectiveOutput);
  res.send({output})
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
  console.log(output);
  return output;
};

export default router;