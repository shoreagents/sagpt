// 1. Import necessary modules and libraries
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

router.get('/', async (req,res) =>{
  res.render('index', { response:"Hi! How may I help you?" })
})
router.post('/', async (req,res) =>{
  const question = req.body.userinput;
  const output = await runWithEmbeddings(question);
  res.send({output})
})

export const runWithEmbeddings = async (question) => {
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

  


  const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());
  
  const res = await chain.call({
    query: question,
  });

  const output = res.text;
  return output;
};

export default router;