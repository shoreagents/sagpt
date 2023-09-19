import { OpenAI } from 'langchain/llms/openai';
import { RetrievalQAChain, loadQAStuffChain } from 'langchain/chains';
import { HNSWLib } from 'langchain/vectorstores/hnswlib';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PromptTemplate } from "langchain/prompts";
import * as fs from 'fs';
import * as dotenv from 'dotenv';

import express from "express";
const router = express.Router()

dotenv.config();

const txtFilename = "gptdata";
const txtPath = `./${txtFilename}.txt`;
const VECTOR_STORE_PATH = `${txtFilename}.index`;

router.get('/', async (req,res) =>{
  res.render('index')
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

  if (tone != "Select Tone/Personality") {
    toneOutput = `You are in ${tone} personality, so you will answer with the given subtones of that personality.`;
  }
  if (author != "Select Author") {
    authorOutput = `The author is ${author}.`;
  }
  if (target != "Select Target Market") {
    targetOutput = `Your Target Market will be ${target}.`;
  }
  if (perspective != "Select Perspective") {
    perspectiveOutput = `You are in perspective of ${perspective}.`;
  }
  if (customerObjective != "Select Customer Objective") {
    customerObjectiveOutput = `The selected Customer Objective is ${author}.`;
  }

  const output = await runWithEmbeddings(question, perspectiveOutput, toneOutput, targetOutput, authorOutput,customerObjectiveOutput);
  res.send({output})
})

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

  const promptTemplate = `You are a helpful assistant. ${perspectiveOutput} ${toneOutput} ${authorOutput} ${targetOutput} ${perspectiveOutput} ${customerObjectiveOutput}

  {question}`;

  console.log(promptTemplate);

  const prompt = new PromptTemplate({
    template: promptTemplate,
    inputVariables: ["question"],
  });


  const chain = new RetrievalQAChain({
    combineDocumentsChain: loadQAStuffChain(model, { prompt }),
    retriever: vectorStore.asRetriever(),
  });

  // const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

  const res = await chain.call({ query: question });
  const output = res.text;
  return output;
};

export default router;